import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SerialModule } from './serial/serial.module';
import { MqttModule } from './mqtt/mqtt.module';
import { EventModule } from './event/event.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [SerialModule, MqttModule, EventModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
