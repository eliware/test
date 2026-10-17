import { detectTestToolUse } from "../detect-test-tool-use.mjs";
import { findTestToolReferencesInText } from "./find-test-tool-references-in-text.mjs";

export function validateTestToolReferences(path, content, harness = false) {
  const prohibited = isJsonFile(path)
    ? packageScriptsUseTool(content, harness)
    : isYamlFile(path)
      ? findTestToolReferencesInText(extractYamlCommands(content), harness)
      : isScriptFile(path)
        ? findTestToolReferencesInText(content, harness)
        : isMarkdownFile(path)
          ? findTestToolReferencesInText(extractMarkdownShellCommands(content), harness)
          : isCodeFile(path)
            ? detectTestToolUse(content, harness)
            : false;
  return prohibited ? `${path} must not import or invoke a test runner or coverage tool.` : null;
}

function packageScriptsUseTool(content, harness) {
  let manifest;
  try {
    manifest = JSON.parse(content);
  } catch {
    return false;
  }
  return Object.values(manifest.scripts ?? {}).some(
    (command) => typeof command === "string" && findTestToolReferencesInText(command, harness),
  );
}

function extractYamlCommands(content) {
  const lines = content.split(/\r?\n/u);
  const commands = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^(\s*)(?:-\s*)?(?:run|command|script):\s*(.*)$/u);
    if (!match) continue;
    if (/^[|>][+-]?$/u.test(match[2])) {
      index = appendBlockCommands(lines, index, match[1].length, commands);
    } else commands.push(match[2].replace(/^(["'])(.*)\1$/u, "$2"));
  }
  return commands.join("\n");
}

function appendBlockCommands(lines, index, keyIndent, commands) {
  let next = index + 1;
  while (next < lines.length && (!lines[next].trim() || indentation(lines[next]) > keyIndent)) {
    if (lines[next].trim()) commands.push(lines[next].trim());
    next += 1;
  }
  return next - 1;
}

function indentation(line) {
  return line.length - line.trimStart().length;
}

function isJsonFile(path) {
  return path === "package.json";
}

function isYamlFile(path) {
  return /\.ya?ml$/iu.test(path);
}

function isScriptFile(path) {
  return /\.(?:sh|ps1|py)$/iu.test(path);
}

function isMarkdownFile(path) {
  return /\.md$/iu.test(path);
}

function extractMarkdownShellCommands(content) {
  const lines = content.split(/\r?\n/u);
  const commands = [];
  let fence = null;
  let shellBlock = false;
  for (const line of lines) {
    const opening = line.match(/^\s*(`{3,}|~{3,})\s*([\w+-]*)/u);
    if (!fence && opening) {
      fence = opening[1][0].repeat(opening[1].length);
      shellBlock = /^(?:sh|bash|shell|zsh|pwsh|powershell)$/iu.test(opening[2]);
      continue;
    }
    if (fence && line.trimStart().startsWith(fence)) {
      fence = null;
      shellBlock = false;
      continue;
    }
    if (fence && shellBlock) commands.push(line);
  }
  return commands.join("\n");
}

function isCodeFile(path) {
  return /\.(?:mjs|js|cjs|jsx|ts|tsx|cts|mts|mjsx|cjsx)$/iu.test(path);
}
