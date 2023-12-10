
import { Inject, Injectable, Logger, OnModuleInit, forwardRef } from '@nestjs/common';
import { SerialPort } from 'serialport';
import { DelimiterParser } from '@serialport/parser-delimiter';
import { EventService } from 'src/event/event.service';
import { execSync } from 'child_process';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { commands } from './commands';
import { Alert } from '../alert/alert';
import { DeltaService } from 'src/delta/delta.service';
import { CronJob, CronTime } from 'cron';
import { MqttService } from 'src/mqtt/mqtt.service';
import { AlertService } from 'src/alert/alert.service';
import * as os from 'os'
import { PAYLOAD, STATUS } from './data.dto';
import { ShutService } from 'src/delta/shut.service';
import getMAC, { isMAC } from 'getmac';

@Injectable()
export class SerialService implements OnModuleInit {
  private reader;
  private readerParser;
  private readonly logger = new Logger(SerialService.name);
  private saveFlag = true;
  private lastSent: Date = new Date();
  private job;
  private command_type: string;
  private status: STATUS = {
    storage: '',
    total_alert: 0,
    total_event: 0,
    delta_time: 0,
    last_log_date: undefined,
    ip: '',
    mac: '',
    shutdown_counter: 0,
  }
  private payload: PAYLOAD = {
    created_at: new Date(),
    version: '',
    version_protocole: '',
    sn: '',
    total: '',
    unit: '',
    number_weightings: '',
    voucher_number: '',
    status: '',
    weight_last_stroke: '',
    date_last_stroke: '',
    time_last_stroke: '',
    current_weight_loading: '',
  };
  constructor(
    private event: EventService,
    private delta: DeltaService,
    private alert: AlertService,
    private schedulerRegistry: SchedulerRegistry,
    private shutService: ShutService,
    @Inject(forwardRef(() => MqttService))
    private mqtt: MqttService,
  ) {

  }

  // checkDevice() {
  //   return new Promise<string>((resolve, reject) => {
  //     const checkPortInterval = setInterval(async () => {
  //       const portList = await SerialPort.list();
  //       for (let index = 0; index < portList.length; index++) {
  //         if (portList[index].vendorId === process.env.DEVICE_VID && portList[index].productId === process.env.DEVICE_PID) {
  //           this.logger.log("[d] Device finded Successfully")
  //           clearInterval(checkPortInterval)
  //           resolve(portList[index].path)
  //         }
  //       }
  //       this.checkALert();
  //     }, 5000)
  //   })
  // }

  async onModuleInit() {
    this.logger.log("[d] init SERIAL MODULE");
    await this.delta.createIfNotExist(20);
    this.status.delta_time = (await this.delta.get()).delta

    await this.shutService.createIfNotExist(0);
    this.status.shutdown_counter = (await this.shutService.get()).count
    this.shutService.update(this.status.shutdown_counter++)

    this.status.storage = execSync(`df -h /data | awk 'NR==2 {print $4}'`).toString();


    this.logger.log("[d] init connection with Device ...")
    if (this.init_device()) {
      this.starthandleRequestJob(this.status.delta_time);
    }

  }

  init_device() {
    try {
      this.reader = new SerialPort({
        path: '/dev/ttyS0',
        baudRate: 9600,
      });
      this.readerParser = this.reader.pipe(
        new DelimiterParser({ delimiter: [0x03, 0x00, 0x00], includeDelimiter: false }),
      );
      this.readerParser.on('data', this.onReaderData.bind(this));
      this.reader.on('close', this.onReaderClose.bind(this))
      return true
    } catch (error) {
      console.log(error);
      return false
    }
  }
  write(data: Buffer) {
    try {
      this.reader.write(data);
    } catch (error) {
      this.logger.log("error writing")
    }
  }

  async handleRequestJob() {
    if (this.reader.isOpen) {
      if (this.payload.version === '') {
        this.command_type = "VERSION"
        this.logger.error('[d] still not getting verion')
        this.write(commands.VERSION)
        await this.sleep(5000);
      }


      if (this.payload.version_protocole === '') {
        this.command_type = "VERSION_PROTOCOLE"
        this.logger.error('[d] still not getting protocole verion')
        this.write(commands.VERSION_PROPTOCOLE)
        await this.sleep(5000);
      }

      if (this.payload.sn === '') {
        this.command_type = "SN"
        this.logger.error('[d] still not getting sn ... ')
        this.write(commands.SN)
        await this.sleep(5000);
      }

      this.command_type = 'RAD_2'
      this.logger.log("[d] sending RAD_2 COMMAND")
      this.write(commands.RAD_2);
    }
    else {
      this.logger.log("port is closed")
    }
  }

