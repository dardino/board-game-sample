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

  #renderedRouteKey: string | null | undefined;

  get activeRoute () {
    return this.#resolveActiveRoute()?.route ?? null;
  }

  #resolveActiveRoute (): { route: RouteConfig;
    key: string; } | null {
    const allPaths = Object.keys(this.#allRoutes) as (keyof RouteConfig)[];
    for (const template of allPaths) {
      const route = this.#allRoutes[template];
      if (!route) continue;
      const directMatch = matchPath(template, location.pathname);
      if (directMatch) {
        return {
          route,
          key: `${template}:${JSON.stringify(directMatch.params)}`,
        };
      }
      const matchingChildPath = Object.keys(route.children ?? {}).find((childPath) => matchPath(childPath, location.pathname));
      if (matchingChildPath) {
        const childMatch = matchPath(matchingChildPath, location.pathname);
        return {
          route,
          key: `${template}:${JSON.stringify(childMatch?.params ?? {})}`,
        };
      }
    }
    return null;
  }

  constructor () {
    super();
    const parent = this.parentElement!.closest(RouteOutlet.tagName) as RouteOutlet | null;
    this.style.display = "contents";
    if (!parent) {
      this.#allRoutes = RouteConfigs;
    } else {
      this.#allRoutes = parent!.activeRoute?.children ?? {};
    }
  }

  connectedCallback () {
    this.updateRoute();
    document.addEventListener(
      "navigate",
      this.#handleNavigation,
    );
    window.addEventListener(
      "popstate",
      this.#handlePopstate,
    );
  }

  disconnectedCallback () {
    document.removeEventListener(
      "navigate",
      this.#handleNavigation,
    );
    window.removeEventListener(
      "popstate",
      this.#handlePopstate,
    );
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
      const resolvedRoute = this.#resolveActiveRoute();
      const route = resolvedRoute?.route ?? null;
      const routeKey = resolvedRoute?.key ?? null;
      if (routeKey === this.#renderedRouteKey) return;
      this.#renderedRouteKey = routeKey;
      if (route === null) {
        this.replaceChildren();
        return;
      }
      if (route != null) {
        if (!customElements.get(route.content.tagName)) {
          route.content.register();
        }
        this.innerHTML = `<${route.content.tagName}></${route.content.tagName}>`;
      }
    });
  }

};
