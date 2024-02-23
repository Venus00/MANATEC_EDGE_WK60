import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SerialPort } from 'serialport';
import { InterByteTimeoutParser } from '@serialport/parser-inter-byte-timeout';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ProcessService } from 'src/process/process.service';
import { Alert } from 'src/alert/alert';
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
  private current_request_elements_key;
  private readonly logger = new Logger(Serial2Service.name);
  private job;
  private health_data = health;
  private last_reply_vims: Date = new Date();
  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private process: ProcessService,
  ) {}

  async onModuleInit() {
    this.logger.log('[d] init connection with Device ...');
    this.init_device();
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
        new InterByteTimeoutParser({
          interval: 30,
          //maxBufferSize: 100,
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
    await this.sleep(5000);
    this.current_data_number = data_number_machine;
    this.request(health_machine, 2);
    await this.sleep(5000);
    this.current_data_number = data_number_transmission;
    this.request(health_transmission, 3);
    // } else {
    //   this.logger.error('port is closed');
    // }
  }

  request(config_object: any, index: number) {
    this.current_request_elements = this.getIDs(config_object);
    this.current_request_elements_key = this.getEntity(config_object);
    this.current_sequence = `000${index}`;
    //this.logger.log(this.current_request_elements);
    const request = this.buildRequest(this.current_request_elements);
    // fs.appendFileSync('test.log', request.toString('hex') + '\n');
    console.log(request);
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
  returnFrame(buffer: Buffer) {
    for (let i = 0; i < buffer.length - 1; i++) {
      if (buffer[i] === 0xff && buffer[i + 1] === 0xff) {
        return buffer.subarray(i, buffer.length);
      }
    }
  }
  returnUtilData(buffer: Buffer) {
    let i = 0;
    let result = [];
    while (i < buffer.length) {
      if (buffer[i] === 0x01 && buffer[i + 1] === 0x6a) {
        console.log('[d] vims message returned');
        result.push(buffer.subarray(i, i + 16));
        i = i + 16;
      } else if (buffer[i] === 0xff && buffer[i + 1] === 0xfd) {
        console.log('[d] error message returned');
        result.push(buffer.subarray(i, i + 9));
        i = i + 9;
      } else if (buffer[i] === 0xff && buffer[i + 1] === 0xfe) {
        console.log('[d] ack message returned');
        result.push(buffer.subarray(i, i + 7));
        i = i + 7;
      } else if (buffer[i] === 0xff && buffer[i + 1] === 0xff) {
        console.log('[d] data message returned');
        const byte_length = buffer[5] | (buffer[4] << 8);
        const crc_length = 2;
        const end_length = 1;
        result.push(
          buffer.subarray(i, i + 4 + byte_length + crc_length + end_length),
        );
        i = i + byte_length + 4 + crc_length + end_length;
      }
    }
    console.log(result);
    return result;
  }
  onReaderData(buffer: Buffer) {
    try {
      console.log(buffer);
      console.log(this.returnUtilData(buffer));
      // if (buffer != null) {
      //   this.logger.log('buffer is not null');
      //   this.logger.log(buffer[1]);
      //   if ((buffer[0] | (buffer[1] << 8)) === 0xfffe) {
      //     this.logger.log('response data');
      //     this.process.lastReplyRequestHealth(new Date());
      //     const data = this.returnFrame(buffer);
      //     const sequence_number = data[3] | (data[2] << 8);
      //     console.log(sequence_number);
      //     if (sequence_number === parseInt(this.current_sequence, 16)) {
      //       this.logger.log('sequence checked');
      //       const number_of_bytes = data[7] | (data[6] << 8);
      //       this.setResponseValues(data, number_of_bytes);
      //       if (sequence_number === parseInt('0003', 16)) {
      //         this.process.pushHealth(this.health_data);
      //         this.health_data = health;
      //       }
      //     }
      //   } else if ((buffer[1] | (buffer[0] << 8)) === 0xfffd) {
      //     console.log('[d] error received');
      //     const error = buffer[5] | (buffer[4] << 8);
      //     console.log(error);
      //     switch (error) {
      //       case 0x0001:
      //         this.process.pushALert({
      //           ...Alert.INVALID_RPC_ID,
      //           created_at: new Date(),
      //         });
      //         break;
      //       case 0x0002:
      //         this.process.pushALert({
      //           ...Alert.ERROR_ARGUMENT,
      //           created_at: new Date(),
      //         });
      //         break;
      //       case 0x0004:
      //         this.process.pushALert({
      //           ...Alert.ECM_NOT_READY,
      //           created_at: new Date(),
      //         });
      //         break;
      //       case 0x0005:
      //         this.process.pushALert({
      //           ...Alert.ECM_READY,
      //           created_at: new Date(),
      //         });
      //         break;
      //       default:
      //         break;
      //     }
      //   } else if ((buffer[1] | (buffer[0] << 8)) === 0x016a) {
      //     console.log('[d] vims still active');
      //     //vims still active update last replay datep
      //     this.process.lastReplyHealth(new Date());
      //   }
      // }
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
      Object.entries(this.health_data).forEach((item) => {
        if (item[0] === this.current_request_elements_key[i]) {
          this.health_data[item[0]].value = response;
        }
      });
    }
    this.logger.log(this.health_data);
  }
  getEntity(object: any) {
    return Object.entries(object).map((item: any) => {
      return item[0];
    });
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
