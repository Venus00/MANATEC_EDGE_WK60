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
  private isConnected:boolean = false;
  private logger = new Logger(MqttService.name)
  private TOPIC_SUBSCRIBE = process.env.TOPIC_SUBSCRIBE.replace('+',getMAC('wlan0').replaceAll(':',''))
  private TOPIC_PUBLISH_STATE = process.env.TOPIC_PUBLISH.replace('+',getMAC('wlan0').replaceAll(':',''))
  private TOPIC_PUBLISH_ALERTE = process.env.TOPIC_ALERT.replace('+',getMAC('wlan0').replaceAll(':',''))

  constructor(
    private event:EventService,
    private alert:AlertService,
    @Inject(forwardRef(() => SerialService))
    private serial:SerialService
  ) {

    this.logger.log(process.env.MQTT_SERVER)
    this.client = mqtt.connect(`mqtt://${process.env.MQTT_SERVER}}`,{
      clientId:getMAC('wlan0').replaceAll(':',''),
      username:getMAC('wlan0').replaceAll(':',''),
      password:getMAC('wlan0').replaceAll(':',''),
      reconnectPeriod:10000
      
    });
    this.client.on('connect', this.onConnect.bind(this));
    this.client.on('message', this.onMessage.bind(this));
    this.client.on('close', this.onDisconnect.bind(this));
    this.client.on('error', this.onDisconnect.bind(this));
    this.client.on('disconnect',this.onDisconnect.bind(this));

    setInterval(()=>{
      this.senderJob();
    },6*1000)
  }

  onConnect() {
    this.logger.log('mqtt server is connected');
    this.client.subscribe(this.TOPIC_SUBSCRIBE);
    this.isConnected = true;
  }
  onDisconnect() {
    this.logger.error("mqtt server is disconnected")
    this.isConnected = false;
  }
  publishState(message:string){
    this.logger.log(this.TOPIC_PUBLISH_STATE)
    this.client.publish(this.TOPIC_PUBLISH_STATE,message);
  }

  publishAlert(message:string){
    this.client.publish(this.TOPIC_PUBLISH_ALERTE,message);
  }
  getConnectionState() {
    return this.isConnected;
  }

  async senderJob() {
    if(this.isConnected) {
      this.logger.log('mqtt server is Connected ');
      const events = await this.event.events();
      for (let i=0;i<events.length;i++)
      {
        if (events[i].isSent === false)
        {
            this.publishState(JSON.stringify(events[i]));
            await this.event.delete(events[i].id)
        }
      }
      const alerts = await this.alert.getAll();
      
      this.logger.log("alert from db",alerts)
      for (let i=0;i<alerts.length;i++)
      {
        if (alerts[i].isSent === false)
        {
            this.logger.log("[d] alert not sent .. sending now ...")
            this.publishAlert(JSON.stringify(alerts[i]));
            this.logger.log("[d] delete alert")

            await this.alert.delete(alerts[i].id)
        }
      }
    }
    else {
      this.logger.log('mqtt server is not connected connot sending ... ');
    }
  }

  onMessage(topic: string, message: string) {
    try {
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
          if(payload.command<150000 && payload.command>1)
          {
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