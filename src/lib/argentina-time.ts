export const ARGENTINA_TIME_ZONE = "America/Argentina/Buenos_Aires";

type ArgentinaNowParts = {
  dateOnly: string;
  hours: number;
  minutes: number;
  totalMinutes: number;
};

const argentinaNowFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: ARGENTINA_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export const getArgentinaNowParts = (referenceDate = new Date()): ArgentinaNowParts => {
  const parts = argentinaNowFormatter.formatToParts(referenceDate);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  ) as Partial<Record<"year" | "month" | "day" | "hour" | "minute", string>>;

  const year = values.year ?? String(referenceDate.getFullYear());
  const month = values.month ?? String(referenceDate.getMonth() + 1).padStart(2, "0");
  const day = values.day ?? String(referenceDate.getDate()).padStart(2, "0");
  const hours = Number(values.hour ?? referenceDate.getHours());
  const minutes = Number(values.minute ?? referenceDate.getMinutes());

  return {
    dateOnly: `${year}-${month}-${day}`,
    hours,
    minutes,
    totalMinutes: hours * 60 + minutes,
  };
};

export const getLocalDateOnly = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

