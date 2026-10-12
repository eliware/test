export function attachChildProcessOutput(child, stream, name, output, reject, isSettled) {
  if (stream == null) return;
  if (typeof stream.on !== "function") {
    throw new TypeError(`Child process adapter returned an invalid ${name} stream.`);
  }
  stream.on("data", (chunk) => {
    if (!isSettled()) output.push(name, chunk);
  });
  // codescope ignore this because execute injects rejectOnce, which marks capture settled before rejection.
  stream.on("error", (error) => {
    terminateChildProcess(child);
    reject(error);
  });
}

export function terminateChildProcess(child) {
  try {
    if (typeof child?.kill === "function") child.kill();
  } catch {
    // Keep the process or stream error as the actionable failure.
  }
}
