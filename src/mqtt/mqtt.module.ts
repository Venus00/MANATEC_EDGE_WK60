import { Module } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EventModule } from 'src/event/event.module';
import { SerialModule } from 'src/serial/serial.module';
@Module({
  imports:[PrismaModule,EventModule,SerialModule],
  providers: [MqttService],
  exports:[MqttService]
})
export class MqttModule {}
