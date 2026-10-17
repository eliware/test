import { expect, test } from "@jest/globals";
import { validateCiWorkflowAccess } from "../../../../../../src/checks/shared/E-0.1.0.1.7/validate/ci-workflow/access.mjs";

test("accepts read-only permissions and no inherited environment", () => {
  expect(
    validateCiWorkflowAccess(
      { permissions: { contents: "read" } },
      { permissions: { contents: "read" } },
    ),
  ).toEqual([]);
});

test("rejects wider permissions and inherited values", () => {
  expect(
    validateCiWorkflowAccess(
      {
        permissions: { contents: "write" },
        env: { TOKEN: "value" },
        defaults: { run: { shell: "bash" } },
      },
      { permissions: { contents: "write" }, env: { MODE: "test" } },
    ),
  ).toEqual(
    expect.arrayContaining([
      "ci.yaml workflow permissions must contain only contents: read.",
      "ci.yaml must not define inherited workflow environment values.",
      "ci.yaml validation job permissions must contain only contents: read.",
      "ci.yaml validation job must not define inherited environment values.",
      "ci.yaml must not set inherited shell or working-directory overrides.",
    ]),
  );
});
