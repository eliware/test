import { existsSync } from "node:fs";
import { win32 } from "node:path";

export function resolveWindowsPowerShellCoreExecutable(env, fileExists = existsSync) {
  const environmentEntries = new Map(
    Object.entries(process.env).map(([key, value]) => [key.toLowerCase(), [key, value]]),
  );
  for (const [key, value] of Object.entries(env)) {
    environmentEntries.set(key.toLowerCase(), [key, value]);
  }
  const currentEnvironment = Object.fromEntries(environmentEntries.values());
  const pathKey = Object.keys(currentEnvironment).find((key) => key.toLowerCase() === "path");
  const pathEntries = (
    pathKey && typeof currentEnvironment[pathKey] === "string"
      ? currentEnvironment[pathKey].split(";")
      : []
  ).filter((entry) => win32.isAbsolute(entry));
  const programFiles = Object.entries(currentEnvironment)
    .filter(([key]) => ["programfiles", "programw6432"].includes(key.toLowerCase()))
    .map(([, value]) => value)
    .filter((value) => typeof value === "string" && win32.isAbsolute(value));
  const candidates = [
    ...pathEntries.map((directory) => win32.join(directory, "pwsh.exe")),
    ...programFiles.map((directory) => win32.join(directory, "PowerShell", "7", "pwsh.exe")),
  ];
  const executable = candidates.find(fileExists);
  if (!executable) {
    throw new Error(
      "PowerShell Core was not found on PATH or in the standard Program Files location.",
    );
  }
  return executable;
}
