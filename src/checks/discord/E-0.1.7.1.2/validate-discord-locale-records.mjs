import { supportedDiscordLocales } from "./supported-discord-locales.mjs";

const localeDirectory = "locales";

export async function validateDiscordLocaleRecords(files, inventory) {
  const names = files
    .filter((path) => path.startsWith(`${localeDirectory}/`) && path.endsWith(".json"))
    .map((path) => path.slice(localeDirectory.length + 1, -5))
    .filter((name) => !name.includes("/"));
  const errors = supportedDiscordLocales
    .filter((locale) => !names.includes(locale))
    .map((locale) => `locales/${locale}.json is required.`);
  errors.push(
    ...names
      .filter((locale) => !supportedDiscordLocales.includes(locale))
      .map((locale) => `locales/${locale}.json uses an unsupported locale.`),
  );
  const base = await readLocale(inventory, "en-US");
  if (!base.valid) errors.push("locales/en-US.json must contain a JSON object.");
  for (const locale of names) {
    const record = await readLocale(inventory, locale);
    if (!record.valid) {
      errors.push(`locales/${locale}.json must contain a JSON object.`);
    } else if (locale !== "en-US" && !sameKeys(base.keys, record.keys)) {
      errors.push(`locales/${locale}.json keys must match locales/en-US.json.`);
    }
  }
  return errors;
}

async function readLocale(inventory, locale) {
  try {
    const value = JSON.parse(await inventory.readText(`${localeDirectory}/${locale}.json`));
    return value && typeof value === "object" && !Array.isArray(value)
      ? { valid: true, keys: Object.keys(value).sort() }
      : { valid: false, keys: [] };
  } catch {
    return { valid: false, keys: [] };
  }
}

function sameKeys(left, right) {
  return left.length === right.length && left.every((key, index) => key === right[index]);
}
