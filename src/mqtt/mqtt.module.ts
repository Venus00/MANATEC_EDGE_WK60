import { Module, forwardRef } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EventModule } from 'src/event/event.module';
import { SerialModule } from 'src/serial/serial.module';
import { AlertModule } from 'src/alert/alert.module';
@Module({
  imports:[PrismaModule,EventModule,AlertModule,forwardRef(() => SerialModule)],
  providers: [MqttService],
  exports:[MqttService]
})
export class MqttModule {}
