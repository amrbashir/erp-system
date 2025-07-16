import { isValidSlug, slugify } from "@erp-system/utils";
import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import * as argon2 from "argon2";

import type { Organization } from "../prisma/generated/client";
import { UserRole } from "../prisma/generated/client";
import { PrismaService } from "../prisma/prisma.service";
import { type CreateOrgDto } from "./org.dto";

@Injectable()
export class OrgService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createOrgDto: CreateOrgDto): Promise<Organization> {
    if (createOrgDto.slug && !isValidSlug(createOrgDto.slug)) {
      throw new BadRequestException("Invalid slug format");
    }

    const slug = createOrgDto.slug || slugify(createOrgDto.name);

    try {
      return await this.prisma.organization.create({
        data: {
          name: createOrgDto.name,
          slug,
          users: {
            create: {
              username: createOrgDto.username,
              password: await argon2.hash(createOrgDto.password),
              role: UserRole.ADMIN,
            },
          },
        },
      });
    } catch (error: any) {
      if (error.code === "P2002" && error.meta?.target?.includes("slug")) {
        throw new ConflictException("Organization with this slug already exists");
      }

      throw error; // Re-throw other errors
    }
  }

  async findOrgBySlug(slug: string): Promise<Organization | null> {
    return this.prisma.organization.findUnique({ where: { slug } });
  }
}
