import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SerialPort } from 'serialport';
import { DelimiterParser } from '@serialport/parser-delimiter';
import { SchedulerRegistry } from '@nestjs/schedule';
import { commands } from './commands';
import { CronJob, CronTime } from 'cron';
import { PAYLOAD } from './data.dto';
import { ProcessService } from 'src/process/process.service';

interface GODET_LOAD {
  weight: string;
  number: string;
  voucher: string;
}
interface ERROR {
  message: string;
  value: string;
}

interface FINISH {
  total_weight: string;
  number_buckets: string;
  voucher_number: string;
  date: string;
  clock_time: string;
  total_price: string;
}

interface FINISH_SHIFT {
  total_weight: string;
  number_bucket: string;
  voucher_number: string;
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
  private godet_load: GODET_LOAD;
  private error: ERROR;
  private finish_shift: FINISH_SHIFT;
  private finish: FINISH;
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

  async handleRequestJob() {
    if (this.reader.isOpen) {
      if (this.payload.version === '') {
        this.command_type = 'VERSION';
        this.logger.error('[d] still not getting verion');
        this.write(commands.VERSION);
        await this.sleep(5000);
      }
      if (this.payload.version_protocole === '') {
        this.command_type = 'VERSION_PROTOCOLE';
        this.logger.error('[d] still not getting protocole verion');
        this.write(commands.VERSION_PROPTOCOLE);
        await this.sleep(5000);
      }
      if (this.payload.sn === '') {
        this.command_type = 'SN';
        this.logger.error('[d] still not getting sn ... ');
        this.write(commands.SN);
        await this.sleep(5000);
      }
      this.command_type = 'RAD_2';
      this.logger.log('[d] sending RAD_2 COMMAND');
      this.write(commands.RAD_2);
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
      if (buffer != null && buffer[0] === 0x02) {
        const protocole_number = buffer[1];
        const util_data = this.splitBufferwithSperator(
          buffer.subarray(2, buffer.length - 1),
          0x01,
        );
        this.logger.log('[d] util data', util_data);
        switch (protocole_number) {
          case 0x32:
            this.godet_load.weight = util_data[0].toString();
            this.godet_load.number = util_data[1].toString();
            this.godet_load.voucher = util_data[2].toString();
            this.logger.log('[d] à la fin de chargement de chaque Godet');
            break;
          case 0x34:
            this.error.message = util_data[0].toString();
            this.error.value = util_data[1].toString();
            this.logger.log('[d] Protocole Erreur');
            break;
          case 0x33:
            this.finish.total_weight = util_data[0].toString();
            this.finish.number_buckets = util_data[1].toString();
            this.finish.voucher_number = util_data[2].toString();
            this.finish.date = util_data[3].toString();
            this.finish.clock_time = util_data[4].toString();
            this.finish.total_price = util_data[5].toString();
            this.finish.total_weight = util_data[6].toString();
            this.logger.log(
              '[d] à la fin de mission de chargement (Shift principalement',
            );
          case 0x38:
            this.finish_shift.total_weight = util_data[0].toString();
            this.finish_shift.number_bucket = util_data[1].toString();
            this.finish_shift.voucher_number = util_data[2].toString();
            this.finish_shift.date = util_data[3].toString();
            this.finish_shift.clock_time = util_data[4].toString();
            this.finish_shift.total_price = util_data[5].toString();
            this.finish_shift.costumer_name = util_data[6].toString();
            this.finish_shift.costumer_number = util_data[7].toString();
            this.finish_shift.material_name = util_data[8].toString();
            this.finish_shift.material_number = util_data[9].toString();
            this.finish_shift.building_name = util_data[10].toString();
            this.finish_shift.building_number = util_data[11].toString();
            this.finish_shift.driver_name = util_data[12].toString();
            this.finish_shift.driver_number = util_data[13].toString();
            this.finish_shift.vehicule_name = util_data[14].toString();
            this.finish_shift.vehicule_number = util_data[15].toString();
            this.finish_shift.container_name = util_data[16].toString();
            this.finish_shift.container_number = util_data[17].toString();
            this.logger.log(
              '[d] à la fin de mission de chargement (Shift principalement',
            );
          default:
            break;
        }
      }
    } catch (error) {
      this.logger.log(error);
    }
  }
  sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
}
