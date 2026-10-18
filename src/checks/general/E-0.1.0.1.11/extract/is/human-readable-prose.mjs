import { countWords } from "../../word-tools.mjs";
import { isSqlStatement } from "./sql/statement.mjs";

const commandStart = /^(?:npm|node|git|gh|npx|yarn|pnpm|powershell|pwsh)\s/iu;

export function isHumanReadableProse(value) {
  const text = value.trim();
  return (
    /\s/u.test(text) && countWords(text) > 1 && !commandStart.test(text) && !isSqlStatement(text)
  );
}
