// src/common/middleware/blocked-user.middleware.ts - COMPLETE VERSION
import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

interface RequestWithUser extends Request {
  user?: any;
}

@Injectable()
export class BlockedUserMiddleware implements NestMiddleware {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async use(req: RequestWithUser, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    
    // Only check if there's an authorization header
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      
      try {
        // Verify token
        const payload = this.jwtService.verify(token);
        
        if (payload.sub) {
          // Check if user is currently blocked in database
          const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: { 
              isBlocked: true, 
              email: true,
              role: true 
            },
          });

          if (user?.isBlocked) {
            console.log('🚫 Middleware: Blocked user attempted access:', user.email);
            
            // Send specific blocked user response with special flag
            return res.status(403).json({
              statusCode: 403,
              message: 'Your account has been blocked. Please contact support.',
              error: 'Forbidden',
              blocked: true, // ✅ Special flag for frontend detection
              timestamp: new Date().toISOString(),
            });
          }
          
          // Attach user to request for downstream use
          req.user = user;
        }
      } catch (error) {
        // Invalid or expired token - let it pass to be handled by guards
        console.log('⚠️ Middleware: Invalid/expired token, passing to guards');
      }
    }
    
    next();
  }
}