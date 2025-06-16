/** Modified version of nestjs-zod pipe and createZodDto helper */

import {
  type PipeTransform,
  type ArgumentMetadata,
  BadRequestException,
  Injectable,
} from "@nestjs/common";
import { type ZodSafeParseResult, type ZodType } from "zod/v4";

const isZodDto = Symbol.for("isZodDto");

// Modified version from nestjs-zod
//
// See https://github.com/BenLorantfy/nestjs-zod/blob/c7bbd89c4b16ee218caa9dd8648c52423fb67ec4/packages/nestjs-zod/src/dto.ts#L4
export interface ZodDto<TOutput = any, TInput = TOutput> {
  new (): TOutput;
  isZodDto: Symbol;
  schema: ZodType<TOutput, TInput>;
  safeParse(input: unknown): ZodSafeParseResult<TOutput>;
}

// Modified version from nestjs-zod
//
// See https://github.com/BenLorantfy/nestjs-zod/blob/c7bbd89c4b16ee218caa9dd8648c52423fb67ec4/packages/nestjs-zod/src/dto.ts#L15
export function createZodDto<TOutput = any, TInput = TOutput>(schema: ZodType<TOutput, TInput>) {
  class AugmentedZodDto {
    public static isZodDto = isZodDto;
    public static schema = schema;

    public static safeParse(input: unknown) {
      return this.schema.safeParse(input);
    }
  }

  return AugmentedZodDto as unknown as ZodDto<TOutput, TInput>;
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
