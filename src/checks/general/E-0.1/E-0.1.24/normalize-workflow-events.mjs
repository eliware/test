import { normalizeWorkflowDocument } from "../../../ghcr-published/normalize-workflow-document.mjs";

export function normalizeWorkflowEvents(document) {
  const normalized = normalizeWorkflowDocument(document);
  const raw = normalized?.on ?? normalized?.true ?? {};
  const events = Array.isArray(raw)
    ? Object.fromEntries(raw.map((event) => [event, {}]))
    : typeof raw === "string"
      ? { [raw]: {} }
      : raw;
  return { document: normalized, events };
}
