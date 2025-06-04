import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateOrgDto } from "./org.dto";
import { type Organization, UserRole } from "../prisma/generated/client";
import { isValidSlug, slugify } from "../utils";
import * as argon2 from "argon2";
import { useRandomDatabase } from "../../e2e/utils";

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

if (import.meta.vitest) {
  const { it, expect, beforeEach, afterEach, describe } = import.meta.vitest;

  describe("OrgService", async () => {
    let service: OrgService;
    let prisma: PrismaService;

    const { createDatabase, dropDatabase } = useRandomDatabase();

    beforeEach(async () => {
      await createDatabase();
      prisma = new PrismaService();
      service = new OrgService(prisma);
    });

    afterEach(async () => await dropDatabase());

    it("should create an organization with valid data", async () => {
      const createOrgDto = {
        name: "Test Org",
        username: "admin",
        password: "12345678",
        slug: "test-org",
      };
      const org = await service.create(createOrgDto);
      expect(org).toBeDefined();
      expect(org!.name).toBe("Test Org");
      expect(org!.slug).toBe("test-org");

      const users = await prisma.user.findMany({
        where: { organizationId: org!.id },
      });
      expect(users.length).toBe(1);
      expect(users[0].username).toBe("admin");
      expect(users[0].role).toBe(UserRole.ADMIN);
      expect(await argon2.verify(users[0].password, "12345678")).toBe(true);
    });

    it("should throw BadRequestException for invalid slug", async () => {
      const createOrgDto = {
        name: "Test Org",
        username: "admin",
        password: "12345678",
        slug: "invalid slug",
      };
      await expect(service.create(createOrgDto)).rejects.toThrow(BadRequestException);
    });

    it("should throw ConflictException for existing organization", async () => {
      const createOrgDto = {
        name: "Test Org",
        username: "admin",
        password: "12345678",
        slug: "test-org",
      };
      await service.create(createOrgDto); // create for the first time
      await expect(service.create(createOrgDto)).rejects.toThrow(ConflictException);
    });

    it("should create an organization without slug", async () => {
      const createOrgDto = { name: "Another Org", username: "admin2", password: "12345678" };
      const org = await service.create(createOrgDto);
      expect(org).toBeDefined();
      expect(org!.name).toBe("Another Org");
      expect(org!.slug).toBe(slugify("Another Org"));
    });
  });
}
