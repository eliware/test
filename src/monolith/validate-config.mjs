/** Validate and normalize monolith configuration values. */
export function validateMonolithConfig(config) {
  if (![config.source, config.test].every((value) => Number.isInteger(value) && value > 0)) {
    throw new Error('monolith limits must be positive integers');
  }
  if (!Array.isArray(config.exemptions) || config.exemptions.some((item) => (
    !item || typeof item.pattern !== 'string' || !item.pattern
    || typeof item.reason !== 'string' || !item.reason.trim()
  ))) {
    throw new Error('each monolith exemption requires a pattern and non-empty reason');
  }
  return config;
}
