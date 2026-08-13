import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly sessions: SessionService,
  ) {}

  private publicUser(user: { id: string; name: string; email: string; role: 'USER' | 'ADMIN' }): AuthUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  async register(dto: RegisterDto): Promise<{ user: AuthUser; token: string; expiresAt: Date }> {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });

    if (existing) {
      throw new ConflictException('Já existe uma conta com este e-mail.');
    }

    const passwordHash = await this.passwords.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        passwordHash,
      },
    });

    const session = await this.sessions.create(user.id);
    return { user: this.publicUser(user), ...session };
  }

  async login(dto: LoginDto): Promise<{ user: AuthUser; token: string; expiresAt: Date }> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !(await this.passwords.verify(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    const session = await this.sessions.create(user.id);
    return { user: this.publicUser(user), ...session };
  }

  async me(token: string | undefined): Promise<AuthUser> {
    if (!token) {
      throw new UnauthorizedException('Sessão não encontrada.');
    }

    const user = await this.sessions.findUserByToken(token);
    if (!user) {
      throw new UnauthorizedException('Sessão inválida ou expirada.');
    }

    return this.publicUser(user);
  }

  async logout(token: string | undefined): Promise<void> {
    if (token) {
      await this.sessions.revoke(token);
    }
  }
}
