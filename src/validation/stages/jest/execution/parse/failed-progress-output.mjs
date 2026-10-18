export function parseFailedJestProgressOutput(text) {
  return String(text ?? "")
    .split(/\r?\n/u)
    .flatMap((line) => {
      const marker = line.match(/^\[eliware-test-progress\] (.+)$/u);
      if (!marker) return [];
      try {
        const event = JSON.parse(marker[1]);
        if (event.event !== "result" || !event.failed) return [];
        return [
          [event.path, ...(event.failures ?? []), ...(event.unexpectedOutput ?? [])]
            .filter(Boolean)
            .join("\n"),
        ];
      } catch {
        return [];
      }
    })
    .filter(Boolean)
    .join("\n");
}
