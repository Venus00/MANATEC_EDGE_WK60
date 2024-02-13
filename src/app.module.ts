import { Module } from '@nestjs/common';
import { SerialModule } from './serial/serial.module';
import { MqttModule } from './mqtt/mqtt.module';
import { EventModule } from './event/event.module';
import { PrismaModule } from './prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AlertModule } from './alert/alert.module';
import { StatusModule } from './status/status.module';
import { ProcessModule } from './process/process.module';
import { Serial2Module } from './serial2/serial2.module';
import { SeedService } from './seed.service';
@Module({
  imports: [
    ScheduleModule.forRoot(),
    MqttModule,
    ProcessModule,
    SerialModule,
    EventModule,
    PrismaModule,
    AlertModule,
    StatusModule,
    Serial2Module,
  ],
  controllers: [],
  providers: [SeedService],
})
export class AppModule {}
