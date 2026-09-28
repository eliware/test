export const sideEffectModules = new Set([
  "node:fs",
  "fs",
  "node:fs/promises",
  "fs/promises",
  "node:http",
  "http",
  "node:https",
  "https",
  "node:net",
  "net",
  "node:dgram",
  "dgram",
  "node:process",
  "process",
  "node:child_process",
  "child_process",
]);

export const childProcessModules = new Set(["node:child_process", "child_process"]);

export const sideEffectRoots = new Set(["fs", "fsp", "http", "https", "net", "dgram"]);
export const processOperations = new Set(["exit", "kill", "abort"]);
export const networkOperations = new Set(["fetch", "request", "connect", "createConnection"]);
export const effectGlobals = new Set(["process", "globalThis", "fetch"]);
