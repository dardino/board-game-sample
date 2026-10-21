import {
  GameChatMessage,
  GameChatMessageResultEvent,
  GameChatState,
} from "@dto/game-state.dto/game-state.dto";
import { BgsComponentTypeStatic } from "../../../../helpers/components";
import style from "./bgs-game-chat.module.css";
import template from "./bgs-game-chat.template.html?css-module";

export const BgsGameChatComponent: BgsComponentTypeStatic = class BgsGameChatComponent extends HTMLElement {

  public static readonly tagName = "bgs-game-chat";

  constructor () {
    super();
    this.innerHTML = template;
  }

  public static register () {
    customElements.define(
      BgsGameChatComponent.tagName,
      BgsGameChatComponent,
    );
  }

  connectedCallback () {
    this.#sendForm.addEventListener("submit", this.#submit);
  }

  setChatState (state: GameChatState, currentPlayerId: number) {
    const messages = state.messages.map((message) => this.#createMessage(message, currentPlayerId));
    if (messages.length === 0) {
      const emptyMessage = document.createElement("li");
      emptyMessage.className = style.emptyMessage;
      emptyMessage.textContent = "No messages yet. Start the conversation.";
      messages.push(emptyMessage);
    }
    this.#messages.replaceChildren(...messages);
    this.#messages.scrollTop = this.#messages.scrollHeight;
  }

  completeSend (result: GameChatMessageResultEvent) {
    this.#sendButton.disabled = false;
    this.#messageInput.disabled = false;
    if (result.status === "accepted") {
      this.#messageInput.value = "";
      this.#chatError.textContent = "";
    } else {
      this.#chatError.textContent = result.error?.message ?? "The message could not be sent.";
    }
  }

  failSend (message: string) {
    this.#sendButton.disabled = false;
    this.#messageInput.disabled = false;
    this.#chatError.textContent = message;
  }

  disconnectedCallback () {
    this.#sendForm.removeEventListener("submit", this.#submit);
  }

  get #sendForm () {
    return this.querySelector<HTMLFormElement>("#chatForm")!;
  }

  get #messageInput () {
    return this.querySelector<HTMLInputElement>("#chatInput")!;
  }

  get #sendButton () {
    return this.querySelector<HTMLButtonElement>("#chatSend")!;
  }

  get #messages () {
    return this.querySelector<HTMLOListElement>("#chatMessages")!;
  }

  get #chatError () {
    return this.querySelector<HTMLParagraphElement>("#chatError")!;
  }

  #createMessage (message: GameChatMessage, currentPlayerId: number): HTMLLIElement {
    const item = document.createElement("li");
    item.className = message.playerId === currentPlayerId
      ? `${style.message} ${style.ownMessage}`
      : style.message;
    const header = document.createElement("div");
    header.className = style.messageHeader;
    const author = document.createElement("span");
    author.className = style.messageAuthor;
    author.textContent = message.playerId === currentPlayerId
      ? "You"
      : message.nickname;
    const time = document.createElement("time");
    time.className = style.messageTime;
    time.dateTime = message.sentAt;
    const date = new Date(message.sentAt);
    time.textContent = Number.isNaN(date.getTime())
      ? ""
      : date.toLocaleTimeString([], { hour: "2-digit",
        minute: "2-digit" });
    header.append(author, time);
    const text = document.createElement("p");
    text.className = style.messageText;
    text.textContent = message.text;
    item.append(header, text);
    return item;
  }

  #submit = (event: SubmitEvent) => {
    event.preventDefault();
    const message = this.#messageInput.value.trim();
    if (!message) return;

    this.#sendButton.disabled = true;
    this.#messageInput.disabled = true;
    this.#chatError.textContent = "";
    this.dispatchEvent(new CustomEvent("game-chat-send", {
      detail: { message },
      bubbles: true,
      composed: true,
    }));
  };

};
