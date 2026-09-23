import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const conventionSpecs = resolve(
  process.argv[2] ?? join(repositoryRoot, "..", "conventions", "specs"),
);
const outputPath = join(repositoryRoot, "specs", "convention-remediation.json");
const packageJson = JSON.parse(await readFile(join(repositoryRoot, "package.json"), "utf8"));
const expectedVersion = packageJson.version.split(".").slice(0, 2).join(".");

async function collectCheckIds(directory) {
  const ids = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      ids.push(...(await collectCheckIds(path)));
    } else if (/^[EA]-\d+(?:\.\d+)*\.mjs$/u.test(entry.name)) {
      ids.push(entry.name.slice(0, -4));
    }
  }
  return ids;
}

function collectDirectives(value, records, source) {
  if (!value || typeof value !== "object") return;
  if (typeof value.id === "string" && Array.isArray(value.dos)) {
    if (records.has(value.id)) throw new Error(`Duplicate convention directive ID: ${value.id}.`);
    records.set(value.id, { source, dos: value.dos });
  }
  for (const child of Object.values(value)) {
    if (Array.isArray(child)) child.forEach((entry) => collectDirectives(entry, records, source));
    else if (child && typeof child === "object") collectDirectives(child, records, source);
  }
}

const checkIds = await collectCheckIds(join(repositoryRoot, "src", "checks"));
const directives = new Map();
let version;
for (const name of (await readdir(conventionSpecs))
  .filter((entry) => entry.endsWith(".json") && entry !== "authority-map.json")
  .sort()) {
  const document = JSON.parse(await readFile(join(conventionSpecs, name), "utf8"));
  if (version !== undefined && document.version !== version)
    throw new Error("Convention spec versions do not agree.");
  version = document.version;
  collectDirectives(document, directives, name);
}
if (version !== expectedVersion) {
  throw new Error(`Convention specs are v${version}; this package bundles v${expectedVersion}.`);
}

const missing = checkIds.filter((id) => !directives.has(id) || directives.get(id).dos.length === 0);
if (missing.length > 0)
  throw new Error(`Convention checks lack remediation guidance: ${missing.join(", ")}.`);

const checks = Object.fromEntries(checkIds.sort().map((id) => [id, directives.get(id)]));
await writeFile(outputPath, `${JSON.stringify({ version, checks }, null, 2)}\n`, "utf8");
console.log(`Wrote remediation guidance for ${checkIds.length} checks to ${outputPath}.`);
