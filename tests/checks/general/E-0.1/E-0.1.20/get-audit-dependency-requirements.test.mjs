import { expect, test } from "@jest/globals";
import { getAuditDependencyRequirements } from "../../../../../src/checks/general/E-0.1/E-0.1.20/get-audit-dependency-requirements.mjs";

test("counts declared audit dependencies by npm metadata category", () => {
  expect(
    getAuditDependencyRequirements({
      dependencies: { production: "1" },
      devDependencies: { development: "1", shared: "1" },
      optionalDependencies: { optional: "1" },
      peerDependencies: { peer: "1" },
      bundleDependencies: ["bundled"],
    }),
  ).toEqual({
    minimumDependencyCount: 6,
    categories: { prod: 1, dev: 2, optional: 1 },
  });
});

test("supports packages with no declared dependencies", () => {
  expect(getAuditDependencyRequirements({})).toEqual({
    minimumDependencyCount: 0,
    categories: {},
  });
});
