// src/auth/guards/jwt-auth.guard.ts - COMPLETE ENHANCED VERSION
import { 
  Injectable, 
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException 
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    console.log('🛡️ JwtAuthGuard handleRequest:', { 
      hasError: !!err,
      errorType: err?.constructor?.name,
      hasUser: !!user, 
      info: info?.message,
      userBlocked: user?.isBlocked
    });

    // Handle specific errors
    if (err) {
      // If it's a ForbiddenException (blocked user), throw it directly
      if (err instanceof ForbiddenException) {
        console.log('🚫 JwtAuthGuard: Blocked user detected');
        throw err;
      }
      
      // Handle other authentication errors
      console.log('❌ JwtAuthGuard: Authentication error:', err.message);
      throw new UnauthorizedException(err.message || 'Authentication failed');
    }

    // If no user found, throw unauthorized
    if (!user) {
      console.log('❌ JwtAuthGuard: No user found');
      throw new UnauthorizedException('Invalid token or user not found');
    }

    // Double-check user is not blocked (redundant safety check)
    if (user.isBlocked) {
      console.log('🚫 JwtAuthGuard: User is blocked in final check');
      throw new ForbiddenException('Your account has been blocked. Please contact support.');
    }

    console.log('✅ JwtAuthGuard: Authentication successful for:', user.email);
    return user;
  }
}