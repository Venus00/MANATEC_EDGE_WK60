import { Injectable, Param } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ShutService {
  constructor(private prisma: PrismaService) {}

  async get(){
   return await this.prisma.shutDownCount.findFirst({
      where:{
        name:"shut"
      }
    })
  }
  async createIfNotExist(count:number) {
    return await this.prisma.shutDownCount.upsert({
        create:{
            name:'shut',
            count,
        },
        where :{
            name:'shut',
        },
        update:{
            
        }
    })
  }

  async update(count:number) {
    return await this.prisma.shutDownCount.update({
        where:{
            name:'shut',
        },
        data:{
            count
        }
    })
  }
}
