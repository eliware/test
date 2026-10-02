import { normalizeWorkflowDocument } from "../../../ghcr-published/normalize-workflow-document.mjs";
import { validateWorkflowEventConfigs } from "./validate-workflow-event-config.mjs";

export function normalizeWorkflowEvents(document) {
  const normalized = normalizeWorkflowDocument(document);
  const raw =
    normalized && Object.hasOwn(normalized, "on") ? normalized.on : (normalized?.true ?? {});
  const validDocument = Boolean(
    normalized && typeof normalized === "object" && !Array.isArray(normalized),
  );
  const validTriggerType =
    (typeof raw === "string" && raw.length > 0) ||
    (Array.isArray(raw) &&
      raw.length > 0 &&
      raw.every((event) => typeof event === "string" && event.length > 0)) ||
    Boolean(raw && typeof raw === "object" && !Array.isArray(raw) && Object.keys(raw).length > 0);
  const events = Array.isArray(raw)
    ? Object.fromEntries(raw.map((event) => [event, {}]))
    : typeof raw === "string"
      ? { [raw]: {} }
      : raw && typeof raw === "object" && !Array.isArray(raw)
        ? Object.fromEntries(
            Object.entries(raw).map(([event, config]) => [
              event,
              config === null
                ? {}
                : ["push", "pull_request", "pull_request_target"].includes(event) &&
                    Array.isArray(config) &&
                    config.length > 0 &&
                    config.every((branch) => typeof branch === "string")
                  ? { branches: config }
                  : config,
            ]),
          )
        : {};
  const validEventConfigs = validateWorkflowEventConfigs(events);
  return {
    document: normalized,
    events,
    valid: validDocument && validTriggerType && validEventConfigs,
  };
}
