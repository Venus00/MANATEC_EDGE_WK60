import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { execSync } from 'child_process';
import { AlertService } from 'src/alert/alert.service';
import { EventService } from 'src/event/event.service';
import { MqttService } from 'src/mqtt/mqtt.service';
import { StatusService } from 'src/status/status.service';
import { Alert } from '../alert/alert';

import * as os from 'os';
export interface STATUS {
  delta_time: number;
  storage: string;
  total_event: number;
  total_alert: number;
  ip: string;
  mac: string;
  shutdown_counter: number;
  last_log_date: Date | undefined;
  last_response_date_vims: Date | undefined;
  engine_status: string;
}
@Injectable()
export class ProcessService implements OnModuleInit {
  private logger = new Logger(ProcessService.name);
  private saveFlag = true;
  private last_sent = new Date();
  private health_engine: any;
  private status: STATUS = {
    storage: '',
    total_alert: 0,
    total_event: 0,
    delta_time: 0,
    last_log_date: undefined,
    ip: '',
    mac: '',
    shutdown_counter: 0,
    last_response_date_vims: undefined,
    engine_status: '',
  };

  constructor(
    private statusService: StatusService,
    private event: EventService,
    private alert: AlertService,
    private mqtt: MqttService,
  ) {}

  async onModuleInit() {
    await this.statusService.createIfNotExist({
      total_alert: 0,
      total_event: 0,
      delta: 60 * 4 * 1000,
      shut: 0,
      engine_status: '',
    });
    const statusFromDb = await this.statusService.get();
    this.logger.log('status from db  : ', statusFromDb);
    this.status.delta_time = statusFromDb.delta;
    this.status.shutdown_counter = statusFromDb.shut;
    this.status.last_log_date = statusFromDb.last_log_date;
    this.status.total_alert = statusFromDb.total_alert;
    this.status.total_event = statusFromDb.total_event;
    this.status.last_response_date_vims = statusFromDb.last_response_date_vims;
    this.status.engine_status = statusFromDb.engine_status;
    await this.statusService.updateShutDownCount(
      this.status.shutdown_counter + 1,
    );
    try {
      this.status.storage = execSync(`df -h /data | awk 'NR==2 {print $4}'`)
        .toString()
        .replace(/\n/g, '');
      this.status.mac = execSync(
        `ifconfig wlan0 | grep -o -E '([[:xdigit:]]{1,2}:){5}[[:xdigit:]]{1,2}'`,
      )
        .toString()
        .replaceAll(':', '')
        .trim();
    } catch (error) {
      this.logger.error(error);
    }

    setInterval(async () => {
      await this.pushStatus();
      await this.checkALert();
      await this.checkLog();
    }, 30 * 1000);
  }

