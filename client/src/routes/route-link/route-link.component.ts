import { BgsComponentTypeStatic } from "../../helpers/components";
import { navigate } from "../navigation";
import template from "./route-link.template.html?raw";


export const RouteLink: BgsComponentTypeStatic = class RouteLink extends HTMLElement {

  static observedAttributes = ["to", "params"];

  static tagName = "route-link" as const;

  static register () {
    customElements.define(
      RouteLink.tagName,
      RouteLink,
    );
  }

  #to = "/";

  #params: Record<string, string> = {};

  #shadow: ShadowRoot;

  constructor () {
    super();
    this.#shadow = this.attachShadow({ mode: "open" });
    this.#shadow.innerHTML = template;
  }

  connectedCallback () {
    this.#shadow.querySelector("a")?.addEventListener("click", this.#navigate);
  }

  disconnectedCallback () {
    this.#shadow.querySelector("a")?.removeEventListener("click", this.#navigate);
  }

  #navigate = (event: MouseEvent) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    navigate(this.#to, this.#params);
  };

  // adoptedCallback () {}


  /**
   * This method is called whenever one of the attributes
   * defined in `observedAttributes` is changed.
   *
   * @param {string} name - The name of the attribute that changed.
   * @param {string} oldValue - The old value of the attribute.
   * @param {string} newValue - The new value of the attribute.
   */
  attributeChangedCallback (name: string, oldValue: string, newValue: string) {
    console.log(`Attribute ${name} has changed from ${oldValue} to ${newValue}.`);
    switch (name) {

      case "to":
        this.#to = newValue;
        break;
      case "params":
        this.#params = JSON.parse(newValue);
        break;

    }
  }

};
