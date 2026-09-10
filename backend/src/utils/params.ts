export function getParamString(param: string | string[] | undefined): string {
  if (typeof param === "string") {
    return param;
  }
  if (Array.isArray(param) && param.length > 0 && typeof param[0] === "string") {
    return param[0];
  }
  return "";
}
