import { GameJoinExceptionArgs } from "src/errors/exceptionsArgs/GameJoinExceptionArgs";
import { BaseHttpException } from "./exceptionBase";


export class GameJoinException extends BaseHttpException<GameJoinExceptionArgs> {

}
