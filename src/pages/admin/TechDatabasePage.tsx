import { useState, useEffect, Fragment } from 'react';
import { Navigation } from '../../components/Navigation';
import { supabase } from '../../lib/supabase';
import type { Page } from '../../types/navigation';
import type { TechProduct, TechIntegration } from '../../types/tech-stack';
import { Search, Filter, ChevronDown, ChevronRight, AlertTriangle, Database } from 'lucide-react';

interface TechDatabasePageProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export function TechDatabasePage({ currentPage, onNavigate }: TechDatabasePageProps) {
  const [products, setProducts] = useState<TechProduct[]>([]);
  const [integrations, setIntegrations] = useState<TechIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterDataSource, setFilterDataSource] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: productsData, error: e1 } = await supabase
        .from('sa_tech_products')
        .select('*')
        .eq('is_active', true)
        .order('primary_category', { ascending: true });
      if (e1 || cancelled) return;
      const { data: intData } = await supabase
        .from('sa_tech_integrations')
        .select('product_a_slug, product_b_slug, integration_type, integration_quality')
        .eq('is_active', true);
      if (!cancelled) {
        setProducts((productsData as TechProduct[]) || []);
        setIntegrations((intData as TechIntegration[]) || []);
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const categories = Array.from(new Set(products.map((p) => p.primary_category).filter(Boolean))).sort();
  const dataSources = Array.from(new Set(products.map((p) => p.data_source).filter(Boolean))).sort();

  const filtered = products.filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      if (!p.product_name?.toLowerCase().includes(q) && !p.product_slug?.toLowerCase().includes(q) && !p.vendor?.toLowerCase().includes(q)) return false;
    }
    if (filterCategory && p.primary_category !== filterCategory) return false;
    if (filterDataSource && p.data_source !== filterDataSource) return false;
    return true;
  });

  const getIntegrationCount = (slug: string) =>
    integrations.filter((i) => i.product_a_slug === slug || i.product_b_slug === slug).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage={currentPage} onNavigate={onNavigate} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="w-7 h-7" />
            SA Tech Product Database
          </h1>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, slug, vendor..."
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
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filterDataSource}
            onChange={(e) => setFilterDataSource(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All sources</option>
            {dataSources.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading products…</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-10 px-4 py-3" />
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pricing</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scores</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Market</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Integrations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((p) => {
                  const isExpanded = expandedId === p.id;
                  const scoreAvg = [
                    p.score_ease_of_use,
                    p.score_feature_depth,
                    p.score_integration_ecosystem,
                    p.score_reporting,
                    p.score_scalability,
                    p.score_support,
                    p.score_value_for_money,
                  ].filter((n) => n != null).reduce((a, b) => a + b, 0) / 7;
                  const intCount = getIntegrationCount(p.product_slug);
                  return (
                    <Fragment key={p.id}>
                      <tr
                        className="hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : p.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{p.product_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{p.primary_category}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {p.price_entry_gbp != null ? `£${p.price_entry_gbp}` : p.pricing_model}
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-500 rounded-full"
                              style={{ width: `${(scoreAvg / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 ml-1">{scoreAvg.toFixed(1)}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{p.market_position}</td>
                        <td className="px-4 py-3">
                          {p.data_source === 'auto_discovered' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                              <AlertTriangle className="w-3 h-3" />
                              Auto-discovered
                            </span>
                          ) : (
                            <span className="text-sm text-gray-600">{p.data_source}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{intCount}</td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-gray-50">
                          <td colSpan={8} className="px-4 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="font-medium text-gray-700">Strengths</p>
                                <ul className="list-disc list-inside text-gray-600">
                                  {(p.key_strengths || []).slice(0, 3).map((s, i) => (
                                    <li key={i}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <p className="font-medium text-gray-700">Weaknesses</p>
                                <ul className="list-disc list-inside text-gray-600">
                                  {(p.key_weaknesses || []).slice(0, 3).map((s, i) => (
                                    <li key={i}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <p className="font-medium text-gray-700">Pricing notes</p>
                                <p className="text-gray-600">{p.pricing_notes || '—'}</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-700">Integrations</p>
                                <p className="text-gray-600">
                                  {integrations
                                    .filter((i) => i.product_a_slug === p.product_slug || i.product_b_slug === p.product_slug)
                                    .slice(0, 5)
                                    .map((i) => i.product_a_slug === p.product_slug ? i.product_b_slug : i.product_a_slug)
                                    .join(', ') || '—'}
                                </p>
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
    </div>
  );
}
