import { Injectable } from "@nestjs/common";
import { AuthGuard, PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-jwt";
import { type Request } from "express";

function extractJwtFromCookie(req: Request): string | null {
  const cookies = req.headers.cookie;
  if (!cookies) return null;

  const cookiesArray = cookies.split("; ");

  const refreshToken = cookiesArray.find((cookie) => cookie.startsWith("refreshToken="));
  if (!refreshToken) return null;

  return refreshToken.split("=")[1] || null;
}

@Injectable()
export class JwtRefresgStrategy extends PassportStrategy(Strategy, "jwt-refresh") {
  constructor() {
    super({
      jwtFromRequest: extractJwtFromCookie,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_REFRESH_SECRET!,
    });
  }

  async validate(payload: any) {
    return payload;
  }
}

@Injectable()
export class JwtRefreshAuthGuard extends AuthGuard("jwt-refresh") {}
