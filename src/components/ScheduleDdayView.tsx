import { useMemo, useState } from 'react';
import { CalendarClock, Star } from 'lucide-react';
import { AdmissionDataset, MISSING_TEXT, UniversityProgram } from '../types/admission';
import { computeDday, displayValue } from '../utils/jsonParser';
import { EmptyDataState } from './EmptyDataState';
import { SourceBanner } from './SourceBanner';

interface ScheduleDdayViewProps {
  dataset: AdmissionDataset | null;
  favoriteIds: Set<string>;
  onSelectProgram: (program: UniversityProgram) => void;
  onOpenJsonModal: () => void;
}

export function ScheduleDdayView({
  dataset,
  favoriteIds,
  onSelectProgram,
  onOpenJsonModal,
}: ScheduleDdayViewProps) {
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [groupFilter, setGroupFilter] = useState('전체');
  const [universityFilter, setUniversityFilter] = useState('전체');

  const availableGroups = useMemo(() => {
    const set = new Set<string>();
    (dataset?.programs ?? []).forEach((p) => {
      if (p.universityGroup) set.add(p.universityGroup);
    });
    return Array.from(set);
  }, [dataset]);

  const availableUniversities = useMemo(() => {
    const set = new Set<string>();
    (dataset?.programs ?? []).forEach((p) => {
      if (groupFilter !== '전체' && p.universityGroup !== groupFilter) return;
      if (p.university) set.add(p.university);
    });
    return Array.from(set);
  }, [dataset, groupFilter]);

  const programs = useMemo(() => {
    let list = dataset?.programs ?? [];
    if (onlyFavorites) list = list.filter((p) => favoriteIds.has(p.id));
    if (groupFilter !== '전체') list = list.filter((p) => p.universityGroup === groupFilter);
    if (universityFilter !== '전체') list = list.filter((p) => p.university === universityFilter);
    return list;
  }, [dataset, onlyFavorites, favoriteIds, groupFilter, universityFilter]);

  const ddayColorClass = (status: string) => {
    if (status === 'today' || status === 'ongoing') return 'text-red-700 font-semibold';
    if (status === 'upcoming') return 'text-blue-700 font-semibold';
    if (status === 'passed') return 'text-slate-400 font-medium';
    return 'text-slate-400 font-normal';
  };

  return (
    <section aria-labelledby="schedule-heading">
      <div className="mb-4">
        <h1 id="schedule-heading" className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          전형 일정 및 D-day 카운터
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          원서 접수, 서류 제출, 면접, 합격자 발표일의 남은 일수(D-day)를 오늘 날짜 기준으로 계산합니다.
        </p>
      </div>

      <SourceBanner dataset={dataset} onOpenJsonModal={onOpenJsonModal} />

      {!dataset ? (
        <EmptyDataState onOpenJsonModal={onOpenJsonModal} />
      ) : (
        <>
          {dataset.scheduleMemo && (
            <div className="mb-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-700 leading-relaxed">
              <strong className="font-semibold text-slate-900">일정 안내:</strong> {dataset.scheduleMemo}
            </div>
          )}
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOnlyFavorites(false)}
                className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  !onlyFavorites
                    ? 'bg-blue-700 text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                전체 일정 ({dataset.programs.length})
              </button>
              <button
                type="button"
                onClick={() => setOnlyFavorites(true)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  onlyFavorites
                    ? 'bg-blue-700 text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Star className="h-3.5 w-3.5" aria-hidden="true" />
                관심 학과만 ({favoriteIds.size})
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {availableGroups.length > 0 && (
                <select
                  aria-label="대학 권역 필터"
                  value={groupFilter}
                  onChange={(e) => {
                    setGroupFilter(e.target.value);
                    setUniversityFilter('전체');
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-none"
                >
                  <option value="전체">전체 권역</option>
                  {availableGroups.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              )}

              {availableUniversities.length > 1 && (
                <select
                  aria-label="대학 필터"
                  value={universityFilter}
                  onChange={(e) => setUniversityFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-none"
                >
                  <option value="전체">전체 대학</option>
                  {availableUniversities.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {programs.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-sm font-medium text-slate-800">표시할 전형 일정이 없습니다.</p>
              <p className="mt-1 text-xs text-slate-500">
                관심 학과를 등록하거나 전체 일정으로 전환해 주세요.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {programs.map((p) => {
                const milestones = [
                  { key: 'application', label: '원서 접수', raw: p.schedules.application },
                  { key: 'document', label: '서류 제출', raw: p.schedules.document },
                  { key: 'stage1Announcement', label: '1단계 발표', raw: p.schedules.stage1Announcement ?? null },
                  { key: 'interview', label: '면접', raw: p.schedules.interview },
                  { key: 'announcement', label: '최초합격 발표', raw: p.schedules.announcement },
                ];

                return (
                  <article
                    key={p.id}
                    className="rounded-xl border border-slate-200 bg-white p-5"
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <p className="text-xs text-slate-500">
                          {displayValue(p.university)} · {displayValue(p.field)} · {displayValue(p.admissionType)}
                        </p>
                        <button
                          type="button"
                          onClick={() => onSelectProgram(p)}
                          className="mt-0.5 text-left text-base font-bold text-slate-900 hover:text-blue-700"
                        >
                          {displayValue(p.department)}
                        </button>
                      </div>
                      <CalendarClock className="h-4 w-4 text-slate-400 shrink-0 mt-1" aria-hidden="true" />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                      {milestones.map((m) => {
                        const res = computeDday(m.raw);
                        return (
                          <div key={m.key} className="space-y-1">
                            <span className="block text-xs text-slate-500">{m.label}</span>
                            <span
                              className={`block font-mono text-sm tabular-nums ${ddayColorClass(res.status)}`}
                            >
                              {res.label}
                            </span>
                            <span className="block text-[11px] text-slate-500 tabular-nums break-words">
                              {res.formattedDate || MISSING_TEXT}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}
