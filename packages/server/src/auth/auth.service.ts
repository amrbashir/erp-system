import { TRPCError } from "@trpc/server";
import * as argon2 from "argon2";

import type { PrismaClient } from "@/prisma-client.ts";
import type { User } from "@/prisma.ts";
import type { UserService } from "@/user/user.service.ts";

import type { LoginUserDto } from "./auth.dto.ts";

const SESSION_SECRET = Deno.env.get("SESSION_SECRET");

async function generateSessionId(userId: string) {
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);
  const timestamp = Date.now();
  const data = `${userId}:${Array.from(randomBytes).join("")}:${timestamp}:${SESSION_SECRET}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export class AuthService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly userService: UserService,
  ) {}

  async validateUser(dto: LoginUserDto & { orgSlug: string }): Promise<User> {
    const user = await this.userService.findByUsernameInOrg(dto.username, dto.orgSlug);
    if (!user) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Username or password is incorrect" });
    }

    const isPasswordValid = await argon2.verify(user.password, dto.password);
    if (!isPasswordValid) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Username or password is incorrect" });
    }

    return user;
  }

  async createSession(userId: string): Promise<string> {
    const sid = await generateSessionId(userId);
    await this.prisma.session.create({
      data: { sid, userId },
    });

    return sid;
  }

  async validateSession(sid: string) {
    const session = await this.prisma.session.findUnique({
      where: { sid },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
            organization: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!session) return null;

    return session.user;
  }

  async deleteSession(sid: string): Promise<void> {
    await this.prisma.session.delete({ where: { sid } });
  }
}
