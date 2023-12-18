import { Inject, Injectable, Logger, OnModuleInit, forwardRef } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { SerialService } from 'src/serial/serial.service';
import { commands } from 'src/serial/commands';
import getMAC, { isMAC } from 'getmac';
@Injectable()
export class MqttService implements OnModuleInit {
  private client: mqtt.MqttClient;
  private logger = new Logger(MqttService.name)
  private mac: string = getMAC('wlan0').replaceAll(':', '')
  private TOPIC_SUBSCRIBE = process.env.TOPIC_SUBSCRIBE.replace('+', this.mac)
  private TOPIC_PUBLISH_PAYLOAD = process.env.TOPIC_PUBLISH.replace('+', this.mac)
  private TOPIC_PUBLISH_ALERTE = process.env.TOPIC_ALERT.replace('+', this.mac)
  private TOPIC_PUBLISH_STATUS = process.env.TOPIC_STATUS.replace('+', this.mac)
  protected total_event: number = 0;
  protected total_alert: number = 0;
  constructor(
    @Inject(forwardRef(() => SerialService))
    private readonly serial: SerialService
  ) { }


  onModuleInit() {
    this.logger.log(process.env.MQTT_SERVER)
    this.client = mqtt.connect(`mqtt://${process.env.MQTT_SERVER}}`, {
      clientId: this.mac,
      username: this.mac,
      password: this.mac,
      keepalive: 1,
      reconnectPeriod: 1
    });
    this.client.on('connect', this.onConnect.bind(this));
    this.client.on('message', this.onMessage.bind(this));
    this.client.on('disconnect', this.onDisconnect.bind(this));
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