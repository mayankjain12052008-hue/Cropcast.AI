import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslation } from '@/lib/LanguageContext';
import type { GovernmentScheme } from '@/lib/types';
import {
  Landmark,
  Search,
  Phone,
  ExternalLink,
  FileText,
  CheckCircle2,
  Users,
  Award,
  Wallet,
  Loader2,
  Building2,
  Tag,
  MapPin,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

const CATEGORIES = ['Subsidy', 'Insurance', 'Credit', 'Pension', 'Service'];

const CATEGORY_STYLES: Record<string, { bg: string; text: string; icon: typeof Wallet }> = {
  Subsidy: { bg: 'bg-green-50', text: 'text-green-700', icon: Wallet },
  Insurance: { bg: 'bg-blue-50', text: 'text-blue-700', icon: ShieldCheck },
  Credit: { bg: 'bg-amber-50', text: 'text-amber-700', icon: Landmark },
  Pension: { bg: 'bg-purple-50', text: 'text-purple-700', icon: Award },
  Service: { bg: 'bg-teal-50', text: 'text-teal-700', icon: FileText },
};

export default function GovernmentSchemesView() {
  const { t } = useTranslation();
  const [schemes, setSchemes] = useState<GovernmentScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedScheme, setSelectedScheme] = useState<GovernmentScheme | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('government_schemes')
        .select('*')
        .order('name', { ascending: true });
      if (!error && data) {
        setSchemes(data as GovernmentScheme[]);
      }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return schemes.filter((s) => {
      if (filterCategory !== 'all' && s.category !== filterCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          (s.ministry?.toLowerCase().includes(q) ?? false) ||
          (s.tags?.some((tag) => tag.toLowerCase().includes(q)) ?? false)
        );
      }
      return true;
    });
  }, [schemes, search, filterCategory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-700 via-emerald-800 to-teal-900 p-7 text-white shadow-xl">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -right-16 top-16 h-56 w-56 rounded-full bg-white/5" />
        <div className="relative">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
              <Landmark className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{t('schemes.title')}</h2>
              <p className="text-sm text-green-100/90 mt-1 max-w-xl">{t('schemes.subtitle')}</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3 text-center">
              <p className="text-2xl font-bold">{schemes.length}</p>
              <p className="text-xs text-green-100 mt-0.5">{t('schemes.totalSchemes')}</p>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3 text-center">
              <p className="text-2xl font-bold">{CATEGORIES.length}</p>
              <p className="text-xs text-green-100 mt-0.5">{t('schemes.categories')}</p>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3 text-center">
              <p className="text-2xl font-bold">All</p>
              <p className="text-xs text-green-100 mt-0.5">{t('schemes.allIndia')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('schemes.searchPlaceholder')}
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterCategory('all')}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              filterCategory === 'all' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t('schemes.allCategories')}
          </button>
          {CATEGORIES.map((cat) => {
            const style = CATEGORY_STYLES[cat];
            const Icon = style?.icon ?? Tag;
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  filterCategory === cat ? 'bg-slate-700 text-white' : `${style?.bg ?? 'bg-slate-100'} ${style?.text ?? 'text-slate-600'} hover:opacity-80`
                }`}
              >
                <Icon className="h-3 w-3" />
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scheme cards */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <Landmark className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-3 text-sm text-slate-400">{t('schemes.noSchemes')}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((scheme) => {
            const catStyle = CATEGORY_STYLES[scheme.category ?? 'Service'] ?? CATEGORY_STYLES['Service'];
            const CatIcon = catStyle.icon;
            return (
              <div
                key={scheme.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-green-200 cursor-pointer"
                onClick={() => setSelectedScheme(scheme)}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${catStyle.bg}`}>
                    <CatIcon className={`h-5 w-5 ${catStyle.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 leading-snug">{scheme.name}</h3>
                    <span className={`mt-1 inline-flex items-center gap-1 rounded-full ${catStyle.bg} ${catStyle.text} px-2 py-0.5 text-[10px] font-semibold`}>
                      {scheme.category}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500 leading-relaxed line-clamp-3">{scheme.description}</p>
                {scheme.ministry && (
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Building2 className="h-3.5 w-3.5" />
                    <span className="truncate">{scheme.ministry}</span>
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                  {scheme.tags && scheme.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {scheme.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-green-600">
                    {t('schemes.viewDetails')}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {selectedScheme && (
        <SchemeDetailModal
          scheme={selectedScheme}
          onClose={() => setSelectedScheme(null)}
        />
      )}
    </div>
  );
}

function SchemeDetailModal({ scheme, onClose }: { scheme: GovernmentScheme; onClose: () => void }) {
  const { t } = useTranslation();
  const catStyle = CATEGORY_STYLES[scheme.category ?? 'Service'] ?? CATEGORY_STYLES['Service'];
  const CatIcon = catStyle.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-br from-green-700 via-emerald-800 to-teal-900 px-6 py-5 text-white">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
              <CatIcon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold leading-snug">{scheme.name}</h2>
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold">
                {scheme.category}
              </span>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/80 transition hover:bg-white/20"
            >
              <ExternalLink className="h-4 w-4 rotate-45" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-5 p-6">
          {/* Description */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">{t('schemes.about')}</h3>
            <p className="text-sm text-slate-700 leading-relaxed">{scheme.description}</p>
          </div>

          {/* Ministry */}
          {scheme.ministry && (
            <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3.5">
              <Building2 className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[11px] font-semibold text-slate-400">{t('schemes.ministry')}</p>
                <p className="text-sm text-slate-700">{scheme.ministry}</p>
              </div>
            </div>
          )}

          {/* Benefits */}
          {scheme.benefits && (
            <DetailSection
              icon={<Award className="h-4 w-4" />}
              title={t('schemes.benefits')}
              content={scheme.benefits}
              color="bg-green-50 text-green-600"
            />
          )}

          {/* Eligibility */}
          {scheme.eligibility && (
            <DetailSection
              icon={<Users className="h-4 w-4" />}
              title={t('schemes.eligibility')}
              content={scheme.eligibility}
              color="bg-blue-50 text-blue-600"
            />
          )}

          {/* How to apply */}
          {scheme.how_to_apply && (
            <DetailSection
              icon={<FileText className="h-4 w-4" />}
              title={t('schemes.howToApply')}
              content={scheme.how_to_apply}
              color="bg-amber-50 text-amber-600"
            />
          )}

          {/* Documents required */}
          {scheme.documents_required && (
            <DetailSection
              icon={<CheckCircle2 className="h-4 w-4" />}
              title={t('schemes.documentsRequired')}
              content={scheme.documents_required}
              color="bg-teal-50 text-teal-600"
            />
          )}

          {/* State */}
          {scheme.state && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin className="h-4 w-4 text-slate-400" />
              <span className="font-semibold text-slate-500">{t('schemes.applicableState')}:</span>
              <span>{scheme.state}</span>
            </div>
          )}

          {/* Tags */}
          {scheme.tags && scheme.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {scheme.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer with links */}
        <div className="sticky bottom-0 border-t border-slate-200 bg-white/95 backdrop-blur-sm px-6 py-4">
          <div className="flex items-center gap-3">
            {scheme.helpline && (
              <a
                href={`tel:${scheme.helpline}`}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <Phone className="h-4 w-4 text-green-600" />
                {scheme.helpline}
              </a>
            )}
            {scheme.official_url && (
              <a
                href={scheme.official_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 py-2.5 text-sm font-semibold text-white shadow-md shadow-green-600/20 transition hover:shadow-lg"
              >
                {t('schemes.visitWebsite')}
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailSection({
  icon,
  title,
  content,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  content: string;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${color}`}>
          {icon}
        </div>
        <h3 className="text-sm font-bold text-slate-700">{title}</h3>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed pl-9">{content}</p>
    </div>
  );
}
