import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SerialModule } from './serial/serial.module';
import { MqttModule } from './mqtt/mqtt.module';
import { EventModule } from './event/event.module';
import { PrismaModule } from './prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { DeltaModule } from './delta/delta.module';
import { AlertModule } from './alert/alert.module';
@Module({
  imports: [
    ScheduleModule.forRoot(),SerialModule, MqttModule, EventModule, PrismaModule, DeltaModule, AlertModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
