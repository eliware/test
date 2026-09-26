import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";
import { readTrackedPaths } from "../E-0.1.6/read-tracked-paths.mjs";
import { hasExplicitIgnoreRule, prohibitedTrackedPath } from "./git-ignore-policy.mjs";
import { inspectGitIgnorePaths } from "./inspect-git-ignore-paths.mjs";
import { readRepositoryText } from "../../../read-repository-text.mjs";

export const ruleId = "A-0.1.22.1";
export const parentRuleId = "E-0.1.22";
const requiredPaths = new Map([
  ["dependencies", "node_modules/eliware-test"],
  ["vcs state", ".git/config"],
  ["coverage", "coverage/index.html"],
  ["build output", "dist/index.js"],
  ["runtime state", ".cache/test-state"],
  ["secrets", ".env.local"],
  ["secrets", ".env"],
  ["machine-specific files", ".vscode/settings.json"],
  ["machine-specific files", ".idea/workspace.xml"],
]);

export async function run(context) {
  const { root, checkIgnored, checkIgnoredPaths = inspectGitIgnorePaths, trackedPaths = readTrackedPaths } = context;
  let ignoreText;
  try {
    ignoreText = await readRepositoryText(context, join(root, ".gitignore"));
  } catch {
    return fail(ruleId, ".gitignore is required.");
  }
  const missing = [];
  const explicitlyIgnoredPaths = [...requiredPaths.values()].filter((path) => hasExplicitIgnoreRule(ignoreText, path));
  const ignoredPaths = checkIgnored ? null : await checkIgnoredPaths(root, explicitlyIgnoredPaths);
  if (!checkIgnored && ignoredPaths === null)
    return fail(ruleId, "Git ignore inspection was unavailable; cannot validate required ignored paths safely.");
  for (const [category, path] of requiredPaths) {
    if (!hasExplicitIgnoreRule(ignoreText, path)) {
      missing.push(category);
      continue;
    }
    const ignored = checkIgnored ? await checkIgnored(root, path) : ignoredPaths.has(path);
    if (ignored === null) return fail(ruleId, "Git ignore inspection was unavailable; cannot validate required ignored paths safely.");
    if (!ignored) missing.push(category);
  }
  if (missing.length > 0)
    return fail(ruleId, `Required .gitignore paths are not ignored: ${missing.join(", ")}.`);
  const tracked = await trackedPaths(root);
  if (!Array.isArray(tracked)) return fail(ruleId, "Git tracked-file inspection was unavailable; cannot validate prohibited tracked paths safely.");
  const violations = tracked.map((path) => path.replaceAll("\\", "/")).filter(prohibitedTrackedPath);
  if (violations.length > 0) return fail(ruleId, `Prohibited ignored paths are tracked: ${violations.join(", ")}.`);
  return pass(ruleId);
}
