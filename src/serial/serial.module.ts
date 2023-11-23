import { Module } from '@nestjs/common';
import { SerialService } from './serial.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SerialService]
})
export class SerialModule {}
