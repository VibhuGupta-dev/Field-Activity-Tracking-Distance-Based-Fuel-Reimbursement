const IST_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});


export function toDateKeyIST(date: Date): string {
  // en-CA locale format hi seedha "YYYY-MM-DD" deta hai
  return IST_FORMATTER.format(date);
}
