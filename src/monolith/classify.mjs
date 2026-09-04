import { extname } from 'node:path';
import { isPureBarrelSource } from '../workspace/policy/pure-barrel.mjs';
export function classifyMonolithFile(file) { if (!['.js', '.mjs', '.cjs', '.ts', '.mts', '.cts', '.jsx', '.tsx'].includes(extname(file).toLowerCase())) return ''; if (/(?:^|\/)(?:tests?|spec)(?:\/|$)/i.test(file)) return 'test'; if (/(?:^|\/)src(?:\/|$)/i.test(file)) return 'source'; return ''; }
export const isPureBarrel = isPureBarrelSource;
