import { Module } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports:[PrismaModule],
  providers: [MqttService]
})
export class MqttModule {}
