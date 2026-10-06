import { expect, test } from "@jest/globals";
import { validateSpecificationIds } from "../../../../src/checks/general/E-0.1.0.1.4/validate-specification-ids.mjs";

test("accepts sequential rule trees in the assigned namespace", () => {
  expect(
    validateSpecificationIds(
      [
        {
          path: "rules.yaml",
          directives: [
            { id: "E-0.1.0", children: [{ id: "E-0.1.0.0" }, { id: "E-0.1.0.1" }] },
            { id: "E-0.1.1" },
          ],
        },
      ],
      "E-0",
    ),
  ).toEqual([]);
});

test("reports duplicates, wrong namespace, and gaps", () => {
  const directives = [
    null,
    { id: "bad" },
    { id: "E-0.1" },
    { id: "E-0.3" },
    { id: "E-1.0" },
    { id: "E-0.1" },
  ];
  const errors = validateSpecificationIds([{ path: "rules.yaml", directives }], "E-0").join(" ");
  expect(errors).toContain("Duplicate");
  expect(errors).toContain("assigned E-0");
  expect(errors).toContain("sequential");
});

test("rejects child IDs outside their parent prefix", () => {
  const directives = [{ id: "E-0.1", children: [{ id: "E-0.2.0" }] }];
  expect(validateSpecificationIds([{ path: "rules.yaml", directives }], "E-0").join(" ")).toContain(
    "extend parent",
  );
  const deep = [{ id: "E-0.1", children: [{ id: "E-0.1.0.0" }] }];
  expect(
    validateSpecificationIds([{ path: "rules.yaml", directives: deep }], "E-0").join(" "),
  ).toContain("extend parent");
});
