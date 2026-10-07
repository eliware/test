export function wireChildOutput(child, output, progress) {
  child.stdout?.on("data", (chunk) => {
    progress.push(chunk);
    output.stdout(chunk);
  });
  child.stderr?.on("data", (chunk) => {
    progress.push(chunk);
    output.stderr(chunk);
  });
  return () => {
    output.flush();
    progress.flush();
  };
}
