import { expect, test } from "@jest/globals";
import { validateApplicationReadmeContent } from "../../../../src/checks/application/E-0.1.130/validate-application-readme-content.mjs";

test("requires runtime settings or an explicit no-configuration statement and operations", () => {
  const readme =
    "## Configuration\nNo runtime configuration exists.\n## Operations\nStartup and shutdown workflows observe operational boundaries.";
  expect(validateApplicationReadmeContent(readme)).toBeNull();
  expect(validateApplicationReadmeContent("## Configuration\nText\n## Operations\nText")).toContain(
    "runtime settings and defaults, startup, shutdown",
  );
});
