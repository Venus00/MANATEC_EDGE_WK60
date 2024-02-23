import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SerialPort } from 'serialport';
import { DelimiterParser } from '@serialport/parser-delimiter';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ProcessService } from 'src/process/process.service';
import { errros } from './config';
import { Alert } from 'src/alert/alert';
import * as moment from 'moment';
import { exec, execSync } from 'child_process';
interface PAYLOAD {
  version_protocole: string;
  version: string;
  sn: string;
  unit: string;
  total: string;
  number_weightings: string;
  current_weight_loading: string;
  voucher_number: string;
  status: string;
  weight_last_stroke: string;
  error_message: string;
  error_value: string;
  value: string;
  date_last_strok: string;
  time_last_stroke: string;
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
  private current_total: number = 0;
  private command_type: string;
  private payload: PAYLOAD = {
    version_protocole: '',
    version: '1.1.6 0.29715',
    sn: '',
    unit: 'T',
    total: '',
    number_weightings: '',
    current_weight_loading: '0',
    voucher_number: '',
    status: '',
    weight_last_stroke: '0',
    error_message: '',
    error_value: '',
    value: '',
    date_last_strok: '',
    time_last_stroke: '',
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
    try {
      this.payload.sn = execSync(
        `ifconfig wlan0 | grep -o -E '([[:xdigit:]]{1,2}:){5}[[:xdigit:]]{1,2}'`,
      )
        .toString()
        .replaceAll(':', '')
        .trim();
    } catch (error) {
      this.logger.error(error);
    }
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
          delimiter: [0x03],
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
    const decoder = new TextDecoder('ascii');
    const result = [];
    let current_byte = [];
    for (let i = 0; i < buffer.length; i++) {
      if (buffer[i] === seprator) {
        if (current_byte.length > 0) {
          result.push(decoder.decode(Buffer.from(current_byte)));
          current_byte = [];
        }
      } else {
        current_byte.push(buffer[i]);
      }
    }
    result.push(decoder.decode(Buffer.from(current_byte)));
    return result;
  }
  returnFrame(buffer: Buffer) {
    for (let i = 0; i < buffer.length; i++) {
      if (buffer[i] === 0x02) {
        return buffer.subarray(i, buffer.length);
      }
    }
  }
  async onReaderData(data: Buffer) {
    try {
      const buffer = this.returnFrame(data);
      if (buffer != null && buffer[0] === 0x02) {
        this.process.lastResponseDate(new Date());
        const protocole_number = buffer[1];
        this.payload.version_protocole = new TextDecoder('ascii').decode(
          Buffer.from([buffer[1]]),
        );
        const util_data = this.splitBufferwithSperator(
          buffer.subarray(3, buffer.length),
          0x01,
        );
        switch (protocole_number) {
          case 0x32:
            if (this.payload.current_weight_loading !== '0') {
              this.payload.weight_last_stroke =
                this.payload.current_weight_loading;
            }
            this.payload.current_weight_loading = util_data[0];

            this.current_total =
              this.current_total +
              parseFloat(
                this.payload.current_weight_loading
                  .toString()
                  .replace(',', '.'),
              );
            this.payload.total = this.current_total.toString();
            this.payload.number_weightings = util_data[1];
            this.payload.voucher_number = util_data[2];
            this.payload.status = 'FB';
            this.logger.log('[d] à la fin de chargement de chaque Godet');
            await this.process.pushEntity(
              JSON.stringify({
                ...this.payload,
                created_at: new Date(),
              }),
            );
            break;
          case 0x34:
            this.payload.error_message = errros[util_data[1]];
            this.payload.error_value = util_data[1];
            this.logger.log('[d] Protocole Erreur');
            this.payload.status = 'Err';

            await this.process.pushALert(
              JSON.stringify({
                ...Alert[this.payload.error_message],
                created_at: new Date(),
              }),
            );
            await this.process.pushEntity(
              JSON.stringify({
                ...this.payload,
                created_at: new Date(),
              }),
            );
            this.payload.error_message = '';
            this.payload.error_value = '';

            break;
          case 0x33:
            this.current_total = 0;
            this.payload.total = util_data[0];
            this.payload.number_weightings = util_data[1];
            this.payload.voucher_number = util_data[2];
            this.payload.date_last_strok = util_data[3];
            this.payload.time_last_stroke = util_data[4];
            this.payload.total_price = util_data[5];
            this.payload.status = 'EL';

            this.logger.log(
              '[d] à la fin de mission de chargement (Shift principalement',
            );
            this.setRtcTime(
              this.payload.date_last_strok,
              this.payload.time_last_stroke,
            );
            await this.process.pushEntity(
              JSON.stringify({
                ...this.payload,
                created_at: new Date(),
              }),
            );
            this.payload.total_price = '';
            this.payload.total = '0';
            break;
          case 0x38:
            this.current_total = 0;
            this.payload.total = util_data[0];
            this.payload.number_weightings = util_data[1];
            this.payload.voucher_number = util_data[2];
            this.payload.date_last_strok = util_data[3];
            this.payload.time_last_stroke = util_data[4];
            this.payload.total_price = util_data[5];
            this.payload.costumer_name = util_data[6];
            this.payload.costumer_number = util_data[7];
            this.payload.material_name = util_data[8];
            this.payload.material_number = util_data[9];
            this.payload.building_name = util_data[10];
            this.payload.building_number = util_data[11];
            this.payload.driver_name = util_data[12];
            this.payload.driver_number = util_data[13];
            this.payload.vehicule_name = util_data[14];
            this.payload.vehicule_number = util_data[15];
            this.payload.container_name = util_data[16];
            this.payload.container_number = util_data[17];
            this.payload.status = 'FL';

            this.setRtcTime(
              this.payload.date_last_strok,
              this.payload.time_last_stroke,
            );
            this.logger.log(
              '[d] à la fin de mission de chargement (Shift principalement',
            );
            await this.process.pushEntity(
              JSON.stringify({
                ...this.payload,
                created_at: new Date(),
              }),
            );
            this.clear_payload();

            break;
          default:
            break;
        }
      }
    } catch (error) {
      this.logger.log(error);
    }
  }
  setRtcTime(date: string, time: string) {
    console.log(moment(`${date} ${time}`).format('YYYY-MM-DD hh:mm:ss'));
    exec(
      `sudo timedatectl set-time "${moment(`${date} ${time}`).format(
        'YYYY-MM-DD hh:mm:ss',
      )}"`,
    );
  }
  clear_payload() {
    this.payload.total = '0';
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
