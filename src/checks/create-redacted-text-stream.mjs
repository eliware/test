import { StringDecoder } from "node:string_decoder";
import { redactProcessOutput } from "./redact-process-output.mjs";

export function createRedactedTextStream(secrets, outputLimit) {
  const values = [...new Set(secrets.filter((secret) => typeof secret === "string" && secret.length > 0))];
  const maximumSecretLength = Math.max(0, ...values.map((secret) => secret.length));
  const suppressed = maximumSecretLength > outputLimit;
  const decoder = new StringDecoder("utf8");
  let pending = "";
  let outputLength = 0;
  let finished = false;

  function append(text) {
    const remaining = Math.max(0, outputLimit - outputLength);
    const output = redactProcessOutput(text, values).slice(0, remaining);
    outputLength += output.length;
    return output;
  }

  function findSafeBoundary() {
    let boundary = Math.max(0, pending.length - maximumSecretLength);
    let adjusted = true;
    while (boundary > 0 && adjusted) {
      adjusted = false;
      for (const secret of values) {
        const index = pending.indexOf(secret, Math.max(0, boundary - secret.length + 1));
        if (index >= 0 && index < boundary) {
          boundary = index;
          adjusted = true;
        }
        if (adjusted) break;
      }
    }
    return boundary;
  }

  function addText(text) {
    if (suppressed || finished || outputLength >= outputLimit) return "";
    pending += text;
    const boundary = findSafeBoundary();
    if (boundary === 0) return "";
    const safeText = pending.slice(0, boundary);
    pending = pending.slice(boundary);
    return append(safeText);
  }

  return {
    redactComplete(text) {
      return redactProcessOutput(trimPartialSecretSuffix(String(text), values), values);
    },
    push(chunk) {
      const text = decoder.write(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
      return addText(text);
    },
    finish() {
      if (finished) return "";
      finished = true;
      if (suppressed || outputLength >= outputLimit) return "";
      pending += decoder.end();
      const safeText = trimPartialSecretSuffix(pending, values);
      pending = "";
      return append(safeText);
    },
  };
}

function trimPartialSecretSuffix(text, secrets) {
  let safeLength = text.length;
  for (const secret of secrets) {
    const maximumPrefix = Math.min(text.length, secret.length - 1);
    for (let length = maximumPrefix; length > 0; length -= 1) {
      if (text.endsWith(secret.slice(0, length))) {
        safeLength = Math.min(safeLength, text.length - length);
        break;
      }
    }
  }
  return text.slice(0, safeLength);
}
