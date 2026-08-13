import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { PrismaService } from '../../prisma/prisma.service';

class HealthResponseDto {
  status!: 'ok';
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOkResponse({ type: HealthResponseDto, example: { status: 'ok' } })
  check(): HealthResponseDto {
    return { status: 'ok' };
  }

  @Get('ready')
  async ready(): Promise<HealthResponseDto> {
    try {
      await this.prisma.ingredient.count();
      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException('Banco de dados indisponível.');
    }
  }
}
