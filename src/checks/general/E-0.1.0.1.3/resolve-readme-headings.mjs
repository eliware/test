import { readCanonicalOrder } from "../../../validation/shared/conventions/read-canonical-order.mjs";

export function resolveReadmeHeadings(packageJson = {}) {
  const applied = new Set(packageJson?.eliware?.apply ?? []);
  const order = readCanonicalOrder("readme-sections.yaml");
  const sections = [...order.generalSections];
  const sharedSections = Object.entries(order.sharedSections);
  const addedSharedSections = new Set();
  for (const profile of order.profileOrder) {
    if (!applied.has(profile)) continue;
    for (const [heading, rule] of sharedSections) {
      if (rule.profiles.includes(profile) && !addedSharedSections.has(heading)) {
        sections.push(heading);
        addedSharedSections.add(heading);
      }
    }
    sections.push(...order.profileSections[profile]);
  }
  const unique = sections.filter((name, index) => sections.indexOf(name) === index);
  return [order.tableOfContentsHeading, ...unique, ...order.finalSections];
}
