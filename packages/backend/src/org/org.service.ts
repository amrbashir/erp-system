import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.ts";
import { CreateOrgDto } from "./org.dto.ts";
import { UserService } from "../user/user.service.ts";
import { type Organization, UserRole } from "../prisma/generated/client.ts";
import { isValidSlug, slugify } from "../utils.ts";

@Injectable()
export class OrgService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  async create(createOrgDto: CreateOrgDto): Promise<Organization | null> {
    if (createOrgDto.slug && !isValidSlug(createOrgDto.slug)) {
      throw new BadRequestException("Invalid slug format");
    }

    const slug = createOrgDto.slug || slugify(createOrgDto.name);

    const org = await this.prisma.organization.findUnique({ where: { slug } });
    if (org) throw new ConflictException("Organization already exists");

    const newOrg = await this.prisma.organization.create({
      data: {
        name: createOrgDto.name,
        slug,
      },
    });

    await this.userService.createUser({
      username: createOrgDto.username,
      password: createOrgDto.password,
      organizationId: newOrg.id,
      role: UserRole.ADMIN,
    });

    return newOrg;
  }
}
