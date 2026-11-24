import { useMemo, useState } from 'react';
import { CheckSquare, Plus, Square, Star, Trash2 } from 'lucide-react';
import {
  AdmissionDataset,
  MISSING_TEXT,
  UniversityProgram,
  UserChecklistItem,
} from '../types/admission';
import { displayValue } from '../utils/jsonParser';
import { SourceBanner } from './SourceBanner';

interface FavoritesChecklistViewProps {
  dataset: AdmissionDataset | null;
  favoriteIds: Set<string>;
  checklistItems: UserChecklistItem[];
  onToggleFavorite: (id: string) => void;
  onAddChecklistItem: (admissionType: string, text: string) => void;
  onToggleChecklistItem: (id: string) => void;
  onDeleteChecklistItem: (id: string) => void;
  onSelectProgram: (program: UniversityProgram) => void;
  onOpenJsonModal: () => void;
}

const DEFAULT_ADMISSION_TYPES = ['학생부교과', '학생부종합', '논술', '정시'];

export function FavoritesChecklistView({
  dataset,
  favoriteIds,
  checklistItems,
  onToggleFavorite,
  onAddChecklistItem,
  onToggleChecklistItem,
  onDeleteChecklistItem,
  onSelectProgram,
  onOpenJsonModal,
}: FavoritesChecklistViewProps) {
  const admissionTypes = useMemo(() => {
    const set = new Set<string>(DEFAULT_ADMISSION_TYPES);
    dataset?.programs.forEach((p) => {
      if (p.admissionType) set.add(p.admissionType);
    });
    if (dataset?.jsonChecklists) {
      Object.keys(dataset.jsonChecklists).forEach((k) => set.add(k));
    }
    checklistItems.forEach((item) => {
      if (item.admissionType) set.add(item.admissionType);
    });
    return Array.from(set);
  }, [dataset, checklistItems]);

  const [activeType, setActiveType] = useState<string>(admissionTypes[0] ?? '학생부교과');
  const [newTaskText, setNewTaskText] = useState('');

  const favoritePrograms = useMemo(() => {
    return (dataset?.programs ?? []).filter((p) => favoriteIds.has(p.id));
  }, [dataset, favoriteIds]);

  const jsonChecklistForType = dataset?.jsonChecklists?.[activeType] ?? [];
  const personalItemsForType = useMemo(() => {
    return checklistItems.filter((item) => item.admissionType === activeType);
  }, [checklistItems, activeType]);

  const totalCount = personalItemsForType.length;
  const completedCount = personalItemsForType.filter((i) => i.checked).length;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTaskText.trim();
    if (!trimmed) return;
    onAddChecklistItem(activeType, trimmed);
    setNewTaskText('');
  };

  return (
    <section aria-labelledby="favorites-heading">
      <div className="mb-4">
        <h1 id="favorites-heading" className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          관심 학과 즐겨찾기 및 전형별 준비 체크리스트
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          즐겨찾기한 목표 공대 학과를 모아보고 전형 유형별 준비 사항을 체크리스트로 관리합니다.
        </p>
      </div>

      <SourceBanner dataset={dataset} onOpenJsonModal={onOpenJsonModal} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* 관심 학과 즐겨찾기 */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              관심 학과 즐겨찾기 ({favoritePrograms.length})
            </h2>
          </div>

          {!dataset ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              입시 JSON 데이터를 입력하면 학과를 즐겨찾기할 수 있습니다.
            </div>
          ) : favoritePrograms.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
              <p className="text-sm font-medium text-slate-800">즐겨찾기한 학과가 없습니다.</p>
              <p className="mt-1 text-xs text-slate-500">
                계열별 탐색에서 별표 아이콘을 눌러 관심 학과를 등록해 주세요.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {favoritePrograms.map((p) => (
                <article
                  key={p.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
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
                    <p className="mt-1 text-xs text-slate-600 tabular-nums">
                      모집인원: {displayValue(p.quota)} · 입결:{' '}
                      {p.cutoff.rawText ??
                        (p.cutoff.representative !== null ? `${p.cutoff.representative}등급` : MISSING_TEXT)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(p.id)}
                    aria-label="즐겨찾기 해제"
                    className="rounded-lg p-2 text-amber-500 hover:bg-slate-100 shrink-0"
                  >
                    <Star className="h-4 w-4 fill-amber-500" aria-hidden="true" />
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* 전형별 준비 체크리스트 */}
        <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-white p-5 space-y-4 self-start">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h2 className="text-sm font-semibold text-slate-900">전형별 준비 체크리스트</h2>
            <span className="font-mono text-xs font-semibold text-blue-700 tabular-nums">
              완료 {completedCount} / {totalCount}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {admissionTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setActiveType(type)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  activeType === type
                    ? 'bg-blue-700 text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* JSON에 포함된 전형별 체크리스트가 있는 경우 표시 */}
          {jsonChecklistForType.length > 0 ? (
            <div className="border-t border-slate-100 pt-3">
              <p className="mb-2 text-xs font-medium text-slate-600">JSON 등록 기본 항목</p>
              <ul className="space-y-1.5 text-xs text-slate-800">
                {jsonChecklistForType.map((text, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-slate-400" aria-hidden="true">•</span>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              JSON 체크리스트 항목: {MISSING_TEXT} (아래에서 개인 준비 항목을 직접 추가할 수 있습니다)
            </p>
          )}

          {/* 개인 준비 항목 추가 폼 */}
          <form onSubmit={handleAdd} className="flex items-center gap-2">
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder={`${activeType} 준비 항목 입력 (예: 생기부 세특 점검)`}
              aria-label="새 체크리스트 항목"
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              추가
            </button>
          </form>

          {personalItemsForType.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-500">
              등록된 개인 준비 체크리스트가 없습니다.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 border-t border-slate-100">
              {personalItemsForType.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2 py-2.5">
                  <button
                    type="button"
                    onClick={() => onToggleChecklistItem(item.id)}
                    className="flex flex-1 items-center gap-2.5 text-left text-sm"
                  >
                    {item.checked ? (
                      <CheckSquare className="h-4 w-4 text-blue-700 shrink-0" aria-hidden="true" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
                    )}
                    <span className={item.checked ? 'text-slate-400 line-through' : 'text-slate-800'}>
                      {item.text}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteChecklistItem(item.id)}
                    aria-label="항목 삭제"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600 shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
