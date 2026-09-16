export function zonedParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    weekday: parts.weekday,
    hour: parts.hour,
    minute: parts.minute,
  };
}

export function zonedDateKey(date: Date, timeZone: string) {
  const { year, month, day } = zonedParts(date, timeZone);
  return `${year}-${month}-${day}`;
}

export function formatZhDate(date: Date, timeZone: string) {
  const weekdayMap: Record<string, string> = {
    Sun: "星期日",
    Mon: "星期一",
    Tue: "星期二",
    Wed: "星期三",
    Thu: "星期四",
    Fri: "星期五",
    Sat: "星期六",
  };
  const { year, month, day, weekday } = zonedParts(date, timeZone);
  return `${year}年${Number(month)}月${Number(day)}日 ${weekdayMap[weekday] ?? ""}`.trim();
}

export function formatZhDateTime(date: Date, timeZone: string) {
  const { hour, minute } = zonedParts(date, timeZone);
  return `${formatZhDate(date, timeZone)} ${hour}:${minute}`;
}

export function padTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function nextRunAt(settings: {
  timezone: string;
  hour: number;
  minute: number;
}) {
  const now = new Date();
  for (let offset = 0; offset < 48; offset += 1) {
    const candidate = new Date(now.getTime() + offset * 60 * 1000);
    const parts = zonedParts(candidate, settings.timezone);
    if (
      Number(parts.hour) === settings.hour &&
      Number(parts.minute) === settings.minute
    ) {
      return candidate;
    }
  }
  const parts = zonedParts(now, settings.timezone);
  const currentMinutes = Number(parts.hour) * 60 + Number(parts.minute);
  const targetMinutes = settings.hour * 60 + settings.minute;
  let delta = targetMinutes - currentMinutes;
  if (delta <= 0) delta += 24 * 60;
  return new Date(now.getTime() + delta * 60 * 1000);
}

export function isWithinScheduleWindow(
  date: Date,
  settings: { timezone: string; hour: number; minute: number },
  windowMinutes = 2,
) {
  const parts = zonedParts(date, settings.timezone);
  const current = Number(parts.hour) * 60 + Number(parts.minute);
  const target = settings.hour * 60 + settings.minute;
  return Math.abs(current - target) <= windowMinutes;
}
