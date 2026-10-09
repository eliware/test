import { basename } from "node:path";
import {
  readProfileComposition,
  validateProfileComposition,
} from "./validate-profile-composition.mjs";
function collectDirectives(directives, profile, source, catalog) {
  if (!Array.isArray(directives)) {
    throw new Error(`Bundled convention profile ${source} has no directive list.`);
  }
  for (const directive of directives) {
    if (
      !directive ||
      typeof directive.id !== "string" ||
      !/^[EA]-\d+(?:\.\d+)*$/u.test(directive.id) ||
      !Array.isArray(directive.dos) ||
      directive.dos.length === 0 ||
      !Array.isArray(directive.donts) ||
      directive.donts.length === 0 ||
      (directive.examples !== undefined && !Array.isArray(directive.examples))
    ) {
      throw new Error(`Bundled convention profile ${source} has a malformed directive.`);
    }
    if (catalog.directives[directive.id]) {
      throw new Error(`Duplicate bundled convention directive ID: ${directive.id}.`);
    }
    catalog.directives[directive.id] = profile;
    if (source.endsWith("-deterministic.yaml"))
      catalog.deterministicDirectives[directive.id] = profile;
    catalog.rules[directive.id] = {
      id: directive.id,
      dos: directive.dos,
      donts: directive.donts,
      ...(directive.examples === undefined ? {} : { examples: directive.examples }),
    };
    if (directive.directives !== undefined) {
      collectDirectives(directive.directives, profile, source, catalog);
    }
  }
}
export function buildProfileCatalog(documents, expectedVersion) {
  if (!Array.isArray(documents) || documents.length === 0) {
    throw new Error("Bundled convention profile catalog cannot be empty.");
  }
  const catalog = {
    version: expectedVersion,
    profiles: {},
    directives: {},
    deterministicDirectives: {},
    rules: {},
  };
  const sources = new Set();
  for (const { source, document } of documents) {
    if (typeof source !== "string" || basename(source) !== source || !source.endsWith(".yaml")) {
      throw new Error(`Bundled convention profile ${source} has an invalid name.`);
    }
    if (sources.has(source))
      throw new Error(`Duplicate bundled convention profile document: ${source}.`);
    sources.add(source);
    const match = /^(?<profile>[a-z0-9-]+)-(?:semantic|deterministic)\.yaml$/u.exec(source);
    const profile = match?.groups?.profile ?? basename(source, ".yaml");
    if (!/^[a-z0-9-]+$/u.test(profile)) {
      throw new Error(`Bundled convention profile ${source} has an invalid name.`);
    }
    if (document?.version !== expectedVersion) {
      throw new Error(
        `Bundled convention profile ${source} must match Convention v${expectedVersion}.`,
      );
    }
    collectDirectives(document.directives, profile, source, catalog);
    const { requires, conflicts } = readProfileComposition(document, source, profile);
    const existing = catalog.profiles[profile];
    if (
      existing &&
      (JSON.stringify(existing.requires) !== JSON.stringify(requires) ||
        JSON.stringify(existing.conflicts) !== JSON.stringify(conflicts))
    ) {
      throw new Error(`Bundled convention profile ${profile} has mismatched composition metadata.`);
    }
    catalog.profiles[profile] = { profile, requires, conflicts };
  }
  validateProfileComposition(catalog.profiles);
  return catalog;
}
