const reportKey = '"numFailedTestSuites"';

export function extractJestJsonReport(output) {
  for (let keyIndex = output.indexOf(reportKey); keyIndex >= 0; keyIndex = output.indexOf(reportKey, keyIndex + 1)) {
    for (let start = output.indexOf("{"); start >= 0 && start < keyIndex; start = output.indexOf("{", start + 1)) {
      const end = findObjectEnd(output, start);
      if (end < keyIndex) continue;
      try {
        const report = JSON.parse(output.slice(start, end + 1));
        if (report && typeof report === "object" && !Array.isArray(report) &&
            Object.hasOwn(report, "numFailedTestSuites")) return { start, end: end + 1, report };
        break;
      } catch {
        continue;
      }
    }
  }
  return null;
}

function findObjectEnd(input, start) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < input.length; index += 1) {
    const character = input[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
    } else if (character === '"') inString = true;
    else if (character === "{") depth += 1;
    else if (character === "}" && --depth === 0) return index;
  }
  return -1;
}
