import { Module } from '@nestjs/common';
import { ProcessService } from './process.service';
import { StatusModule } from 'src/status/status.module';
import { EventModule } from 'src/event/event.module';
import { MqttModule } from 'src/mqtt/mqtt.module';
import { AlertModule } from 'src/alert/alert.module';
@Module({
  imports: [StatusModule, EventModule, AlertModule, MqttModule],
  providers: [ProcessService],
  exports: [ProcessService]
})
export class ProcessModule { }
