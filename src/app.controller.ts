import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiGenericServerErrorResponse } from './common/openapi/api-generic-server-error.decorator.js';
import { AppService } from './app.service.js';

@Controller()
@ApiTags('Status')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Check API availability' })
  @ApiOkResponse({
    description: 'The API is available.',
    schema: { type: 'string', example: 'CourseHubAPI esta en linea' },
  })
  @ApiGenericServerErrorResponse()
  getHello(): string {
    return this.appService.getHello();
  }
}
