import { expect, jest, test } from "@jest/globals";

const readFile = jest.fn();
jest.unstable_mockModule("node:fs/promises", () => ({ readFile }));
const { run, ruleId } = await import("../../../src/checks/shared/E-0.1.0.1.3.mjs");

const packageJson = {
  name: "@eliware/fixture",
  description: "Fixture package.",
  repository: "https://github.com/eliware/fixture",
  eliware: { apply: ["general"] },
};
const generalSections = [
  "Features",
  "Requirements",
  "Setup",
  "Usage",
  "Development",
  "Testing",
  "Troubleshooting",
  "Security",
];
const support = `For help, questions, or to chat with the author and community, visit:\n\n[![Discord](https://eliware.org/logos/discord_96.png)](https://discord.gg/M6aTR9eTwN)[![eliware.org](https://eliware.org/logos/eliware_96.png)](https://discord.gg/M6aTR9eTwN)\n\n**[eliware.org on Discord](https://discord.gg/M6aTR9eTwN)**`;

function createReadme(sections = generalSections) {
  const title =
    "## @eliware/fixture [![License](https://img.shields.io/github/license/eliware/fixture)](https://github.com/eliware/fixture/blob/main/LICENSE) [![CI](https://github.com/eliware/fixture/actions/workflows/ci.yaml/badge.svg)](https://github.com/eliware/fixture/actions/workflows/ci.yaml)";
  const toc = [...sections, "Support", "Links", "License"].map(
    (heading) => `- [${heading}](#${heading.toLowerCase().replaceAll(" ", "-")})`,
  );
  const body = sections.map(
    (heading) =>
      `## ${heading}\n\n${heading === "Features" ? "[Specifications](specs/README.md)" : "Fixture content."}`,
  );
  return [
    "# [![eliware.org](https://eliware.org/logos/brand.png)](https://discord.gg/M6aTR9eTwN)",
    "",
    title,
    "",
    packageJson.description,
    "",
    "## Table of Contents",
    ...toc,
    ...body,
    `## Support\n\n${support}`,
    "## Links",
    "- [Home Page](https://eliware.org)",
    "- [GitHub Org](https://github.com/eliware)",
    "- [GitHub Repo](https://github.com/eliware/fixture)",
    "- [Bug Reports](https://github.com/eliware/fixture/issues)",
    "- [Discord](https://discord.gg/M6aTR9eTwN)",
    "## License",
    "[MIT © Eliware](LICENSE)",
  ].join("\n");
}

const read = async () => createReadme();

test("validates a README that follows the general profile structure", async () => {
  await expect(run({ root: "/repo", packageJson }, { read })).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
});

test("requires the specs index link to resolve in a content section", async () => {
  await expect(
    run(
      { root: "/repo", packageJson },
      {
        read: async (path) => {
          if (path.replaceAll("\\", "/").endsWith("specs/README.md"))
            throw new Error("missing target");
          return createReadme().replace("[Specifications](specs/README.md)", "Text");
        },
      },
    ),
  ).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("must link specs/README.md from a content section"),
  });
  await expect(
    run(
      { root: "/repo", packageJson },
      {
        read: async (path) => {
          if (path.replaceAll("\\", "/").endsWith("specs/README.md"))
            throw new Error("missing target");
          return createReadme();
        },
      },
    ),
  ).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("specs index link must resolve"),
  });
});

test("reports a missing README", async () => {
  await expect(
    run(
      { root: "/missing" },
      {
        read: async () => {
          throw new Error("missing");
        },
      },
    ),
  ).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: "README.md is required.",
  });
});

test("uses default context and reports missing package metadata", async () => {
  await expect(run({ root: "/repo" }, { read })).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: expect.stringContaining("README.md title must match package.json.name."),
  });
});

test("uses default context, dependencies, and file reader", async () => {
  readFile.mockResolvedValue(createReadme());
  await expect(run()).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: expect.stringContaining("README.md title must match package.json.name."),
  });
});

test("requires sections selected by the applied profile", async () => {
  const sections = [...generalSections, "Configuration", "Operations"];
  const incomplete = createReadme(sections)
    .replace("- [Configuration](#configuration)\n", "")
    .replace("## Configuration\n\nFixture content.\n", "");
  await expect(
    run(
      {
        root: "/repo",
        packageJson: { ...packageJson, eliware: { apply: ["general", "application"] } },
      },
      { read: async () => incomplete },
    ),
  ).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: expect.stringContaining("every required section"),
  });
});
