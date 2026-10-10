export function isHolidays(): boolean {
  const now = new Date();
  const year = now.getFullYear();

  const startOfYear = new Date(year, 0, 16); // 16 jan
  const endOfYear = new Date(year, 11, 15); // 15 dec

  return now < startOfYear || now >= endOfYear;
}
