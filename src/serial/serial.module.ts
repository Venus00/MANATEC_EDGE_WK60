import { Module, forwardRef } from '@nestjs/common';
import { SerialService } from './serial.service';
import { ProcessModule } from 'src/process/process.module';

@Module({
  imports: [ProcessModule],
  providers: [SerialService],
  exports: [SerialService]
})
export class SerialModule { }
