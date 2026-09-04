export function assertChildProcessArguments(command, argumentsList, options) {
  if (typeof command !== 'string' || command.length === 0) throw new TypeError('runChildProcess requires a command');
  if (!Array.isArray(argumentsList)) throw new TypeError('runChildProcess arguments must be an array');
  if (options === null || typeof options !== 'object') throw new TypeError('runChildProcess options must be an object');
}
