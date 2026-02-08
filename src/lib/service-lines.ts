/**
 * BSG Service Lines — thin wrapper over canonical service registry
 * For full definitions and pricing, use src/lib/service-registry.ts
 */

import { SERVICE_REGISTRY } from './service-registry';

export const BSG_SERVICE_LINES = [
  'Automation',
  'Business Intelligence',
  'Future Financial Information / Advisory Accelerator',
  'Benchmarking - External and Internal',
  'Goal Alignment Programme',
  'Systems Audit',
  'Profit Extraction / Remuneration Strategies',
  'Fractional CFO Services',
  'Fractional COO Services',
  'Combined CFO/COO Advisory'
] as const;

export type BSGServiceLine = typeof BSG_SERVICE_LINES[number];

/** Backward-compatible: code → { name, displayName, category, priceRange } from registry */
export const SERVICE_DEFINITIONS = Object.fromEntries(
  Object.entries(SERVICE_REGISTRY).map(([code, def]) => {
    const first = def.tiers[0];
    const last = def.tiers.at(-1);
    const priceRange = def.tiers.length > 1 && first && last
      ? `${first.priceFormatted ?? first.priceFromFormatted ?? ''} - ${last.priceFormatted ?? last.priceFromFormatted ?? ''}`
      : (first?.priceFormatted ?? first?.priceFromFormatted ?? 'TBD');
    return [
      code,
      {
        id: code,
        name: def.name,
        displayName: def.displayName,
        category: def.category,
        description: def.description,
        priceRange,
      }
    ];
  })
) as Record<string, { id: string; name: string; displayName: string; category: string; description: string; priceRange: string }>;