  getStatus() {
    return this.status;
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  checkSystemStorage() {
    try {
      const storage = execSync(
        `df -h /data | awk 'NR==2 {print $4}'`,
      ).toString();
      this.status.storage = storage.replace(/\n/g, '');
      const typeKB = storage.includes('K');
      const sizeValue = +storage.replace(/[GMK]/gi, '');
      if (typeKB && sizeValue < 300) {
        this.saveFlag = false;
      } else {
        this.saveFlag = true;
      }
    } catch (error) {
      this.logger.error(error);
    }
  }

  //@Cron(CronExpression.EVERY_MINUTE)
  async checkLog() {
    if (this.mqtt.getConnectionState() && os.networkInterfaces()['wlan0']) {
      this.logger.log('mqtt server is Connected ');
      const events = await this.event.events();
      this.logger.log('events log', events.length);
      if (events.length !== 0) {
        this.status.total_event = events.length;
      }
      for (let i = 0; i < events.length; i++) {
        if (this.mqtt.getConnectionState() && os.networkInterfaces()['wlan0']) {
          this.mqtt.publishPayload(JSON.stringify(events[i]));
          this.logger.log('[d] delete event');
          await this.event.delete(events[i].id);
        } else {
          this.logger.error('[d] BROKER MQTT CONNECTION IS LOST');
          return;
        }
      }
      const alerts = await this.alert.getAll();

      this.logger.log('alert from db', alerts.length);
      if (alerts.length !== 0) {
        this.status.total_alert = alerts.length;
      }
      for (let i = 0; i < alerts.length; i++) {
        if (this.mqtt.getConnectionState() && os.networkInterfaces()['wlan0']) {
          this.mqtt.publishAlert(JSON.stringify(alerts[i]));
          this.logger.log('[d] delete alert');
          await this.alert.delete(alerts[i].id);
        } else {
          this.logger.error('[d] BROKERR MQTT CONNECTION IS LOST');
          return;
        }
      }
    } else {
      this.logger.error('[d] mqtt server is not connected connot sending ... ');
    }
  }
  async pushStatus() {
    if (this.mqtt.getConnectionState() && os.networkInterfaces()['wlan0']) {
      if (this.status.total_alert !== 0 || this.status.total_event !== 0) {
        await this.statusService.updateEventAlert(
          this.status.total_alert,
          this.status.total_event,
        );
      }
      this.status.ip = os.networkInterfaces()['wlan0'][0].address;
      this.logger.log(this.status.ip);
      if (this.status.ip) {
        this.logger.log('ip', this.status.ip);
      }
      this.mqtt.publishStatus(JSON.stringify(this.status));
    } else {
      this.logger.log('connection problem');
    }
  }
  engineHealth(obj: any) {
    this.health_engine = obj;
  }
  lastReplyHealth(date: Date) {
    this.status.last_response_date_vims = date;
  }
  lastResponseDate(date: Date) {
    this.last_sent = date;
  }
  async pushALert(payload) {
    if (this.mqtt.getConnectionState()) {
      this.logger.log('connection is good published');
      this.mqtt.publishAlert(JSON.stringify(payload));
    } else if (this.saveFlag) {
      this.logger.log('save in database');
      await this.alert.create(JSON.parse(payload));
    }
  }
  async pushHealth(payload) {
    if (this.mqtt.getConnectionState()) {
      this.logger.log('connection is good published');
      this.mqtt.publishHealth(JSON.stringify(payload));
    } else if (this.saveFlag) {
      this.logger.log('save in database');
      await this.event.createHealth(payload);
    }
  }
  async pushEntity(payload) {
    if (this.mqtt.getConnectionState()) {
      this.logger.log('connection is good published');
      this.mqtt.publishPayload(JSON.stringify(payload));
    } else if (this.saveFlag) {
      this.logger.log('save in database');
      await this.event.createEvent(JSON.parse(payload));
      this.status.last_log_date = new Date();
      await this.statusService.updateLogDate(this.status.last_log_date);
    }
  }
  async updateDelta(delta_time: number) {
    await this.statusService.updateDelta(delta_time);
    this.status.delta_time = delta_time;
  }
  async checkALert() {
    try {
      if (
        new Date().getTime() - this.last_sent.getTime() > 40 * 60 * 1000 &&
        parseInt(this.health_engine?.TR005.value) > 700
      ) {
        this.logger.log('this PAYLOAD is connected but not sending data');
        if (this.mqtt.getConnectionState() && os.networkInterfaces()['wlan0']) {
          this.mqtt.publishAlert(
            JSON.stringify({
              ...Alert.DEVICE,
              created_at: new Date(),
            }),
          );
        } else if (this.saveFlag) {
          this.logger.log('insert alert no device communication');

          await this.alert.create({
            ...Alert.DEVICE,
          });
        }
      }
      if (
        new Date().getTime() - this.status.last_response_date_vims.getTime() >
        4 * 60 * 1000
      ) {
        this.logger.log('this ECM is connected but not sending data');
        if (this.mqtt.getConnectionState() && os.networkInterfaces()['wlan0']) {
          this.mqtt.publishAlert(
            JSON.stringify({
              ...Alert.ECM_NOT_RESPONDING,
              created_at: new Date(),
            }),
          );
          this.mqtt.publishAlert(
            JSON.stringify({
              ...Alert.ECM_MESSAGE_ERROR,
              created_at: new Date(),
            }),
          );
        } else if (this.saveFlag) {
          this.logger.log('insert alert no device communication');

          await this.alert.create({
            ...Alert.DEVICE,
          });
        }
      }
      if (!this.saveFlag) {
        this.mqtt.publishAlert(
          JSON.stringify({
            ...Alert.STORAGE,
            created_at: new Date(),
          }),
        );
      } else {
        if (!this.mqtt.getConnectionState()) {
          //check if only wifi
          const wifiAddress = os.networkInterfaces()['wlan0'];
          if (!wifiAddress) {
            this.logger.error('is not connected to wifi');
            await this.alert.create({
              ...Alert.WIFI,
            });
          } else {
            this.logger.error('is not connected to mqtt');
            await this.alert.create({
              ...Alert.MQTT,
            });
          }
        }
      }
    } catch (error) {
      this.logger.error(error);
    }
  }
}
