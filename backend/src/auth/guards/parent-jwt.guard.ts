import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ParentJwtGuard extends AuthGuard('parent-jwt') {}
