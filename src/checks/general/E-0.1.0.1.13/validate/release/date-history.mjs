import { isValidReleaseDate } from "./notes/version/order.mjs";

export function validateReleaseDateHistory(dates) {
  const errors = dates.flatMap((date) =>
    isValidReleaseDate(date) ? [] : [`Release date is invalid: ${date}.`],
  );
  for (let index = 1; index < dates.length; index++)
    if (dates[index - 1] < dates[index]) errors.push("Release dates must not increase.");
  return errors;
}
