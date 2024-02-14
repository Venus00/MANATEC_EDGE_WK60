import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EventService {
  constructor(private prisma: PrismaService) {}

  async events() {
    return await this.prisma.event.findMany();
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
    return await this.prisma.health.findMany();
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
