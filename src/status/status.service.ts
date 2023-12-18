import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
interface Status{
    total_event:number
    total_alert:number
    shut:number
    delta:number
}
@Injectable()
export class StatusService {
    constructor(private prisma:PrismaService){

    }
    async get(){
        return await this.prisma.status.findFirst({
           where:{
             name:"status"
           }
         })
       }
       async createIfNotExist(data:Status) {
         return await this.prisma.status.upsert({
             create:{
                 name:'status',
                 ...data,
             },
             where :{
                 name:'status',
             },
             update:{
                 
             }
         })
       }
       async updateShutDownCount(shut:number) {
        return await this.prisma.status.update({
            where:{
                name:'stauts',
            },
            data:{
                shut,
            }
        })
       }
       async updateDelta(delta:number) {
        return await this.prisma.status.update({
            where:{
                name:'stauts',
            },
            data:{
                delta,
            }
        })
       }
       async updateEventAlert(data:{total_alert:number,total_event:number}) {
        return await this.prisma.status.update({
            where:{
                name:'stauts',
            },
            data:{
                ...data,
            }
        })
       }
       async update(data:Status) {
         return await this.prisma.status.update({
             where:{
                 name:'status',
             },
             data:{
                 ...data
             }
         })
       }

}
