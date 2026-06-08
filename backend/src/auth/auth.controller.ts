import { Body, Controller, Get, Post, HttpCode, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserResponseDto } from '../users/dto/user-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Iniciar sesión y obtener tokens', 
    description: 'Permite a los usuarios autenticarse en el sistema utilizando su email y contraseña para obtener un token JWT válido.' 
  })
  @ApiBody({
    type: LoginDto,
    examples: {
      ejemploManual: {
        summary: 'Credenciales de Recepcionista',
        value: {
          email: 'recepcionista@demo.local',
          password: 'password-demo'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso. Retorna el token de acceso y la información del usuario.',
    type: AuthResponseDto,
    schema: {
      example: {
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwYzI0ZWEyMS1jMzBkLTQ2ZmMtOGIwNS1hNzVjZDIyM2RhNjQiLCJlbWFpbCI6InJlY2VwY2lvbmlzdGFAZGVtby5sb2NhbCIsInJvbGUiOiJSRUNFUFRJT05JU1QifQ",
        refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwYzI0ZWEyMS1jMzBkLTQ2ZmMtOGIwNS1hNzVjZDIyM2RhNjQifQ",
        tokenType: "Bearer",
        expiresIn: 28800,
        user: {
          id: "0c24ea21-c30d-46fc-8b05-a75cd223da64",
          name: "Recepcionista Demo",
          email: "recepcionista@demo.local",
          role: "RECEPTIONIST"
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Credenciales inválidas.',
    schema: { example: { statusCode: 401, message: "Credenciales invalidas", error: "Unauthorized" } }
  })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar tokens usando refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Tokens renovados exitosamente',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Refresh token inválido' })
  async refresh(@Body('refresh_token') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener informacion del usuario autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Informacion del usuario autenticado',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Token invalido o usuario inactivo' })
  async me(@Req() request: { user: { userId: string } }) {
    return this.authService.getAuthenticatedUser(request.user.userId);
  }
}