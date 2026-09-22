import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";
import { readTrackedPaths } from "../E-1.6/read-tracked-paths.mjs";
import { hasExplicitIgnoreRule, prohibitedTrackedPath } from "./git-ignore-policy.mjs";

export const ruleId = "A-1.22.1";
export const parentRuleId = "E-1.22";
const execFileAsync = promisify(execFile);
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

export async function gitIgnores(root, path, runGit = execFileAsync) {
  try {
    await runGit("git", ["-C", root, "check-ignore", "-q", "--no-index", "--", path.replaceAll("\\", "/")], { windowsHide: true });
    return true;
  } catch (error) {
    if (error?.code === 1) return false;
    return null;
  }
}

export async function run({ root, checkIgnored = gitIgnores, trackedPaths = readTrackedPaths }) {
  let ignoreText;
  try {
    ignoreText = await readFile(join(root, ".gitignore"), "utf8");
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
