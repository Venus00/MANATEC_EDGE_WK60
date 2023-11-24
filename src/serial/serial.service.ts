
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

interface RAD2 {
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
  private saveFlag = true;
  private job;
  private payload: RAD2 = {
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
    private schedulerRegistry: SchedulerRegistry,
    @Inject(forwardRef(() => MqttService))
    private mqtt: MqttService,
  ) {

  }
  async onModuleInit() {
    this.logger.log("[d] init SERIAL MODULE");
    await this.delta.createIfNotExist(1);
    //this.starthandleRequestJob();
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
  }
  
  write(data: Buffer) {
    this.reader.write(data);
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

  onReaderData(buffer: Buffer) {
    try {
      //this.logger.log(buffer)
      if (buffer != null && buffer.length > 7 && buffer[0] === 0x02) {
        let length = buffer[1] + buffer[2] + buffer[3] + buffer[4];
        length = parseInt(length.toString(), 16)
        const util_data = buffer.toString().substring(5, length + 1).split(';');
        this.logger.log(util_data.length)
        if (util_data.length === 9) {
          this.logger.log('enter')
          this.payload.total = util_data[0];
          this.payload.unit = util_data[1];
          this.payload.number_weightings = util_data[2];
          this.payload.voucher_number = util_data[3];
          this.payload.status = util_data[4];
          this.payload.weight_last_stroke = util_data[5];
          this.payload.date_last_stroke = util_data[6];
          this.payload.time_last_stroke = util_data[7];
          this.payload.current_weight_loading = util_data[8];
          if(this.saveFlag) {
            this.event.createEvent(this.payload)
          }
          this.logger.log("result : ", this.payload);
          this.mqtt.publish('manatec/payload/status',JSON.stringify(this.payload));
        }

        // console.log(util_data);
        // this.logger.log(util_data)
        //this.event.createEvent(util_data);

      }
    } catch (error) {
      this.logger.error(error);
    }
  }
  insertFirstDeltaIfNotExist() {
    this
  }
}