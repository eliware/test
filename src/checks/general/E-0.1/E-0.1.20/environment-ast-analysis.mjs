import { collectEnvironmentBindings } from "./collect-environment-bindings.mjs";
import { collectEnvironmentMember } from "./collect-environment-members.mjs";

export function collectEnvironmentReferences(node, aliases, variables) {
  if (!node || typeof node !== "object") return;
  collectEnvironmentBindings(node, aliases, variables);
  collectEnvironmentMember(node, aliases, variables);
  for (const [key, value] of Object.entries(node)) {
    if (key === "loc" || key === "start" || key === "end") continue;
    if (Array.isArray(value)) value.forEach((child) => collectEnvironmentReferences(child, aliases, variables));
    else if (value && typeof value === "object") collectEnvironmentReferences(value, aliases, variables);
  }
}
