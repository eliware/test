export function childEnvironment(options, baseEnvironment) {
  return { ...baseEnvironment(options), ...options.env };
}
