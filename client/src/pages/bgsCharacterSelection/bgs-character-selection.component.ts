import { BgsComponentTypeStatic } from "../../helpers/components";
import {
  GameActionResultEvent,
  GameStateEvent,
} from "@dto/game-state.dto/game-state.dto";
import style from "./bgs-character-selection.module.css";
import template from "./bgs-character-selection.template.html?css-module";

type GameActionSender = (action: unknown) => Promise<GameActionResultEvent>;

export const BgsCharacterSelectionComponent: BgsComponentTypeStatic = class BgsCharacterSelectionComponent extends HTMLElement {

  public static readonly tagName = "bgs-character-selection";

  #gameState: GameStateEvent | null = null;

  #playerId: number | null = null;

  #sendGameAction: GameActionSender | null = null;

  #selectionPending = false;

  #selectionClock: ReturnType<typeof setInterval> | null = null;

  constructor () {
    super();
    this.innerHTML = template;
    this.classList.add(style.selection);
  }

  public static register () {
    customElements.define(
      BgsCharacterSelectionComponent.tagName,
      BgsCharacterSelectionComponent,
    );
  }

  connectedCallback () {
    this.#selectionClock = setInterval(() => this.#render(), 1000);
    this.dispatchEvent(new CustomEvent("bgs-character-selection-connected", {
      bubbles: true,
      composed: true,
    }));
  }

  disconnectedCallback () {
    if (this.#selectionClock !== null) {
      clearInterval(this.#selectionClock);
      this.#selectionClock = null;
    }
  }

  setGameContext (
    state: GameStateEvent,
    playerId: number,
    sendGameAction: GameActionSender,
  ) {
    this.#gameState = state;
    this.#playerId = playerId;
    this.#sendGameAction = sendGameAction;
    this.#render();
  }

  #render () {
    const state = this.#gameState;
    const panel = this.querySelector<HTMLElement>("#characterSelection");
    const grid = this.querySelector<HTMLElement>("#characterGrid");
    const roster = this.querySelector<HTMLUListElement>("#selectedCharacters");
    if (!state || !panel || !grid || !roster) return;

    const selection = state.characterSelection;
    const isChoosing = selection.stage === "choosing" && state.phase === "Setup";
    const isRevealing = selection.stage === "revealing" && state.phase === "CharacterReveal";
    panel.hidden = !isChoosing && !isRevealing;
    if (!isChoosing && !isRevealing) return;

    const playerId = this.#playerId;
    if (playerId === null) return;
    const player = selection.players.find((candidate) => candidate.playerId === playerId);
    const isReady = selection.readyPlayerIds.includes(playerId);
    const canChoose = Boolean(player && isChoosing && !isReady && !state.reconnection.paused);

    let instructions = "Join this game to select a character.";
    if (isRevealing) {
      instructions = "These are the final character assignments. The game will begin shortly.";
    } else if (player && isReady) {
      instructions = "You're ready. Your preference is locked while the others finish.";
    } else if (player) {
      instructions = "Choose or change your preference. Multiple players can choose the same character.";
    }
    this.#setText("#selectionInstructions", instructions);
    if (!this.#selectionPending) {
      this.#setText(
        "#selectionFeedback",
        isRevealing
          ? `${selection.readyPlayerIds.length} of ${selection.players.length} players are ready.`
          : `${selection.selectedCharacters.length} of ${selection.players.length} players have chosen.`,
      );
    }
    this.#setText(
      "#selectionTimer",
      state.reconnection.paused
        ? "Paused"
        : selection.endsAt === null
          ? ""
          : `${Math.max(0, Math.ceil((selection.endsAt - Date.now()) / 1000))}s`,
    );
    const readyButton = this.querySelector<HTMLButtonElement>("#selectionReady");
    if (readyButton) {
      readyButton.hidden = !player;
      readyButton.disabled = !player || isReady || state.reconnection.paused || this.#selectionPending;
      readyButton.textContent = isReady
        ? "Ready ✓"
        : "Ready";
      readyButton.onclick = () => {
        void this.#readyForNextPhase(isChoosing);
      };
    }

    const themes: Record<string, string> = {
      Chierico: style.characterThemeCleric,
      Barbaro: style.characterThemeBarbarian,
      Mago: style.characterThemeMage,
      Ladro: style.characterThemeRogue,
      Bardo: style.characterThemeBard,
    };
    grid.replaceChildren(...selection.availableCharacters.map((character) => {
      const selected = selection.selectedCharacters.filter((candidate) => candidate.characterId === character.characterId);
      const ownPreference = selected.some((candidate) => candidate.playerId === playerId);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `${style.characterCard} ${themes[character.characterClass] ?? style.characterThemeFallback}`;
      if (ownPreference) button.classList.add(style.characterCardPreferred);
      button.disabled = !canChoose || this.#selectionPending;
      button.setAttribute("aria-pressed", String(ownPreference));

      const characterClass = document.createElement("span");
      characterClass.className = style.characterClass;
      characterClass.textContent = character.characterClass;

      const name = document.createElement("h2");
      name.className = style.characterName;
      name.textContent = character.characterClass;

      const stats = document.createElement("span");
      stats.className = style.characterStats;
      for (const [label, value] of [
        ["Life", character.startingLife],
        ["Energy", character.startingEnergy],
        ["Movement", character.movementSpeed],
        ["Defence", character.defence],
      ] as const) {
        const stat = document.createElement("span");
        stat.className = style.characterStat;
        const statLabel = document.createElement("span");
        statLabel.className = style.characterStatLabel;
        statLabel.textContent = label;
        const statValue = document.createElement("strong");
        statValue.className = style.characterStatValue;
        statValue.textContent = String(value);
        stat.append(statLabel, statValue);
        stats.append(stat);
      }

      const availability = document.createElement("span");
      availability.className = style.characterAvailability;
      if (isRevealing) {
        availability.textContent = selection.selectedCharacters.find((candidate) => candidate.characterId === character.characterId)?.nickname ?? "Assigned";
      } else if (ownPreference) {
        availability.textContent = "Your preference";
      } else if (canChoose) {
        availability.textContent = "Choose character";
      } else {
        availability.textContent = "Waiting";
      }
      button.append(characterClass, name, stats, availability);
      if (selected.length > 0) {
        const count = document.createElement("span");
        count.className = style.characterCount;
        count.textContent = String(selected.length);
        count.setAttribute("aria-label", `Chosen by ${selected.length} players`);
        button.append(count);
      }
      if (canChoose) {
        button.addEventListener("click", () => {
          void this.#selectCharacter(character.characterId, character.characterClass);
        });
      }
      return button;
    }));

    roster.replaceChildren(...selection.selectedCharacters.map((chosen) => {
      const item = document.createElement("li");
      item.textContent = `${chosen.nickname}: ${chosen.characterName}`;
      return item;
    }));
  }

  async #selectCharacter (characterId: number, characterName: string) {
    const playerId = this.#playerId;
    if (playerId === null || !this.#sendGameAction) return;

    this.#selectionPending = true;
    this.#setText("#selectionFeedback", `Selecting ${characterName}...`);
    this.#render();
    await this.#sendAction({
      phase: "Setup",
      kind: "CharacterSelection",
      playerId,
      characterId,
      characterName,
    }, `Selected ${characterName}.`);
  }

  async #readyForNextPhase (isChoosing: boolean) {
    const playerId = this.#playerId;
    if (playerId === null || !this.#sendGameAction || this.#selectionPending) return;
    this.#selectionPending = true;
    this.#setText("#selectionFeedback", "Confirming ready...");
    this.#render();
    await this.#sendAction({
      phase: isChoosing
        ? "Setup"
        : "CharacterReveal",
      kind: isChoosing
        ? "CharacterSelectionReady"
        : "CharacterRevealReady",
      playerId,
    }, "Ready.");
  }

  async #sendAction (action: unknown, successFeedback: string) {
    const sendGameAction = this.#sendGameAction;
    if (!sendGameAction) return;
    try {
      const result = await sendGameAction(action);
      this.#selectionPending = false;
      if (result.status === "accepted") {
        this.#setText("#selectionFeedback", successFeedback);
      } else {
        this.#setText("#selectionFeedback", result.error?.message ?? "The action was rejected.");
      }
      this.#render();
    } catch (error) {
      this.#selectionPending = false;
      this.#setText(
        "#selectionFeedback",
        error instanceof Error
          ? error.message
          : "Unable to send the selection action.",
      );
      this.#render();
    }
  }

  #setText (selector: string, value: string) {
    const element = this.querySelector(selector);
    if (element) element.textContent = value;
  }

};
