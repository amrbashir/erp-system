import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { type CreateOrgDto } from "./org.dto";
import { type Organization, UserRole } from "../prisma/generated/client";
import { slugify, isValidSlug } from "@erp-system/utils";
import * as argon2 from "argon2";

@Injectable()
export class OrgService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createOrgDto: CreateOrgDto): Promise<Organization> {
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
        stores: {
          create: {
            name: "Default",
            slug: "default",
          },
        },
      },
    });
  }

  async findOrgBySlug(slug: string): Promise<Pick<Organization, "name" | "slug"> | null> {
    return this.prisma.organization.findUnique({
      where: { slug },
      select: {
        name: true,
        slug: true,
      },
    });
  }
}
