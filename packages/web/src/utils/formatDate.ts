import i18n from "@/i18n.ts";

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";

  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
  };

  return new Intl.DateTimeFormat(i18n.language, options).format(new Date(date));
}
