/// <reference types="vite/client" />

declare module "*.template.html?css-module" {
  const template: string;
  export default template;
}
