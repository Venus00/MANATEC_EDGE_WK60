import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { execSync } from 'child_process';
import { AlertService } from 'src/alert/alert.service';
import { EventService } from 'src/event/event.service';
import { MqttService } from 'src/mqtt/mqtt.service';
import { StatusService } from 'src/status/status.service';
import getMAC, { isMAC } from 'getmac';
import { Alert } from '../alert/alert';

import * as os from 'os';
export interface STATUS {
  delta_time: number
  storage: String
  total_event: number
  total_alert: number
  ip: String
  mac: String
  shutdown_counter: number
  last_log_date: Date | undefined
}
@Injectable()
export class ProcessService implements OnModuleInit {
  private logger = new Logger(ProcessService.name)
  private saveFlag = true;
  private last_sent = new Date();
  private status: STATUS = {
    storage: '',
    total_alert: 0,
    total_event: 0,
    delta_time: 0,
    last_log_date: undefined,
    ip: '',
    mac: '',
    shutdown_counter: 0,
  }

  constructor(
    private statusService: StatusService,
    private event: EventService,
    private alert: AlertService,
    private mqtt: MqttService
  ) { }

  async onModuleInit() {
    await this.statusService.createIfNotExist({
      total_alert: 0,
      total_event: 0,
      delta: 90,
      shut: 0,
    });
    const statusFromDb = await this.statusService.get();
    this.logger.log("status from db  : ", statusFromDb);
    this.status.delta_time = statusFromDb.delta;
    this.status.shutdown_counter = statusFromDb.shut;
    this.status.last_log_date = statusFromDb.last_log_date;
    this.status.total_alert = statusFromDb.total_alert;
    this.status.total_event = statusFromDb.total_event;
    await this.statusService.updateShutDownCount(this.status.shutdown_counter + 1)
    this.status.storage = execSync(`df -h /data | awk 'NR==2 {print $4}'`).toString().replace(/\n/g, '');
    this.status.mac = getMAC('wlan0').replaceAll(':', '')

    setInterval(() => {
      this.statusAlertSender();
      this.logSender();
    }, 10 * 1000)
  }

  getStatus() {
    return this.status;
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  handleCron() {
    const storage = execSync(`df -h /data | awk 'NR==2 {print $4}'`).toString();
    this.status.storage = storage.replace(/\n/g, '');
    const typeKB = storage.includes('K');
    const sizeValue = +storage.replace(/[GMK]/gi, '');
    if (typeKB && sizeValue < 300) {

      this.saveFlag = false;
    }
    else {
      this.saveFlag = true;
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async logSender() {
    if (this.mqtt.getConnectionState() && os.networkInterfaces()['wlan0'][0].address) {
      this.logger.log('mqtt server is Connected ');
      const events = await this.event.events();
      this.logger.log('events log', events.length)
      if (events.length !== 0) {
        this.status.total_event = events.length;
      }
      for (let i = 0; i < events.length; i++) {

        if (this.mqtt.getConnectionState() && os.networkInterfaces()['wlan0'][0].address) {
          this.mqtt.publishPayload(JSON.stringify(events[i]));
          this.logger.log("[d] delete event")
          await this.event.delete(events[i].id)
        }
        else {
          this.logger.error('[d] BROKER MQTT CONNECTION IS LOST')
          return;
        }
      }
      const alerts = await this.alert.getAll();

      this.logger.log("alert from db", alerts.length);
      if (alerts.length !== 0) {
        this.status.total_alert = alerts.length;
      }
      for (let i = 0; i < alerts.length; i++) {
        if (this.mqtt.getConnectionState() && os.networkInterfaces()['wlan0'][0].address) {
          this.mqtt.publishAlert(JSON.stringify(alerts[i]));
          this.logger.log("[d] delete alert")
          await this.alert.delete(alerts[i].id)
        }
        else {
          this.logger.error('[d] BROKERR MQTT CONNECTION IS LOST')
          return;
        }
      }
    }
    else {
      this.logger.error('[d] mqtt server is not connected connot sending ... ');
    }
  }
  async statusAlertSender() {
    //if (this.mqtt.getConnectionState() && os.networkInterfaces()['wlan0'][0].address) {
    this.logger.log("mqtt connection is good sending status payload ....");
    this.logger.log('totale_event', this.status.total_event)
    this.logger.log('totale_alert', this.status.total_alert)
    if (this.status.total_alert !== 0 || this.status.total_event !== 0) {
      this.logger.log('total event diifer from zero updating db now')
      this.statusService.updateEventAlert({
        total_event: this.status.total_event,
        total_alert: this.status.total_alert,
      })
    }
    this.status.ip = os.networkInterfaces()['wlan0'][0].address
    if (os.networkInterfaces()['wlan0'][0].address) {
      this.logger.log('ip', os.networkInterfaces()['wlan0'][0].address)
    }
    if (this.mqtt.getConnectionState()) {

      this.mqtt.publishStatus(JSON.stringify(this.status))
    }
    //}
    this.checkALert()

  }
  lastResponseDate(date: Date) {
    this.last_sent = date;
  }
  pushEntity(payload) {
    if (this.mqtt.getConnectionState()) {
      this.logger.log("connection is good published")
      this.mqtt.publishPayload(JSON.stringify(payload));
    }
    else if (this.saveFlag) {
      this.logger.log("save in database");
      this.event.createEvent(payload)
    }
  }
  async updateDelta(delta_time: number) {
    await this.statusService.updateDelta(delta_time);
    this.status.delta_time = delta_time;
  }
  async checkALert() {
    try {
      if (new Date().getTime() - this.last_sent.getTime() > this.status.delta_time * 1000) {

        this.logger.log('this reader is connected but not sending data')
        if (this.mqtt.getConnectionState() && os.networkInterfaces()['wlan0'][0].address) {
          this.mqtt.publishAlert(JSON.stringify({
            ...Alert.DEVICE,
            created_at: new Date()
          }))
        }
        else if (this.saveFlag) {
          this.logger.log("insert alert no device communication")
          this.status.last_log_date = new Date();
          this.statusService.updateLogDate(this.status.last_log_date)
          this.alert.create({
            ...Alert.DEVICE,
          })
        }
      }
      if (!this.saveFlag) {
        this.mqtt.publishAlert(JSON.stringify({
          ...Alert.STORAGE,
          created_at: new Date(),
        }))
      }
      else {
        if (!this.mqtt.getConnectionState()) {
          //check if only wifi 
          const wifiAddress = os.networkInterfaces()['wlan0'][0].address
          if (!wifiAddress) {
            this.alert.create({
              ...Alert.WIFI
            })
          }
          else {
            this.alert.create({
              ...Alert.MQTT
            })
          }
        }
      }
    } catch (error) {
      this.logger.error(error)
    }
  }
}
