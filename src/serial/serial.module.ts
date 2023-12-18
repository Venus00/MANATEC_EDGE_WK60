import { Module, forwardRef } from '@nestjs/common';
import { SerialService } from './serial.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EventModule } from 'src/event/event.module';
import { MqttModule } from 'src/mqtt/mqtt.module';
import { AlertModule } from 'src/alert/alert.module';
import { StatusModule } from 'src/status/status.module';
@Module({
  imports: [EventModule,PrismaModule,AlertModule,StatusModule,forwardRef(() => MqttModule)],
  providers: [SerialService],
  exports:[SerialService]
})
export class SerialModule {}
