import { Module } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { SerialModule } from 'src/serial/serial.module';
@Module({
  imports: [SerialModule],
  providers: [MqttService],
  exports: [MqttService]
})
export class MqttModule { }
