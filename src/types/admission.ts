export const ENGINEERING_FIELDS = [
  '전기전자',
  '반도체',
  '신소재',
  '기계',
  '화공',
  '컴퓨터',
  '건축·토목',
  '산업',
  '자유전공',
] as const;

export type EngineeringField = (typeof ENGINEERING_FIELDS)[number];

export interface ScheduleMilestones {
  application: string | null;   // 원서 접수
  document: string | null;      // 서류 제출
  interview: string | null;     // 면접
  announcement: string | null;  // 발표일
}

export interface CutoffInfo {
  representative: number | null;     // 대표 내신 수치 (비교 기준, 예: 70%컷 또는 평균)
  avg: number | null;                // 내신 평균 등급
  cut70: number | null;              // 내신 70% 컷
  cut50: number | null;              // 내신 50% 컷
  safeThreshold: number | null;      // JSON에 명시된 안정 기준
  fitThreshold: number | null;       // JSON에 명시된 적정 기준
  csatGradeCutoff: number | null;    // 전년도 수능 평균 등급 입결
  percentileCutoff: number | null;   // 전년도 백분위 입결
  convertedScoreCutoff: number | null; // 전년도 환산 점수 입결
  convertedScoreMax: number | null;  // 환산 점수 만점 (JSON에 있는 경우)
  rawText: string | null;            // 원문 텍스트
}

export interface UniversityProgram {
  id: string;
  university: string | null;
  department: string | null;
  field: EngineeringField | string | null;
  rawField: string | null;
  admissionType: string | null;    // 전형 유형
  admissionName: string | null;    // 세부 전형명
  quota: string | null;            // 모집 인원
  eligibility: string | null;      // 지원 자격
  gpaRatio: string | null;         // 학생부 반영 비율
  csatRatio: string | null;        // 수능 반영 비율 (있는 경우)
  csatMinimum: string | null;      // 수능 최저
  features: string | null;         // 학과 주요 특징 (JSON에 있는 경우)
  link: string | null;             // 모집요강 / 입학처 관련 링크 (JSON에 있는 경우)
  schedules: ScheduleMilestones;
  cutoff: CutoffInfo;
  referenceYear: string | null;    // 기준 연도
  source: string | null;           // 출처
  notes: string | null;            // 비고
}

export interface NoticeAlertItem {
  id: string;
  university: string | null;
  department: string | null;
  category: '원서 접수 시작' | '마감 임박' | '면접 일정 변경' | '일정 안내' | '입시 뉴스';
  title: string;
  schedule: string | null;
  link: string | null;
  sourceType: 'json-notice' | 'json-schedule' | 'live-search';
  sourceLabel: string | null;
  referenceYear: string | null;
  createdAt: string;
}

export interface AdmissionDataset {
  referenceYear: string | null;
  source: string | null;
  sourceList: string[];
  cutoffCaution: string | null;
  dataGrade: string | null;
  lastChecked: string | null;
  scheduleMemo: string | null;
  programs: UniversityProgram[];
  jsonChecklists: Record<string, string[]>;
  jsonNotices: NoticeAlertItem[];
  loadedAt: string;
}

export type GpaPositionStatus = '안정' | '적정' | '도전' | '정보 없음';

export interface GpaEvaluation {
  status: GpaPositionStatus;
  diff: number | null; // myGpa - cutoff (음수면 내신이 더 우수)
  referenceValue: number | null;
  basisLabel: string;
}

export interface CsatGradesInput {
  korean: number | null;
  math: number | null;
  english: number | null;
  inquiry1: number | null;
  inquiry2: number | null;
}

export interface SimulationResult {
  program: UniversityProgram;
  overallStatus: GpaPositionStatus;
  gpaEval: GpaEvaluation;
  csatAvgGrade: number | null;
  estimatedPercentile: number | null;
  percentileEval: {
    cutoffPercentile: number | null;
    diff: number | null;
    status: GpaPositionStatus;
  };
  convertedScore: {
    userScore: number | null;
    cutoffScore: number | null;
    maxScore: number | null;
    basis: string;
  };
  csatMinimumNote: string;
}

export interface AiRecommendationResultItem {
  programId: string | null;
  university: string;
  department: string;
  field: string;
  admissionType: string;
  fitLevel: GpaPositionStatus;
  matchReason: string;
  features: string;
  expectedCutoff: string;
  referenceYear: string;
  source: string;
}

export interface DdayResult {
  label: string;
  status: 'upcoming' | 'ongoing' | 'today' | 'passed' | 'none';
  daysLeft: number | null;
  formattedDate: string;
}

export interface UserChecklistItem {
  id: string;
  admissionType: string;
  text: string;
  checked: boolean;
  fromJson: boolean;
}

export type ActiveTab =
  | 'explorer'
  | 'compare'
  | 'schedule'
  | 'simulator'
  | 'ai-recommend'
  | 'alerts'
  | 'favorites'
  | 'saengibu'
  | 'glossary';

export const MISSING_TEXT = '정보 없음';
