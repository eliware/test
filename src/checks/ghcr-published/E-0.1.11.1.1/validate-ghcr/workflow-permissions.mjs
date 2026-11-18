export default function hasGhcrPublisherPermissions(value) {
  const required = {
    contents: "read",
    packages: "write",
  };
  return (
    value &&
    Object.keys(value).length === Object.keys(required).length &&
    Object.entries(required).every(([key, permission]) => value[key] === permission)
  );
}
