export function mapTemplateClasses (
  template: string,
  styles: Record<string, string>,
): string {
  return template.replace(
    /(^|\s)class\s*=\s*(["'])(.*?)\2/gs,
    (
      _attribute,
      prefix: string,
      quote: string,
      classNames: string,
    ) => {
      const mappedClassNames = classNames.trim().length === 0
        ? []
        : classNames.trim().split(/\s+/).
          map((className) => {
            if (!Object.prototype.hasOwnProperty.call(styles, className) || !styles[className]) {
              throw new Error(`CSS Module class "${className}" is not defined.`);
            }
            return styles[className];
          });
      return `${prefix}class=${quote}${mappedClassNames.join(" ")}${quote}`;
    },
  );
}
