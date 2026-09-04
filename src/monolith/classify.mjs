import { extname } from 'node:path';
import { isPureBarrelSource } from '../workspace/policy/pure-barrel.mjs';
export function classifyMonolithFile(file) { const normalized = file.replaceAll('\\', '/'); if (!['.js', '.mjs', '.cjs', '.ts', '.mts', '.cts', '.jsx', '.tsx'].includes(extname(normalized).toLowerCase())) return ''; if (/(?:^|\/)(?:tests?|spec)(?:\/|$)/i.test(normalized)) return 'test'; if (/(?:^|\/)src(?:\/|$)/i.test(normalized)) return 'source'; return ''; }
export const isPureBarrel = isPureBarrelSource;
