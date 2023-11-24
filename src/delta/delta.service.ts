import { Injectable, Param } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DeltaService {
  constructor(private prisma: PrismaService) {}

  async createIfNotExist(delta:number) {
    return await this.prisma.delta.upsert({
        create:{
            name:'delta',
            delta,
        },
        where :{
            name:"delta",
        },
        update:{
            
        }
    })
  }

  async update(delta:number) {
    return await this.prisma.delta.update({
        where:{
            name:'delta',
        },
        data:{
            delta
        }
    })
  }
}
