import { useMemo, useState } from 'react';
import { BookMarked, ExternalLink, Loader2, RefreshCw, Search } from 'lucide-react';
import { JINHAK_CORE_PRINCIPLES, JINHAK_SAENGIBU_GUIDES } from '../data/jinhakSaengibu';
import { AdmissionDataset, ENGINEERING_FIELDS } from '../types/admission';
import { SourceBanner } from './SourceBanner';

interface SaengibuGuideViewProps {
  dataset: AdmissionDataset | null;
  onOpenJsonModal: () => void;
}

interface LiveJinhakArticle {
  id: string;
  title: string;
  field: string;
  summary: string;
  keywords: string[];
  link: string | null;
  sourceTitle: string;
}

export function SaengibuGuideView({ dataset, onOpenJsonModal }: SaengibuGuideViewProps) {
  const [selectedField, setSelectedField] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [liveArticles, setLiveArticles] = useState<LiveJinhakArticle[] | null>(null);

  const filteredGuides = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return JINHAK_SAENGIBU_GUIDES.filter((g) => {
      if (selectedField !== '전체' && g.field !== selectedField) return false;
      if (q) {
        const hay = `${g.field} ${g.recommendedSubjects} ${g.keywords.join(' ')} ${g.evaluationPoint} ${g.topics
          .map((t) => `${t.subjects} ${t.title} ${t.process}`)
          .join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [selectedField, searchQuery]);

  const handleFetchLiveJinhak = async () => {
    setLiveLoading(true);
    setLiveError(null);
    try {
      const response = await fetch('/api/jinhak-saengibu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: selectedField }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '진학사 자료 검색에 실패했습니다.');
      }
      setLiveArticles(Array.isArray(data.articles) ? data.articles : []);
    } catch (err) {
      setLiveError(err instanceof Error ? err.message : '진학사 칼럼 조회 중 오류가 발생했습니다.');
    } finally {
      setLiveLoading(false);
    }
  };

  return (
    <section aria-labelledby="saengibu-heading">
      <div className="mb-4">
        <h1 id="saengibu-heading" className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          진학사 공대 생기부 · 세특 가이드 모음
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          진학사(jinhak.com)의 공학계열 학생부종합전형 분석을 바탕으로 9개 공대 계열별 세특 핵심 과목과 탐구 주제를 모았습니다.
        </p>
      </div>

      <SourceBanner dataset={dataset} onOpenJsonModal={onOpenJsonModal} />

      {/* 진학사 공대 생기부 3대 핵심 원칙 및 공식 바로가기 */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-700">출처: 진학사 (jinhak.com) 입시전략 가이드</p>
            <h2 className="mt-0.5 text-base font-bold text-slate-900">
              공대 학생부종합전형 세특 관리 핵심 원칙
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href="https://www.jinhak.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 transition-colors hover:bg-blue-100 whitespace-nowrap"
            >
              진학사 공식 사이트
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
            <a
              href="https://www.adiga.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-blue-700 whitespace-nowrap"
            >
              대입정보포털 어디가
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            </a>
            <a
              href="https://www.uway.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-blue-700 whitespace-nowrap"
            >
              유웨이
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={handleFetchLiveJinhak}
              disabled={liveLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-60 whitespace-nowrap"
            >
              {liveLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  진학사 칼럼 검색 중...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  진학사 칼럼 더 찾기
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {JINHAK_CORE_PRINCIPLES.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <p className="text-xs font-bold text-slate-900">
                0{idx + 1}. {item.title}
              </p>
              <p className="text-xs leading-relaxed text-slate-600">{item.summary}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 실시간 진학사 검색 결과 */}
      {liveError && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700" role="alert">
          {liveError}
        </div>
      )}

      {liveArticles && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">
              실시간 진학사 검색 칼럼 ({liveArticles.length}건)
            </h2>
            <span className="text-xs text-slate-500">Google 실시간 검색 연동</span>
          </div>
          {liveArticles.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">검색된 진학사 칼럼이 없습니다.</p>
          ) : (
            <div className="mt-3 divide-y divide-slate-100">
              {liveArticles.map((art) => (
                <div key={art.id} className="py-3 first:pt-1 last:pb-0 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-blue-700">{art.field}</span>
                    {art.link && (
                      <a
                        href={art.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
                      >
                        원문 보기
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{art.title}</h3>
                  <p className="text-xs leading-relaxed text-slate-600">{art.summary}</p>
                  {art.keywords.length > 0 && (
                    <p className="text-[11px] text-slate-500">
                      키워드: {art.keywords.join(' · ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 9개 공대 계열 선택 탭 */}
      <div className="mb-5">
        <div
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1"
          role="tablist"
          aria-label="생기부 계열 선택"
        >
          {['전체', ...ENGINEERING_FIELDS].map((field) => {
            const active = selectedField === field;
            return (
              <button
                key={field}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedField(field)}
                className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-blue-700 text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {field}
              </button>
            );
          })}
        </div>
      </div>

      {/* 검색바 */}
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
            placeholder="과목, 탐구 주제, 키워드 검색 (예: 밴드갭, FFT, 아레니우스)"
            aria-label="공대 생기부 주제 검색"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
          />
        </div>

        <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
          <BookMarked className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
          <span>표시 중인 공학 계열 가이드 {filteredGuides.length}개</span>
        </p>
      </div>

      {/* 계열별 공대 생기부 카드 목록 */}
      {filteredGuides.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm font-medium text-slate-800">
            검색 조건에 맞는 생기부 가이드가 없습니다.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            검색어를 지우거나 &ldquo;전체&rdquo; 계열을 선택해 주세요.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredGuides.map((guide) => (
            <article
              key={guide.field}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5"
            >
              <div>
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <p className="text-xs font-medium text-blue-700">
                      권장 교과 · {guide.recommendedSubjects}
                    </p>
                    <h2 className="mt-0.5 text-lg font-bold text-slate-900">{guide.field} 계열</h2>
                  </div>
                  <span className="text-xs text-slate-500 tabular-nums">
                    추천 주제 {guide.topics.length}건
                  </span>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-slate-600">
                  <strong className="font-semibold text-slate-800">핵심 키워드:</strong>{' '}
                  {guide.keywords.join(' · ')}
                </p>

                <p className="mt-2 text-xs leading-relaxed text-slate-700">
                  <strong className="font-semibold text-slate-900">진학사 평가 포인트:</strong>{' '}
                  {guide.evaluationPoint}
                </p>

                <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
                  {guide.topics.map((topic, idx) => (
                    <div key={idx} className="py-3 last:pb-0">
                      <p className="text-[11px] font-semibold text-slate-500">{topic.subjects}</p>
                      <h3 className="mt-0.5 text-sm font-bold text-slate-900 leading-snug">
                        {topic.title}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">{topic.process}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                <span>출처: 진학사(jinhak.com) 공학계열 세특 가이드 요약</span>
                <a
                  href="https://www.jinhak.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline whitespace-nowrap"
                >
                  진학사 보기
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
