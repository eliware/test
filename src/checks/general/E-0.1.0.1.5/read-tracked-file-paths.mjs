export async function readTrackedFilePaths(root, runGit) {
  const { stdout } = await runGit("git", ["-C", root, "ls-files", "--cached", "-z"], {
    windowsHide: true,
    encoding: "buffer",
  });
  const output = Buffer.isBuffer(stdout) ? stdout.toString("utf8") : String(stdout);
  return new Set(output.split("\0").filter(Boolean));
}
