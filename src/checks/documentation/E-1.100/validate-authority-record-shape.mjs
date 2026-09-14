export function validateAuthorityRecordShape(document) {
  if (!document || typeof document !== "object" || !Array.isArray(document.subjects)) {
    return "authority.json must declare a subjects array.";
  }
  if (typeof document.repositoryId !== "string" || !document.repositoryId) {
    return "authority.json must declare repositoryId.";
  }
  if (typeof document.globalAuthorityMap !== "string") {
    return "authority.json must declare globalAuthorityMap.";
  }
  for (const [index, subject] of document.subjects.entries()) {
    if (!subject || typeof subject !== "object" || typeof subject.id !== "string") {
      return `authority subject ${index} must declare an id.`;
    }
    if (!subject.authority || typeof subject.authority.path !== "string") {
      return `authority subject ${subject.id} must declare an authority path.`;
    }
    for (const [field, records] of Object.entries(subject).filter(([key]) => ["directives", "implementation", "evidence"].includes(key))) {
      if (!Array.isArray(records)) return `authority subject ${subject.id}.${field} must be an array.`;
      for (const [recordIndex, record] of records.entries()) {
        if (!record || typeof record !== "object" || typeof record.path !== "string") {
          return `authority subject ${subject.id}.${field}[${recordIndex}] must contain a path.`;
        }
      }
    }
  }
  return null;
}
