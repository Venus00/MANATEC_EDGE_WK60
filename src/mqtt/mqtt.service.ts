import { Injectable } from '@nestjs/common';
import * as mqtt from 'mqtt';

@Injectable()
export class MqttService {
  private client: mqtt.MqttClient;

  constructor(
  ) {
    this.client = mqtt.connect('mqtt://192.168.1.128');
    this.client.on('connect', this.onConnect.bind(this));
    this.client.on('message', this.onMessage.bind(this));
  }

  onConnect() {
    console.log('connected');
    this.client.subscribe('nxt/+/pointage/data');
  }

  onMessage(topic: string, message: string) {
    console.log('message arrived');
    console.log(message.toString());
    const payload = JSON.parse(message.toString());
    console.log(payload);
  }
}