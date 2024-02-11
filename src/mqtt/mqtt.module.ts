import { Module, forwardRef } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { SerialModule } from 'src/serial/serial.module';
@Module({
  imports: [forwardRef(() => SerialModule)],
  providers: [MqttService],
  exports: [MqttService],
})
export class MqttModule {}
