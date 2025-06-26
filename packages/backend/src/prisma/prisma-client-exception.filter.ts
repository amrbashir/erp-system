import { Catch, HttpStatus } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";

import type { ArgumentsHost } from "@nestjs/common";
import type { Response } from "express";

import { Prisma } from "./generated/client";

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    console.error(exception.message);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const message = exception.message.replace(/\n/g, "");

    switch (exception.code) {
      case "P2000": {
        const statusCode = HttpStatus.BAD_REQUEST;
        response.status(statusCode).json({ statusCode, message });
        break;
      }
      case "P2002": {
        const statusCode = HttpStatus.CONFLICT;
        response.status(statusCode).json({ statusCode, message });
        break;
      }
      case "P2025": {
        const statusCode = HttpStatus.NOT_FOUND;
        response.status(statusCode).json({ statusCode, message });
        break;
      }
      default:
        // default 500 error code
        super.catch(exception, host);
        break;
    }
  }
}
