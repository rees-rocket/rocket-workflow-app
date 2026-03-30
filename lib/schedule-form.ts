export type TimeOption = {
  value: string;
  label: string;
};

export function getHalfHourOptions(): TimeOption[] {
  const options: TimeOption[] = [];

  for (let hour = 0; hour < 24; hour += 1) {
    for (const minute of [0, 30]) {
      const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      const suffix = hour < 12 ? "AM" : "PM";
      const minuteLabel = minute === 0 ? "00" : "30";
      options.push({ value, label: `${displayHour}:${minuteLabel} ${suffix}` });
    }
  }

  return options;
}

export function getTimeValueFromIso(value: string | null | undefined) {
  if (!value) {
    return "09:00";
  }

  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
