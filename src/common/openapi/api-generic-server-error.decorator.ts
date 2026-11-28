import { applyDecorators } from '@nestjs/common';
import { ApiInternalServerErrorResponse } from '@nestjs/swagger';
import { ApiErrorResponseDto } from './api-response.dto.js';

export function ApiGenericServerErrorResponse(): MethodDecorator {
  return applyDecorators(
    ApiInternalServerErrorResponse({
      description: 'Unexpected error. Internal details are not exposed.',
      type: ApiErrorResponseDto,
    }),
  );
}
