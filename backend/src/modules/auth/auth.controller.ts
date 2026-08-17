import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

function getBearerToken(authorization: string | undefined): string | undefined {
  if (!authorization) return undefined;

  const [scheme, token] = authorization.trim().split(/\s+/, 2);
  if (scheme?.toLowerCase() !== 'bearer' || !token) return undefined;

  return token;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get('me')
  async me(@Headers('authorization') authorization: string | undefined) {
    return this.auth.me(getBearerToken(authorization));
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Headers('authorization') authorization: string | undefined): Promise<void> {
    await this.auth.logout(getBearerToken(authorization));
  }
}
