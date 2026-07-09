import { Injectable } from '@nestjs/common';
import { OAuthProvider } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProviderProfile } from './oauth-providers/oauth-provider.interface';

@Injectable()
export class ParentSocialAccountService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertParentUser(providerName: string, profile: ProviderProfile) {
    const providerEnum = this.toProviderEnum(providerName);
    const existingAccount = await this.prisma.parentSocialAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: providerEnum,
          providerAccountId: profile.providerAccountId,
        },
      },
      include: { parentUser: true },
    });

    if (existingAccount) {
      await this.prisma.parentSocialAccount.update({
        where: { id: existingAccount.id },
        data: { profileEmail: profile.email, profileName: profile.name },
      });

      return this.prisma.parentUser.update({
        where: { id: existingAccount.parentUserId },
        data: { email: profile.email ?? existingAccount.parentUser.email, name: profile.name ?? existingAccount.parentUser.name },
      });
    }

    let parentUser = profile.email
      ? await this.prisma.parentUser.findUnique({ where: { email: profile.email } })
      : null;

    if (!parentUser) {
      parentUser = await this.prisma.parentUser.create({
        data: { email: profile.email, name: profile.name },
      });
    } else if (profile.name && !parentUser.name) {
      parentUser = await this.prisma.parentUser.update({
        where: { id: parentUser.id },
        data: { name: profile.name },
      });
    }

    await this.prisma.parentSocialAccount.create({
      data: {
        provider: providerEnum,
        providerAccountId: profile.providerAccountId,
        profileEmail: profile.email,
        profileName: profile.name,
        parentUserId: parentUser.id,
      },
    });

    return parentUser;
  }

  private toProviderEnum(provider: string): OAuthProvider {
    switch (provider) {
      case 'google':
        return OAuthProvider.GOOGLE;
      case 'kakao':
        return OAuthProvider.KAKAO;
      case 'naver':
        return OAuthProvider.NAVER;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }
}
