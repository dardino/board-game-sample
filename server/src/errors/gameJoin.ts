import { GameJoinExceptionArgs } from "@dto/exceptions/GameJoinExceptionArgs";
import { BaseHttpException } from "./exceptionBase";


export class GameJoinException extends BaseHttpException<GameJoinExceptionArgs> {

}
