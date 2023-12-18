import { Module, forwardRef } from '@nestjs/common';
import { SerialService } from './serial.service';
import { StatusModule } from 'src/status/status.module';
import { ProcessModule } from 'src/process/process.module';

@Module({
  imports: [StatusModule, ProcessModule],
  providers: [SerialService],
  exports: [SerialService]
})
export class SerialModule { }
