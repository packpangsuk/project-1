import { useMemo, useState } from 'react';
import { Calculator, SlidersHorizontal } from 'lucide-react';
import {
  AdmissionDataset,
  CsatGradesInput,
  ENGINEERING_FIELDS,
  MISSING_TEXT,
  UniversityProgram,
} from '../types/admission';
import { displayValue, runAdmissionSimulation } from '../utils/jsonParser';
import { EmptyDataState } from './EmptyDataState';
import { SourceBanner } from './SourceBanner';
import { StatusLabel } from './StatusLabel';

interface GpaSimulatorViewProps {
  dataset: AdmissionDataset | null;
  gpaInput: string;
  onChangeGpaInput: (val: string) => void;
  onSelectProgram: (program: UniversityProgram) => void;
  onOpenJsonModal: () => void;
}

export function GpaSimulatorView({
  dataset,
  gpaInput,
  onChangeGpaInput,
  onSelectProgram,
  onOpenJsonModal,
}: GpaSimulatorViewProps) {
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [fieldFilter, setFieldFilter] = useState<string>('전체');
  const [csat, setCsat] = useState<CsatGradesInput>({
    korean: 2,
    math: 2,
    english: 2,
    inquiry1: 2,
    inquiry2: 2,
  });
  const [directPercentileInput, setDirectPercentileInput] = useState<string>('');

  const parsedGpa = useMemo(() => {
    const n = Number(gpaInput);
    if (!gpaInput.trim() || Number.isNaN(n) || n < 1 || n > 9) return null;
    return Number(n.toFixed(2));
  }, [gpaInput]);

  const parsedDirectPercentile = useMemo(() => {
    if (!directPercentileInput.trim()) return null;
    const n = Number(directPercentileInput);
    if (Number.isNaN(n) || n < 0 || n > 100) return null;
    return Number(n.toFixed(1));
  }, [directPercentileInput]);

  const programs = dataset?.programs ?? [];

  const filteredPrograms = useMemo(() => {
    if (fieldFilter === '전체') return programs;
    return programs.filter((p) => p.field === fieldFilter);
  }, [programs, fieldFilter]);

  const activeTargetProgram = useMemo(() => {
    if (programs.length === 0) return null;
    return programs.find((p) => p.id === selectedProgramId) ?? filteredPrograms[0] ?? programs[0];
  }, [programs, filteredPrograms, selectedProgramId]);

  const focusedSimulation = useMemo(() => {
    if (!activeTargetProgram) return null;
    return runAdmissionSimulation(activeTargetProgram, parsedGpa, csat, parsedDirectPercentile);
  }, [activeTargetProgram, parsedGpa, csat, parsedDirectPercentile]);

  const allSimulations = useMemo(() => {
    return filteredPrograms.map((p) =>
      runAdmissionSimulation(p, parsedGpa, csat, parsedDirectPercentile)
    );
  }, [filteredPrograms, parsedGpa, csat, parsedDirectPercentile]);

  const updateCsatField = (key: keyof CsatGradesInput, raw: string) => {
    if (!raw.trim()) {
      setCsat((prev) => ({ ...prev, [key]: null }));
      return;
    }
    const num = Number(raw);
    if (!Number.isNaN(num)) {
      const clamped = Math.max(1, Math.min(9, num));
      setCsat((prev) => ({ ...prev, [key]: clamped }));
    }
  };

  return (
    <section aria-labelledby="sim-heading">
      <div className="mb-4">
        <h1 id="sim-heading" className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          내신 · 수능 합격 가능성 시뮬레이션
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          내신 평균, 수능 예상 등급, 지원 희망 대학·학과를 입력해 JSON의 전년도 입결 대비 위치(안정/적정/도전), 예상 백분위, 환산 점수를 확인합니다.
        </p>
      </div>

      <SourceBanner dataset={dataset} onOpenJsonModal={onOpenJsonModal} />

      {!dataset ? (
        <EmptyDataState onOpenJsonModal={onOpenJsonModal} />
      ) : (
        <div className="space-y-6">
          {/* 입력 컨트롤 + 선택 학과 정밀 시뮬레이션 결과 2단 구성 */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-stretch">
            {/* 입력 덱 */}
            <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <SlidersHorizontal className="h-4 w-4 text-blue-700" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-slate-900">성적 및 지원 희망 학과 입력</h2>
              </div>

              {/* 내신 평균 */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="gpa-number-input" className="text-xs font-medium text-slate-700">
                    내신 평균 등급 (1.00 ~ 9.00)
                  </label>
                  <span className="font-mono text-xs font-semibold text-blue-700 tabular-nums">
                    {parsedGpa !== null ? `${parsedGpa.toFixed(2)}등급` : '미입력'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="9"
                    step="0.05"
                    value={parsedGpa ?? 2.5}
                    onChange={(e) => onChangeGpaInput(e.target.value)}
                    aria-label="내신 평균 등급 슬라이더"
                    className="flex-1 accent-blue-700"
                  />
                  <input
                    id="gpa-number-input"
                    type="number"
                    min="1"
                    max="9"
                    step="0.01"
                    value={gpaInput}
                    onChange={(e) => onChangeGpaInput(e.target.value)}
                    placeholder="예: 1.85"
                    className="w-24 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-sm text-slate-900 tabular-nums focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* 수능 예상 등급 */}
              <div className="border-t border-slate-100 pt-4">
                <p className="mb-2.5 text-xs font-medium text-slate-700">
                  수능 예상 등급 (1~9등급)
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {(
                    [
                      { key: 'korean', label: '국어' },
                      { key: 'math', label: '수학' },
                      { key: 'english', label: '영어' },
                      { key: 'inquiry1', label: '탐구1' },
                      { key: 'inquiry2', label: '탐구2' },
                    ] as const
                  ).map((sub) => (
                    <div key={sub.key}>
                      <label htmlFor={`csat-${sub.key}`} className="mb-1 block text-[11px] text-slate-500">
                        {sub.label}
                      </label>
                      <input
                        id={`csat-${sub.key}`}
                        type="number"
                        min="1"
                        max="9"
                        step="1"
                        value={csat[sub.key] ?? ''}
                        onChange={(e) => updateCsatField(sub.key, e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center font-mono text-sm text-slate-900 tabular-nums focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <label htmlFor="direct-percentile" className="text-xs text-slate-600 whitespace-nowrap">
                    모의고사 평균 백분위 직접 입력 (선택)
                  </label>
                  <input
                    id="direct-percentile"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={directPercentileInput}
                    onChange={(e) => setDirectPercentileInput(e.target.value)}
                    placeholder="미입력 시 등급 환산"
                    className="w-36 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-right font-mono text-xs text-slate-900 tabular-nums focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* 지원 희망 대학 및 학과 선택 */}
              <div className="border-t border-slate-100 pt-4">
                <label htmlFor="target-program-select" className="mb-1.5 block text-xs font-medium text-slate-700">
                  지원 희망 대학 및 학과 선택
                </label>
                <select
                  id="target-program-select"
                  value={activeTargetProgram?.id ?? ''}
                  onChange={(e) => setSelectedProgramId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                >
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {displayValue(p.university)} — {displayValue(p.department)} ({displayValue(p.admissionType)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 선택 대학·학과 정밀 결과 카드 */}
            <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between">
              {focusedSimulation ? (
                <>
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <p className="text-xs text-slate-500">
                          {displayValue(focusedSimulation.program.university)} ·{' '}
                          {displayValue(focusedSimulation.program.field)} ·{' '}
                          {displayValue(focusedSimulation.program.admissionType)}
                        </p>
                        <h2 className="mt-0.5 text-lg font-bold text-slate-900">
                          {displayValue(focusedSimulation.program.department)} 시뮬레이션 결과
                        </h2>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                        <StatusLabel status={focusedSimulation.overallStatus} />
                      </div>
                    </div>

                    <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="border-b border-slate-100 pb-3 sm:border-b-0 sm:pb-0">
                        <dt className="text-xs text-slate-500">내신 비교 ({focusedSimulation.gpaEval.basisLabel})</dt>
                        <dd className="mt-1 font-mono text-base font-bold text-slate-900 tabular-nums">
                          {parsedGpa !== null ? `${parsedGpa.toFixed(2)}등급` : '미입력'}
                          <span className="mx-1 text-slate-400 font-normal">/</span>
                          <span className="text-sm font-medium text-slate-600">
                            {focusedSimulation.gpaEval.referenceValue !== null
                              ? `${focusedSimulation.gpaEval.referenceValue}등급`
                              : MISSING_TEXT}
                          </span>
                        </dd>
                        <dd className="mt-1 text-xs text-slate-500 tabular-nums">
                          {focusedSimulation.gpaEval.diff !== null
                            ? focusedSimulation.gpaEval.diff <= 0
                              ? `입결 대비 ${Math.abs(focusedSimulation.gpaEval.diff).toFixed(2)}등급 우위`
                              : `입결 대비 +${focusedSimulation.gpaEval.diff.toFixed(2)}등급 차이`
                            : MISSING_TEXT}
                        </dd>
                      </div>

                      <div className="border-b border-slate-100 pb-3 sm:border-b-0 sm:pb-0">
                        <dt className="text-xs text-slate-500">예상 백분위 · 전년도 백분위</dt>
                        <dd className="mt-1 font-mono text-base font-bold text-slate-900 tabular-nums">
                          {focusedSimulation.estimatedPercentile !== null
                            ? `${focusedSimulation.estimatedPercentile}%`
                            : MISSING_TEXT}
                          <span className="mx-1 text-slate-400 font-normal">/</span>
                          <span className="text-sm font-medium text-slate-600">
                            {focusedSimulation.percentileEval.cutoffPercentile !== null
                              ? `${focusedSimulation.percentileEval.cutoffPercentile}%`
                              : MISSING_TEXT}
                          </span>
                        </dd>
                        <dd className="mt-1 text-xs text-slate-500 tabular-nums">
                          {focusedSimulation.csatAvgGrade !== null
                            ? `수능 평균 ${focusedSimulation.csatAvgGrade}등급`
                            : '수능 등급 미입력'}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-xs text-slate-500">환산 점수 · 전년도 환산</dt>
                        <dd className="mt-1 font-mono text-base font-bold text-slate-900 tabular-nums">
                          {focusedSimulation.convertedScore.userScore !== null
                            ? `${focusedSimulation.convertedScore.userScore}점`
                            : MISSING_TEXT}
                          <span className="mx-1 text-slate-400 font-normal">/</span>
                          <span className="text-sm font-medium text-slate-600">
                            {focusedSimulation.convertedScore.cutoffScore !== null
                              ? `${focusedSimulation.convertedScore.cutoffScore}점`
                              : MISSING_TEXT}
                          </span>
                        </dd>
                        <dd className="mt-1 text-xs text-slate-500">
                          {focusedSimulation.convertedScore.basis}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-600 space-y-1">
                      <p>
                        <strong className="text-slate-800">수능 최저 기준:</strong>{' '}
                        {displayValue(focusedSimulation.program.csatMinimum)}
                      </p>
                      {focusedSimulation.program.notes && (
                        <p>
                          <strong className="text-slate-800">비고:</strong>{' '}
                          {focusedSimulation.program.notes}
                        </p>
                      )}
                      {dataset.cutoffCaution && (
                        <p className="text-slate-600">
                          <strong className="text-slate-800">입결 참고:</strong> {dataset.cutoffCaution}
                        </p>
                      )}
                      <p className="text-slate-500">
                        판정 기준: JSON에 명시된 안정/적정 기준이 있으면 우선 적용하며, 없을 경우 전년도 입결 대비 -0.20 이하 안정, +0.15 이하 적정, +0.15 초과 도전으로 분류합니다. JSON에 입결 수치가 없으면 &ldquo;정보 없음&rdquo;으로 표시합니다.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                    <span>
                      기준 연도:{' '}
                      <strong className="text-slate-800">
                        {displayValue(focusedSimulation.program.referenceYear ?? dataset.referenceYear)}
                      </strong>{' '}
                      · 출처:{' '}
                      <strong className="text-slate-800">
                        {displayValue(focusedSimulation.program.source ?? dataset.source)}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectProgram(focusedSimulation.program)}
                      className="font-semibold text-blue-700 hover:underline whitespace-nowrap"
                    >
                      전체 요강 보기
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  비교할 학과를 선택해 주세요.
                </div>
              )}
            </div>
          </div>

          {/* 전체 학과 일괄 비교 */}
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-slate-900">
                  등록 학과별 합격 위치 일괄 비교 ({allSimulations.length}건)
                </h2>
              </div>

              <select
                value={fieldFilter}
                onChange={(e) => setFieldFilter(e.target.value)}
                aria-label="계열 필터"
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-none"
              >
                <option value="전체">전체 계열</option>
                {ENGINEERING_FIELDS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {allSimulations.map((sim) => {
                const p = sim.program;
                return (
                  <article
                    key={p.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs text-slate-500 truncate">
                          {displayValue(p.university)} · {displayValue(p.field)}
                        </p>
                        <StatusLabel status={sim.overallStatus} />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProgramId(p.id);
                          onSelectProgram(p);
                        }}
                        className="mt-1 text-left text-sm font-bold text-slate-900 hover:text-blue-700"
                      >
                        {displayValue(p.department)}
                      </button>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {displayValue(p.admissionType)}
                        {p.admissionName ? ` · ${p.admissionName}` : ''}
                      </p>
                      {p.notes && (
                        <p className="mt-1.5 text-[11px] text-slate-600 line-clamp-1">
                          {p.notes}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs tabular-nums">
                      <span className="text-slate-600">
                        입결:{' '}
                        <strong className="text-slate-900">
                          {sim.gpaEval.referenceValue !== null
                            ? `${sim.gpaEval.referenceValue}등급`
                            : MISSING_TEXT}
                        </strong>
                      </span>
                      <span className="font-mono text-slate-600">
                        {sim.gpaEval.diff !== null
                          ? sim.gpaEval.diff <= 0
                            ? `${sim.gpaEval.diff.toFixed(2)}`
                            : `+${sim.gpaEval.diff.toFixed(2)}`
                          : MISSING_TEXT}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
