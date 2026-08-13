import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

class HealthResponseDto {
  status!: 'ok';
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOkResponse({ type: HealthResponseDto, example: { status: 'ok' } })
  check(): HealthResponseDto {
    return { status: 'ok' };
  }
}
