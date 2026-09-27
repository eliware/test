export function isApprovedNpmPublishCommand(command) {
  return typeof command === "string" &&
    /^npm\s+publish(?:\s+(?:--provenance|--access\s+(?:public|restricted)|--tag\s+[A-Za-z0-9._-]+))*$/iu.test(command.trim());
}
