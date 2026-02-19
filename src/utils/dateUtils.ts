/**
 * Parse une date au format DD-MM-YYYY (avec tirets, tirets longs, ou slashs)
 * et retourne un timestamp en millisecondes.
 */
export const parseDate = (dateStr: string): number => {
  const dmyMatch = dateStr.match(
    /^(\d{1,2})[\u2212\-\u2013/](\d{1,2})[\u2212\-\u2013/](\d{4})$/,
  );
  if (dmyMatch) {
    return new Date(
      `${dmyMatch[3]}-${dmyMatch[2].padStart(2, "0")}-${dmyMatch[1].padStart(2, "0")}`,
    ).getTime();
  }
  return new Date(dateStr).getTime();
};

/**
 * Tri par date décroissante (plus récent en premier)
 */
export const sortByDateDesc = <T extends { date: string }>(items: T[]): T[] =>
  [...items].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
