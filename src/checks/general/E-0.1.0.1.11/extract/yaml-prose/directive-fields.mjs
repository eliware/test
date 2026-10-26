export function isYamlDirectiveField(field, path) {
  return ["dos", "donts"].includes(field) && path.includes("directives");
}
