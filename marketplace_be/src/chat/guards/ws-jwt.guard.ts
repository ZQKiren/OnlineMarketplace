import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const token = this.extractTokenFromClient(client);
    
    if (!token) {
      client.disconnect();
      return false;
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      if (!user) {
        client.disconnect();
        return false;
      }

      client.user = user;
      return true;
    } catch (error) {
      client.disconnect();
      return false;
    }
  }

  private extractTokenFromClient(client: any): string | null {
    const token = client.handshake.auth?.token || 
                 client.handshake.query?.token ||
                 client.handshake.headers?.authorization?.replace('Bearer ', '');
    
    return token || null;
  }
}