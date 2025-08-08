import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { TokenData } from '../interfaces/tokenData';
import { AuthenticatedSocket } from '../interfaces/authenticatedSocket';
import { AppService } from '../app.service';

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private appService: AppService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: AuthenticatedSocket = context.switchToWs().getClient();
    const token: string | undefined = (
      client.handshake.auth as { token?: string }
    )?.token;

    const access = await this.appService.getStatusAccess();

    if (!token || typeof token !== 'string' || !access) {
      throw new WsException('Token not provided');
    }

    try {
      const payload = this.jwt.verify<TokenData>(token);

      client.data.user = payload;
      console.log('WsJwtAuthGuard');
      return true;
    } catch {
      throw new WsException('Invalid token');
    }
  }
}
