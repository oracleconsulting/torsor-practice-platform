import { useState, useEffect, Fragment, useMemo } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import type { LiveTechProduct } from '../../types/tech-stack';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';

interface IntegrationRow {
  product_a_slug: string;
  product_b_slug: string;
  integration_type: string;
  quality: string;
  data_flows: string | null;
}

interface MiddlewareRow {
  product_slug: string;
  platform: string;
  capability_type: string;
  capability_name: string;
  capability_description: string | null;
}

interface CategoryRow {
  category_code: string;
  category_name: string;
  parent_category: string | null;
}

export function TechDatabasePage() {
  const [products, setProducts] = useState<LiveTechProduct[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationRow[]>([]);
  const [middleware, setMiddleware] = useState<MiddlewareRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterMarketPosition, setFilterMarketPosition] = useState<string>('');
  const [filterUkStrong, setFilterUkStrong] = useState<boolean | null>(null);
  const [filterHasZapier, setFilterHasZapier] = useState<boolean | null>(null);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [productsRes, intRes, mwRes, catRes] = await Promise.all([
        supabase.from('sa_tech_products').select('*').order('product_name'),
        supabase.from('sa_tech_integrations').select('product_a_slug, product_b_slug, integration_type, quality, data_flows'),
        supabase.from('sa_middleware_capabilities').select('product_slug, platform, capability_type, capability_name, capability_description'),
        supabase.from('sa_system_categories').select('category_code, category_name, parent_category'),
      ]);
      if (cancelled) return;
      setProducts((productsRes.data as LiveTechProduct[]) || []);
      setIntegrations((intRes.data as IntegrationRow[]) || []);
      setMiddleware((mwRes.data as MiddlewareRow[]) || []);
      setCategories((catRes.data as CategoryRow[]) || []);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const categoryNameByCode = useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach((c) => m.set(c.category_code, c.category_name));
    return m;
  }, [categories]);

  const stats = useMemo(() => ({
    products: products.length,
    integrations: integrations.length,
    middleware: middleware.length,
    categoryCount: new Set(products.map((p) => p.category).filter(Boolean)).size,
  }), [products, integrations, middleware]);

  const categoryOptions = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (searchDebounced) {
        const q = searchDebounced.toLowerCase();
        if (
          !(p.product_name ?? '').toLowerCase().includes(q) &&
          !(p.slug ?? '').toLowerCase().includes(q) &&
          !(p.vendor ?? '').toLowerCase().includes(q)
        )
          return false;
      }
      if (filterCategory && p.category !== filterCategory) return false;
      if (filterMarketPosition && p.market_position !== filterMarketPosition) return false;
      if (filterUkStrong !== null && !!p.uk_strong !== filterUkStrong) return false;
      if (filterHasZapier !== null && !!p.has_zapier !== filterHasZapier) return false;
      return true;
    });
  }, [products, searchDebounced, filterCategory, filterMarketPosition, filterUkStrong, filterHasZapier]);

  const getIntegrationCount = (slug: string) =>
    integrations.filter((i) => i.product_a_slug === slug || i.product_b_slug === slug).length;

  const getMiddlewareForProduct = (slug: string) =>
    middleware.filter((m) => m.product_slug === slug);

  const getIntegrationsForProduct = (slug: string) =>
    integrations.filter((i) => i.product_a_slug === slug || i.product_b_slug === slug);

  const getScoreAvg = (p: LiveTechProduct): number => {
    const scores = [
      p.score_ease,
      p.score_features,
      p.score_integrations,
      p.score_reporting,
      p.score_scalability,
      p.score_support,
      p.score_value,
    ].filter((n) => n != null) as number[];
    if (scores.length === 0) return 0;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  return (
    <AdminLayout
      title="Tech Database"
      subtitle={`${stats.products} products · ${stats.integrations} integrations · ${stats.middleware} middleware capabilities · ${stats.categoryCount} categories`}
    >
      <div className="max-w-7xl mx-auto">
        <p className="text-sm text-gray-600 mb-6">
          {stats.products} products · {stats.integrations} integrations · {stats.middleware} middleware capabilities · {stats.categoryCount} categories
        </p>

        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by product name, vendor, slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All categories</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>{categoryNameByCode.get(c) ?? c}</option>
            ))}
          </select>
          <select
            value={filterMarketPosition}
            onChange={(e) => setFilterMarketPosition(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All market positions</option>
            <option value="market_leader">Market leader</option>
            <option value="established">Established</option>
            <option value="challenger">Challenger</option>
            <option value="specialist">Specialist</option>
            <option value="emerging">Emerging</option>
          </select>
          <label className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white">
            <input
              type="checkbox"
              checked={filterUkStrong === true}
              onChange={(e) => setFilterUkStrong(e.target.checked ? true : null)}
            />
            <span className="text-sm">UK strong</span>
          </label>
          <label className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white">
            <input
              type="checkbox"
              checked={filterHasZapier === true}
              onChange={(e) => setFilterHasZapier(e.target.checked ? true : null)}
            />
            <span className="text-sm">Has Zapier</span>
          </label>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading products…</p>
        ) : (
          <div className="card overflow-hidden">
            <table className="data-table min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-10 px-4 py-3" />
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th>Category</th>
                  <th>Market</th>
                  <th>UK</th>
                  <th>Price from</th>
                  <th>Scores</th>
                  <th>Integrations</th>
                  <th>Zapier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((p) => {
                  const isExpanded = expandedSlug === p.slug;
                  const scoreAvg = getScoreAvg(p);
                  const intCount = getIntegrationCount(p.slug);
                  const categoryName = categoryNameByCode.get(p.category) ?? p.category;
                  return (
                    <Fragment key={p.slug}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setExpandedSlug(isExpanded ? null : p.slug)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900">{p.product_name}</span>
                          {p.vendor && <span className="block text-xs text-gray-500">{p.vendor}</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{categoryName}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            {p.market_position || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{p.uk_strong ? '✓' : '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {p.price_entry_gbp != null ? `£${Number(p.price_entry_gbp)}/mo` : (p.pricing_model || '—')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-500 rounded-full"
                              style={{ width: `${(scoreAvg / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 ml-1">{scoreAvg > 0 ? scoreAvg.toFixed(1) : '—'}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{intCount}</td>
                        <td className="px-4 py-3 text-sm">{p.has_zapier ? '✓' : '—'}</td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-gray-50">
                          <td colSpan={9} className="px-4 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                              <div>
                                <p className="font-medium text-gray-700 mb-1">Pricing</p>
                                <p className="text-gray-600">
                                  Entry: {p.price_entry_gbp != null ? `£${p.price_entry_gbp}` : '—'} · Mid: {p.price_mid_gbp != null ? `£${p.price_mid_gbp}` : '—'} · Top: {p.price_top_gbp != null ? `£${p.price_top_gbp}` : '—'} {p.is_per_user ? '(per user)' : ''}
                                </p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-700 mb-1">Scores</p>
                                <p className="text-gray-600">
                                  Ease {p.score_ease ?? '—'} · Features {p.score_features ?? '—'} · Integrations {p.score_integrations ?? '—'} · Reporting {p.score_reporting ?? '—'} · Scalability {p.score_scalability ?? '—'} · Support {p.score_support ?? '—'} · Value {p.score_value ?? '—'}
                                </p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-700 mb-1">Sweet spot</p>
                                <p className="text-gray-600">
                                  {p.sweet_min_employees ?? '—'}–{p.sweet_max_employees ?? '—'} employees
                                </p>
                              </div>
                              <div className="md:col-span-2">
                                <p className="font-medium text-gray-700 mb-1">Key strengths</p>
                                <p className="text-gray-600">{(p.key_strengths ?? []).join(' · ') || '—'}</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-700 mb-1">Key weaknesses</p>
                                <p className="text-gray-600">{(p.key_weaknesses ?? []).join(' · ') || '—'}</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-700 mb-1">Best for</p>
                                <p className="text-gray-600">{p.best_for || '—'}</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-700 mb-1">Not ideal for</p>
                                <p className="text-gray-600">{p.not_ideal_for || '—'}</p>
                              </div>
                              <div className="md:col-span-3">
                                <p className="font-medium text-gray-700 mb-1">Integrations</p>
                                <ul className="text-gray-600 space-y-0.5">
                                  {getIntegrationsForProduct(p.slug).slice(0, 10).map((i, idx) => {
                                    const other = i.product_a_slug === p.slug ? i.product_b_slug : i.product_a_slug;
                                    return (
                                      <li key={idx}>{other} · {i.integration_type} · {i.quality}</li>
                                    );
                                  })}
                                  {getIntegrationsForProduct(p.slug).length > 10 && (
                                    <li>+{getIntegrationsForProduct(p.slug).length - 10} more</li>
                                  )}
                                  {getIntegrationsForProduct(p.slug).length === 0 && <li>—</li>}
                                </ul>
                              </div>
                              <div className="md:col-span-3">
                                <p className="font-medium text-gray-700 mb-1">Middleware (triggers/actions)</p>
                                <ul className="text-gray-600 space-y-0.5">
                                  {getMiddlewareForProduct(p.slug).slice(0, 10).map((m, idx) => (
                                    <li key={idx}>{m.platform}: {m.capability_type} – {m.capability_name}</li>
                                  ))}
                                  {getMiddlewareForProduct(p.slug).length > 10 && (
                                    <li>+{getMiddlewareForProduct(p.slug).length - 10} more</li>
                                  )}
                                  {getMiddlewareForProduct(p.slug).length === 0 && <li>—</li>}
                                </ul>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="px-4 py-8 text-center text-gray-500">No products match the filters.</p>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
