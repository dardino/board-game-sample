import { HttpException, HttpStatus } from "@nestjs/common";

export class GameStartException extends HttpException {

  constructor (message: string, internalCode: number) {
    super(
      message,
      HttpStatus.BAD_REQUEST,
      { cause: internalCode, description: message },
    );
  }

}
