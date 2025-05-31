import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateOrgDto } from "./org.dto";
import { UserService } from "../user/user.service";
import { UserRole } from "../prisma/generated";

@Injectable()
export class OrgService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  async create(createOrgDto: CreateOrgDto) {
    const org = await this.prisma.organization.findUnique({ where: { slug: createOrgDto.slug } });
    if (org) throw new ConflictException("Organization already exists");

    const newOrg = await this.prisma.organization.create({
      data: {
        name: createOrgDto.name,
        slug: createOrgDto.slug,
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
