export function cookieparser(): Record<string, string> {
  return document.cookie.split(";").map(cookie => cookie.trim().split("=")).reduce((aggr, elem) => { return { ...aggr, [elem[0]]: elem[1] }; }, {});
}
