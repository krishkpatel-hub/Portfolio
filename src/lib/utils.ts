export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function isExternalUrl(href: string) {
  return /^https?:\/\//.test(href);
}
