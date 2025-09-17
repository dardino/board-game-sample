import { BaseHttpException } from "./exceptionBase";
import { RegisterExceptionArgs } from "./exceptionsArgs/RegisterExceptionArgs";

export enum RegisterCodes {
  INVALID_CLIENT_ID = 2000,
  NICKNAME_ALREADY_EXISTS = 2001,
  INVALID_NICKNAME = 2002,
}

export class RegisterException extends BaseHttpException<RegisterExceptionArgs> {

  constructor (message: string, internalCode: RegisterCodes) {

    super({ internalCode, message });
    this.name = "RegisterException";

  }

}
