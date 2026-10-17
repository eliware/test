import { expect, test } from "@jest/globals";
import { validateSpecificationIndex } from "../../../../../../src/checks/general/E-0.1.0.1.4/validate/specification/index-directory.mjs";

const order = {
  directYamlFiles: "filename-ascending",
  subdirectoryIndexes: "directory-name-ascending",
  placement: "after-yaml-files",
};

test("validates one complete specification index", async () => {
  const files = [
    { path: "specs/rules.yaml", type: "file" },
    { path: "specs/README.md", type: "file" },
    { path: "specs/directives.yaml", type: "file" },
  ];
  await expect(
    validateSpecificationIndex("/repo", "specs", {
      files,
      children: ["specs/nested"],
      order,
      read: async () =>
        "- [Directives](directives.yaml)\n- [Rules](rules.yaml)\n- [Nested](nested/README.md)",
    }),
  ).resolves.toEqual([]);
});
