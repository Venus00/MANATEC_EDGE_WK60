import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AlertService {
  constructor(private prismaService: PrismaService) {}
  async create(data: any) {
    return await this.prismaService.alert.create({
      data,
    });
  }
  async getAll() {
    return await this.prismaService.alert.findMany({});
  }
  async delete(id: number) {
    await this.prismaService.alert.delete({
      where: {
        id,
      },
    });
    await this.prismaService.$queryRaw`ALTER TABLE Alert AUTO_INCREMENT = 1`;
  }
}
