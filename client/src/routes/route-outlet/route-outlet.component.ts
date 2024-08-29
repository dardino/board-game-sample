import { BgsComponentTypeStatic } from "../../helpers/components";
import { RouteConfig, RouteConfigs } from "../config";
import { matchPath } from "../navigation";
import { RouteLink } from "../route-link/route-link.component";


export const RouteOutlet: BgsComponentTypeStatic = class RouteOutlet extends HTMLElement {

  static tagName = "route-outlet" as const;

  static register () {
    customElements.define(
      RouteOutlet.tagName,
      RouteOutlet,
    );
    RouteLink.register();
  }

  #allRoutes: Record<string, RouteConfig> = {};

  get activeRoute () {
    const allPaths = Object.keys(this.#allRoutes) as (keyof RouteConfig)[];
    const match = allPaths.find((template) => matchPath(
      template,
      location.pathname,
    ));
    return match
      ? this.#allRoutes[match]
      : null;
  }

  constructor () {
    super();
    const parent = this.parentElement!.closest(RouteOutlet.tagName) as RouteOutlet | null;
    this.style.display = "contents";
    console.log(parent);
    if (!parent) {
      this.#allRoutes = RouteConfigs;
    } else {
      this.#allRoutes = parent!.activeRoute?.children ?? {};
    }
  }

  connectedCallback () {
    this.updateRoute();
    document.addEventListener("navigate", this.#handleNavigation);
    window.addEventListener("popstate", this.#handlePopstate);
  }

  disconnectedCallback () {
    document.removeEventListener("navigate", this.#handleNavigation);
    window.removeEventListener("popstate", this.#handlePopstate);
  }

  #handlePopstate = () => {
    this.updateRoute();
  };

  // adoptedCallback () {}

  // attributeChangedCallback () {}

  #handleNavigation = (/* event: NavigateEvent */) => {
    this.updateRoute();
  };

  updateRoute () {
    requestAnimationFrame(() => {
      if (this.activeRoute != null) {
        if (!customElements.get(this.activeRoute.content.tagName)) {
          this.activeRoute.content.register();
        }
        this.innerHTML = `<${this.activeRoute.content.tagName}></${this.activeRoute.content.tagName}>`;
      }
    });
  }

};
