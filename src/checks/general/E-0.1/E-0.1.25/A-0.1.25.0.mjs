import { readdir } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";
import { readRepositoryText } from "../../../read-repository-text.mjs";
import { findRepositoryEntries } from "../find-repository-files.mjs";

export const ruleId = "A-0.1.25.0";
export const parentRuleId = "E-0.1.25";

function indexTargets(content) {
  return [...content.matchAll(/\[[^\]]+\]\(([^)]+)\)/gu)].map(([, target]) => target);
}

function isNavigationOnly(content) {
  return content
    .split(/\r?\n/u)
    .every(
      (line) =>
        !line.trim() || /^#{1,6}\s/u.test(line) || /^-\s*\[[^\]]+\]\([^)]+\)\s*$/u.test(line),
    );
}

export async function run(context) {
  const { root } = context;
  const failures = [];
  let entries;
  try {
    entries = context.repositoryInventory
      ? await context.repositoryInventory.entriesUnder(join(root, "specs"))
      : await findRepositoryEntries(root, readdir, { scopeDirectory: "specs" });
  } catch {
    return fail(ruleId, "specs/ is required to contain indexed YAML specifications.");
  }

  const directories = [
    ...new Set([
      "specs",
      ...entries.filter(({ type }) => type === "directory").map(({ path }) => path),
    ]),
  ];
  const files = entries.filter(({ type }) => type === "file").map(({ path }) => path);
  if (!files.includes("specs/directives.yaml")) failures.push("specs/directives.yaml is required.");
  for (const directory of directories) {
    const localFiles = files.filter((file) => dirname(file) === directory);
    const localDirectories = directories.filter(
      (child) => child !== directory && dirname(child) === directory,
    );
    const localYaml = localFiles.filter((file) => file.endsWith(".yaml"));
    const indexPath = join(root, directory, "README.md");
    let index;
    try {
      index = await readRepositoryText(context, indexPath);
    } catch {
      failures.push(`${directory}/README.md is required to index its specifications.`);
      continue;
    }
    if (localYaml.length === 0)
      failures.push(`${directory} must contain at least one YAML specification.`);
    const expectedTargets = [
      ...localYaml.map((file) => basename(file)),
      ...localDirectories.map((child) => `${basename(child)}/README.md`),
    ];
    if (!isNavigationOnly(index))
      failures.push(`${directory}/README.md must be a navigation-only index.`);
    const targets = indexTargets(index);
    for (const target of expectedTargets) {
      if (!targets.includes(target)) failures.push(`${directory}/README.md must link ${target}.`);
    }
    for (const target of targets) {
      if (!expectedTargets.includes(target))
        failures.push(`${directory}/README.md links to unexpected target ${target}.`);
    }
    for (const file of localFiles) {
      if (!file.endsWith(".yaml") && basename(file) !== "README.md")
        failures.push(`${file} is not an allowed specs file; use an indexed YAML document.`);
    }
  }
  return failures.length ? fail(ruleId, failures.join("\n")) : pass(ruleId);
}
