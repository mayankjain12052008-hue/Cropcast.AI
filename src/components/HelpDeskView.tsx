import { useState, useEffect, useMemo } from 'react';
import type { Expert } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useTranslation } from '@/lib/LanguageContext';
import {
  Headphones,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  Clock,
  Languages,
  Star,
  Search,
  Briefcase,
  Award,
  UserCircle2,
  ExternalLink,
  Loader2,
  Info,
} from 'lucide-react';

const SPECIALIZATIONS = [
  'Plant Pathology',
  'Entomology & Pest Management',
  'Agronomy & Crop Science',
  'Soil Science & Fertilizer Management',
  'Nematology & Integrated Pest Management',
  'Plant Breeding & Genetics',
];

export default function HelpDeskView() {
  const { t } = useTranslation();
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSpec, setFilterSpec] = useState('all');
  const [filterRegion, setFilterRegion] = useState('all');

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('experts')
        .select('*')
        .order('rating', { ascending: false });
      if (!error && data) {
        setExperts(data as Expert[]);
      }
      setLoading(false);
    })();
  }, []);

  const regions = useMemo(() => {
    const set = new Set<string>();
    experts.forEach((e) => { if (e.region) set.add(e.region); });
    return Array.from(set).sort();
  }, [experts]);

  const filtered = useMemo(() => {
    return experts.filter((e) => {
      if (filterSpec !== 'all' && e.specialization !== filterSpec) return false;
      if (filterRegion !== 'all' && e.region !== filterRegion) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.name.toLowerCase().includes(q) ||
          e.specialization.toLowerCase().includes(q) ||
          (e.organization?.toLowerCase().includes(q) ?? false) ||
          (e.region?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [experts, search, filterSpec, filterRegion]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-green-600 via-emerald-700 to-teal-800 p-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <Headphones className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{t('helpdesk.title')}</h2>
            <p className="text-sm text-green-100 mt-1">{t('helpdesk.subtitle')}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3 text-center">
            <p className="text-2xl font-bold">{experts.length}</p>
            <p className="text-xs text-green-100 mt-0.5">{t('helpdesk.expertsAvailable')}</p>
          </div>
          <div className="rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3 text-center">
            <p className="text-2xl font-bold">{SPECIALIZATIONS.length}</p>
            <p className="text-xs text-green-100 mt-0.5">{t('helpdesk.specializations')}</p>
          </div>
          <div className="rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3 text-center">
            <p className="text-2xl font-bold">{regions.length}</p>
            <p className="text-xs text-green-100 mt-0.5">{t('helpdesk.regionsCovered')}</p>
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
            placeholder={t('helpdesk.searchPlaceholder')}
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterSpec('all')}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              filterSpec === 'all' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t('helpdesk.allSpecializations')}
          </button>
          {SPECIALIZATIONS.map((spec) => (
            <button
              key={spec}
              onClick={() => setFilterSpec(spec)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                filterSpec === spec ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
        {regions.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">{t('helpdesk.filterRegion')}</span>
            <button
              onClick={() => setFilterRegion('all')}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                filterRegion === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t('helpdesk.allRegions')}
            </button>
            {regions.map((region) => (
              <button
                key={region}
                onClick={() => setFilterRegion(region)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  filterRegion === region ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Expert cards */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <UserCircle2 className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-3 text-sm text-slate-400">{t('helpdesk.noExperts')}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((expert) => (
            <ExpertCard key={expert.id} expert={expert} />
          ))}
        </div>
      )}

      {/* Info banner */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">{t('helpdesk.infoTitle')}</p>
            <p className="text-sm text-blue-700 mt-1 leading-relaxed">{t('helpdesk.infoDesc')}</p>
          </div>
        </div>
      </div>

      {/* Emergency contacts */}
      <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50/50 p-6">
        <h3 className="text-sm font-bold text-amber-800 mb-4">{t('helpdesk.emergencyContacts')}</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/80 border border-amber-100 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Phone className="h-4 w-4 text-amber-600" />
              <p className="text-sm font-semibold text-slate-700">Kisan Call Center</p>
            </div>
            <a href="tel:18001801551" className="text-lg font-bold text-amber-700 hover:underline">1800-180-1551</a>
            <p className="text-xs text-slate-500 mt-1">{t('helpdesk.kisanCallCenterDesc')}</p>
          </div>
          <div className="rounded-xl bg-white/80 border border-amber-100 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Phone className="h-4 w-4 text-amber-600" />
              <p className="text-sm font-semibold text-slate-700">{t('helpdesk.plantProtection')}</p>
            </div>
            <a href="tel:+911123234910" className="text-lg font-bold text-amber-700 hover:underline">+91-11-23234910</a>
            <p className="text-xs text-slate-500 mt-1">{t('helpdesk.plantProtectionDesc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpertCard({ expert }: { expert: Expert }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const stars = (rating: number) => {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${
              i < full
                ? 'fill-amber-400 text-amber-400'
                : i === full && half
                  ? 'fill-amber-200 text-amber-400'
                  : 'text-slate-200'
            }`}
          />
        ))}
        <span className="ml-1 text-xs font-bold text-slate-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-green-200">
      {/* Top: avatar + name + rating */}
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100">
          {expert.image_url ? (
            <img src={expert.image_url} alt={expert.name} className="h-14 w-14 rounded-2xl object-cover" />
          ) : (
            <UserCircle2 className="h-8 w-8 text-green-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-slate-800 truncate">{expert.name}</h3>
          <p className="text-sm text-green-600 font-medium truncate">{expert.specialization}</p>
          <div className="mt-1">{stars(expert.rating)}</div>
        </div>
      </div>

      {/* Details */}
      <div className="mt-4 space-y-2">
        {expert.organization && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Briefcase className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate">{expert.organization}</span>
          </div>
        )}
        {expert.region && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <span>{expert.region}</span>
          </div>
        )}
        {expert.experience_years > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Award className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <span>{expert.experience_years} {t('helpdesk.yearsExperience')}</span>
          </div>
        )}
        {expert.languages && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Languages className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <span>{expert.languages}</span>
          </div>
        )}
        {expert.availability && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Clock className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <span>{expert.availability}</span>
          </div>
        )}
      </div>

      {/* Expand for contact */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
      >
        {expanded ? t('helpdesk.hideContact') : t('helpdesk.showContact')}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {expert.phone && (
            <a
              href={`tel:${expert.phone}`}
              className="flex items-center gap-3 rounded-xl border border-green-100 bg-green-50/50 p-3 transition hover:bg-green-50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
                <Phone className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500">{t('helpdesk.phone')}</p>
                <p className="text-sm font-semibold text-slate-700">{expert.phone}</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </a>
          )}
          {expert.whatsapp && (
            <a
              href={`https://wa.me/${expert.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 transition hover:bg-emerald-50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
                <MessageCircle className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500">WhatsApp</p>
                <p className="text-sm font-semibold text-slate-700">{expert.whatsapp}</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </a>
          )}
          {expert.email && (
            <a
              href={`mailto:${expert.email}`}
              className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-3 transition hover:bg-blue-50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                <Mail className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500">{t('helpdesk.email')}</p>
                <p className="text-sm font-semibold text-slate-700 truncate">{expert.email}</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
