const draft = "https://json-schema.org/draft/2020-12/schema";
const documentRequired = ["version", "description", "directives"];
const directiveRequired = ["id", "dos", "donts"];
const documentProperties = ["version", "description", "requires", "directives"];
const directiveProperties = ["id", "dos", "donts", "examples", "children"];

export function validateV12DirectiveSchema(schema) {
  const document = schema?.$defs?.document;
  const directive = schema?.$defs?.directive;
  const valid = [
    schema?.$schema === draft,
    schema?.$ref === "#/$defs/document",
    validDefinition(document, documentRequired, documentProperties),
    validDefinition(directive, directiveRequired, directiveProperties),
  ];
  return valid.every(Boolean)
    ? []
    : ["specs/directives-schema.yaml must define the v12 document and directive schema."];
}

function validDefinition(definition, required, properties) {
  const validType = definition?.type === "object";
  const rejectsExtras = definition?.additionalProperties === false;
  const hasRequired = required.every((key) => definition?.required?.includes(key));
  const hasProperties = properties.every((key) => Object.hasOwn(definition?.properties ?? {}, key));
  return validType && rejectsExtras && hasRequired && hasProperties;
}
