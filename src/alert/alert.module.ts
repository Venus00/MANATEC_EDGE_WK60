import { Module } from '@nestjs/common';
import { AlertService } from './alert.service';
import { PrismaModule } from 'src/prisma/prisma.module';
@Module({
  imports: [PrismaModule],
  providers: [AlertService],
  exports: [AlertService],
})
export class AlertModule {}
