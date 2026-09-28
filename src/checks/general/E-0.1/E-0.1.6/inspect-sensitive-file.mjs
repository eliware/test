import { parseAllDocuments } from "yaml";
import { sensitivePathRole } from "./sensitive-path-classifier.mjs";

export function isAllowedSensitiveFile(path, source) {
  const role = sensitivePathRole(path);
  if (role === "documentation") return true;
  if (!role || typeof source !== "string") return false;
  const documents = parseAllDocuments(source);
  if (documents.some((document) => document.errors.length > 0)) return false;
  const values = documents.map((document) => document.toJSON()).filter(Boolean);
  if (values.length === 0) return false;
  if (role === "encrypted-secret") return values.every(isEncryptedSecret);
  if (role === "generator") return values.every(isEncryptedSecretGenerator);
  if (role === "kustomization") return values.every(isSecretKustomization);
  return values.every(isSecretApplication);
}

function isEncryptedSecret(document) {
  const resources = Array.isArray(document.items) ? document.items : [document];
  return (
    Boolean(document.sops?.version) &&
    isEncryptedValue(document.sops?.mac) &&
    resources.length > 0 &&
    resources.every(isEncryptedSecretResource)
  );
}

function isEncryptedSecretResource(resource) {
  if (!resource || typeof resource !== "object") return false;
  const payload = { ...resource.data, ...resource.stringData };
  const values = Object.values(payload).flatMap(encryptedLeaves);
  return (
    (resource.kind === "Secret" || isEncryptedValue(resource.kind)) &&
    values.length > 0 &&
    values.every(isEncryptedValue)
  );
}

function encryptedLeaves(value) {
  if (value && typeof value === "object") return Object.values(value).flatMap(encryptedLeaves);
  return [value];
}

function isEncryptedValue(value) {
  return (
    typeof value === "string" &&
    /^ENC\[AES256_GCM,data:[^,\]]+,iv:[^,\]]+,tag:[^,\]]+,type:(?:str|bytes)\]$/.test(value)
  );
}

function isEncryptedSecretGenerator(document) {
  return (
    document.apiVersion === "viaduct.ai/v1" &&
    document.kind === "ksops" &&
    Array.isArray(document.files) &&
    document.files.length > 0 &&
    document.files.every((file) => typeof file === "string" && /\.enc\.ya?ml$/i.test(file))
  );
}

function isSecretKustomization(document) {
  return (
    document.kind === "Kustomization" &&
    Array.isArray(document.generators) &&
    document.generators.length > 0 &&
    document.generators.every((file) => typeof file === "string" && /generator\.ya?ml$/i.test(file))
  );
}

function isSecretApplication(document) {
  const sourceList = Array.isArray(document.spec?.sources) ? document.spec.sources : [];
  const sources = [document.spec?.source, ...sourceList];
  return (
    document.kind === "Application" &&
    sources.some(
      (source) =>
        typeof source?.path === "string" && /(?:^|\/)(?:[^/]+-)?secrets?$/i.test(source.path),
    )
  );
}
