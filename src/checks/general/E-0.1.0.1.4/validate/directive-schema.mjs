const expectedSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $ref: "#/$defs/document",
  $defs: {
    document: {
      type: "object",
      required: ["version", "description", "directives"],
      properties: {
        version: { type: "string", minLength: 1, pattern: "\\S" },
        description: { type: "string", minLength: 1, pattern: "\\S" },
        directives: { type: "array", minItems: 1, items: { $ref: "#/$defs/directive" } },
      },
      additionalProperties: false,
    },
    directive: {
      type: "object",
      required: ["id", "dos", "donts"],
      properties: {
        id: { type: "string", pattern: "^E-[0-9]+(?:\\.[0-9]+)*$" },
        dos: {
          type: "array",
          minItems: 1,
          items: { type: "string", minLength: 1, pattern: "\\S" },
        },
        donts: {
          type: "array",
          minItems: 1,
          items: { type: "string", minLength: 1, pattern: "\\S" },
        },
        examples: {
          type: "array",
          minItems: 1,
          items: { type: "string", minLength: 1, pattern: "\\S" },
        },
        children: { type: "array", minItems: 1, items: { $ref: "#/$defs/directive" } },
      },
      additionalProperties: false,
    },
  },
};

export function validateDirectiveSchema(schema) {
  return matchesSchema(schema, expectedSchema)
    ? []
    : ["specs/directives-schema.yaml must define the document and directive schema."];
}

function matchesSchema(actual, expected) {
  if (Array.isArray(expected))
    return (
      Array.isArray(actual) &&
      actual.length === expected.length &&
      expected.every((value, index) => matchesSchema(actual[index], value))
    );
  if (expected && typeof expected === "object")
    return (
      actual &&
      typeof actual === "object" &&
      !Array.isArray(actual) &&
      Object.keys(actual).length === Object.keys(expected).length &&
      Object.entries(expected).every(([key, value]) => matchesSchema(actual[key], value))
    );
  return actual === expected;
}
