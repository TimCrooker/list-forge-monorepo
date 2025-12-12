import {
  IsString,
  IsOptional,
  IsObject,
  IsUUID,
  IsInt,
  Min,
  Max,
  MaxLength,
  ValidateNested,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { BadRequestException } from '@nestjs/common';

/**
 * Maximum allowed size for tool inputs in bytes
 */
const MAX_INPUT_SIZE = 10 * 1024; // 10KB

/**
 * Custom validator to check object size
 */
function MaxObjectSize(maxBytes: number, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'maxObjectSize',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [maxBytes],
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          if (value === null || value === undefined) return true;
          try {
            const jsonSize = JSON.stringify(value).length;
            return jsonSize <= args.constraints[0];
          } catch {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} exceeds maximum size of ${args.constraints[0]} bytes`;
        },
      },
    });
  };
}

/**
 * Query params for searching debugger items
 */
export class SearchDebuggerItemsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  query?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

/**
 * Request body for executing a tool
 */
export class ExecuteToolBodyDto {
  @IsString()
  @MaxLength(100)
  toolName: string;

  @IsOptional()
  @IsUUID()
  itemId?: string;

  @IsObject()
  @MaxObjectSize(MAX_INPUT_SIZE, {
    message: `Input payload exceeds maximum size of ${MAX_INPUT_SIZE} bytes`,
  })
  inputs: Record<string, unknown>;
}
