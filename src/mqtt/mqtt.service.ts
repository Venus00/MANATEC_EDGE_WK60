import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as mqtt from 'mqtt';
import { EventService } from 'src/event/event.service';
import { SerialService } from 'src/serial/serial.service';
import { commands } from 'src/serial/commands';
@Injectable()
export class MqttService {
  private client: mqtt.MqttClient;
  private isConnected:boolean = false;
  private logger = new Logger(MqttService.name)

  constructor(
    private event:EventService,
    private serial:SerialService
  ) {
    this.client = mqtt.connect('mqtt://test.mosquitto.org',{
      
    });
    this.client.on('connect', this.onConnect.bind(this));
    this.client.on('message', this.onMessage.bind(this));
    this.client.on('disconnect',this.onDisconnect.bind(this));
  }

  onConnect() {
    this.isConnected = true;
    console.log('connected');
    this.client.subscribe('managem/payload');
  }
  onDisconnect() {
    this.isConnected = false;
  }
  publish(topic:string,message:string){
    this.client.publish(topic,message);
  }
  // @Cron('* * * * * *')
  // senderJob() {
  //   if(this.isConnected) {
  //     this.logger.log('mqtt server is Connected ');
  //   }
  //   else {
  //     this.logger.log('mqtt server is not connected connot send ... ');
  //   }
  // }

  onMessage(topic: string, message: string) {
    const payload = JSON.parse(message)
    if (commands.hasOwnProperty(payload.command))
    {
      this.logger.log("[i] sending command ...")
      this.serial.write(commands[payload.command])
    }
    else {
      if(payload.type==="DATETIME")
      {
        this.logger.log("set Datetime")
        this.serial.write(Buffer.from(payload.command))
      }
      else if (payload.type==="DELTA"){
        this.serial.changehandleRequestJob(payload.command.toString());
      }
      else {
        this.logger.log('command not exist')

      }
    }
    
  }
}