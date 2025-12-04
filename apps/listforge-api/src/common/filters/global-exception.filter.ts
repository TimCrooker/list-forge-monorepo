import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ApiErrorResponse,
  ErrorCodes,
  ErrorMessages,
  ErrorCode,
} from '@listforge/api-types';

/**
 * Custom application exception with error code
 */
export class AppException extends HttpException {
  constructor(
    public readonly errorCode: ErrorCode,
    statusCode: HttpStatus,
    message?: string,
    public readonly details?: string[],
  ) {
    super(message || ErrorMessages[errorCode], statusCode);
  }
}

/**
 * Global exception filter that transforms all exceptions into standardized API responses
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception, request);

    // Log the error with appropriate level
    if (errorResponse.statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${errorResponse.statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} - ${errorResponse.statusCode}: ${errorResponse.message}`,
      );
    }

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private buildErrorResponse(
    exception: unknown,
    request: Request,
  ): ApiErrorResponse {
    const timestamp = new Date().toISOString();
    const path = request.url;

    // Handle our custom AppException
    if (exception instanceof AppException) {
      return {
        statusCode: exception.getStatus(),
        errorCode: exception.errorCode,
        message: exception.message,
        details: exception.details,
        timestamp,
        path,
      };
    }

    // Handle NestJS HttpException (includes all built-in exceptions)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Extract message from exception response
      let message: string;
      let details: string[] | undefined;

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message =
          typeof responseObj.message === 'string'
            ? responseObj.message
            : Array.isArray(responseObj.message)
              ? 'Validation failed'
              : 'An error occurred';
        details = Array.isArray(responseObj.message)
          ? (responseObj.message as string[])
          : undefined;
      } else {
        message = 'An error occurred';
      }

      // Map HTTP status to error code
      const errorCode = this.statusToErrorCode(status);

      return {
        statusCode: status,
        errorCode,
        message,
        details,
        timestamp,
        path,
      };
    }

    // Handle unknown errors (these are unexpected)
    this.logger.error(
      'Unhandled exception type',
      exception instanceof Error ? exception.stack : String(exception),
    );

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: ErrorCodes.INTERNAL_ERROR,
      message: ErrorMessages.INTERNAL_ERROR,
      timestamp,
      path,
    };
  }

  private statusToErrorCode(status: number): ErrorCode {
    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        return ErrorCodes.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCodes.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCodes.NOT_FOUND;
      case HttpStatus.BAD_REQUEST:
        return ErrorCodes.BAD_REQUEST;
      case HttpStatus.CONFLICT:
        return ErrorCodes.CONFLICT;
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return ErrorCodes.UNPROCESSABLE;
      case HttpStatus.BAD_GATEWAY:
        return ErrorCodes.EXTERNAL_SERVICE_ERROR;
      default:
        return ErrorCodes.INTERNAL_ERROR;
    }
  }
}

