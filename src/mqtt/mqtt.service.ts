import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as mqtt from 'mqtt';
import { EventService } from 'src/event/event.service';
import { SerialService } from 'src/serial/serial.service';
import { commands } from 'src/serial/commands';
import getMAC, { isMAC } from 'getmac';
import { AlertService } from 'src/alert/alert.service';
@Injectable()
export class MqttService {
  private client: mqtt.MqttClient;
  private isConnected: boolean;
  private logger = new Logger(MqttService.name)
  private mac: string = getMAC('wlan0').replaceAll(':', '')
  private TOPIC_SUBSCRIBE = process.env.TOPIC_SUBSCRIBE.replace('+', this.mac)
  private TOPIC_PUBLISH_PAYLOAD = process.env.TOPIC_PUBLISH.replace('+', this.mac)
  private TOPIC_PUBLISH_ALERTE = process.env.TOPIC_ALERT.replace('+', this.mac)
  private TOPIC_PUBLISH_STATUS = process.env.TOPIC_STATUS.replace('+', this.mac)
  private total_event: number;
  private total_alert: number;
  constructor(
    private event: EventService,
    private alert: AlertService,
    @Inject(forwardRef(() => SerialService))
    private serial: SerialService
  ) {
    this.logger.log(process.env.MQTT_SERVER)
    this.client = mqtt.connect(`mqtt://${process.env.MQTT_SERVER}}`, {
      clientId: this.mac,
      username: this.mac,
      password: this.mac,

    });
    this.client.on('connect', this.onConnect.bind(this));
    this.client.on('message', this.onMessage.bind(this));
    this.client.on('disconnect', this.onDisconnect.bind(this));

    setInterval(() => {
      this.senderJob();
    }, 60 * 1000)
  }

  onConnect() {
    this.logger.log('mqtt server is connected');
    this.client.subscribe(this.TOPIC_SUBSCRIBE);
  }
  onDisconnect() {
    this.logger.error("mqtt server is disconnected")
  }
  publishStatus(message: string) {
    this.logger.log(this.TOPIC_PUBLISH_STATUS)
    this.client.publish(this.TOPIC_PUBLISH_STATUS, message);
  }
  publishPayload(message: string) {
    this.client.publish(this.TOPIC_PUBLISH_PAYLOAD, message)
  }
  publishAlert(message: string) {
    this.client.publish(this.TOPIC_PUBLISH_ALERTE, message);
  }
  getConnectionState() {
    return this.client.connected;
  }

  getTotalEvent() {
    return this.total_event;
  }

  getTotalAlert() {
    return this.total_alert;
  }
  async senderJob() {
    if (this.client.connected) {
      this.logger.log('mqtt server is Connected ');
      const events = await this.event.events();
      if(events.length !== 0)
      {
        this.total_event = events.length;
      }
      for (let i = 0; i < events.length; i++) {

        this.publishPayload(JSON.stringify(events[i]));
        this.logger.log("[d] delete event")
        await this.event.delete(events[i].id)

      }
      const alerts = await this.alert.getAll();
      this.logger.log("alert from db", alerts);
      if(alerts.length !== 0)
      {
        this.total_alert = alerts.length;
      }
      for (let i = 0; i < alerts.length; i++) {
        this.publishAlert(JSON.stringify(alerts[i]));
        this.logger.log("[d] delete alert")
        await this.alert.delete(alerts[i].id)
      }
    }
    else {
      this.logger.log('mqtt server is not connected connot sending ... ');
    }
  }

  onMessage(topic: string, message: string) {
    try {
      const payload = JSON.parse(message)
      if (commands.hasOwnProperty(payload.command)) {
        this.logger.log("[i] sending command ...")
        this.serial.write(commands[payload.command])
      }
      else {
        if (payload.type === "DATETIME") {
          this.logger.log("set Datetime")
          this.serial.write(Buffer.from(payload.command))
        }
        else if (payload.type === "DELTA") {
          if (payload.command < 150000 && payload.command > 1) {
            this.serial.changehandleRequestJob(payload.command.toString());
          }
        }
        else {
          this.logger.log('command not exist')

        }
      }
    } catch (error) {
      this.logger.error(error)
    }


  }
}