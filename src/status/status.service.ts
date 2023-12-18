import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
interface Status {
    total_event: number
    total_alert: number
    shut: number
    delta: number
    last_log_date?: Date;
}
@Injectable()
export class StatusService {
    constructor(private prisma: PrismaService) {

    }
    async get() {
        return await this.prisma.status.findFirst({
            where: {
                id: 1,
            }
        })
    }
    async createIfNotExist(data: Status) {
        return await this.prisma.status.upsert({
            create: {
                name: "status",
                ...data,
            },
            where: {
                name: "status",
            },
            update: {

            }
        })
    }
    async updateShutDownCount(shut: number) {
        return await this.prisma.status.update({
            where: {
                id: 1,
            },
            data: {
                shut: shut,
            }
        })
    }
    async updateLogDate(last_log_date: Date) {
        return await this.prisma.status.update({
            where: {
                id: 1,
            },
            data: {
                last_log_date,
            }
        })
    }
    async updateDelta(delta: number) {
        return await this.prisma.status.update({
            where: {
                id: 1,
            },
            data: {
                delta,
            }
        })
    }
    async updateEventAlert(data: { total_alert: number, total_event: number }) {
        return await this.prisma.status.update({
            where: {
                id: 1,
            },
            data: {
                ...data,
            }
        })
    }
    async update(data: Status) {
        return await this.prisma.status.update({
            where: {
                id: 1,
            },
            data: {
                ...data
            }
        })
    }

}
