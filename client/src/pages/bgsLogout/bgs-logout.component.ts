import { BgsComponentTypeStatic } from "../../helpers/components";
import { navigate } from "../../routes/navigation";
import { Registration } from "../../services/registration/registration.service";
import template from "./bgs-logout.template.html?raw";

export const BgsLogoutComponent: BgsComponentTypeStatic = class BgsLogoutComponent extends HTMLElement {

  public static readonly tagName = "bgs-logout";

  public static register () {
    customElements.define(
      BgsLogoutComponent.tagName,
      BgsLogoutComponent,
    );
  }

  constructor () {
    super();
    this.innerHTML = template;
  }

  connectedCallback () {
    Registration.Unregister().finally(() => navigate("/"));
  }


};
