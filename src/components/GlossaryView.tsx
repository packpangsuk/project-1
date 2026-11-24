import { useMemo, useState } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { ADMISSION_GLOSSARY, GLOSSARY_CATEGORIES, GlossaryCategory } from '../data/admissionGlossary';
import { AdmissionDataset } from '../types/admission';
import { SourceBanner } from './SourceBanner';

interface GlossaryViewProps {
  dataset: AdmissionDataset | null;
  onOpenJsonModal: () => void;
}

export function GlossaryView({ dataset, onOpenJsonModal }: GlossaryViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<'전체' | GlossaryCategory>('전체');
  const [searchQuery, setSearchQuery] = useState('');

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { 전체: ADMISSION_GLOSSARY.length };
    GLOSSARY_CATEGORIES.forEach((cat) => {
      counts[cat] = 0;
    });
    ADMISSION_GLOSSARY.forEach((item) => {
      counts[item.category] = (counts[item.category] ?? 0) + 1;
    });
    return counts;
  }, []);

  const filteredTerms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ADMISSION_GLOSSARY.filter((item) => {
      if (selectedCategory !== '전체' && item.category !== selectedCategory) return false;
      if (q) {
        const hay = `${item.term} ${item.shortLabel ?? ''} ${item.category} ${item.definition} ${item.howToRead}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <section aria-labelledby="glossary-heading">
      <div className="mb-4">
        <h1 id="glossary-heading" className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          공대 입시 필수 용어 사전
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          전형 유형, 선발 방식, 내신·입결, 수능 최저 등 입시 요강과 비교표를 읽을 때 꼭 필요한 핵심 용어를 정리했습니다.
        </p>
      </div>

      <SourceBanner dataset={dataset} onOpenJsonModal={onOpenJsonModal} />

      {/* 카테고리 탭 */}
      <div className="mb-5">
        <div
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1"
          role="tablist"
          aria-label="입시 용어 분류 선택"
        >
          {(['전체', ...GLOSSARY_CATEGORIES] as const).map((cat) => {
            const active = selectedCategory === cat;
            const count = categoryCounts[cat] ?? 0;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedCategory(cat)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-blue-700 text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>{cat}</span>
                <span className={`tabular-nums ${active ? 'text-blue-100' : 'text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 검색창 및 안내 */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="용어명 또는 키워드 검색 (예: 70%컷, 배수, 세특)"
            aria-label="입시 용어 검색"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
          />
        </div>

        <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
          <BookOpen className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
          <span>대학별 실제 적용 방식은 각 대학 모집요강 및 JSON 기준을 따릅니다.</span>
        </p>
      </div>

      {filteredTerms.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm font-medium text-slate-800">
            검색어에 해당하는 입시 용어가 없습니다.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            다른 키워드로 검색하거나 &ldquo;전체&rdquo; 분류를 선택해 보세요.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTerms.map((item) => (
            <article
              key={item.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300"
            >
              <div>
                <p className="text-xs font-medium text-blue-700">
                  {item.category}
                  {item.shortLabel ? ` · 약칭 ${item.shortLabel}` : ''}
                </p>
                <h2 className="mt-1 text-base font-bold text-slate-900">{item.term}</h2>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-700">{item.definition}</p>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3 text-xs leading-relaxed text-slate-600">
                <span className="font-semibold text-slate-800">입시 요강 읽는 법:</span>{' '}
                {item.howToRead}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
