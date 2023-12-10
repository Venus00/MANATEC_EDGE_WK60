import { Module } from '@nestjs/common';
import { DeltaService } from './delta.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ShutService } from './shut.service';
@Module({
  imports:[PrismaModule],
  providers: [DeltaService,ShutService],
  exports:[DeltaService,ShutService]
})
export class DeltaModule {}
