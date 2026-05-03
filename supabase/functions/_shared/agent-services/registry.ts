// Service module registry. Edge functions import this to resolve which
// modules apply to a given client.

import type { ServiceModule } from './types.ts';
import { gaModule } from './ga.ts';
import { bmModule } from './benchmarking.ts';
import { saModule } from './systems_audit.ts';
import { maModule } from './management_accounts.ts';
import { discoveryModule } from './discovery.ts';

export const ALL_SERVICE_MODULES: ServiceModule[] = [
  gaModule,
  bmModule,
  saModule,
  maModule,
  discoveryModule,
];

/** Return the modules whose codes are in the given list of enrolled codes. */
export function modulesForCodes(codes: string[]): ServiceModule[] {
  if (codes.length === 0) return [];
  const set = new Set(codes);
  return ALL_SERVICE_MODULES.filter((m) => m.codes.some((c) => set.has(c)));
}

/** Return all allowed-write targets across the active modules. v1 only GA
 *  contributes any. */
export function allowedTargetsForModules(modules: ServiceModule[]) {
  return modules.flatMap((m) => m.allowedTargets);
}

/** Concatenated system prompt modules for the active services. */
export function systemPromptForModules(modules: ServiceModule[]): string {
  if (modules.length === 0) return '';
  return modules.map((m) => m.systemPromptModule).join('\n');
}
