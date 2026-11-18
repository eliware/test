import { resolve } from "node:path";
import readRepositoryText from "../repository-text.mjs";
const parsedByContext = new WeakMap();
async function readRepositoryParsed(context, filePath, cacheKey, parse) {
  if (context?.repositoryInventory?.readParsed)
    return context.repositoryInventory.readParsed(filePath, cacheKey, parse);
  const text = await readRepositoryText(context, filePath);
  if (!context || typeof context !== "object") return parse(text);
  let parsed = parsedByContext.get(context);
  if (!parsed) {
    parsed = new Map();
    parsedByContext.set(context, parsed);
  }
  const key = `${resolve(filePath)}\0${cacheKey}`;
  if (!parsed.has(key)) parsed.set(key, parse(text));
  return parsed.get(key);
}
export default readRepositoryParsed;
