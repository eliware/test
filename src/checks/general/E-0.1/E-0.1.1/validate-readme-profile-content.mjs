import { readSection } from "./read-readme-section.mjs";

export function validateReadmeProfileContent(readme, packageJson = {}) {
  const section = (heading) => readSection(readme, heading);
  const missing = [];
  const applied = new Set(packageJson?.eliware?.apply ?? []);

  if (applied.has("application")) {
    requireGroups(
      section("Configuration"),
      [
        ["runtime", "configuration"],
        ["default", "none", "no runtime", "missing or blank"],
      ],
      "Configuration",
      missing,
    );
    requireGroups(
      section("Operations"),
      [
        ["startup", "start"],
        ["shutdown", "stop"],
        ["workflow"],
        ["boundary", "boundaries", "read-only", "does not deploy", "does not publish"],
      ],
      "Operations",
      missing,
    );
  }

  if (applied.has("cli")) {
    requireGroups(
      `${section("Setup")}\n${section("Commands")}`,
      [["install"]],
      "Commands",
      missing,
    );
    requireGroups(
      section("Commands"),
      [
        ["command"],
        ["--help"],
        ["--version"],
        ["platform", "windows", "macos", "linux", "ubuntu"],
        ["example"],
        ["dry-run", "confirm", "read-only", "does not publish"],
      ],
      "Commands",
      missing,
    );
    requireGroups(
      section("Exit codes"),
      [["exit code", "exit with", "exit status"], [/\b0\b/u], ["success"], ["failure", "error"]],
      "Exit codes",
      missing,
    );
  }

  if (applied.has("npm-published")) {
    requireGroups(section("Setup"), [["npm install", "npm i"]], "Setup", missing);
    requireGroups(
      `${section("Usage")}\n${applied.has("cli") ? section("Commands") : ""}`,
      [["entrypoint", "bin/"], ["version"], ["release", "publish"]],
      "Usage",
      missing,
    );
  }

  return missing.length > 0
    ? `README.md applied-profile sections are missing required content: ${missing.join(", ")}.`
    : null;
}

function requireGroups(content, groups, section, missing) {
  groups.forEach((alternatives, index) => {
    if (
      !alternatives.some((term) =>
        term instanceof RegExp ? term.test(content) : content.includes(term),
      )
    ) {
      missing.push(`${section} requirement ${index + 1}`);
    }
  });
}
