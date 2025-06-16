import {
  type PipeTransform,
  type ArgumentMetadata,
  BadRequestException,
  Injectable,
} from "@nestjs/common";
import { createSchema } from "zod-openapi";
import { ZodType, type SafeParseReturnType } from "zod";
import type { ApiBodyOptions } from "@nestjs/swagger";

const isZodDto = Symbol.for("isZodDto");

// Extract the schema type from ApiBodyOptions
type ApiBodySchemaHostOnly = Extract<ApiBodyOptions, { schema: any }>;
type ExtractedSchemaType = ApiBodySchemaHostOnly extends { schema: infer S } ? S : never;

// Modified version from nestjs-zod
//
// See https://github.com/BenLorantfy/nestjs-zod/blob/c7bbd89c4b16ee218caa9dd8648c52423fb67ec4/packages/nestjs-zod/src/dto.ts#L4
export interface ZodDto<T extends ZodType = ZodType> {
  new (): T["_output"];
  isZodDto: Symbol;
  schema: T;
  openapiSchema: ExtractedSchemaType;
  safeParse(input: unknown): SafeParseReturnType<T["_output"], T["_input"]>;
}

// Modified version from nestjs-zod
//
// See https://github.com/BenLorantfy/nestjs-zod/blob/c7bbd89c4b16ee218caa9dd8648c52423fb67ec4/packages/nestjs-zod/src/dto.ts#L15
export function createZodDto<T extends ZodType = ZodType>(schema: T): ZodDto<T> {
  class AugmentedZodDto {
    public static isZodDto = isZodDto;
    public static schema = schema;
    public static openapiSchema = createSchema(schema).schema;

    public static safeParse(input: unknown) {
      return this.schema.safeParse(input);
    }
  }

  return AugmentedZodDto as unknown as ZodDto<T>;
}

// Modified version from nestjs-zod
//
// See https://github.com/BenLorantfy/nestjs-zod/blob/c7bbd89c4b16ee218caa9dd8648c52423fb67ec4/packages/nestjs-zod/src/pipe.ts#L19
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schemaOrDto?: ZodType | ZodDto) {}

  public transform(value: unknown, metadata: ArgumentMetadata) {
    const metatype = metadata.metatype as ZodDto | undefined;

    const schema = metatype?.isZodDto === isZodDto ? metatype.schema : this.schemaOrDto;

    if (!schema) return value; // No schema provided, return the value as is

    const parsedValue = schema.safeParse(value);

    if (parsedValue.success) return parsedValue.data;

    throw new BadRequestException({
      message: `Validation failed for ${metadata.type}`,
      errors: parsedValue.error.issues.map((i) => i.path.join(".") + " - " + i.message),
    });
  }
}
