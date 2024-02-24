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
    const results = await this.prismaService.alert.findMany({});
    if (results.length === 0) {
      await this.prismaService
        .$queryRaw`delete from sqlite_sequence where name='Alert'`;
    }
    return results;
  }
  async delete(id: number) {
    await this.prismaService.alert.delete({
      where: {
        id,
      },
    });
  }
}
