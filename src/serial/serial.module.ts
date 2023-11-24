import { Module } from '@nestjs/common';
import { SerialService } from './serial.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EventModule } from 'src/event/event.module';
import { DeltaModule } from 'src/delta/delta.module';
@Module({
  imports: [EventModule,PrismaModule,DeltaModule],
  providers: [SerialService],
  exports:[SerialService]
})
export class SerialModule {}
