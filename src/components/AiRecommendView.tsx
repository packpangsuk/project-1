import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import {
  AdmissionDataset,
  AiRecommendationResultItem,
  ENGINEERING_FIELDS,
  MISSING_TEXT,
} from '../types/admission';
import { EmptyDataState } from './EmptyDataState';
import { SourceBanner } from './SourceBanner';
import { StatusLabel } from './StatusLabel';

interface AiRecommendViewProps {
  dataset: AdmissionDataset | null;
  gpaInput: string;
  onChangeGpaInput: (val: string) => void;
  onOpenJsonModal: () => void;
}

export function AiRecommendView({
  dataset,
  gpaInput,
  onChangeGpaInput,
  onOpenJsonModal,
}: AiRecommendViewProps) {
  const [csatSummary, setCsatSummary] = useState('국어 2등급, 수학 1등급, 영어 2등급, 탐구 2등급');
  const [interests, setInterests] = useState('');
  const [preferredFields, setPreferredFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AiRecommendationResultItem[] | null>(null);

  const togglePreferredField = (field: string) => {
    setPreferredFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const handleRecommend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataset || dataset.programs.length === 0) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/recommend-major', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gpa: gpaInput.trim() || '미입력',
          csatGrades: csatSummary.trim() || '미입력',
          interests: interests.trim(),
          preferredFields,
          programs: dataset.programs,
          referenceYear: dataset.referenceYear ?? MISSING_TEXT,
          source: dataset.source ?? MISSING_TEXT,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'AI 학과 추천 요청에 실패했습니다.');
      }
      setResults(Array.isArray(data.recommendations) ? data.recommendations : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-labelledby="ai-recommend-heading">
      <div className="mb-4">
        <h1 id="ai-recommend-heading" className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          AI 맞춤 공대 학과 추천
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          내신·수능 성적과 관심사를 입력하면 업로드된 JSON 데이터를 기반으로 가장 적합한 공대 학과와 예상 커트라인을 추천합니다.
        </p>
      </div>

      <SourceBanner dataset={dataset} onOpenJsonModal={onOpenJsonModal} />

      {!dataset ? (
        <EmptyDataState
          title="AI 학과 추천을 위해 먼저 입시 JSON 데이터를 입력해 주세요"
          description="AI 추천 결과는 반드시 사용자가 입력한 JSON 데이터에 존재하는 대학과 학과만 근거로 생성되며, JSON에 없는 특징이나 커트라인은 '정보 없음'으로 표시됩니다."
          onOpenJsonModal={onOpenJsonModal}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <form
            onSubmit={handleRecommend}
            className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 space-y-4 self-start"
          >
            <div>
              <label htmlFor="ai-gpa" className="mb-1.5 block text-xs font-medium text-slate-700">
                내신 평균 등급
              </label>
              <input
                id="ai-gpa"
                type="number"
                min="1"
                max="9"
                step="0.01"
                value={gpaInput}
                onChange={(e) => onChangeGpaInput(e.target.value)}
                placeholder="예: 1.85"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="ai-csat" className="mb-1.5 block text-xs font-medium text-slate-700">
                수능 성적 (등급 또는 백분위)
              </label>
              <input
                id="ai-csat"
                type="text"
                value={csatSummary}
                onChange={(e) => setCsatSummary(e.target.value)}
                placeholder="예: 국어 2등급, 수학 1등급, 영어 2등급, 과탐 평균 2등급"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="ai-interests" className="mb-1.5 block text-xs font-medium text-slate-700">
                관심 분야 및 진로 키워드
              </label>
              <textarea
                id="ai-interests"
                rows={3}
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="예: AI 반도체 공정, 임베디드 시스템, 배터리 소재 연구, 소프트웨어 개발"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <span className="mb-2 block text-xs font-medium text-slate-700">
                희망 계열 (선택, 미선택 시 전체 계열 탐색)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {ENGINEERING_FIELDS.map((field) => {
                  const selected = preferredFields.includes(field);
                  return (
                    <button
                      key={field}
                      type="button"
                      onClick={() => togglePreferredField(field)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                        selected
                          ? 'bg-blue-700 text-white'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {field}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  JSON 데이터 기반 학과 분석 중...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  맞춤 공대 학과 추천받기
                </>
              )}
            </button>
          </form>

          <div className="lg:col-span-7 space-y-4">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
                {error}
              </div>
            )}

            {!results && !loading && !error && (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
                <p className="text-sm font-medium text-slate-800">
                  성적과 관심사를 입력한 후 &ldquo;맞춤 공대 학과 추천받기&rdquo;를 눌러주세요.
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  등록된 {dataset.programs.length}개 학과 중에서 적합한 후보와 JSON 기준 커트라인을 분석해 드립니다.
                </p>
              </div>
            )}

            {results && results.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
                <p className="text-sm font-medium text-slate-800">추천 가능한 학과를 찾지 못했습니다.</p>
                <p className="mt-1 text-xs text-slate-500">조건을 조정하거나 JSON 데이터를 확인해 주세요.</p>
              </div>
            )}

            {results &&
              results.map((rec, idx) => (
                <article
                  key={`${rec.university}-${rec.department}-${idx}`}
                  className="rounded-xl border border-slate-200 bg-white p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-500">
                        {rec.university} · {rec.field} · {rec.admissionType}
                      </p>
                      <h3 className="mt-0.5 text-base font-bold text-slate-900">
                        {idx + 1}. {rec.department}
                      </h3>
                    </div>
                    <StatusLabel status={rec.fitLevel} />
                  </div>

                  <p className="text-sm leading-relaxed text-slate-700">{rec.matchReason}</p>

                  <dl className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 text-xs sm:grid-cols-2">
                    <div>
                      <dt className="text-slate-500">학과 주요 특징</dt>
                      <dd className="mt-1 font-medium text-slate-900 leading-relaxed">{rec.features}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">예상 커트라인 (JSON 입결 기준)</dt>
                      <dd className="mt-1 font-semibold text-slate-900 tabular-nums">{rec.expectedCutoff}</dd>
                    </div>
                  </dl>

                  <div className="border-t border-slate-100 pt-2.5 text-xs text-slate-500">
                    기준 연도: <strong className="text-slate-700">{rec.referenceYear}</strong> · 출처:{' '}
                    <strong className="text-slate-700">{rec.source}</strong>
                  </div>
                </article>
              ))}
          </div>
        </div>
      )}
    </section>
  );
}
