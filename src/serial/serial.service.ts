import { Injectable } from '@nestjs/common';
import { SerialPort } from 'serialport';
import { DelimiterParser } from '@serialport/parser-delimiter';
import { InterByteTimeoutParser } from 'serialport';


@Injectable()
export class SerialService {
  private reader;
  private readerParser;
  constructor(
  ) {
    try {
      this.reader = new SerialPort({
        path: '/dev/ttyS1',
        baudRate: 115200,
      });
      //this.readerParser = new SerialPort({path:'/dev/ttyS0',baudRate:115200})
      this.readerParser = this.reader.pipe(
       new DelimiterParser({ delimiter: '\r`\n' }),
      );
      this.reader.on('data', this.onReaderData.bind(this));
    } catch (error) {
      console.log(error);
    }
  }

  onReaderData(buffer: Buffer) {
    try {
      if (buffer != null  && buffer.length > 6) 
      {
        if (buffer[0] === 0x02)
        {
          const length = buffer[4]
        }
      }
    } catch (error) {
      
    }
  }
}