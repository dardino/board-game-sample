import { HttpException, HttpStatus } from "@nestjs/common";

export class BaseHttpException<T extends {
  message: string;
  internalCode: number;
}> extends HttpException {

  constructor (public details: T) {
    super(details.message, HttpStatus.BAD_REQUEST);
  }

}
