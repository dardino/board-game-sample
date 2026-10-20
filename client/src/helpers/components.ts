
export interface BgsComponentTypeStatic {
  new(): HTMLElement & {
    connectedCallback?: () => void;
    disconnectedCallback?: () => void;
  };
  tagName: string;
  register(): void;
}
