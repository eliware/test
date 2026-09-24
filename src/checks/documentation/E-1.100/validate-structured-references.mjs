import { readFile, stat } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";

const uriPattern = /^[A-Za-z][A-Za-z\d+.-]*:/u;

function resolveReference(root, file, reference, allowCrossRepository) {
  const [path] = reference.split("#", 1);
  if (!path || uriPattern.test(path)) return null;
  const target = path.startsWith("/") ? resolve(root, path.slice(1)) : resolve(dirname(file), path);
  const fromRoot = relative(root, target);
  const external = fromRoot.startsWith("..") || fromRoot.includes(":");
  if (external && !allowCrossRepository)
    throw new Error(`${reference} resolves outside the repository`);
  return { target, external };
}

async function readRegisteredRepositoryRoots(root) {
  try {
    const authorityFile = join(root, "specs", "authority.json");
    const authority = JSON.parse(await readFile(authorityFile, "utf8"));
    if (typeof authority.globalAuthorityMap !== "string") return null;
    const mapPath = resolve(dirname(authorityFile), authority.globalAuthorityMap);
    const map = JSON.parse(await readFile(mapPath, "utf8"));
    if (!Array.isArray(map.repositoryRegistry)) return null;
    return map.repositoryRegistry
      .filter((entry) => typeof entry?.path === "string")
      .map((entry) => resolve(dirname(mapPath), entry.path));
  } catch {
    return null;
  }
}

function isWithinRepository(target, repositoryRoot) {
  const path = relative(repositoryRoot, target);
  return !/^(?:\.\.(?:[/\\]|$)|[A-Za-z]:)/u.test(path);
}

export async function validateStructuredReferences(root, files) {
  let registeredRepositoryRoots;
  let registryLoaded = false;
  for (const relativeFile of files) {
    const file = join(root, relativeFile);
    const document = JSON.parse(await readFile(file, "utf8"));
    const references = [];
    const visit = (value, crossRepository = false) => {
      if (!value || typeof value !== "object") return;
      if (!Array.isArray(value) && typeof value.path === "string") {
        references.push({ path: value.path, crossRepository });
      }
      for (const [key, child] of Object.entries(value)) {
        visit(child, crossRepository || key === "crosslinks");
      }
    };
    visit(document);
    for (const reference of references) {
      const resolved = resolveReference(root, file, reference.path, reference.crossRepository);
      if (!resolved) continue;
      if (resolved.external) {
        if (!registryLoaded) {
          registeredRepositoryRoots = await readRegisteredRepositoryRoots(root);
          registryLoaded = true;
        }
        if (
          registeredRepositoryRoots &&
          !registeredRepositoryRoots.some((repositoryRoot) =>
            isWithinRepository(resolved.target, repositoryRoot),
          )
        ) {
          throw new Error(`${reference.path} is outside every registered repository path`);
        }
      }
      try {
        await stat(resolved.target);
      } catch (error) {
        if (resolved.external && error.code === "ENOENT") continue;
        throw error;
      }
      if (resolved.external && registeredRepositoryRoots === null) {
        throw new Error(
          `${reference.path} cannot be verified without the registered repository map`,
        );
      }
    }
  }
  return null;
}
