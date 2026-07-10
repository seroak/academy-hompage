import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const parents = await this.prisma.parentUser.findMany({
      include: {
        socialAccounts: { select: { provider: true } },
        reservations: {
          include: { preferredSlots: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return parents.map((parent) => ({
      id: parent.id,
      name: parent.name,
      email: parent.email,
      createdAt: parent.createdAt,
      hasPassword: parent.passwordHash !== null,
      socialProviders: parent.socialAccounts.map((account) => account.provider),
      reservations: parent.reservations,
    }));
  }
}
