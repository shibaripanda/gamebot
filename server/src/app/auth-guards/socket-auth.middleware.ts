import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenData } from '../interfaces/tokenData';
import { AuthenticatedSocket } from '../interfaces/authenticatedSocket';
import { AppService } from '../app.service';

@Injectable()
export class SocketAuthMiddleware {
  constructor(
    private jwt: JwtService,
    private appService: AppService,
  ) {}
  async use(socket: AuthenticatedSocket, next: (err?: any) => void) {
    const token: string | undefined = (
      socket.handshake.auth as { token?: string }
    )?.token;

    const access = await this.appService.getStatusAccess();

    if (!token || typeof token !== 'string' || !access) {
      return next(new UnauthorizedException('Token not provided'));
    }

    try {
      const payload = this.jwt.verify<TokenData>(token);
      socket.data.user = payload;
      console.log('SocketAuthMiddleware');
      next();
    } catch (err) {
      console.log(err);
      return next(new UnauthorizedException('Invalid token'));
    }
  }
}
