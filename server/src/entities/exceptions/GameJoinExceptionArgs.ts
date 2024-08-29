import { BaseHttpExceptionArgs } from "./BaseHttpExceptionArgs";

export interface GameJoinExceptionArgs extends BaseHttpExceptionArgs {

  gameId: number;
}
