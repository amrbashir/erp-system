import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.ts";
import { CreateOrgDto } from "./org.dto.ts";
import { type Organization, UserRole } from "../prisma/generated/client.ts";
import { isValidSlug, slugify } from "../utils.ts";
import * as argon2 from "argon2";

@Injectable()
export class OrgService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createOrgDto: CreateOrgDto): Promise<Organization | null> {
    if (createOrgDto.slug && !isValidSlug(createOrgDto.slug)) {
      throw new BadRequestException("Invalid slug format");
    }

    const slug = createOrgDto.slug || slugify(createOrgDto.name);

    const org = await this.prisma.organization.findUnique({ where: { slug } });
    if (org) throw new ConflictException("Organization already exists");

    return this.prisma.organization.create({
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
  }
}
