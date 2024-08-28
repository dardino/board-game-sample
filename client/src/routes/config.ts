import { BgsComponentTypeStatic } from "../helpers/components";
import { BgsJoinComponent } from "../pages/bgsJoin/bgs-join.component";
import { BgsLandingComponent } from "../pages/bgsLanding/bgs-landing.component";
import { BgsMasterComponent } from "../pages/bgsMaster/bgs-master.component";

export interface RouteConfig {
  content: BgsComponentTypeStatic;
  auth: boolean;
  children?: Record<string, RouteConfig>;
}

export const RouteConfigs = {
  "/*": {
    content: BgsMasterComponent,
    auth: false,
    children: {
      "/": {
        content: BgsLandingComponent,
        auth: false,
      },
      "/join": {
        content: BgsJoinComponent,
        auth: false,
      },
    } as const satisfies Record<string, RouteConfig>,
  },
} as const satisfies Record<string, RouteConfig>;
