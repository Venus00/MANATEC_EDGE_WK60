import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EventService {
  constructor(private prisma: PrismaService) {}

  async events() {
    const results = await this.prisma.event.findMany();
    if (results.length === 0) {
      await this.prisma
        .$queryRaw`delete from sqlite_sequence where name='Event'`;
    }
    return results;
  }
  async deleteHealth(id: number) {
    await this.prisma.health.delete({
      where: {
        id,
      },
    });
  }
  async delete(id: number) {
    await this.prisma.event.delete({
      where: {
        id,
      },
    });
  }
  async findManyHealthEvents() {
    const results = await this.prisma.health.findMany();
    if (results.length === 0) {
      await this.prisma
        .$queryRaw`delete from sqlite_sequence where name='Health'`;
    }
    return results;
  }
  async createHealth(health: string) {
    await this.prisma.health.create({
      data: {
        health,
      },
    });
  }
  async createEvent(data: any) {
    return this.prisma.event.create({
      data,
    });
  }
}
