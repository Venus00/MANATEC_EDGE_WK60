import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SerialPort } from 'serialport';
import { DelimiterParser } from '@serialport/parser-delimiter';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ProcessService } from 'src/process/process.service';
import { Alert } from 'src/alert/alert';
import * as fs from 'fs';
import {
  health,
  health_machine,
  health_engine,
  health_transmission,
  request_identity,
  request_end,
  data_number_engine,
  data_number_machine,
  data_number_transmission,
} from './config';
import { CronJob, CronTime } from 'cron';
@Injectable()
export class Serial2Service implements OnModuleInit {
  private reader;
  private readerParser;
  private current_sequence: string;
  private current_data_number: string;
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
    //this.init_device();
    this.logger.log('[d] init requesting from device ...');
    this.starthandleRequestJob(this.process.getStatus().delta_time);
    //this.starthandleRequestJob(10);
    // this.current_sequence = '0001';
    // this.current_request_elements = this.getIDs(health_engine);
    // this.testData(
    //   Buffer.from(
    //     'ffff0001003E000F4700100041800000bf00000000000000470010003f3333334363000041f80000428600004700100047001000418800004700100041bc00004f80000009bfc0',
    //     'hex',
    //   ),
    // );
  }

  init_device() {
    try {
      this.reader = new SerialPort({
        path: '/dev/ttyS5',
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
    //if (this.reader.isOpen) {
    //request job
    //return the groups
    this.current_data_number = data_number_engine;
    this.request(health_engine, 1);
    //await this.sleep(5000);
    this.current_data_number = data_number_machine;
    this.request(health_machine, 2);
    //await this.sleep(5000);
    this.current_data_number = data_number_transmission;
    this.request(health_transmission, 3);
    // } else {
    //   this.logger.error('port is closed');
    // }
  }

  request(config_object: any, index: number) {
    const ids = this.getIDs(config_object);
    this.current_sequence = `000${index}`;
    this.current_request_elements = ids;
    //this.logger.log(this.current_request_elements);
    const request = this.buildRequest(this.current_request_elements);
    // fs.appendFileSync('test.log', request.toString('hex') + '\n');
    //console.log(request);
    this.write(request);
    //let index = 0;
    // for (const request_elements in request_group) {
    //   this.current_sequence.writeInt16LE(index);
    //   this.current_request_elements = request_elements;
    //   const request = this.buildRequest(request_elements);
    //   index++;
    //   this.write(request);
    // }
  }
  async changehandleRequestJob(seconds) {
    const job = this.schedulerRegistry.getCronJob('request');
    this.logger.log('seconds', seconds);
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
      console.log(buffer);
      if (buffer != null) {
        this.logger.log('buffer is not null');
        this.logger.log(buffer[1]);
        if ((buffer[0] | (buffer[1] << 8)) === 0xffff) {
          this.logger.log('response data');
          const sequence_number = buffer[3] | (buffer[2] << 8);
          console.log(sequence_number);
          if (sequence_number === parseInt(this.current_sequence, 16)) {
            this.logger.log('sequence checked');
            const number_of_bytes = buffer[7] | (buffer[6] << 8);
            this.setResponseValues(buffer, number_of_bytes);
            if (sequence_number === parseInt(this.current_sequence, 16)) {
              this.process.pushHealth(JSON.stringify(this.health_data));
              this.health_data = health;
            }
          }
        } else if ((buffer[0] | (buffer[1] << 8)) === 0xfffd) {
          const error = buffer[5] | (buffer[6] << 8);
          switch (error) {
            case 0x0001:
              this.process.pushALert({
                ...Alert.INVALID_RPC_ID,
                created_at: new Date(),
              });
              break;
            case 0x0002:
              this.process.pushALert({
                ...Alert.ERROR_ARGUMENT,
                created_at: new Date(),
              });
              break;
            case 0x0004:
              this.process.pushALert({
                ...Alert.ECM_NOT_READY,
                created_at: new Date(),
              });
              break;
            case 0x0005:
              this.process.pushALert({
                ...Alert.ECM_READY,
                created_at: new Date(),
              });
              break;
            default:
              break;
          }
        } else if ((buffer[0] | (buffer[1] << 8)) === 0x016a) {
          //vims still active update last replay date
          this.process.lastReplyHealth(new Date());
        }
      }
    } catch (error) {
      this.logger.log(error);
    }
  }

  sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  buildRequest(request_elements: any) {
    this.logger.log(request_elements.length);
    const packet_crc = [
      request_identity,
      this.current_sequence,
      this.current_data_number,
      ...request_elements,
    ].join('');
    const crc = this.slipcrc(Buffer.from(packet_crc, 'hex')).toString('hex');
    console.log('crc', crc);
    const packet = [
      request_identity,
      this.current_sequence,
      this.current_data_number,
      ...request_elements,
      crc,
      request_end,
    ].join('');
    return Buffer.from(packet, 'hex');
  }
  setResponseValues(buffer: Buffer, number_of_parameters: number) {
    for (let i = 0; i < number_of_parameters; i++) {
      const response = Buffer.from([
        buffer[8 + 4 * i],
        buffer[9 + 4 * i],
        buffer[10 + 4 * i],
        buffer[11 + 4 * i],
      ]).readFloatBE();
      Object.keys(this.health_data).forEach((item) => {
        if (
          this.health_data[item].mid_uid === this.current_request_elements[i]
        ) {
          this.health_data[item].value = response;
        }
      });
    }
    this.logger.log(this.health_data);
  }
  getIDs(object: any) {
    return Object.entries(object).map((item: any) => {
      return item[1].mid_uid;
    });
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
  crc16(ch, crc) {
    const bits = 8;
    let c = crc;
    for (let i = 0; i < bits; i++) {
      if ((ch & 0x01) ^ (c & 0x01)) {
        c >>= 1;
        c ^= 0x8408;
      } else {
        c >>= 1;
      }
      ch >>= 1;
    }
    return c;
  }

  slipcrc(buf) {
    let crc = 0;
    for (const byte of buf) {
      crc = this.crc16(byte, crc);
    }
    crc ^= 0xffff; // Complement the CRC

    const crcbuf = Buffer.from([crc & 0xff, (crc >> 8) & 0xff]); // Corrected byte order
    return crcbuf;
  }
}
