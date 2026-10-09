import { readFileSync } from "node:fs";
import { expect, test } from "@jest/globals";
import { parse } from "yaml";
import { canonicalOrderRequirements } from "../../../../src/validation/shared/conventions/canonical-order-requirements.mjs";
import { validateCanonicalOrderDocument } from "../../../../src/validation/shared/conventions/validate-canonical-order-document.mjs";

test("accepts every canonical ordering document", () => {
  for (const name of Object.keys(canonicalOrderRequirements)) {
    const url = new URL(`../../../../specs/conventions/ordering/${name}`, import.meta.url);
    expect(validateCanonicalOrderDocument(parse(readFileSync(url, "utf8")), name)).toEqual([]);
  }
});

test("requires npm-published package files and required profile headings", () => {
  const packageUrl = new URL(
    "../../../../specs/conventions/ordering/package-files.yaml",
    import.meta.url,
  );
  const packageOrder = parse(readFileSync(packageUrl, "utf8"));
  delete packageOrder.orders.profileEntries["npm-published"];
  expect(validateCanonicalOrderDocument(packageOrder, "package-files.yaml")).toContain(
    "package-files.yaml.orders.profileEntries.npm-published is required.",
  );

  const agents = {
    orders: {
      baseSections: ["Project"],
      profileOrder: ["web"],
      profileHeadings: { web: "Web" },
    },
  };
  expect(validateCanonicalOrderDocument(agents, "agents-sections.yaml")).toContain(
    "agents-sections.yaml.orders.profileHeadings.application is required.",
  );
});

test("rejects incorrect order field types and checks required nested values", () => {
  expect(
    validateCanonicalOrderDocument({ orders: { profiles: ["general", 4] } }, "eliware-apply.yaml"),
  ).toContain("eliware-apply.yaml.orders.profiles must be text-list.");
  expect(
    validateCanonicalOrderDocument(
      { orders: { sharedSections: { Commands: {} } } },
      "readme-sections.yaml",
    ),
  ).toContain("readme-sections.yaml.orders.sharedSections.Commands.profiles is required.");
  expect(validateCanonicalOrderDocument({}, "unknown.yaml")).toEqual([]);
});

test("reports missing order objects and malformed required maps", () => {
  expect(validateCanonicalOrderDocument({}, "eliware-apply.yaml")).toContain(
    "eliware-apply.yaml.orders.profiles is required.",
  );
  expect(
    validateCanonicalOrderDocument({ orders: { profileHeadings: null } }, "agents-sections.yaml"),
  ).toContain("agents-sections.yaml.orders.profileHeadings.application is required.");
  expect(
    validateCanonicalOrderDocument({ orders: { sharedSections: {} } }, "readme-sections.yaml"),
  ).toContain("readme-sections.yaml.orders.sharedSections.Commands.profiles is required.");
  expect(
    validateCanonicalOrderDocument(
      { orders: { sharedSections: { Commands: { profiles: 42 } } } },
      "readme-sections.yaml",
    ),
  ).toContain(
    "readme-sections.yaml.orders.sharedSections.Commands.profiles must be nonempty-text-list.",
  );
  expect(
    validateCanonicalOrderDocument(
      { orders: { sharedSections: { Commands: { profiles: [] } } } },
      "readme-sections.yaml",
    ),
  ).toContain(
    "readme-sections.yaml.orders.sharedSections.Commands.profiles must be nonempty-text-list.",
  );
});

test("rejects unsupported field type declarations", () => {
  canonicalOrderRequirements["temporary.yaml"] = { fields: { value: "unsupported" } };
  expect(validateCanonicalOrderDocument({ orders: { value: "text" } }, "temporary.yaml")).toEqual([
    "temporary.yaml.orders.value must be unsupported.",
  ]);
  delete canonicalOrderRequirements["temporary.yaml"];
});
