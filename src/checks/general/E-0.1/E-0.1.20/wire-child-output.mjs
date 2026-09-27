export function wireChildOutput(child, output, progress) {
  child.stdout?.on("data", output.stdout);
  child.stderr?.on("data", (chunk) => {
    progress.push(chunk);
    output.stderr(chunk);
  });
  return () => {
    output.flush();
    progress.flush();
  };
}
