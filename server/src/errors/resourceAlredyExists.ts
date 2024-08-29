import { HttpException, HttpStatus } from "@nestjs/common";

export class ResourceAlredyExistsException extends HttpException {

  constructor (message: string, internalCode: number) {
    super(
      message,
      HttpStatus.BAD_REQUEST,
      { cause: internalCode, description: message },
    );
  }

}
