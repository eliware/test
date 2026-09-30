import { basename } from "node:path";
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
  const catalog = { version: expectedVersion, profiles: {}, directives: {}, rules: {} };
  for (const { source, document } of documents) {
    if (typeof source !== "string" || basename(source) !== source || !source.endsWith(".json")) {
      throw new Error(`Bundled convention profile ${source} has an invalid name.`);
    }
    const profile = basename(source, ".json");
    if (!/^[a-z0-9-]+$/u.test(profile)) {
      throw new Error(`Bundled convention profile ${source} has an invalid name.`);
    }
    if (document?.version !== expectedVersion) {
      throw new Error(
        `Bundled convention profile ${source} must match Convention v${expectedVersion}.`,
      );
    }
    if (catalog.profiles[profile]) {
      throw new Error(`Duplicate bundled convention profile: ${profile}.`);
    }
    collectDirectives(document.directives, profile, source, catalog);
    const requires = document.requires;
    if (
      !Array.isArray(requires) ||
      requires.some(
        (required) => typeof required !== "string" || !/^[a-z0-9-]+$/u.test(required),
      ) ||
      new Set(requires).size !== requires.length ||
      requires.includes(profile)
    ) {
      throw new Error(`Bundled convention profile ${source} has an invalid requires list.`);
    }
    catalog.profiles[profile] = { profile, requires };
  }
  for (const [profile, metadata] of Object.entries(catalog.profiles)) {
    const unknown = metadata.requires.filter((required) => !catalog.profiles[required]);
    if (unknown.length) {
      throw new Error(
        `Bundled convention profile ${profile} requires unknown profiles: ${unknown.join(", ")}.`,
      );
    }
  }
  return catalog;
}
