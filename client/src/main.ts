import { BgsJoinComponent } from "./components/bgsJoin/bgs-join.component";
import { html } from "./tools/html";

BgsJoinComponent.register();

const title = "Alla ricerca del McGuffin";
const subTitle = "Un gioco di espolorazione ed avventura alla ricerca del famigerato McGuffin";

document.querySelector<HTMLDivElement>('#app')!.innerHTML = html`
  <h1>${title}</h1>
  <h2>${subTitle}</h2>
  <bgs-join></bgs-join>
`;
document.title = `${title} - ${subTitle}`;
