import { type PipeTransform, type ArgumentMetadata, BadRequestException } from "@nestjs/common";
import { ZodSchema } from "zod";

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    const parsedValue = this.schema.safeParse(value);

    if (parsedValue.success) return parsedValue.data;

    throw new BadRequestException({
      message: "Validation failed",
      errors: parsedValue.error.errors.map((e) => e.path + " - " + e.code + ": " + e.message),
    });
  }
}
