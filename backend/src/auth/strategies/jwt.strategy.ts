import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    let user;
    try {
      user = await this.usersService.findOne(payload.sub);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new UnauthorizedException('La cuenta ya no está activa');
      }
      throw error;
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role.name,
      departmentId: user.departmentId,
    };
  }
}
