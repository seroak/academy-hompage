import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { isPrismaNotFoundError } from '../common/prisma-errors.js';

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

  async remove(id: string) {
    try {
      await this.prisma.$transaction(async (tx) => {
        const groupedReservations = await tx.reservation.findMany({
          where: { parentUserId: id, groupId: { not: null } },
          select: { id: true, groupId: true },
        });

        const groupIds = [
          ...new Set(groupedReservations.map((reservation) => reservation.groupId!)),
        ];
        for (const groupId of groupIds) {
          const reservationIds = groupedReservations
            .filter((reservation) => reservation.groupId === groupId)
            .map((reservation) => reservation.id);
          const remaining = await tx.reservation.count({
            where: { groupId, id: { notIn: reservationIds } },
          });
          if (remaining === 0) {
            await tx.reservationGroupSlot.updateMany({
              where: { groupId, reservationId: { in: reservationIds } },
              data: { reservationId: null },
            });
            await tx.reservationGroup.update({
              where: { id: groupId },
              data: { status: 'EMPTY' },
            });
          }
        }

        await tx.reservation.deleteMany({ where: { parentUserId: id } });
        await tx.parentSocialAccount.deleteMany({ where: { parentUserId: id } });
        await tx.parentAuthSession.deleteMany({ where: { parentUserId: id } });
        await tx.parentUser.delete({ where: { id } });
      });
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        throw new NotFoundException(`ParentUser ${id} not found`);
      }
      throw error;
    }
  }
}
