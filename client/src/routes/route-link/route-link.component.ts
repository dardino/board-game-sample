import { BgsComponentTypeStatic } from "../../helpers/components";
import { RoutePath } from "../config";
import { navigate, RouteParameters } from "../navigation";
import template from "./route-link.template.html?raw";


export const RouteLink: BgsComponentTypeStatic = class RouteLink extends HTMLElement {

  static observedAttributes = [
    "to",
    "params",
  ];

  static tagName = "route-link" as const;

  static register () {
    customElements.define(
      RouteLink.tagName,
      RouteLink,
    );
  }
  
  #to: RoutePath = "/";

  #params: Partial<RouteParameters<RoutePath>> = {};

  #shadow: ShadowRoot;

  constructor () {
    super();
    this.#shadow = this.attachShadow({ mode: "open" });
    this.#shadow.innerHTML = template;
  }

  connectedCallback () {
    this.#shadow.querySelector("a")?.addEventListener(
      "click",
      this.#navigate,
    );
  }

  disconnectedCallback () {
    this.#shadow.querySelector("a")?.removeEventListener(
      "click",
      this.#navigate,
    );
  }

  #navigate = (event: MouseEvent) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    navigate(
      this.#to,
      this.#params as RouteParameters<RoutePath>,
    );
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
  attributeChangedCallback (name: string, oldValue: string, newValue: RoutePath) {
    if (oldValue === newValue) { // No change
      return;
    }
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
