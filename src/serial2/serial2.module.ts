import { Module } from '@nestjs/common';
import { Serial2Service } from './serial2.service';
import { ProcessModule } from 'src/process/process.module';

@Module({
  imports: [ProcessModule],
  providers: [Serial2Service],
})
export class Serial2Module {}
