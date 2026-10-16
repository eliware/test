import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  bundledConventionVersion,
  readBundledProfileCatalog,
} from "../../check-discovery/read/bundled-profile-catalog.mjs";
import { parseBoundedYamlValue } from "../../shared/yaml/parse-bounded-yaml-documents.mjs";
import { validateProfileCombinationPolicy } from "../validate/profile-combination-policy.mjs";

const policyUrl = new URL("../../../../specs/profile-combinations.yaml", import.meta.url);

export function readProfileCombinationPolicy({ read = readFileSync } = {}) {
  const path = fileURLToPath(policyUrl);
  const policy = parseBoundedYamlValue(read(policyUrl, "utf8"), path);
  const errors = validateProfileCombinationPolicy(
    policy,
    Object.keys(readBundledProfileCatalog().profiles),
    bundledConventionVersion,
  );
  if (errors.length > 0) throw new Error(errors.join(" "));
  return policy;
}
