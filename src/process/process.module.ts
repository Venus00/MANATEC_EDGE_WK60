import { Module } from '@nestjs/common';
import { ProcessService } from './process.service';
import { StatusModule } from 'src/status/status.module';
import { EventModule } from 'src/event/event.module';
import { MqttModule } from 'src/mqtt/mqtt.module';
@Module({
  imports:[StatusModule,EventModule,MqttModule],
  providers: [ProcessService]
})
export class ProcessModule {}
