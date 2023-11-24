import { Module, forwardRef } from '@nestjs/common';
import { SerialService } from './serial.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EventModule } from 'src/event/event.module';
import { DeltaModule } from 'src/delta/delta.module';
import { MqttModule } from 'src/mqtt/mqtt.module';
@Module({
  imports: [EventModule,PrismaModule,DeltaModule,forwardRef(() => MqttModule)],
  providers: [SerialService],
  exports:[SerialService]
})
export class SerialModule {}
