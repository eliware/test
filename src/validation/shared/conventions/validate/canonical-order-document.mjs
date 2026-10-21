import { canonicalOrderRequirements } from "../canonical-order-requirements.mjs";

export function validateCanonicalOrderDocument(document, path) {
  const name = path.split("/").at(-1);
  const contract = canonicalOrderRequirements[name];
  if (!contract) return [];
  const errors = [];
  const orders = document?.orders;
  for (const [field, type] of Object.entries(contract.fields)) {
    if (!Object.hasOwn(orders ?? {}, field)) {
      errors.push(`${path}.orders.${field} is required.`);
      continue;
    }
    if (!hasType(orders[field], type)) errors.push(`${path}.orders.${field} must be ${type}.`);
    const requiredKeys = contract.maps?.[field] ?? [];
    for (const key of requiredKeys) {
      if (!Object.hasOwn(orders[field] ?? {}, key))
        errors.push(`${path}.orders.${field}.${key} is required.`);
    }
    if (contract.maps?.[field] && isObject(orders[field]))
      for (const key of Object.keys(orders[field]))
        if (!requiredKeys.includes(key))
          errors.push(`${path}.orders.${field}.${key} is not supported.`);
  }
  validateNestedMaps(orders, contract.nestedMaps, contract.nestedTypes, path, errors);
  return errors;
}

function validateNestedMaps(orders, nestedMaps = {}, nestedTypes = {}, path, errors) {
  for (const [field, entries] of Object.entries(nestedMaps)) {
    for (const [entry, required] of Object.entries(entries)) {
      const values = orders?.[field]?.[entry];
      for (const key of required) {
        if (!Object.hasOwn(values ?? {}, key))
          errors.push(`${path}.orders.${field}.${entry}.${key} is required.`);
        else if (!hasType(values[key], nestedTypes[field]?.[entry]?.[key]))
          errors.push(
            `${path}.orders.${field}.${entry}.${key} must be ${nestedTypes[field][entry][key]}.`,
          );
      }
      if (isObject(values))
        for (const key of Object.keys(values))
          if (!required.includes(key))
            errors.push(`${path}.orders.${field}.${entry}.${key} is not supported.`);
    }
  }
}

function hasType(value, type) {
  if (type === "text") return typeof value === "string" && Boolean(value.trim());
  if (type === "text-list") return Array.isArray(value) && value.length > 0 && value.every(isText);
  if (type === "nonempty-text-list")
    return Array.isArray(value) && value.length > 0 && value.every(isText);
  if (type === "text-list-map") return isObject(value) && Object.values(value).every(isTextList);
  if (type === "text-map") return isObject(value) && Object.values(value).every(isText);
  if (type === "number-map")
    return isObject(value) && Object.values(value).every((entry) => Number.isFinite(entry));
  if (type === "object-map") return isObject(value) && Object.values(value).every(isObject);
  return false;
}

function isText(value) {
  return typeof value === "string" && Boolean(value.trim());
}

function isTextList(value) {
  return Array.isArray(value) && value.every(isText);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
