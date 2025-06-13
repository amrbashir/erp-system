import { type PipeTransform, type ArgumentMetadata, BadRequestException } from "@nestjs/common";
import { type ZodType } from "zod/v4";

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodType) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    const parsedValue = this.schema.safeParse(value);

    if (parsedValue.success) return parsedValue.data;

    throw new BadRequestException({
      message: `Validation failed for ${metadata.type}`,
      errors: parsedValue.error.issues.map((i) => i.path.join(".") + " - " + i.message),
    });
  }
}
