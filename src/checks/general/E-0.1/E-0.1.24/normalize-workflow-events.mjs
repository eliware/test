import { normalizeWorkflowDocument } from "../../../ghcr-published/normalize-workflow-document.mjs";

export function normalizeWorkflowEvents(document) {
  const normalized = normalizeWorkflowDocument(document);
  const raw = normalized?.on ?? normalized?.true ?? {};
  const validDocument = Boolean(
    normalized && typeof normalized === "object" && !Array.isArray(normalized),
  );
  const validTriggerType =
    typeof raw === "string" ||
    (Array.isArray(raw) && raw.every((event) => typeof event === "string" && event.length > 0)) ||
    Boolean(raw && typeof raw === "object" && !Array.isArray(raw));
  const events = Array.isArray(raw)
    ? Object.fromEntries(raw.map((event) => [event, {}]))
    : typeof raw === "string"
      ? { [raw]: {} }
      : raw && typeof raw === "object" && !Array.isArray(raw)
        ? Object.fromEntries(Object.entries(raw).map(([event, config]) => [event, config ?? {}]))
        : {};
  const validEventConfigs = Object.entries(events).every(([event, config]) =>
    (typeof config === "object" && !Array.isArray(config)) ||
    (["push", "pull_request"].includes(event) && Array.isArray(config) &&
      (event !== "push" || config.length > 0) &&
      config.every((branch) => typeof branch === "string")),
  );
  return {
    document: normalized,
    events,
    valid: validDocument && validTriggerType && validEventConfigs,
  };
}
