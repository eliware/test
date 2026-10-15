import { expect, test } from "@jest/globals";
import { validateProfileDocumentation } from "../../../../src/validation/shared/conventions/validate-profile-documentation.mjs";

const order = {
  "agents-sections.yaml": {
    profileHeadings: {
      web: "Web",
      private: "Private distribution",
      application: "Application",
      library: "Library",
    },
  },
  "readme-sections.yaml": { profileSections: { web: ["Routes", "Build"], private: [] } },
};

function inventory(files) {
  return { readText: async (path) => files[path] };
}

test("checks the selected profile document headings", async () => {
  const files = inventory({
    "AGENTS.md": "## Web",
    "README.md": "## Routes\n## Build",
  });
  await expect(validateProfileDocumentation("web", files, (name) => order[name])).resolves.toEqual(
    [],
  );
});

test("checks focused test guidance only for application and library", async () => {
  const guidance = [
    "For a small change, run one or more focused tests.",
    "Run one test file with `npm test -- tests/path/to/example.test.mjs`.",
    "Run multiple test files with `npm test -- tests/path/to/first.test.mjs tests/path/to/second.test.mjs`.",
    "Run the full `npm test` suite before a commit or milestone.",
  ].join("\n");
  const readOrder = (name) => order[name];

  await expect(
    validateProfileDocumentation(
      "application",
      inventory({ "AGENTS.md": `## Application\n${guidance}\n## CLI` }),
      readOrder,
    ),
  ).resolves.toEqual([]);
  await expect(
    validateProfileDocumentation(
      "web",
      inventory({ "AGENTS.md": "## Web", "README.md": "## Routes\n## Build" }),
      readOrder,
    ),
  ).resolves.toEqual([]);
});

test("reports missing documents and profile headings", async () => {
  const files = inventory({ "AGENTS.md": "## Other", "README.md": "## Routes" });
  await expect(validateProfileDocumentation("web", files, (name) => order[name])).resolves.toEqual([
    "AGENTS.md must include: ## Web",
    "README.md must include: ## Build",
  ]);
});

test("checks only the AGENTS heading when a profile has no README sections", async () => {
  await expect(
    validateProfileDocumentation(
      "private",
      inventory({ "AGENTS.md": "## Private distribution" }),
      (name) => order[name],
    ),
  ).resolves.toEqual([]);
});

test("reports unavailable inventory and document reads", async () => {
  await expect(validateProfileDocumentation("web")).resolves.toEqual([
    "Repository documents could not be inspected.",
  ]);
  await expect(validateProfileDocumentation("web", {})).resolves.toEqual([
    "Repository documents could not be inspected.",
  ]);
  const files = inventory({ "AGENTS.md": "" });
  await expect(
    validateProfileDocumentation("web", files, (name) => order[name]),
  ).resolves.toContain(
    "README.md could not be read: Cannot read properties of undefined (reading 'split')",
  );
  const denied = { readText: async () => Promise.reject(new Error("denied")) };
  await expect(
    validateProfileDocumentation("web", denied, (name) => order[name]),
  ).resolves.toContain("AGENTS.md could not be read: denied");
  const unusedOrder = {
    "agents-sections.yaml": { profileHeadings: { unused: "Unused" } },
    "readme-sections.yaml": { profileSections: {} },
  };
  await expect(
    validateProfileDocumentation(
      "unused",
      inventory({ "AGENTS.md": "## Unused" }),
      (name) => unusedOrder[name],
    ),
  ).resolves.toEqual([]);
});
