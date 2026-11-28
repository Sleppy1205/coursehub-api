import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { AuthenticatedUser } from './types/jwt-payload.type.js';
import {
  ApiErrorResponseDto,
  AuthProfileResponseDto,
  AuthUserResponseDto,
  LoginResponseDto,
} from '../common/openapi/api-response.dto.js';
import { ApiGenericServerErrorResponse } from '../common/openapi/api-generic-server-error.decorator.js';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a student account' })
  @ApiCreatedResponse({ type: AuthUserResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiConflictResponse({
    description: 'The email is already registered.',
    type: ApiErrorResponseDto,
  })
  @ApiTooManyRequestsResponse({ type: ApiErrorResponseDto })
  @ApiGenericServerErrorResponse()
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Log in and obtain a JWT',
    description:
      'Limited to five attempts per minute. Invalid email/password combinations return the same 401 response.',
  })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiTooManyRequestsResponse({ type: ApiErrorResponseDto })
  @ApiGenericServerErrorResponse()
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('BearerAuth')
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  @ApiOkResponse({ type: AuthProfileResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiTooManyRequestsResponse({ type: ApiErrorResponseDto })
  @ApiGenericServerErrorResponse()
  getProfile(@Req() request: Request & { user: AuthenticatedUser }) {
    const { id, email, role } = request.user;
    return { id, email, role };
  }
}
