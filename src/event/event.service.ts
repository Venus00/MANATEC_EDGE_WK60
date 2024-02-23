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
    await this.prisma.$queryRaw`ALTER TABLE Health AUTO_INCREMENT = 1`;
  }
  async delete(id: number) {
    await this.prisma.event.delete({
      where: {
        id,
      },
    });
    await this.prisma.$queryRaw`ALTER TABLE Event AUTO_INCREMENT = 1`;
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
