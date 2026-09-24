export function hasExactTagTrigger(workflow) {
  const trigger = workflow.document?.on ?? workflow.document?.true;
  const tags = trigger?.push?.tags;
  return Boolean(
    trigger &&
      Object.keys(trigger).every((event) => event === "push") &&
      Array.isArray(tags) &&
      tags.length === 1 &&
      tags[0] === "v[0-9]+.[0-9]+.[0-9]+",
  );
}
