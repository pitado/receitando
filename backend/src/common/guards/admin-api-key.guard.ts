import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';

const ADMIN_API_KEY_HEADER = 'x-admin-api-key';

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const configuredKey = this.configService.get<string>('ADMIN_API_KEY');

    if (!configuredKey) {
      throw new ServiceUnavailableException('Operações administrativas indisponíveis.');
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();
    const suppliedKey = request.headers[ADMIN_API_KEY_HEADER];

    if (typeof suppliedKey !== 'string' || !this.matches(configuredKey, suppliedKey)) {
      throw new UnauthorizedException('Chave administrativa inválida.');
    }

    return true;
  }

  private matches(configuredKey: string, suppliedKey: string): boolean {
    const configured = Buffer.from(configuredKey);
    const supplied = Buffer.from(suppliedKey);

    return configured.length === supplied.length && timingSafeEqual(configured, supplied);
  }
}
