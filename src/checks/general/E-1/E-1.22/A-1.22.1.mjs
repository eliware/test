import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";
import { readTrackedPaths } from "../E-1.6/read-tracked-paths.mjs";

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
  ["machine-specific files", ".vscode/settings.json"],
]);

export async function gitIgnores(root, path) {
  try {
    await execFileAsync("git", ["-C", root, "check-ignore", "-q", "--no-index", "--", path], { windowsHide: true });
    return true;
  } catch {
    return false;
  }
}

function prohibitedTrackedPath(path) {
  const normalized = path.replaceAll("\\", "/").toLowerCase();
  return normalized === ".env" || normalized.startsWith(".env/") || (normalized.startsWith(".env.") && normalized !== ".env.example") ||
    normalized.includes("node_modules/") || normalized.startsWith("coverage/") || normalized.startsWith("dist/") ||
    normalized.startsWith("build/") || normalized.startsWith(".cache/") || normalized.startsWith(".vscode/") ||
    normalized.startsWith(".idea/") || normalized.endsWith(".pem") || normalized.endsWith(".key");
}

export async function run({ root, checkIgnored = gitIgnores, trackedPaths = readTrackedPaths }) {
  try {
    await readFile(join(root, ".gitignore"), "utf8");
  } catch {
    return fail(ruleId, ".gitignore is required.");
  }
  const missing = [];
  for (const [category, path] of requiredPaths) if (!(await checkIgnored(root, path))) missing.push(category);
  if (missing.length > 0)
    return fail(ruleId, `Required .gitignore paths are not ignored: ${missing.join(", ")}.`);
  const tracked = await trackedPaths(root);
  const violations = (tracked ?? []).filter(prohibitedTrackedPath);
  if (violations.length > 0) return fail(ruleId, `Prohibited ignored paths are tracked: ${violations.join(", ")}.`);
  return pass(ruleId);
}
