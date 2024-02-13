import { Module } from '@nestjs/common';
import { StatusService } from './status.service';
import { PrismaModule } from 'src/prisma/prisma.module';
@Module({
  imports: [PrismaModule],
  providers: [StatusService],
  exports: [StatusService],
})
export class StatusModule {}
