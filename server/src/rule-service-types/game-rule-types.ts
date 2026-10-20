export interface GameRuleTransition<State, Event = never> {
  state: State;
  events: readonly Event[];
}

export interface GameRuleService<Context, State, Action, Snapshot, Event = never> {
  readonly gameType: string;

  initialize (context: Context): GameRuleTransition<State, Event>;

  applyAction (
    state: State,
    action: Action,
    context: Context,
  ): GameRuleTransition<State, Event>;

  getSnapshot (state: State, context: Context): Snapshot;
}
