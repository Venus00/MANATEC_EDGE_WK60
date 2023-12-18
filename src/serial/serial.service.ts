
import { Injectable, Logger, OnModuleInit, forwardRef } from '@nestjs/common';
import { SerialPort } from 'serialport';
import { DelimiterParser } from '@serialport/parser-delimiter';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { commands } from './commands';
import { CronJob, CronTime } from 'cron';
import { PAYLOAD } from './data.dto';
import { ProcessService } from 'src/process/process.service';

@Injectable()
export class SerialService implements OnModuleInit {
  private reader;
  private readerParser;
  private readonly logger = new Logger(SerialService.name);
  private job;
  private command_type: string;
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
    private schedulerRegistry: SchedulerRegistry,
    private process: ProcessService,
  ) { }

  async onModuleInit() {
    this.logger.log("[d] init connection with Device ...")
    this.init_device()
    this.logger.log("[d] init requesting from device ...")
    this.starthandleRequestJob(this.process.getStatus().delta_time);
    setInterval(() => {
      this.logger.log("push response from device")
      this.process.lastResponseDate(new Date())
      this.process.pushEntity(JSON.stringify(this.payload))
    }, 5000)
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
      this.logger.error("port is closed")
    }
  }

  async changehandleRequestJob(seconds) {
    const job = this.schedulerRegistry.getCronJob('request');
    this.logger.log(seconds)
    await this.process.updateDelta(parseInt(seconds));
    job.setTime(new CronTime(`*/${seconds} * * * * *`));
  }
  starthandleRequestJob(seconds: number) {
    this.logger.log("[d] create REQUEST from device ")
    this.job = new CronJob(`*/${seconds} * * * * *`, this.handleRequestJob.bind(this));
    this.schedulerRegistry.addCronJob('request', this.job);
    this.job.start();
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
              this.process.lastResponseDate(new Date())
              this.process.pushEntity(JSON.stringify(this.payload))

            }
            break;
          case 'VERSION':
            this.logger.log('[d] version type response')
            util_data = buffer.toString().substring(5);
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