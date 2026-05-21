import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const tokens = await this.generateTokens(payload);

    return {
      access_token: tokens.accessToken,
      token_type: 'Bearer',
      expires_in: this.getTokenExpirationSeconds('JWT_EXPIRES_IN'),
      refresh_token: tokens.refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });

      const newPayload: JwtPayload = {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      const tokens = await this.generateTokens(newPayload);

      return {
        access_token: tokens.accessToken,
        token_type: 'Bearer',
        expires_in: this.getTokenExpirationSeconds('JWT_EXPIRES_IN'),
        refresh_token: tokens.refreshToken,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateUser(email: string, _password: string) {
    // TODO: Reemplazar con la búsqueda real de usuarios y la validación de contraseña
    // cuando el UsersModule esté implementado
    return {
      id: "1",
      email,
      role: "admin",
    };
  }

  private async generateTokens(payload: JwtPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRES_IN',
          '7d',
        ) as StringValue,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private getTokenExpirationSeconds(envVar: string): number {
    const value = this.configService.get<string>(envVar, '8h');
    const match = value.match(/^(\d+)([smhd])$/);
    if (!match) return 28800;

    const num = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    return num * (multipliers[unit] ?? 3600);
  }
}
