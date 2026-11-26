import { useMemo, useState } from 'react';
import { Calendar, ChevronRight, GitCompareArrows, Search, Star } from 'lucide-react';
import {
  AdmissionDataset,
  ENGINEERING_FIELDS,
  MISSING_TEXT,
  UniversityProgram,
} from '../types/admission';
import { computeDday, displayValue } from '../utils/jsonParser';
import { EmptyDataState } from './EmptyDataState';
import { SourceBanner } from './SourceBanner';

interface FieldExplorerViewProps {
  dataset: AdmissionDataset | null;
  selectedField: string;
  onSelectField: (field: string) => void;
  favoriteIds: Set<string>;
  compareIds: Set<string>;
  onToggleFavorite: (id: string) => void;
  onToggleCompare: (id: string) => void;
  onSelectProgram: (program: UniversityProgram) => void;
  onOpenJsonModal: () => void;
}

export function FieldExplorerView({
  dataset,
  selectedField,
  onSelectField,
  favoriteIds,
  compareIds,
  onToggleFavorite,
  onToggleCompare,
  onSelectProgram,
  onOpenJsonModal,
}: FieldExplorerViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [admissionFilter, setAdmissionFilter] = useState('전체');
  const [groupFilter, setGroupFilter] = useState('전체');
  const [universityFilter, setUniversityFilter] = useState('전체');

  const programs = dataset?.programs ?? [];

  const availableGroups = useMemo(() => {
    const set = new Set<string>();
    programs.forEach((p) => {
      if (p.universityGroup) set.add(p.universityGroup);
    });
    return ['전체', ...Array.from(set)];
  }, [programs]);

  const availableUniversities = useMemo(() => {
    const set = new Set<string>();
    programs.forEach((p) => {
      if (groupFilter !== '전체' && p.universityGroup !== groupFilter) return;
      if (p.university) set.add(p.university);
    });
    return ['전체', ...Array.from(set)];
  }, [programs, groupFilter]);

  const admissionTypes = useMemo(() => {
    const set = new Set<string>();
    programs.forEach((p) => {
      if (p.admissionType) set.add(p.admissionType);
    });
    return ['전체', ...Array.from(set)];
  }, [programs]);

  const availableFields = useMemo(() => {
    const extra: string[] = [];
    programs.forEach((p) => {
      if (
        p.field &&
        !(ENGINEERING_FIELDS as readonly string[]).includes(p.field) &&
        !extra.includes(p.field)
      ) {
        extra.push(p.field);
      }
    });
    return [...ENGINEERING_FIELDS, ...extra];
  }, [programs]);

  const fieldCounts = useMemo(() => {
    const counts: Record<string, number> = { 전체: programs.length };
    availableFields.forEach((f) => {
      counts[f] = 0;
    });
    programs.forEach((p) => {
      if (p.field) {
        counts[p.field] = (counts[p.field] ?? 0) + 1;
      }
    });
    return counts;
  }, [programs, availableFields]);

  const filteredPrograms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return programs.filter((p) => {
      if (selectedField !== '전체' && p.field !== selectedField) return false;
      if (groupFilter !== '전체' && p.universityGroup !== groupFilter) return false;
      if (universityFilter !== '전체' && p.university !== universityFilter) return false;
      if (admissionFilter !== '전체' && p.admissionType !== admissionFilter) return false;
      if (q) {
        const hay = `${p.university ?? ''} ${p.universityGroup ?? ''} ${p.department ?? ''} ${p.field ?? ''} ${p.admissionType ?? ''} ${p.admissionName ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [programs, selectedField, groupFilter, universityFilter, admissionFilter, searchQuery]);

  const getNearestMilestone = (p: UniversityProgram) => {
    const entries = [
      { label: '원서', raw: p.schedules.application },
      { label: '서류', raw: p.schedules.document },
      { label: '1단계', raw: p.schedules.stage1Announcement ?? null },
      { label: '면접', raw: p.schedules.interview },
      { label: '발표', raw: p.schedules.announcement },
    ];
    for (const e of entries) {
      const res = computeDday(e.raw);
      if (res.status === 'today' || res.status === 'ongoing' || res.status === 'upcoming') {
        return { label: e.label, dday: res.label };
      }
    }
    const firstValid = entries.find((e) => e.raw);
    if (firstValid) {
      return { label: firstValid.label, dday: computeDday(firstValid.raw).label };
    }
    return { label: '일정', dday: MISSING_TEXT };
  };

  return (
    <section aria-labelledby="explorer-heading">
      <div className="mb-4">
        <h1 id="explorer-heading" className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          공대 계열별 대학 및 학과 탐색
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          관심 공학 계열과 대학 권역(SKY · 인서울 · 지방거점국립대)을 선택하면 대학별 전형 정보를 카드로 확인할 수 있습니다.
        </p>
      </div>

      <SourceBanner dataset={dataset} onOpenJsonModal={onOpenJsonModal} />

      {/* 9대 학과 계열 선택 바 */}
      <div className="mb-5">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1" role="tablist" aria-label="학과 계열 선택">
          {['전체', ...availableFields].map((field) => {
            const active = selectedField === field;
            const count = fieldCounts[field] ?? 0;
            return (
              <button
                key={field}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelectField(field)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-blue-700 text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>{field}</span>
                {dataset && (
                  <span className={`tabular-nums ${active ? 'text-blue-100' : 'text-slate-400'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {!dataset ? (
        <EmptyDataState onOpenJsonModal={onOpenJsonModal} />
      ) : (
        <>
          {/* 대학 구분 · 대학 선택 */}
          {availableGroups.length > 1 && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-xs font-medium text-slate-500 whitespace-nowrap shrink-0 mr-1">대학 권역</span>
                {availableGroups.map((grp) => (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => {
                      setGroupFilter(grp);
                      setUniversityFilter('전체');
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      groupFilter === grp
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {grp === '지방거점국립대' ? '지방거점국립대(9개교)' : grp}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="explorer-univ-select" className="text-xs font-medium text-slate-500 whitespace-nowrap">
                  대학 선택
                </label>
                <select
                  id="explorer-univ-select"
                  value={universityFilter}
                  onChange={(e) => setUniversityFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-none"
                >
                  <option value="전체">전체 대학 ({availableUniversities.length - 1}개교)</option>
                  {availableUniversities.slice(1).map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* 검색 및 전형 필터 */}
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="대학명, 학과명, 전형 검색"
                aria-label="대학명, 학과명, 전형 검색"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
              {admissionTypes.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 whitespace-nowrap shrink-0">전형 필터</span>
                  {admissionTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAdmissionFilter(type)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        admissionFilter === type
                          ? 'bg-slate-900 text-white'
                          : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
              <span className="text-xs text-slate-500 whitespace-nowrap tabular-nums">
                {filteredPrograms.length}건
              </span>
            </div>
          </div>

          {filteredPrograms.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-sm font-medium text-slate-800">
                선택한 조건({selectedField})에 해당하는 대학/학과 정보가 없습니다.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                다른 계열을 선택하거나 JSON 데이터에 해당 계열 학과를 추가해 보세요.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPrograms.map((p) => {
                const isFav = favoriteIds.has(p.id);
                const isCmp = compareIds.has(p.id);
                const nearest = getNearestMilestone(p);

                return (
                  <article
                    key={p.id}
                    className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-medium text-slate-500 truncate">
                          {displayValue(p.university)}
                          {p.universityGroup ? ` · ${p.universityGroup}` : ''} · {displayValue(p.field)}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => onToggleFavorite(p.id)}
                            aria-label={isFav ? '관심 학과 해제' : '관심 학과 즐겨찾기'}
                            aria-pressed={isFav}
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-amber-600"
                          >
                            <Star
                              className={`h-4 w-4 ${isFav ? 'fill-amber-500 text-amber-500' : ''}`}
                              aria-hidden="true"
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggleCompare(p.id)}
                            aria-label={isCmp ? '비교함에서 제거' : '비교함에 추가'}
                            aria-pressed={isCmp}
                            className={`rounded-lg p-1.5 transition-colors ${
                              isCmp
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-slate-400 hover:bg-slate-100 hover:text-blue-700'
                            }`}
                          >
                            <GitCompareArrows className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      <h3 className="mt-1 text-base font-bold text-slate-900">
                        {displayValue(p.department)}
                      </h3>

                      <p className="mt-1 text-xs text-slate-600">
                        {displayValue(p.admissionType)}
                        {p.admissionName ? ` · ${p.admissionName}` : ''}
                      </p>

                      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-slate-100 pt-3.5 text-xs">
                        <div>
                          <dt className="text-slate-500">모집 인원</dt>
                          <dd className="mt-0.5 font-semibold text-slate-900 tabular-nums">
                            {displayValue(p.quota)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">전년도 입결</dt>
                          <dd className="mt-0.5 font-semibold text-slate-900 tabular-nums truncate">
                            {p.cutoff.rawText ??
                              (p.cutoff.representative !== null ? `${p.cutoff.representative}등급` : MISSING_TEXT)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">학생부 비율</dt>
                          <dd className="mt-0.5 font-medium text-slate-800 truncate">
                            {displayValue(p.gpaRatio)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">수능 최저</dt>
                          <dd className="mt-0.5 font-medium text-slate-800 truncate">
                            {displayValue(p.csatMinimum)}
                          </dd>
                        </div>
                      </dl>

                      {p.notes && (
                        <p className="mt-3 text-xs text-slate-600 leading-relaxed line-clamp-2">
                          <span className="font-medium text-slate-800">비고:</span> {p.notes}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 tabular-nums">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                        {nearest.label}: <strong className="font-semibold text-blue-700">{nearest.dday}</strong>
                      </span>

                      <button
                        type="button"
                        onClick={() => onSelectProgram(p)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-blue-700 whitespace-nowrap"
                      >
                        상세 보기
                        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
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
