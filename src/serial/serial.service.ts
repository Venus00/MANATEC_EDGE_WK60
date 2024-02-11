import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SerialPort } from 'serialport';
import { DelimiterParser } from '@serialport/parser-delimiter';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ProcessService } from 'src/process/process.service';
import { errros } from './config';
import { Alert } from 'src/alert/alert';
interface PAYLOAD {
  created_at: Date;
  version_protocole: string;
  total_weight: string;
  number_bucket: string;
  current_weighting: string;
  voucher_number: string;
  error_message: string;
  error_value: string;
  value: string;
  date: string;
  clock_time: string;
  total_price: string;
  costumer_name: string;
  costumer_number: string;
  material_name: string;
  material_number: string;
  building_name: string;
  building_number: string;
  driver_name: string;
  driver_number: string;
  vehicule_number: string;
  vehicule_name: string;
  container_name: string;
  container_number: string;
}

@Injectable()
export class SerialService implements OnModuleInit {
  private reader;
  private readerParser;
  private readonly logger = new Logger(SerialService.name);
  private job;
  private command_type: string;
  private payload: PAYLOAD = {
    created_at: new Date(),
    version_protocole: '',
    total_weight: '',
    number_bucket: '',
    current_weighting: '',
    voucher_number: '',
    error_message: '',
    error_value: '',
    value: '',
    date: '',
    clock_time: '',
    total_price: '',
    costumer_name: '',
    costumer_number: '',
    material_name: '',
    material_number: '',
    building_name: '',
    building_number: '',
    driver_name: '',
    driver_number: '',
    vehicule_number: '',
    vehicule_name: '',
    container_name: '',
    container_number: '',
  };
  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private process: ProcessService,
  ) {}

  async onModuleInit() {
    this.logger.log('[d] init connection with Device ...');
    this.init_device();
    this.logger.log('[d] init requesting from device ...');
    //this.starthandleRequestJob(this.process.getStatus().delta_time);
  }

  init_device() {
    try {
      this.reader = new SerialPort({
        path: '/dev/ttyS0',
        baudRate: 9600,
      });
      this.readerParser = this.reader.pipe(
        new DelimiterParser({
          delimiter: [0x03, 0x00, 0x00],
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

  // async handleRequestJob() {
  //   if (this.reader.isOpen) {
  //     if (this.payload.version === '') {
  //       this.command_type = 'VERSION';
  //       this.logger.error('[d] still not getting verion');
  //       this.write(commands.VERSION);
  //       await this.sleep(5000);
  //     }
  //     if (this.payload.version_protocole === '') {
  //       this.command_type = 'VERSION_PROTOCOLE';
  //       this.logger.error('[d] still not getting protocole verion');
  //       this.write(commands.VERSION_PROPTOCOLE);
  //       await this.sleep(5000);
  //     }
  //     if (this.payload.sn === '') {
  //       this.command_type = 'SN';
  //       this.logger.error('[d] still not getting sn ... ');
  //       this.write(commands.SN);
  //       await this.sleep(5000);
  //     }
  //     this.command_type = 'RAD_2';
  //     this.logger.log('[d] sending RAD_2 COMMAND');
  //     this.write(commands.RAD_2);
  //   } else {
  //     this.logger.error('port is closed');
  //   }
  // }

  // async changehandleRequestJob(seconds) {
  //   const job = this.schedulerRegistry.getCronJob('request');
  //   this.logger.log(seconds);
  //   await this.process.updateDelta(parseInt(seconds));
  //   job.setTime(new CronTime(`*/${seconds} * * * * *`));
  // }
  // starthandleRequestJob(seconds: number) {
  //   this.logger.log('[d] create REQUEST from device ');
  //   this.job = new CronJob(
  //     `*/${seconds} * * * * *`,
  //     this.handleRequestJob.bind(this),
  //   );
  //   this.schedulerRegistry.addCronJob('request', this.job);
  //   this.job.start();
  // }

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
      if (buffer != null && buffer[0] === 0x02) {
        const protocole_number = buffer[1];
        const util_data = this.splitBufferwithSperator(
          buffer.subarray(2, buffer.length - 1),
          0x01,
        );
        this.logger.log('[d] util data', util_data);
        this.clear_payload();
        switch (protocole_number) {
          case 0x32:
            this.payload.current_weighting = util_data[0].toString();
            this.payload.number_bucket = util_data[1].toString();
            this.payload.voucher_number = util_data[2].toString();
            this.logger.log('[d] à la fin de chargement de chaque Godet');
            break;
          case 0x34:
            this.payload.error_message = errros[util_data[1].toString('ascii')];
            this.payload.error_value = util_data[1].toString();
            this.logger.log('[d] Protocole Erreur');
            this.process.pushALert(
              JSON.stringify({
                ...Alert[this.payload.error_message],
                created_at: new Date(),
              }),
            );
            break;
          case 0x33:
            this.payload.total_weight = util_data[0].toString();
            this.payload.number_bucket = util_data[1].toString();
            this.payload.voucher_number = util_data[2].toString();
            this.payload.date = util_data[3].toString();
            this.payload.clock_time = util_data[4].toString();
            this.payload.total_price = util_data[5].toString();
            this.logger.log(
              '[d] à la fin de mission de chargement (Shift principalement',
            );
            break;
          case 0x38:
            this.payload.total_weight = util_data[0].toString();
            this.payload.number_bucket = util_data[1].toString();
            this.payload.voucher_number = util_data[2].toString();
            this.payload.date = util_data[3].toString();
            this.payload.clock_time = util_data[4].toString();
            this.payload.total_price = util_data[5].toString();
            this.payload.costumer_name = util_data[6].toString();
            this.payload.costumer_number = util_data[7].toString();
            this.payload.material_name = util_data[8].toString();
            this.payload.material_number = util_data[9].toString();
            this.payload.building_name = util_data[10].toString();
            this.payload.building_number = util_data[11].toString();
            this.payload.driver_name = util_data[12].toString();
            this.payload.driver_number = util_data[13].toString();
            this.payload.vehicule_name = util_data[14].toString();
            this.payload.vehicule_number = util_data[15].toString();
            this.payload.container_name = util_data[16].toString();
            this.payload.container_number = util_data[17].toString();
            this.logger.log(
              '[d] à la fin de mission de chargement (Shift principalement',
            );
            break;
          default:
            break;
        }
        this.process.pushEntity(JSON.stringify(this.payload));
      }
    } catch (error) {
      this.logger.log(error);
    }
  }
  clear_payload() {
    this.payload.current_weighting = '';
    this.payload.number_bucket = '';
    this.payload.error_message = '';
    this.payload.error_value = '';
    this.payload.total_weight = '';
    this.payload.number_bucket = '';
    this.payload.voucher_number = '';
    this.payload.date = '';
    this.payload.clock_time = '';
    this.payload.total_price = '';
    this.payload.costumer_name = '';
    this.payload.costumer_number = '';
    this.payload.material_name = '';
    this.payload.material_number = '';
    this.payload.building_name = '';
    this.payload.building_number = '';
    this.payload.driver_name = '';
    this.payload.driver_number = '';
    this.payload.vehicule_name = '';
    this.payload.vehicule_number = '';
    this.payload.container_name = '';
    this.payload.container_number = '';
  }
  sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
}
