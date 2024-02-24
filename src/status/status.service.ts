import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
interface Status {
  last_log_count_alert: number;
  last_log_count_health: number;
  last_log_count_payload: number;
  shut: number;
  delta: number;
  last_log_date?: Date;
  last_request_vims?: Date;
  engine_status: string;
}
@Injectable()
export class StatusService {
  constructor(private prisma: PrismaService) {}
  async get() {
    return await this.prisma.status.findFirst({
      where: {
        id: 1,
      },
    });
  }
  async createIfNotExist(data: Status) {
    return await this.prisma.status.upsert({
      create: {
        name: 'status',
        ...data,
      },
      where: {
        name: 'status',
      },
      update: {},
    });
  }
  async updateStartupDate(startup_date: Date) {
    return await this.prisma.status.update({
      where: {
        id: 1,
      },
      data: {
        startup_date,
      },
    });
  }
  async updateShutDownCount(shut: number) {
    return await this.prisma.status.update({
      where: {
        id: 1,
      },
      data: {
        shut: shut,
      },
    });
  }
  async updateLogDate(last_log_date: Date) {
    return await this.prisma.status.update({
      where: {
        id: 1,
      },
      data: {
        last_log_date,
      },
    });
  }
  async updateDelta(delta: number) {
    return await this.prisma.status.update({
      where: {
        id: 1,
      },
      data: {
        delta,
      },
    });
  }
  async updateReplyDate(last_request_vims: Date) {
    return await this.prisma.status.update({
      where: {
        id: 1,
      },
      data: {
        last_request_vims,
      },
    });
  }
  async updateEventAlert(
    last_log_count_alert: number,
    last_log_count_health: number,
    last_log_count_payload: number,
  ) {
    return await this.prisma.status.update({
      where: {
        id: 1,
      },
      data: {
        last_log_count_alert,
        last_log_count_health,
        last_log_count_payload,
      },
    });
  }
  async update(data: Status) {
    return await this.prisma.status.update({
      where: {
        id: 1,
      },
      data: {
        ...data,
      },
    });
  }
}
