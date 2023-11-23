import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports:[PrismaModule],
  providers: [EventService]
})
export class EventModule {}
