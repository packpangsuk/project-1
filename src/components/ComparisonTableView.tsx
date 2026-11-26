import { useMemo, useState } from 'react';
import { GitCompareArrows, Star, Trash2 } from 'lucide-react';
import {
  AdmissionDataset,
  ENGINEERING_FIELDS,
  MISSING_TEXT,
  UniversityProgram,
} from '../types/admission';
import { displayValue } from '../utils/jsonParser';
import { EmptyDataState } from './EmptyDataState';
import { SourceBanner } from './SourceBanner';

interface ComparisonTableViewProps {
  dataset: AdmissionDataset | null;
  compareIds: Set<string>;
  favoriteIds: Set<string>;
  onToggleCompare: (id: string) => void;
  onClearCompare: () => void;
  onSelectProgram: (program: UniversityProgram) => void;
  onOpenJsonModal: () => void;
}

type CompareScope = 'selected' | 'favorites' | 'all';

export function ComparisonTableView({
  dataset,
  compareIds,
  favoriteIds,
  onToggleCompare,
  onClearCompare,
  onSelectProgram,
  onOpenJsonModal,
}: ComparisonTableViewProps) {
  const [scope, setScope] = useState<CompareScope>(compareIds.size > 0 ? 'selected' : 'all');
  const [fieldFilter, setFieldFilter] = useState('전체');
  const [groupFilter, setGroupFilter] = useState('전체');
  const [universityFilter, setUniversityFilter] = useState('전체');

  const programs = dataset?.programs ?? [];

  const availableGroups = useMemo(() => {
    const set = new Set<string>();
    programs.forEach((p) => {
      if (p.universityGroup) set.add(p.universityGroup);
    });
    return Array.from(set);
  }, [programs]);

  const availableUniversities = useMemo(() => {
    const set = new Set<string>();
    programs.forEach((p) => {
      if (groupFilter !== '전체' && p.universityGroup !== groupFilter) return;
      if (p.university) set.add(p.university);
    });
    return Array.from(set);
  }, [programs, groupFilter]);

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

  const targetPrograms = useMemo(() => {
    let base = programs;
    if (scope === 'selected') {
      base = programs.filter((p) => compareIds.has(p.id));
    } else if (scope === 'favorites') {
      base = programs.filter((p) => favoriteIds.has(p.id));
    }
    if (groupFilter !== '전체') {
      base = base.filter((p) => p.universityGroup === groupFilter);
    }
    if (universityFilter !== '전체') {
      base = base.filter((p) => p.university === universityFilter);
    }
    if (fieldFilter !== '전체') {
      base = base.filter((p) => p.field === fieldFilter);
    }
    return base;
  }, [programs, scope, compareIds, favoriteIds, groupFilter, universityFilter, fieldFilter]);

  return (
    <section aria-labelledby="compare-heading">
      <div className="mb-4">
        <h1 id="compare-heading" className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          대학별 전형 비교표
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          전형 유형, 모집 인원, 지원 자격, 학생부 반영 비율, 수능 최저학력기준을 한눈에 비교합니다.
        </p>
      </div>

      <SourceBanner dataset={dataset} onOpenJsonModal={onOpenJsonModal} />

      {!dataset ? (
        <EmptyDataState onOpenJsonModal={onOpenJsonModal} />
      ) : (
        <>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  scope === 'all'
                    ? 'bg-blue-700 text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                전체 학과 ({programs.length})
              </button>
              <button
                type="button"
                onClick={() => setScope('selected')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  scope === 'selected'
                    ? 'bg-blue-700 text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <GitCompareArrows className="h-3.5 w-3.5" aria-hidden="true" />
                비교함 선택 ({compareIds.size})
              </button>
              <button
                type="button"
                onClick={() => setScope('favorites')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  scope === 'favorites'
                    ? 'bg-blue-700 text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Star className="h-3.5 w-3.5" aria-hidden="true" />
                관심 학과 ({favoriteIds.size})
              </button>

              {scope === 'selected' && compareIds.size > 0 && (
                <button
                  type="button"
                  onClick={onClearCompare}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-red-600 whitespace-nowrap"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  비교함 비우기
                </button>
              )}
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

              <select
                id="compare-field-select"
                aria-label="계열 필터"
                value={fieldFilter}
                onChange={(e) => setFieldFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-none"
              >
                <option value="전체">전체 계열</option>
                {availableFields.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {targetPrograms.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-sm font-medium text-slate-800">
                비교할 학과가 없습니다.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {scope === 'selected'
                  ? '계열별 탐색 화면에서 카드 우측 상단의 비교 아이콘을 눌러 학과를 담아보세요.'
                  : scope === 'favorites'
                  ? '별표(즐겨찾기)로 등록한 관심 학과가 없습니다.'
                  : '해당 계열의 학과 데이터가 없습니다.'}
              </p>
            </div>
          ) : (
            <>
              {/* 데스크톱 비교 테이블 */}
              <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                      <th className="px-4 py-3 whitespace-nowrap">대학 · 학과</th>
                      <th className="px-4 py-3 whitespace-nowrap">전형 유형</th>
                      <th className="px-4 py-3 whitespace-nowrap text-right">모집 인원</th>
                      <th className="px-4 py-3">지원 자격</th>
                      <th className="px-4 py-3">학생부 반영 비율</th>
                      <th className="px-4 py-3">수능 최저</th>
                      <th className="px-4 py-3 whitespace-nowrap">전년도 입결</th>
                      <th className="px-4 py-3 whitespace-nowrap text-right">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {targetPrograms.map((p) => {
                      const inCmp = compareIds.has(p.id);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3.5 align-top">
                            <button
                              type="button"
                              onClick={() => onSelectProgram(p)}
                              className="text-left group"
                            >
                              <div className="text-xs text-slate-500">
                                {displayValue(p.university)} · {displayValue(p.field)}
                              </div>
                              <div className="font-semibold text-slate-900 group-hover:text-blue-700">
                                {displayValue(p.department)}
                              </div>
                            </button>
                          </td>
                          <td className="px-4 py-3.5 align-top text-xs text-slate-800 whitespace-nowrap">
                            <div className="font-medium">{displayValue(p.admissionType)}</div>
                            {p.admissionName && (
                              <div className="mt-0.5 text-slate-500">{p.admissionName}</div>
                            )}
                          </td>
                          <td className="px-4 py-3.5 align-top text-right font-medium text-slate-900 tabular-nums whitespace-nowrap">
                            {displayValue(p.quota)}
                          </td>
                          <td className="px-4 py-3.5 align-top text-xs text-slate-700 min-w-[180px] max-w-[240px] leading-relaxed">
                            {displayValue(p.eligibility)}
                          </td>
                          <td className="px-4 py-3.5 align-top text-xs text-slate-800 tabular-nums min-w-[140px]">
                            {displayValue(p.gpaRatio)}
                          </td>
                          <td className="px-4 py-3.5 align-top text-xs text-slate-800 min-w-[140px]">
                            {displayValue(p.csatMinimum)}
                          </td>
                          <td className="px-4 py-3.5 align-top text-xs font-medium text-slate-900 tabular-nums">
                            <div className="whitespace-nowrap">
                              {p.cutoff.rawText ??
                                (p.cutoff.representative !== null ? `${p.cutoff.representative}등급` : MISSING_TEXT)}
                            </div>
                            {p.notes && (
                              <div className="mt-1 font-normal text-slate-500 max-w-[200px] leading-snug">
                                {p.notes}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3.5 align-top text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => onToggleCompare(p.id)}
                              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                                inCmp
                                  ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {inCmp ? '담김' : '비교 담기'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 모바일 비교 카드 스택 */}
              <div className="space-y-3 md:hidden">
                {targetPrograms.map((p) => {
                  const inCmp = compareIds.has(p.id);
                  return (
                    <article
                      key={p.id}
                      className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs text-slate-500">
                            {displayValue(p.university)} · {displayValue(p.field)}
                          </p>
                          <h3 className="text-base font-bold text-slate-900">
                            {displayValue(p.department)}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => onToggleCompare(p.id)}
                          className={`rounded-lg px-2.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 ${
                            inCmp
                              ? 'bg-blue-50 text-blue-700'
                              : 'border border-slate-200 text-slate-600'
                          }`}
                        >
                          {inCmp ? '담김' : '비교 담기'}
                        </button>
                      </div>

                      <dl className="mt-3 divide-y divide-slate-100 border-t border-slate-100 text-xs">
                        <div className="flex justify-between gap-3 py-2">
                          <dt className="text-slate-500 shrink-0">전형 유형</dt>
                          <dd className="font-medium text-slate-900 text-right">
                            {displayValue(p.admissionType)}
                            {p.admissionName ? ` (${p.admissionName})` : ''}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3 py-2">
                          <dt className="text-slate-500 shrink-0">모집 인원</dt>
                          <dd className="font-semibold text-slate-900 tabular-nums text-right">
                            {displayValue(p.quota)}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3 py-2">
                          <dt className="text-slate-500 shrink-0">지원 자격</dt>
                          <dd className="text-slate-800 text-right">{displayValue(p.eligibility)}</dd>
                        </div>
                        <div className="flex justify-between gap-3 py-2">
                          <dt className="text-slate-500 shrink-0">학생부 반영 비율</dt>
                          <dd className="font-medium text-slate-900 tabular-nums text-right">
                            {displayValue(p.gpaRatio)}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3 py-2">
                          <dt className="text-slate-500 shrink-0">수능 최저</dt>
                          <dd className="font-medium text-slate-900 text-right">
                            {displayValue(p.csatMinimum)}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3 py-2">
                          <dt className="text-slate-500 shrink-0">전년도 입결</dt>
                          <dd className="font-semibold text-slate-900 tabular-nums text-right">
                            {p.cutoff.rawText ??
                              (p.cutoff.representative !== null ? `${p.cutoff.representative}등급` : MISSING_TEXT)}
                          </dd>
                        </div>
                        {p.notes && (
                          <div className="flex justify-between gap-3 py-2">
                            <dt className="text-slate-500 shrink-0">비고</dt>
                            <dd className="text-slate-700 text-right">{p.notes}</dd>
                          </div>
                        )}
                      </dl>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
