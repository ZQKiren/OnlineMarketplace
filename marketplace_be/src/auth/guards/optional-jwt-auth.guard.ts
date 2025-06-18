// src/auth/guards/optional-jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Override handleRequest to make auth optional
  handleRequest(err: any, user: any) {
    // Allow request to proceed even if no user is found
    return user;
  }
}