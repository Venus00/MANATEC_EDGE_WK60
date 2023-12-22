import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EventService {
  constructor(private prisma: PrismaService) {}

  async events() {
    return await this.prisma.event.findMany();
  }
  async delete(id: number) {
    await this.prisma.event.delete({
      where: {
        id,
      },
    });
  }

  async createEvent(data: any) {
    return this.prisma.event.create({
      data: data,
    });
  }
}
