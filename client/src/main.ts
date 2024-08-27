import { RouteOutlet } from "./routes/route-outlet/route-outlet.component";
import { html } from "./tools/html";

RouteOutlet.register();

document.querySelector<HTMLDivElement>("#app")!.innerHTML = html`
  <route-outlet id="MAIN"></route-outlet>
`;
document.title = "La Città Perduta di Eldalorisa";
