import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";
import { hasExplicitIgnoreRule } from "./git-ignore-policy.mjs";
import { isIgnoredByRepositoryRules } from "../check-repository-ignore.mjs";
import { readRepositoryText } from "../../../read-repository-text.mjs";
import { readIgnoredTrackedPaths } from "./read-ignored-tracked-paths.mjs";

export const ruleId = "A-0.1.22.1";
export const parentRuleId = "E-0.1.22";
const requiredPaths = new Map([
  ["dependencies", "node_modules/eliware-test"],
  ["vcs state", ".git/config"],
  ["coverage", "coverage/index.html"],
  ["build output", "dist/index.js"],
  ["runtime state", ".cache/test-state"],
  ["generated artifacts", "artifacts/screenshot.png"],
  ["secrets", ".env.local"],
  ["secrets", ".env"],
  ["machine-specific files", ".vscode/settings.json"],
  ["machine-specific files", ".idea/workspace.xml"],
]);

export async function run(context) {
  const {
    root,
    checkIgnored = isIgnoredByRepositoryRules,
    readIgnoredPaths = readIgnoredTrackedPaths,
  } = context;
  let ignoreText;
  try {
    ignoreText = await readRepositoryText(context, join(root, ".gitignore"));
  } catch {
    return fail(ruleId, ".gitignore is required.");
  }
  const missing = [];
  for (const [category, path] of requiredPaths) {
    if (!hasExplicitIgnoreRule(ignoreText, path)) {
      missing.push(category);
      continue;
    }
    const ignored = await checkIgnored(root, path);
    if (!ignored) missing.push(category);
  }
  if (missing.length > 0)
    return fail(ruleId, `Required .gitignore paths are not ignored: ${missing.join(", ")}.`);
  const ignoredTrackedPaths = await readIgnoredPaths(root);
  if (ignoredTrackedPaths === null || !Array.isArray(ignoredTrackedPaths))
    return fail(
      ruleId,
      "Git index inspection was unavailable; cannot verify ignored tracked files.",
    );
  if (ignoredTrackedPaths.length > 0)
    return fail(
      ruleId,
      `Tracked or staged files match ignore rules: ${ignoredTrackedPaths.join(", ")}.`,
    );
  return pass(ruleId);
}
