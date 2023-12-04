
import { Inject, Injectable, Logger, OnModuleInit, forwardRef } from '@nestjs/common';
import { SerialPort } from 'serialport';
import { DelimiterParser } from '@serialport/parser-delimiter';
import { EventService } from 'src/event/event.service';
import { execSync } from 'child_process';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { commands } from './commands';
import { Event } from './event.dto';
import { DeltaService } from 'src/delta/delta.service';
import { CronJob,CronTime } from 'cron';
import { MqttService } from 'src/mqtt/mqtt.service';
import { AlertService } from 'src/alert/alert.service';

interface State {
  version:String
  version_protocole:String
  sn:String
  total: String
  unit: String
  number_weightings: String
  voucher_number: String
  status: String
  weight_last_stroke: String
  date_last_stroke: String
  time_last_stroke: String
  current_weight_loading: String
}
@Injectable()
export class SerialService implements OnModuleInit {
  private reader;
  private readerParser;
  private readonly logger = new Logger(SerialService.name);
  private RAD_2_RESPONSE_LENGTH = 40;
  private VERSION_RESPONSE_lENGTH = 13;
  private VERSION_PROTOCOLE_RESPONSE_LENGTH = 3;
  private SN_RESPONSE_LENGTH = 2;
  private saveFlag = true;
  private lastSent:Date = new Date();
  private job;
  private deltaTime:number;
  private command_type:string;
  private payload: State = {
    version:'',
    version_protocole:'',
    sn:'',
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
    private alert:AlertService,
    private schedulerRegistry: SchedulerRegistry,
    @Inject(forwardRef(() => MqttService))
    private mqtt: MqttService,
  ) {

  }
  async onModuleInit() {
    this.logger.log("[d] init SERIAL MODULE");
    await this.delta.createIfNotExist(1);
    this.deltaTime = (await this.delta.get()).delta
    try {
      this.reader = new SerialPort({
        path: '/dev/ttyUSB0',
        baudRate: 9600,
      });
      //this.readerParser = new SerialPort({path:'/dev/ttyS0',baudRate:115200})
      this.readerParser = this.reader.pipe(
        new DelimiterParser({ delimiter: [0x03, 0x00, 0x00], includeDelimiter: false }),
      );
      this.readerParser.on('data', this.onReaderData.bind(this));
    } catch (error) {
      console.log(error);
    }

      this.command_type="VERSION"
      this.logger.log('[d] still not getting verion ... request now')
      this.write(commands.VERSION)
      await this.sleep(10000);

   
      this.command_type="VERSION_PROTOCOLE"
      this.logger.log('[d] still not getting protocole verion  ... request now')
      this.write(commands.VERSION_PROPTOCOLE)
      await this.sleep(10000);

    
       
      this.command_type="SN"
      this.logger.log('[d] still not getting SN  ... request now')
      this.write(commands.SN)
      await this.sleep(10000);


   
      this.command_type='RAD_2'  
      this.starthandleRequestJob(this.deltaTime);
      
  }
  
  write(data: Buffer) {
    try {
      this.reader.write(data);

    } catch (error) {
      this.logger.log("error writing")
    }
  }

  handleRequestJob() {
    this.logger.log("[d] sending RAD_2 COMMAND")
    this.reader.write(commands.RAD_2);
  }

  changehandleRequestJob(seconds) {
    const job = this.schedulerRegistry.getCronJob('request');
    this.logger.log(seconds)
    job.setTime(new CronTime(`*/${seconds} * * * * *`));
  }
  starthandleRequestJob(seconds: number) {
    this.logger.log("[d] create REQUEST RAD_2 JOB ")
    this.job = new CronJob(`*/${seconds} * * * * *`, this.handleRequestJob.bind(this));
    this.schedulerRegistry.addCronJob('request', this.job);
    this.job.start();
  }
  @Cron(CronExpression.EVERY_30_MINUTES)
  handleCron() {
    const storage = execSync(`df -h /data | awk 'NR==2 {print $4}'`).toString();
    const typeKB = storage.includes('K');
    const sizeValue = +storage.replace(/[GMK]/gi, '');
    if (typeKB && sizeValue < 300) {
      this.saveFlag = false;
    }
    else {
      this.saveFlag = true;
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  checkALert() {
    if(new Date().getTime() -this.lastSent.getTime() > this.deltaTime*1000){
      if(this.mqtt.getConnectionState) 
      {
        this.mqtt.publishAlert('[d] device not sending data')
      }
      else if (this.saveFlag)
      {
        this.alert.create('[d] device not sending data')
      }
    }
  }

  onReaderData(buffer: Buffer) {
    try {
      //this.logger.log(buffer)
      if (buffer != null && buffer.length > 7 && buffer[0] === 0x02) {
        let util_data;
        let length = buffer[1] + buffer[2] + buffer[3] + buffer[4];
        length = parseInt(length.toString(), 16)
        this.logger.log("buffer is : " ,)

        switch (this.command_type) {
          case 'RAD_2':
            if(length>=40)
            {
              this.logger.log('[d] rad2 type response')
              util_data = buffer.toString().substring(5, length + 1).split(';');
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
              if(this.mqtt.getConnectionState) 
              {
                this.mqtt.publishState(JSON.stringify(this.payload));
              }
              else if (this.saveFlag)
              {
                this.event.createEvent(this.payload)
              }
            }
            break;
          case 'VERSION':
            this.logger.log('[d] version type response')
            util_data = buffer.subarray(5,length+1);
            this.payload.version = util_data;
            this.logger.log("version : ",this.payload.version)
            break;
          case 'VERSION_PROTOCOLE':
            this.logger.log('[d] version protcole type response')
            util_data = buffer.toString().substring(5,length+1)
            this.payload.version_protocole = buffer.subarray(5,length+1).toString();
            this.logger.log("protocole version",this.payload.version_protocole)
          case 'SN':
            this.logger.log('[d] sn type response')
            util_data = buffer.subarray(5,length+1).toString();
            this.payload.sn = util_data;
            this.logger.log("sn : ",this.payload.sn)
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