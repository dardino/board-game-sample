import { BgsComponentTypeStatic } from "../helpers/components";
import { BgsJoinComponent } from "../pages/bgsJoin/bgs-join.component";
import { BgsLandingComponent } from "../pages/bgsLanding/bgs-landing.component";
import { BgsLogoutComponent } from "../pages/bgsLogout/bgs-logout.component";
import { BgsMasterComponent } from "../pages/bgsMaster/bgs-master.component";

export interface RouteConfig {
  content: BgsComponentTypeStatic;
  auth: "always" | "never" | "optional";
  children?: Record<string, RouteConfig>;
}

export const RouteConfigs = {
  "/*": {
    content: BgsMasterComponent,
    auth: "optional",
    children: {
      "/": {
        content: BgsLandingComponent,
        auth: "optional",
      },
      "/join": {
        content: BgsJoinComponent,
        auth: "never",
      },
      "/logout": {
        content: BgsLogoutComponent,
        auth: "always",
      },
    } as const satisfies Record<string, RouteConfig>,
  },
} as const satisfies Record<string, RouteConfig>;
