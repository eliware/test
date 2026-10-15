import { validateCanonicalOrderDocument } from "../../../../validation/shared/conventions/validate/canonical-order-document.mjs";

export function validateOrderingSpecificationDocument(value, path) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value))
    return [`${path} must contain an ordering object.`];
  if (Object.keys(value).some((key) => !["version", "description", "orders"].includes(key)))
    errors.push(`${path} contains unsupported ordering fields.`);
  if (typeof value.version !== "string" || !value.version.trim())
    errors.push(`${path}.version must be a nonempty string.`);
  if (typeof value.description !== "string" || !value.description.trim())
    errors.push(`${path}.description must be a nonempty string.`);
  if (!isOrderRecord(value.orders)) errors.push(`${path}.orders must contain ordered values.`);
  errors.push(...validateCanonicalOrderDocument(value, path));
  return errors;
}

function isOrderRecord(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).length > 0 &&
    Object.values(value).every(isOrderValue),
  );
}

function isOrderValue(value) {
  if (typeof value === "number") return Number.isFinite(value) && value >= 0;
  if (typeof value === "string") return Boolean(value.trim());
  if (Array.isArray(value))
    return value.every((item) => typeof item === "string" && Boolean(item.trim()));
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).length > 0 &&
    Object.values(value).every(isOrderValue),
  );
}
