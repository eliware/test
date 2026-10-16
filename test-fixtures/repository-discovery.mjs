import { createRepositoryDiscovery } from "../src/validation/shared/repository/create-repository/inventory/discovery.mjs";

export function createRepositoryDiscoveryFixture(findEntries) {
  return createRepositoryDiscovery({
    root: "/repo",
    findEntries,
    readDirectory: async () => [],
  });
}
