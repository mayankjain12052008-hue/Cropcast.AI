import { useTranslation } from '@/lib/LanguageContext';
import { Newspaper, ArrowUpRight, Cpu, Satellite, FlaskConical, Sprout } from 'lucide-react';

interface NewsItem {
  id: string;
  categoryKey: string;
  titleKey: string;
  excerptKey: string;
  source: string;
  date: string;
  image: string;
  icon: React.ReactNode;
  badgeColor: string;
}

const NEWS_ITEMS: NewsItem[] = [
  {
    id: 'ai-disease-detection',
    categoryKey: 'news.catAI',
    titleKey: 'news.aiTitle',
    excerptKey: 'news.aiExcerpt',
    source: 'AgriTech Daily',
    date: 'Oct 9, 2026',
    image: 'https://images.pexels.com/photos/3912469/pexels-photo-3912469.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
    icon: <Cpu className="h-4 w-4" />,
    badgeColor: 'text-blue-600 border-blue-200',
  },
  {
    id: 'drone-spraying',
    categoryKey: 'news.catDrones',
    titleKey: 'news.droneTitle',
    excerptKey: 'news.droneExcerpt',
    source: 'FarmTech Weekly',
    date: 'Oct 7, 2026',
    image: 'https://images.pexels.com/photos/34182367/pexels-photo-34182367.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
    icon: <Satellite className="h-4 w-4" />,
    badgeColor: 'text-green-600 border-green-200',
  },
  {
    id: 'precision-irrigation',
    categoryKey: 'news.catIoT',
    titleKey: 'news.iotTitle',
    excerptKey: 'news.iotExcerpt',
    source: 'Smart Farming Review',
    date: 'Oct 5, 2026',
    image: 'https://images.pexels.com/photos/34182297/pexels-photo-34182297.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
    icon: <Sprout className="h-4 w-4" />,
    badgeColor: 'text-orange-600 border-orange-200',
  },
  {
    id: 'vertical-farming',
    categoryKey: 'news.catVertical',
    titleKey: 'news.verticalTitle',
    excerptKey: 'news.verticalExcerpt',
    source: 'Future Agriculture',
    date: 'Oct 3, 2026',
    image: 'https://images.pexels.com/photos/10269715/pexels-photo-10269715.jpeg?auto=compress&cs=tinysrgb&h=400&w=600',
    icon: <FlaskConical className="h-4 w-4" />,
    badgeColor: 'text-teal-600 border-teal-200',
  },
];

export default function AgriNewsSection() {
  const { t } = useTranslation();

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-sm">
            <Newspaper className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">{t('news.heading')}</h3>
            <p className="text-xs text-slate-400">{t('news.subheading')}</p>
          </div>
        </div>
        <span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-semibold text-green-600">
          {t('news.live')}
        </span>
      </div>

      {/* Featured article — first item */}
      <a
        href="#"
        onClick={(e) => e.preventDefault()}
        className="group mb-5 block overflow-hidden rounded-xl border border-slate-100 transition-all hover:border-slate-200 hover:shadow-md"
      >
        <div className="relative h-48 overflow-hidden">
          <img
            src={NEWS_ITEMS[0].image}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold backdrop-blur-sm bg-white/90 ${NEWS_ITEMS[0].badgeColor}`}>
              {NEWS_ITEMS[0].icon}
              {t(NEWS_ITEMS[0].categoryKey)}
            </span>
            <h4 className="mt-2 text-sm font-bold leading-snug text-white">
              {t(NEWS_ITEMS[0].titleKey)}
            </h4>
          </div>
          <ArrowUpRight className="absolute right-3 top-3 h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <div className="p-4">
          <p className="text-xs leading-relaxed text-slate-500 line-clamp-2">
            {t(NEWS_ITEMS[0].excerptKey)}
          </p>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
            <span className="font-medium text-slate-500">{NEWS_ITEMS[0].source}</span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span>{NEWS_ITEMS[0].date}</span>
          </div>
        </div>
      </a>

      {/* Secondary articles — remaining items */}
      <div className="grid sm:grid-cols-3 gap-3">
        {NEWS_ITEMS.slice(1).map((item) => (
          <a
            key={item.id}
            href="#"
            onClick={(e) => e.preventDefault()}
            className="group flex flex-col overflow-hidden rounded-xl border border-slate-100 transition-all hover:border-slate-200 hover:shadow-sm"
          >
            <div className="relative h-24 overflow-hidden">
              <img
                src={item.image}
                alt=""
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
              <span className={`absolute left-2 top-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold backdrop-blur-sm bg-white/90 ${item.badgeColor}`}>
                {item.icon}
                {t(item.categoryKey)}
              </span>
            </div>
            <div className="flex flex-1 flex-col p-3">
              <h4 className="text-xs font-semibold leading-snug text-slate-700 line-clamp-2 group-hover:text-green-700 transition-colors">
                {t(item.titleKey)}
              </h4>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400 line-clamp-2 flex-1">
                {t(item.excerptKey)}
              </p>
              <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className="font-medium text-slate-500">{item.source}</span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span>{item.date}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
