import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SerialPort } from 'serialport';
import { DelimiterParser } from '@serialport/parser-delimiter';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ProcessService } from 'src/process/process.service';
import {
  health,
  request_identity,
  request_end,
  sequence_number,
  data_number,
} from './config';
import { CronJob, CronTime } from 'cron';
import { crc16 } from 'crc';
@Injectable()
export class Serial2Service implements OnModuleInit {
  private reader;
  private readerParser;
  private current_sequence: Buffer = Buffer.alloc(2);
  private current_request_elements;
  private readonly logger = new Logger(Serial2Service.name);
  private job;
  private health_data = health;
  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private process: ProcessService,
  ) {}

  async onModuleInit() {
    this.logger.log('[d] init connection with Device ...');
    this.init_device();
    this.logger.log('[d] init requesting from device ...');
    this.starthandleRequestJob(this.process.getStatus().delta_time);
  }

  init_device() {
    try {
      this.reader = new SerialPort({
        path: '/dev/ttyS2',
        baudRate: 9600,
      });
      this.readerParser = this.reader.pipe(
        new DelimiterParser({
          delimiter: [0xc0],
          includeDelimiter: false,
        }),
      );
      this.readerParser.on('data', this.onReaderData.bind(this));
      this.reader.on('close', this.onReaderClose.bind(this));
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
  write(data: Buffer) {
    try {
      this.reader.write(data);
    } catch (error) {
      this.logger.log('error writing');
    }
  }

  async handleRequestJob() {
    if (this.reader.isOpen) {
      //request job
      //return the group
      const request_group = this.splitObj(this.health_data, 16);
      let index = 0;
      for (const request_elements in request_group) {
        this.current_sequence.writeInt16LE(index);
        this.current_request_elements = request_elements;
        const request = this.buildRequest(request_elements);
        index++;
        this.write(request);
      }
    } else {
      this.logger.error('port is closed');
    }
  }

  async changehandleRequestJob(seconds) {
    const job = this.schedulerRegistry.getCronJob('request');
    this.logger.log(seconds);
    await this.process.updateDelta(parseInt(seconds));
    job.setTime(new CronTime(`*/${seconds} * * * * *`));
  }
  starthandleRequestJob(seconds: number) {
    this.logger.log('[d] create REQUEST from device ');
    this.job = new CronJob(
      `*/${seconds} * * * * *`,
      this.handleRequestJob.bind(this),
    );
    this.schedulerRegistry.addCronJob('request', this.job);
    this.job.start();
  }

  async onReaderClose() {
    this.logger.error('PORT CLOSED');
  }
  splitBufferwithSperator(buffer, seprator) {
    const result = [];
    let current_byte = [];
    for (let i = 0; i < buffer.length; i++) {
      if (buffer[i] === seprator) {
        if (current_byte.length > 0) {
          result.push(current_byte);
          current_byte = [];
        } else {
          current_byte.push(buffer[i]);
        }
      }
    }
    return result;
  }
  onReaderData(buffer: Buffer) {
    try {
      if (buffer != null) {
        this.process.lastReplyHealth(new Date());
        if ((buffer[0] | (buffer[1] << 8)) === 0xffff) {
          const sequence_number = buffer[2] | (buffer[3] << 8);
          if (sequence_number === this.current_sequence.readInt16BE()) {
            this.setResponseValues(buffer);
            this.process.pushHealth(JSON.stringify(this.health_data));
          }
        } else {
          // if ((buffer[0] | (buffer[1] << 8)) === 0xfffd) {
          //this.process.pushALert()
          // }
        }
      }
    } catch (error) {
      this.logger.log(error);
    }
  }
  sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  buildRequest(request_elements: any) {
    const crc = crc16(
      Buffer.from([
        request_identity,
        sequence_number,
        data_number,
        ...request_elements,
      ]),
    ).toString(16);
    return Buffer.from([
      request_identity,
      sequence_number,
      data_number,
      ...request_elements,
      ,
      crc,
      request_end,
    ]);
  }
  setResponseValues(buffer: Buffer) {
    for (let i = 0; i < 16; i++) {
      const response = Buffer.from([
        buffer[7 + i],
        buffer[8 + i],
        buffer[9 + i],
        buffer[10 + i],
      ]).readFloatBE();
      Object.keys(this.health_data).forEach((key) => {
        if (
          this.health_data[key].mid_uid === this.current_request_elements[i]
        ) {
          this.health_data[key].value = response;
        }
      });
    }
  }
  splitObj(object: any, size: number) {
    const array = [];
    let subArray = [];
    Object.entries(object).forEach((element: any, index) => {
      subArray.push(element[1].mid_uid);
      if ((index + 1) % size === 0) {
        array.push(subArray);
        subArray = [];
      }
    });
    return array;
  }
}