  async changehandleRequestJob(seconds) {
    const job = this.schedulerRegistry.getCronJob('request');
    this.logger.log(seconds)
    this.status.delta_time = parseInt(seconds);
    await this.delta.update(parseInt(seconds));
    job.setTime(new CronTime(`*/${seconds} * * * * *`));

  }
  starthandleRequestJob(seconds: number) {
    this.logger.log("[d] create REQUEST RAD_2 JOB ")
    this.job = new CronJob(`*/${seconds} * * * * *`, this.handleRequestJob.bind(this));
    this.schedulerRegistry.addCronJob('request', this.job);
    this.job.start();
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async Status() {
    if (this.mqtt.getConnectionState()) {
      this.status.total_alert = this.mqtt.getTotalAlert();
      this.status.total_event = this.mqtt.getTotalEvent();
      this.status.ip = await os.networkInterfaces()['wlan0'][0].address
      this.status.mac = getMAC('wlan0').replaceAll(':', '')

    }
  }


  @Cron(CronExpression.EVERY_10_MINUTES)
  handleCron() {
    const storage = execSync(`df -h /data | awk 'NR==2 {print $4}'`).toString();
    this.status.storage = storage;
    const typeKB = storage.includes('K');
    const sizeValue = +storage.replace(/[GMK]/gi, '');
    if (typeKB && sizeValue < 300) {

      this.saveFlag = false;
    }
    else {
      this.saveFlag = true;
    }
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async checkALert() {
    try {
      if (new Date().getTime() - this.lastSent.getTime() > this.status.delta_time * 1000) {

        this.logger.log('this reader is connected but not sending data')
        if (this.mqtt.getConnectionState) {
          this.mqtt.publishAlert(JSON.stringify({
            ...Alert.DEVICE,
            created_at: new Date()
          }))
        }
        else if (this.saveFlag) {
          this.status.last_log_date = new Date();
          this.alert.create({
            ...Alert.DEVICE,
          })
        }
      }

      if (!this.saveFlag) {
        this.mqtt.publishAlert(JSON.stringify({
          ...Alert.STORAGE,
          created_at: new Date(),
        }))
      }
      else {
        if (!this.mqtt.getConnectionState()) {
          //check if only wifi 
          const wifiAddress = await os.networkInterfaces()['wlan0'][0].address
          if (!wifiAddress) {
            this.alert.create({
              ...Alert.WIFI
            })
          }
          else {
            this.alert.create({
              ...Alert.MQTT
            })
          }
        }
      }
    } catch (error) {
      this.logger.error(error)
    }

  }

  async onReaderClose() {
    this.logger.error("PORT CLOSED")
  }
  onReaderData(buffer: Buffer) {
    try {
      //this.logger.log(buffer)
      if (buffer != null && buffer.length > 7 && buffer[0] === 0x02) {
        let util_data;
        let length = buffer[1] + buffer[2] + buffer[3] + buffer[4];
        length = parseInt(length.toString(), 16)
        this.logger.log("buffer received", buffer)
        switch (this.command_type) {
          case 'RAD_2':
            if (length >= 40) {
              this.logger.log('[d] rad2 type response')
              util_data = buffer.toString().substring(5, length + 1).split(';');
              this.payload.created_at = new Date();
              this.payload.total = util_data[0];
              this.payload.unit = util_data[1];
              this.payload.number_weightings = util_data[2];
              this.payload.voucher_number = util_data[3];
              this.payload.status = util_data[4];
              this.payload.weight_last_stroke = util_data[5];
              this.payload.date_last_stroke = util_data[6];
              this.payload.time_last_stroke = util_data[7];
              this.payload.current_weight_loading = util_data[8];
              this.logger.log("result rad2: ", this.payload);
              this.lastSent = new Date();
              if (this.mqtt.getConnectionState) {
                this.logger.log("connection is good published")
                this.mqtt.publishPayload(JSON.stringify(this.payload));

              }
              else if (this.saveFlag) {
                this.logger.log("save in database");
                this.status.last_log_date = new Date();
                this.event.createEvent(this.payload)
              }
            }
            break;
          case 'VERSION':
            this.logger.log('[d] version type response')
            util_data = buffer.toString().substring(5, length + 1);
            this.payload.version = util_data;
            this.logger.log("version : ", this.payload.version)
            break;
          case 'VERSION_PROTOCOLE':
            this.logger.log('[d] version protcole type response')
            util_data = buffer.toString().substring(5);
            this.payload.version_protocole = util_data;
            this.logger.log("protocole version", this.payload.version_protocole)
          case 'SN':
            this.logger.log('[d] sn type response')
            util_data = buffer.toString().substring(5);
            this.payload.sn = util_data;
            this.logger.log("sn : ", this.payload.sn)
          default:
            break;
        }
      }
    } catch (error) {
      this.logger.error(error);
    }
  }
  sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
}