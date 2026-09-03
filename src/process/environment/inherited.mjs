export function inheritedEnvironment(options) {
  return options.inheritEnv === false ? {} : process.env;
}
