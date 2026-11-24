import { useEffect, useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import {
  ActiveTab,
  AdmissionDataset,
  NoticeAlertItem,
  UniversityProgram,
  UserChecklistItem,
} from './types/admission';
import { buildScheduleAlertsFromJson, parseAdmissionJson } from './utils/jsonParser';
import { FieldExplorerView } from './components/FieldExplorerView';
import { ComparisonTableView } from './components/ComparisonTableView';
import { ScheduleDdayView } from './components/ScheduleDdayView';
import { GpaSimulatorView } from './components/GpaSimulatorView';
import { AiRecommendView } from './components/AiRecommendView';
import { AlertsNewsView } from './components/AlertsNewsView';
import { FavoritesChecklistView } from './components/FavoritesChecklistView';
import { GlossaryView } from './components/GlossaryView';
import { SaengibuGuideView } from './components/SaengibuGuideView';
import { JsonInputModal } from './components/JsonInputModal';
import { ProgramDetailModal } from './components/ProgramDetailModal';
import userDefaultData from './data/userAdmissions2027.json';

const DEFAULT_ADMISSIONS_RAW_JSON = JSON.stringify(userDefaultData, null, 2);

const STORAGE_KEYS = {
  RAW_JSON: 'gongdae_raw_json_v4',
  FAVORITES: 'gongdae_favorites_v1',
  COMPARE: 'gongdae_compare_v1',
  CHECKLIST: 'gongdae_checklist_v1',
  GPA: 'gongdae_gpa_v1',
};

type NavGroup = 'explorer' | 'compare' | 'schedule-alerts' | 'diagnosis-ai' | 'favorites' | 'guide-glossary';

export default function App() {
  const [rawJson, setRawJson] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RAW_JSON);
      return saved !== null ? saved : DEFAULT_ADMISSIONS_RAW_JSON;
    } catch {
      return DEFAULT_ADMISSIONS_RAW_JSON;
    }
  });

  const [dataset, setDataset] = useState<AdmissionDataset | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RAW_JSON);
      const sourceText = saved !== null ? saved : DEFAULT_ADMISSIONS_RAW_JSON;
      if (!sourceText.trim()) return null;
      return parseAdmissionJson(sourceText).dataset;
    } catch {
      return parseAdmissionJson(DEFAULT_ADMISSIONS_RAW_JSON).dataset;
    }
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('explorer');
  const [selectedField, setSelectedField] = useState<string>('전체');
  const [isJsonModalOpen, setIsJsonModalOpen] = useState<boolean>(false);
  const [detailProgram, setDetailProgram] = useState<UniversityProgram | null>(null);
  const [liveAlerts, setLiveAlerts] = useState<NoticeAlertItem[]>([]);

  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      return saved ? new Set(JSON.parse(saved) as string[]) : new Set();
    } catch {
      return new Set();
    }
  });

  const [compareIds, setCompareIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COMPARE);
      return saved ? new Set(JSON.parse(saved) as string[]) : new Set();
    } catch {
      return new Set();
    }
  });

  const [checklistItems, setChecklistItems] = useState<UserChecklistItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHECKLIST);
      return saved ? (JSON.parse(saved) as UserChecklistItem[]) : [];
    } catch {
      return [];
    }
  });

  const [gpaInput, setGpaInput] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.GPA) ?? '2.00';
    } catch {
      return '2.00';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(Array.from(favoriteIds)));
    } catch {
      // ignore storage quota errors
    }
  }, [favoriteIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COMPARE, JSON.stringify(Array.from(compareIds)));
    } catch {
      // ignore
    }
  }, [compareIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CHECKLIST, JSON.stringify(checklistItems));
    } catch {
      // ignore
    }
  }, [checklistItems]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.GPA, gpaInput);
    } catch {
      // ignore
    }
  }, [gpaInput]);

  const urgentAlertCount = useMemo(() => {
    return buildScheduleAlertsFromJson(dataset).length + liveAlerts.length;
  }, [dataset, liveAlerts]);

  const activeNavGroup: NavGroup = useMemo(() => {
    if (activeTab === 'explorer') return 'explorer';
    if (activeTab === 'compare') return 'compare';
    if (activeTab === 'schedule' || activeTab === 'alerts') return 'schedule-alerts';
    if (activeTab === 'simulator' || activeTab === 'ai-recommend') return 'diagnosis-ai';
    if (activeTab === 'saengibu' || activeTab === 'glossary') return 'guide-glossary';
    return 'favorites';
  }, [activeTab]);

  const handleApplyDataset = (nextDataset: AdmissionDataset, nextRawJson: string) => {
    setDataset(nextDataset);
    setRawJson(nextRawJson);
    try {
      localStorage.setItem(STORAGE_KEYS.RAW_JSON, nextRawJson);
    } catch {
      // ignore
    }

    // Dispatch browser notification if urgent schedules are detected and permission is granted
    const scheduleAlerts = buildScheduleAlertsFromJson(nextDataset);
    if (
      scheduleAlerts.length > 0 &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      const first = scheduleAlerts[0];
      new Notification(`[공대 입시 알림] ${first.category}`, {
        body: `${first.university ?? '정보 없음'} ${first.department ?? ''} — ${first.title}`,
      });
    }
  };

  const handleClearDataset = () => {
    setDataset(null);
    setRawJson('');
    setLiveAlerts([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.RAW_JSON);
    } catch {
      // ignore
    }
  };

  const toggleFavorite = (id: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addChecklistItem = (admissionType: string, text: string) => {
    setChecklistItems((prev) => [
      ...prev,
      {
        id: `chk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        admissionType,
        text,
        checked: false,
        fromJson: false,
      },
    ]);
  };

  const toggleChecklistItem = (id: string) => {
    setChecklistItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const deleteChecklistItem = (id: string) => {
    setChecklistItems((prev) => prev.filter((item) => item.id !== id));
  };

  const navItems: Array<{ group: NavGroup; label: string; defaultTab: ActiveTab }> = [
    { group: 'explorer', label: '계열 탐색', defaultTab: 'explorer' },
    { group: 'compare', label: '대학 비교', defaultTab: 'compare' },
    { group: 'schedule-alerts', label: '일정 · 알림', defaultTab: 'schedule' },
    { group: 'diagnosis-ai', label: '합격 · AI추천', defaultTab: 'simulator' },
    { group: 'favorites', label: '관심 · 체크', defaultTab: 'favorites' },
    { group: 'guide-glossary', label: '생기부 · 용어', defaultTab: 'saengibu' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Banner Ad: 베리타스알파 */}
      <a
        href="https://www.veritas-a.com"
        target="_blank"
        rel="noopener noreferrer"
        className="block border-b border-slate-800 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 text-white transition-colors hover:from-slate-900 hover:via-blue-900 hover:to-slate-900"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <span className="shrink-0 rounded border border-amber-400/60 bg-amber-400/15 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-amber-300">
              AD
            </span>
            <div className="flex min-w-0 flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="text-xs font-bold tracking-tight text-white whitespace-nowrap sm:text-sm">
                베리타스알파 · 대한민국 대표 입시신문
              </span>
              <span className="hidden text-slate-400 sm:inline" aria-hidden="true">|</span>
              <span className="truncate text-[11px] text-slate-300 sm:text-xs">
                수시·정시 경쟁률, 대학별 전형 분석, 실시간 입결 뉴스 한눈에 보기
              </span>
            </div>
          </div>

          <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-400 px-2.5 py-1 text-[11px] font-bold text-slate-950 transition-colors sm:px-3 sm:py-1.5 sm:text-xs whitespace-nowrap">
            사이트 바로가기
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </span>
        </div>
      </a>

      {/* Top Bar Contract: Zone 1 (1-line wordmark) — Zone 2 (single-line links) — Zone 3 (1 primary CTA) */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3 sm:px-6">
          {/* Zone 1: Single text element wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('explorer')}
            className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 sm:text-lg"
          >
            공대 입시 가이드
          </button>

          {/* Zone 2: Concise single-line navigation links */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium" aria-label="주요 메뉴">
            {navItems.map((item) => {
              const isActive = activeNavGroup === item.group;
              return (
                <button
                  key={item.group}
                  type="button"
                  onClick={() => setActiveTab(item.defaultTab)}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                    isActive
                      ? 'border-blue-700 text-blue-700 font-semibold'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setIsJsonModalOpen(true)}
              className="rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0"
            >
              JSON 입력
            </button>
          </div>
        </div>
      </header>

      {/* Mobile horizontal navigation bar (non-sticky to preserve mobile sticky height budget) */}
      <nav
        className="border-b border-slate-200 bg-white px-4 py-2 md:hidden overflow-x-auto no-scrollbar"
        aria-label="모바일 메뉴"
      >
        <div className="flex items-center gap-2">
          {navItems.map((item) => {
            const isActive = activeNavGroup === item.group;
            return (
              <button
                key={item.group}
                type="button"
                onClick={() => setActiveTab(item.defaultTab)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  isActive
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {/* Sub-navigation switcher for grouped tools */}
        {activeNavGroup === 'schedule-alerts' && (
          <div className="mb-6 flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 w-fit">
            <button
              type="button"
              onClick={() => setActiveTab('schedule')}
              className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'schedule'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              전형별 D-day 일정
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('alerts')}
              className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap tabular-nums ${
                activeTab === 'alerts'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              실시간 입시 뉴스 · 푸시 알림 ({urgentAlertCount})
            </button>
          </div>
        )}

        {activeNavGroup === 'diagnosis-ai' && (
          <div className="mb-6 flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 w-fit">
            <button
              type="button"
              onClick={() => setActiveTab('simulator')}
              className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'simulator'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              내신 · 수능 합격 예측 시뮬레이션
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ai-recommend')}
              className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'ai-recommend'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              AI 맞춤 학과 추천
            </button>
          </div>
        )}

        {activeNavGroup === 'guide-glossary' && (
          <div className="mb-6 flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 w-fit">
            <button
              type="button"
              onClick={() => setActiveTab('saengibu')}
              className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'saengibu'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              진학사 공대 생기부
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('glossary')}
              className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'glossary'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              공대 입시 용어 사전
            </button>
          </div>
        )}

        {activeTab === 'explorer' && (
          <FieldExplorerView
            dataset={dataset}
            selectedField={selectedField}
            onSelectField={setSelectedField}
            favoriteIds={favoriteIds}
            compareIds={compareIds}
            onToggleFavorite={toggleFavorite}
            onToggleCompare={toggleCompare}
            onSelectProgram={setDetailProgram}
            onOpenJsonModal={() => setIsJsonModalOpen(true)}
          />
        )}

        {activeTab === 'compare' && (
          <ComparisonTableView
            dataset={dataset}
            compareIds={compareIds}
            favoriteIds={favoriteIds}
            onToggleCompare={toggleCompare}
            onClearCompare={() => setCompareIds(new Set())}
            onSelectProgram={setDetailProgram}
            onOpenJsonModal={() => setIsJsonModalOpen(true)}
          />
        )}

        {activeTab === 'schedule' && (
          <ScheduleDdayView
            dataset={dataset}
            favoriteIds={favoriteIds}
            onSelectProgram={setDetailProgram}
            onOpenJsonModal={() => setIsJsonModalOpen(true)}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsNewsView
            dataset={dataset}
            liveAlerts={liveAlerts}
            onSetLiveAlerts={setLiveAlerts}
            onOpenJsonModal={() => setIsJsonModalOpen(true)}
          />
        )}

        {activeTab === 'simulator' && (
          <GpaSimulatorView
            dataset={dataset}
            gpaInput={gpaInput}
            onChangeGpaInput={setGpaInput}
            onSelectProgram={setDetailProgram}
            onOpenJsonModal={() => setIsJsonModalOpen(true)}
          />
        )}

        {activeTab === 'ai-recommend' && (
          <AiRecommendView
            dataset={dataset}
            gpaInput={gpaInput}
            onChangeGpaInput={setGpaInput}
            onOpenJsonModal={() => setIsJsonModalOpen(true)}
          />
        )}

        {activeTab === 'favorites' && (
          <FavoritesChecklistView
            dataset={dataset}
            favoriteIds={favoriteIds}
            checklistItems={checklistItems}
            onToggleFavorite={toggleFavorite}
            onAddChecklistItem={addChecklistItem}
            onToggleChecklistItem={toggleChecklistItem}
            onDeleteChecklistItem={deleteChecklistItem}
            onSelectProgram={setDetailProgram}
            onOpenJsonModal={() => setIsJsonModalOpen(true)}
          />
        )}

        {activeTab === 'saengibu' && (
          <SaengibuGuideView
            dataset={dataset}
            onOpenJsonModal={() => setIsJsonModalOpen(true)}
          />
        )}

        {activeTab === 'glossary' && (
          <GlossaryView
            dataset={dataset}
            onOpenJsonModal={() => setIsJsonModalOpen(true)}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>
            공대 입시 가이드 · 사용자 제공 JSON 데이터 전용 (누락 항목은 &ldquo;정보 없음&rdquo; 표시)
          </span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <a
              href="https://www.veritas-a.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-600 hover:text-blue-700 hover:underline"
            >
              베리타스알파
            </a>
            <a
              href="https://www.jinhak.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-600 hover:text-blue-700 hover:underline"
            >
              진학사
            </a>
            <a
              href="https://www.uway.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-600 hover:text-blue-700 hover:underline"
            >
              유웨이
            </a>
            <a
              href="https://www.adiga.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-600 hover:text-blue-700 hover:underline"
            >
              대입정보포털 어디가
            </a>
            <button
              type="button"
              onClick={() => setIsJsonModalOpen(true)}
              className="font-medium text-blue-700 hover:underline"
            >
              JSON 데이터 관리
            </button>
          </div>
        </div>
      </footer>

      <JsonInputModal
        isOpen={isJsonModalOpen}
        initialRawJson={rawJson}
        currentDataset={dataset}
        onClose={() => setIsJsonModalOpen(false)}
        onApplyDataset={handleApplyDataset}
        onClearDataset={handleClearDataset}
      />

      <ProgramDetailModal
        program={detailProgram}
        isFavorite={detailProgram ? favoriteIds.has(detailProgram.id) : false}
        isCompared={detailProgram ? compareIds.has(detailProgram.id) : false}
        onClose={() => setDetailProgram(null)}
        onToggleFavorite={toggleFavorite}
        onToggleCompare={toggleCompare}
      />
    </div>
  );
}
