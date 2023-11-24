import { Module } from '@nestjs/common';
import { DeltaService } from './delta.service';
import { PrismaModule } from 'src/prisma/prisma.module';
@Module({
  imports:[PrismaModule],
  providers: [DeltaService],
  exports:[DeltaService]
})
export class DeltaModule {}
