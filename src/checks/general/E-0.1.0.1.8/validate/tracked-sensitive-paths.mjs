import { parseGitIndexEntries } from "../parse-git-index-output.mjs";

const protectedNames = new Set([
  "id_rsa",
  "secret",
  "secrets",
  "credential",
  "credentials",
  "token",
  "tokens",
]);

export async function validateTrackedSensitivePaths(root, runGit) {
  try {
    const { stdout } = await runGit("git", ["-C", root, "ls-files", "--cached", "--stage", "-z"], {
      windowsHide: true,
      encoding: "buffer",
    });
    const paths = parseGitIndexEntries(stdout)
      .map(({ path }) => path)
      .filter((path) => {
        const parts = path.replaceAll("\\", "/").split("/");
        return parts.some((part) => {
          const name = part.toLowerCase();
          const environmentFile = /^\.env(?:$|\.)/u.test(name) || name === ".envrc";
          const exampleFile = name === ".env.example";
          return (
            protectedNames.has(name) ||
            (environmentFile && !exampleFile) ||
            /\.(?:pem|key|p12|pfx)$/u.test(name)
          );
        });
      });
    return paths.length ? [`Tracked sensitive paths are prohibited: ${paths.join(", ")}.`] : [];
  } catch {
    return ["Git index status could not be read; sensitive paths are unknown."];
  }
}
