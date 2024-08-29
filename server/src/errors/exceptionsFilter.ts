import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import { FastifyReply } from "fastify";
import { BaseHttpException } from "./exceptionBase";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {

  catch (exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const status = exception.getStatus();
    const serializedError: { statusCode: number; timestamp: string; message?: string; detail?: unknown } = {
      statusCode: status,
      timestamp: new Date().toISOString(),
    };

    if (exception instanceof BaseHttpException) {
      serializedError.detail = exception.details;
    } else {
      serializedError.message = exception.message;
    }

    response.
      status(status).
      send(serializedError);

  }

}
