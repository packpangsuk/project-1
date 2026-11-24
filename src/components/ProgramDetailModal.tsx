import { ExternalLink, GitCompareArrows, Star, X } from 'lucide-react';
import { MISSING_TEXT, UniversityProgram } from '../types/admission';
import { computeDday, displayValue } from '../utils/jsonParser';

interface ProgramDetailModalProps {
  program: UniversityProgram | null;
  isFavorite: boolean;
  isCompared: boolean;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onToggleCompare: (id: string) => void;
}

export function ProgramDetailModal({
  program,
  isFavorite,
  isCompared,
  onClose,
  onToggleFavorite,
  onToggleCompare,
}: ProgramDetailModalProps) {
  if (!program) return null;

  const scheduleRows = [
    { label: '원서 접수', raw: program.schedules.application },
    { label: '서류 제출', raw: program.schedules.document },
    { label: '면접', raw: program.schedules.interview },
    { label: '발표일', raw: program.schedules.announcement },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-t-2xl border border-slate-200 bg-white shadow-xl sm:rounded-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">
              {displayValue(program.university)} · {displayValue(program.field)}
            </p>
            <h2 id="detail-modal-title" className="mt-0.5 text-lg font-bold text-slate-900">
              {displayValue(program.department)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 shrink-0"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500">전형 유형</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">
                {displayValue(program.admissionType)}
                {program.admissionName ? ` (${program.admissionName})` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">모집 인원</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900 tabular-nums">
                {displayValue(program.quota)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">학생부 반영 비율</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900 tabular-nums">
                {displayValue(program.gpaRatio)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">수능 최저학력기준</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">
                {displayValue(program.csatMinimum)}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-slate-500">지원 자격</dt>
              <dd className="mt-1 text-sm text-slate-800 leading-relaxed">
                {displayValue(program.eligibility)}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-slate-500">학과 주요 특징</dt>
              <dd className="mt-1 text-sm text-slate-800 leading-relaxed">
                {displayValue(program.features)}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-slate-500">전년도 입결</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900 tabular-nums">
                {program.cutoff.rawText ?? (program.cutoff.representative !== null ? `${program.cutoff.representative}등급` : MISSING_TEXT)}
              </dd>
            </div>
            {program.notes && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-slate-500">비고</dt>
                <dd className="mt-1 text-sm text-slate-800 leading-relaxed">
                  {program.notes}
                </dd>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-xs font-semibold text-slate-700 mb-3">전형 일정 및 D-day</h3>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {scheduleRows.map((row) => {
                const dday = computeDday(row.raw);
                return (
                  <div
                    key={row.label}
                    className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm"
                  >
                    <div>
                      <span className="text-xs text-slate-500 block">{row.label}</span>
                      <span className="font-medium text-slate-900 tabular-nums">
                        {dday.formattedDate}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-semibold text-blue-700 tabular-nums">
                      {dday.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              기준 연도: <strong className="text-slate-700">{displayValue(program.referenceYear)}</strong> · 출처:{' '}
              <strong className="text-slate-700">{displayValue(program.source)}</strong>
            </span>
            {program.link ? (
              <a
                href={program.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline"
              >
                관련 링크 열기
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            ) : (
              <span>관련 링크: {MISSING_TEXT}</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleFavorite(program.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                isFavorite
                  ? 'border-amber-300 bg-amber-50 text-amber-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Star className={`h-3.5 w-3.5 ${isFavorite ? 'fill-amber-500 text-amber-500' : ''}`} aria-hidden="true" />
              {isFavorite ? '관심 학과 해제' : '관심 학과 즐겨찾기'}
            </button>
            <button
              type="button"
              onClick={() => onToggleCompare(program.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                isCompared
                  ? 'border-blue-300 bg-blue-50 text-blue-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <GitCompareArrows className="h-3.5 w-3.5" aria-hidden="true" />
              {isCompared ? '비교표에서 제외' : '비교표에 담기'}
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
