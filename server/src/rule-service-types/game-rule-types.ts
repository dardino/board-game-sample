export interface RuleActionBase<ActionKind extends string> {
  playerId: number;
  runAt: string;
  action: ActionKind;
}

export interface GameRuleService<ActionKind extends string> {
  queuePlayerAction<Kind extends ActionKind>(gameId: number, action: RuleActionBase<Kind>): Promise<boolean>;
  executePlayerAction<Kind extends ActionKind>(gameId: number, action: RuleActionBase<Kind>): Promise<boolean>;
}
