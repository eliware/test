export function uncoveredFunctions(data) {
  const counters = data.f === undefined || data.f === null ? {} : (typeof data.f === 'object' && !Array.isArray(data.f) ? data.f : null);
  if (counters === null) return [{ type: 'function', name: 'unknown' }];
  return Object.entries(counters).filter(([, count]) => !Number.isFinite(count) || count <= 0).map(([id]) => {
    const metadata = data.fnMap && typeof data.fnMap === 'object' && Object.hasOwn(data.fnMap, id) ? data.fnMap[id] : undefined;
    const fn = metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? metadata : {};
    const primaryLocation = fn.loc && typeof fn.loc === 'object' && !Array.isArray(fn.loc) && fn.loc.start && typeof fn.loc.start === 'object' ? fn.loc : undefined;
    const fallbackLocation = Array.isArray(fn.locations) && fn.locations[0] && typeof fn.locations[0] === 'object' && !Array.isArray(fn.locations[0]) ? fn.locations[0] : undefined;
    const location = primaryLocation ?? fallbackLocation;
    return { ...(location && typeof location === 'object' && !Array.isArray(location) ? location : {}), name: typeof fn.name === 'string' ? fn.name : (metadata && typeof metadata === 'object' ? 'anonymous' : 'unknown') };
  });
}
