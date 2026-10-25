import { expect, test } from "@jest/globals";
import { canonicalOrderRequirements } from "../../../../../src/validation/shared/conventions/canonical-order-requirements.mjs";
import { validateCanonicalOrderDocument } from "../../../../../src/validation/shared/conventions/validate/canonical-order-document.mjs";

function valueFor(type) {
  if (type === "text") return "value";
  if (type === "number") return 1;
  if (type === "number-map") return { value: 1 };
  if (type === "text-map") return { value: "value" };
  if (type === "text-list-map") return { value: ["value"] };
  if (type === "object-map") return { value: {} };
  if (type === "object") return {};
  return ["value"];
}

function validDocument(name) {
  const contract = canonicalOrderRequirements[name];
  const orders = Object.fromEntries(
    Object.entries(contract.fields).map(([field, type]) => [field, valueFor(type)]),
  );
  for (const [field, keys] of Object.entries(contract.maps ?? {})) {
    const type = contract.fields[field];
    orders[field] = Object.fromEntries(keys.map((key) => [key, valueFor(type.slice(0, -4))]));
  }
  for (const [field, entries] of Object.entries(contract.nestedMaps ?? {})) {
    orders[field] ??= {};
    for (const [entry, keys] of Object.entries(entries)) {
      orders[field][entry] ??= {};
      for (const key of keys) orders[field][entry][key] = ["value"];
    }
  }
  for (const [field, entries] of Object.entries(contract.nestedValues ?? {})) {
    orders[field] ??= {};
    for (const [entry, values] of Object.entries(entries)) orders[field][entry] = { ...values };
  }
  return { orders };
}

test("accepts every canonical ordering document", () => {
  for (const name of Object.keys(canonicalOrderRequirements)) {
    expect(validateCanonicalOrderDocument(validDocument(name), name)).toEqual([]);
  }
});

test("requires npm-published package files and required profile headings", () => {
  const packageOrder = validDocument("package-files.yaml");
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

test("requires profile policy fields and types in the ordering schema", () => {
  const requirements = canonicalOrderRequirements["ordering-data-schema.yaml"];
  expect(requirements.maps.requiredFields).toContain("profile-combinations.yaml");
  expect(requirements.maps.requiredTypes).toContain("profile-combinations.yaml");
});

test("requires the declared profile policy type fields and exact list schemas", () => {
  const schema = validDocument("ordering-data-schema.yaml");
  delete schema.orders.requiredTypes["profile-combinations.yaml"]["profiles.*.requires"];
  schema.orders.requiredTypes["profile-combinations.yaml"].prohibits = "text";

  expect(validateCanonicalOrderDocument(schema, "ordering-data-schema.yaml")).toEqual(
    expect.arrayContaining([
      "ordering-data-schema.yaml.orders.requiredTypes.profile-combinations.yaml.profiles.*.requires is required.",
      "ordering-data-schema.yaml.orders.requiredTypes.profile-combinations.yaml.prohibits is not supported.",
      "ordering-data-schema.yaml.orders.requiredTypes.profile-combinations.yaml.profiles.*.requires must equal profile-name-list.",
    ]),
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

test("rejects undeclared entries in canonical ordering maps", () => {
  const agents = validDocument("agents-sections.yaml");
  agents.orders.profileHeadings.extra = "Extra";
  expect(validateCanonicalOrderDocument(agents, "agents-sections.yaml")).toContain(
    "agents-sections.yaml.orders.profileHeadings.extra is not supported.",
  );

  const readme = validDocument("readme-sections.yaml");
  readme.orders.sharedSections.Commands.extra = ["web"];
  expect(validateCanonicalOrderDocument(readme, "readme-sections.yaml")).toContain(
    "readme-sections.yaml.orders.sharedSections.Commands.extra is not supported.",
  );
});

test("rejects unsupported field type declarations", () => {
  canonicalOrderRequirements["temporary.yaml"] = { fields: { value: "unsupported" } };
  expect(validateCanonicalOrderDocument({ orders: { value: "text" } }, "temporary.yaml")).toEqual([
    "temporary.yaml.orders.value must be unsupported.",
  ]);
  delete canonicalOrderRequirements["temporary.yaml"];
});
