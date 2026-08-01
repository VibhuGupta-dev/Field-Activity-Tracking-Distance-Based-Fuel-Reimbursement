const IST_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * Assumption (documented in README): associate ka "working day" IST calendar
 * day ke hisaab se define hota hai, chahe server kahin bhi deployed ho
 * (Vercel edge functions ka default timezone UTC hota hai). Isse "Start Day"
 * raat 11:50 PM IST pe ho aur "End Day" 12:10 AM ko, tab bhi dono ek hi
 * dateKey ("in-progress" logic ke through) ya alag dateKey mein aa sakte
 * hain — dateKey hamesha startTimestamp se derive hota hai, isliye session
 * apne pure lifecycle mein ek hi dateKey rakhta hai chahe wo midnight cross
 * kare.
 */
export function toDateKeyIST(date: Date): string {
  // en-CA locale format hi seedha "YYYY-MM-DD" deta hai
  return IST_FORMATTER.format(date);
}
