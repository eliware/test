import packageMetadata from "../package.json" with { type: "json" };

export const conventionVersion = packageMetadata.version.split(".").slice(0, 2).join(".");
const [conventionMajor, conventionMinor] = conventionVersion.split(".");
export const otherConventionVersion = `${conventionMajor}.${Number(conventionMinor) + 1}`;

export function profileDocument(source, id) {
  return {
    source,
    document: {
      version: conventionVersion,
      directives: [{ id, dos: ["Do."], donts: ["Do not."] }],
    },
  };
}
