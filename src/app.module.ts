import { Module } from '@nestjs/common';
import { SerialModule } from './serial/serial.module';
import { MqttModule } from './mqtt/mqtt.module';
import { EventModule } from './event/event.module';
import { PrismaModule } from './prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AlertModule } from './alert/alert.module';
import { StatusModule } from './status/status.module';
@Module({
  imports: [
    ScheduleModule.forRoot(),SerialModule, MqttModule, EventModule, PrismaModule, AlertModule, StatusModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
