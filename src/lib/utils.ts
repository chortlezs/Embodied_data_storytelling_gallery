import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function resolveCaseLink(link: string) {
  if (/^https?:\/\//i.test(link)) {
    return link;
  }

  const normalizedLink = link.replace(/^\/+/, "");
  return `${import.meta.env.BASE_URL}${normalizedLink}`;
}
