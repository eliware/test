const requiredLicenseText = [
  "MIT License",
  "Copyright (c) 2026 Eliware",
  "Permission is hereby granted",
  'THE SOFTWARE IS PROVIDED "AS IS"',
  "WITHOUT WARRANTY OF ANY KIND",
  "IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE",
];

export function validateApprovedLicense(license) {
  const normalized = license.replace(/\s+/gu, " ");
  const missing = requiredLicenseText.filter(
    (marker) => !normalized.includes(marker.replace(/\s+/gu, " ")),
  );
  return missing.length > 0 ? `LICENSE is missing approved MIT text: ${missing.join(", ")}.` : null;
}
