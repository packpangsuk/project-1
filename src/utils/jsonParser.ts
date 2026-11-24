import {
  AdmissionDataset,
  CsatGradesInput,
  CutoffInfo,
  DdayResult,
  ENGINEERING_FIELDS,
  EngineeringField,
  GpaEvaluation,
  GpaPositionStatus,
  MISSING_TEXT,
  NoticeAlertItem,
  SimulationResult,
  UniversityProgram,
} from '../types/admission';

function cleanStr(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') {
    return Number.isFinite(val) ? String(val) : null;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed || trimmed === '-') return null;
    return trimmed;
  }
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    const start = cleanStr(obj.start ?? obj.from ?? obj.시작 ?? obj.시작일);
    const end = cleanStr(obj.end ?? obj.to ?? obj.종료 ?? obj.종료일 ?? obj.마감);
    if (start && end) return `${start} ~ ${end}`;
    if (start) return start;
    if (end) return end;
  }
  return null;
}

function cleanSafeUrl(val: unknown): string | null {
  const s = cleanStr(val);
  if (!s) return null;
  try {
    const parsed = new URL(s);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

function cleanNum(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') {
    return Number.isFinite(val) ? val : null;
  }
  if (typeof val === 'string') {
    const match = val.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
    if (!match) return null;
    const parsed = Number(match[0]);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function normalizeField(raw: string | null): EngineeringField | string | null {
  if (!raw) return null;
  const compact = raw.replace(/\s+/g, '');
  if ((ENGINEERING_FIELDS as readonly string[]).includes(compact)) {
    return compact as EngineeringField;
  }
  if (compact.includes('전기') || compact.includes('전자')) return '전기전자';
  if (compact.includes('반도체')) return '반도체';
  if (compact.includes('신소재') || compact.includes('재료')) return '신소재';
  if (compact.includes('기계')) return '기계';
  if (compact.includes('화공') || compact.includes('화학공')) return '화공';
  if (
    compact.includes('컴퓨터') ||
    compact.includes('소프트웨어') ||
    compact.includes('AI') ||
    compact.includes('인공지능')
  ) {
    return '컴퓨터';
  }
  if (compact.includes('건축') || compact.includes('토목') || compact.includes('건설')) return '건축·토목';
  if (compact.includes('산업')) return '산업';
  if (compact.includes('자유') || compact.includes('자율') || compact.includes('무전공')) return '자유전공';
  return raw.trim();
}

function parseCutoff(raw: unknown): CutoffInfo {
  if (raw === null || raw === undefined || raw === '') {
    return {
      representative: null,
      avg: null,
      cut70: null,
      cut50: null,
      safeThreshold: null,
      fitThreshold: null,
      csatGradeCutoff: null,
      percentileCutoff: null,
      convertedScoreCutoff: null,
      convertedScoreMax: null,
      rawText: null,
    };
  }

  if (typeof raw === 'number' || typeof raw === 'string') {
    const num = cleanNum(raw);
    const text = cleanStr(raw);
    return {
      representative: num,
      avg: num,
      cut70: null,
      cut50: null,
      safeThreshold: null,
      fitThreshold: null,
      csatGradeCutoff: null,
      percentileCutoff: null,
      convertedScoreCutoff: null,
      convertedScoreMax: null,
      rawText: text,
    };
  }

  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const cut70 = cleanNum(obj.cut70 ?? obj['70%컷'] ?? obj['70컷'] ?? obj.seventyPercent);
    const cut50 = cleanNum(obj.cut50 ?? obj['50%컷'] ?? obj['50컷'] ?? obj.fiftyPercent);
    const avg = cleanNum(obj.avg ?? obj.average ?? obj['평균'] ?? obj['등급평균'] ?? obj['내신평균']);
    const rep =
      cleanNum(obj.representative ?? obj.cutoff ?? obj['기준'] ?? obj['입결']) ??
      cut70 ??
      avg ??
      cut50;
    const safeThreshold = cleanNum(obj.safe ?? obj.safeThreshold ?? obj['안정'] ?? obj['안정기준']);
    const fitThreshold = cleanNum(obj.fit ?? obj.fitThreshold ?? obj['적정'] ?? obj['적정기준']);
    const csatGradeCutoff = cleanNum(obj.csatGradeCutoff ?? obj.csatAvg ?? obj['수능등급'] ?? obj['수능평균등급']);
    const percentileCutoff = cleanNum(obj.percentile ?? obj.percentileCutoff ?? obj['백분위'] ?? obj['백분위컷']);
    const convertedScoreCutoff = cleanNum(obj.convertedScore ?? obj.convertedScoreCutoff ?? obj['환산점수'] ?? obj['환산점수컷']);
    const convertedScoreMax = cleanNum(obj.convertedScoreMax ?? obj.maxScore ?? obj['환산만점'] ?? obj['만점']);
    const noteText = cleanStr(obj.note ?? obj.rawText ?? obj.description ?? obj['설명'] ?? obj['비고']);

    let builtText = noteText;
    if (!builtText) {
      const parts: string[] = [];
      if (avg !== null) parts.push(`평균 ${avg.toFixed(2)}`);
      if (cut50 !== null) parts.push(`50%컷 ${cut50.toFixed(2)}`);
      if (cut70 !== null) parts.push(`70%컷 ${cut70.toFixed(2)}`);
      if (percentileCutoff !== null) parts.push(`백분위 ${percentileCutoff}`);
      if (convertedScoreCutoff !== null) parts.push(`환산 ${convertedScoreCutoff}`);
      if (parts.length > 0) builtText = parts.join(' · ');
      else if (rep !== null) builtText = `${rep.toFixed(2)}등급`;
    }

    return {
      representative: rep,
      avg,
      cut70,
      cut50,
      safeThreshold,
      fitThreshold,
      csatGradeCutoff,
      percentileCutoff,
      convertedScoreCutoff,
      convertedScoreMax,
      rawText: builtText,
    };
  }

  return {
    representative: null,
    avg: null,
    cut70: null,
    cut50: null,
    safeThreshold: null,
    fitThreshold: null,
    csatGradeCutoff: null,
    percentileCutoff: null,
    convertedScoreCutoff: null,
    convertedScoreMax: null,
    rawText: null,
  };
}

function parseSchedules(item: Record<string, unknown>) {
  const schedObj =
    (typeof item.schedules === 'object' && item.schedules !== null
      ? (item.schedules as Record<string, unknown>)
      : null) ??
    (typeof item.일정 === 'object' && item.일정 !== null
      ? (item.일정 as Record<string, unknown>)
      : null) ??
    {};

  return {
    application: cleanStr(
      schedObj.application ??
        schedObj.원서접수 ??
        schedObj['원서 접수'] ??
        item.applicationDate ??
        item.원서접수 ??
        item['원서 접수']
    ),
    document: cleanStr(
      schedObj.document ??
        schedObj.documents ??
        schedObj.서류제출 ??
        schedObj['서류 제출'] ??
        item.documentDate ??
        item.서류제출 ??
        item['서류 제출']
    ),
    interview: cleanStr(
      schedObj.interview ??
        schedObj.면접 ??
        schedObj.면접일 ??
        item.interviewDate ??
        item.면접 ??
        item.면접일
    ),
    announcement: cleanStr(
      schedObj.announcement ??
        schedObj.result ??
        schedObj.발표 ??
        schedObj.발표일 ??
        schedObj.합격자발표 ??
        item.announcementDate ??
        item.발표일 ??
        item.합격발표
    ),
  };
}

function parseProgram(
  rawItem: unknown,
  idx: number,
  rootYear: string | null,
  rootSource: string | null
): UniversityProgram | null {
  if (!rawItem || typeof rawItem !== 'object') return null;
  const item = rawItem as Record<string, unknown>;

  const university = cleanStr(item.university ?? item.univ ?? item.학교 ?? item.대학 ?? item.대학명);
  const department = cleanStr(
    item.department ?? item.major ?? item.dept ?? item.학과 ?? item.학과명 ?? item.모집단위
  );
  const rawField = cleanStr(item.field ?? item.category ?? item.계열 ?? item.학과계열);
  const field = normalizeField(rawField);
  const admissionType = cleanStr(
    item.admissionType ?? item.type ?? item.전형유형 ?? item['전형 유형'] ?? item.전형
  );
  const admissionName = cleanStr(item.admissionName ?? item.전형명 ?? item.세부전형);

  const quotaRaw = item.quota ?? item.capacity ?? item.모집인원 ?? item['모집 인원'];
  let quota = cleanStr(quotaRaw);
  if (quota && /^\d+$/.test(quota)) {
    quota = `${quota}명`;
  }

  const eligibility = cleanStr(item.eligibility ?? item.qualification ?? item.지원자격 ?? item['지원 자격']);
  const gpaRatio = cleanStr(
    item.gpaRatio ??
      item.reflectionRatio ??
      item.학생부반영비율 ??
      item['학생부 반영 비율'] ??
      item.전형요소반영비율
  );
  const csatRatio = cleanStr(
    item.csatRatio ??
      item.수능반영비율 ??
      item['수능 반영 비율']
  );
  const csatMinimum = cleanStr(
    item.csatMinimum ??
      item.csatMin ??
      item.수능최저 ??
      item['수능 최저'] ??
      item.수능최저학력기준
  );
  const features = cleanStr(
    item.features ??
      item.characteristics ??
      item.주요특징 ??
      item['주요 특징'] ??
      item.특징 ??
      item.학과특징
  );
  const link = cleanSafeUrl(item.link ?? item.url ?? item.관련링크 ?? item['관련 링크'] ?? item.모집요강링크);

  const cutoffSource =
    item.previousCutoff ??
    item.cutoff ??
    item.전년도입결 ??
    item['전년도 입결'] ??
    item.입결;
  const cutoff = parseCutoff(cutoffSource);

  const schedules = parseSchedules(item);
  const referenceYear = cleanStr(item.referenceYear ?? item.year ?? item.기준연도 ?? item['기준 연도']) ?? rootYear;
  const source = cleanStr(item.source ?? item.출처) ?? rootSource;
  const notes = cleanStr(item.notes ?? item.note ?? item.비고);

  const id =
    cleanStr(item.id) ??
    `prog-${idx}-${university ?? 'unknown'}-${department ?? 'unknown'}-${admissionType ?? 'unknown'}`;

  return {
    id,
    university,
    department,
    field,
    rawField,
    admissionType,
    admissionName,
    quota,
    eligibility,
    gpaRatio,
    csatRatio,
    csatMinimum,
    features,
    link,
    schedules,
    cutoff,
    referenceYear,
    source,
    notes,
  };
}

function parseJsonChecklists(raw: unknown): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  if (!raw || typeof raw !== 'object') return result;

  if (Array.isArray(raw)) {
    for (const entry of raw) {
      if (!entry || typeof entry !== 'object') continue;
      const obj = entry as Record<string, unknown>;
      const type = cleanStr(obj.admissionType ?? obj.전형유형 ?? obj.type);
      const items = Array.isArray(obj.items ?? obj.항목) ? ((obj.items ?? obj.항목) as unknown[]) : [];
      if (type) {
        const cleaned = items.map(cleanStr).filter((v): v is string => v !== null);
        if (cleaned.length > 0) result[type] = cleaned;
      }
    }
    return result;
  }

  const mapObj = raw as Record<string, unknown>;
  for (const [key, val] of Object.entries(mapObj)) {
    if (Array.isArray(val)) {
      const cleaned = val.map(cleanStr).filter((v): v is string => v !== null);
      if (cleaned.length > 0) result[key.trim()] = cleaned;
    }
  }
  return result;
}

function normalizeNoticeCategory(raw: string | null): NoticeAlertItem['category'] {
  if (!raw) return '일정 안내';
  if (raw.includes('시작')) return '원서 접수 시작';
  if (raw.includes('마감') || raw.includes('임박')) return '마감 임박';
  if (raw.includes('변경') || raw.includes('면접')) return '면접 일정 변경';
  if (raw.includes('뉴스')) return '입시 뉴스';
  return '일정 안내';
}

function parseJsonNotices(
  raw: unknown,
  rootYear: string | null,
  rootSource: string | null
): NoticeAlertItem[] {
  if (!Array.isArray(raw)) return [];
  const list: NoticeAlertItem[] = [];
  raw.forEach((entry, idx) => {
    if (!entry || typeof entry !== 'object') return;
    const obj = entry as Record<string, unknown>;
    const university = cleanStr(obj.university ?? obj.대학 ?? obj.대학명);
    const department = cleanStr(obj.department ?? obj.학과 ?? obj.학과명);
    const title = cleanStr(obj.title ?? obj.제목 ?? obj.내용 ?? obj.summary) ?? '공지사항';
    const schedule = cleanStr(obj.schedule ?? obj.date ?? obj.일정 ?? obj.날짜);
    const link = cleanSafeUrl(obj.link ?? obj.url ?? obj.관련링크 ?? obj['관련 링크']);
    const category = normalizeNoticeCategory(cleanStr(obj.category ?? obj.유형 ?? obj.구분));
    const sourceLabel = cleanStr(obj.source ?? obj.출처) ?? rootSource;
    const referenceYear = cleanStr(obj.referenceYear ?? obj.기준연도) ?? rootYear;

    list.push({
      id: `json-notice-${idx}`,
      university,
      department,
      category,
      title,
      schedule,
      link,
      sourceType: 'json-notice',
      sourceLabel,
      referenceYear,
      createdAt: new Date().toISOString(),
    });
  });
  return list;
}

function parseSourceField(rawSource: unknown): { summary: string | null; list: string[] } {
  if (Array.isArray(rawSource)) {
    const list = rawSource.map(cleanStr).filter((v): v is string => v !== null);
    if (list.length === 0) return { summary: null, list: [] };
    if (list.length === 1) return { summary: list[0], list };
    return {
      summary: `${list[0].replace(/https?:\/\/\S+/g, '').trim()} 외 ${list.length - 1}건`,
      list,
    };
  }
  const single = cleanStr(rawSource);
  return { summary: single, list: single ? [single] : [] };
}

function parseRelationalDataset(obj: Record<string, unknown>): AdmissionDataset | null {
  if (!Array.isArray(obj.학과)) return null;

  const metaObj =
    typeof obj.meta === 'object' && obj.meta !== null
      ? (obj.meta as Record<string, unknown>)
      : {};

  const rootYear =
    cleanStr(metaObj.기준 ?? metaObj.기준연도 ?? obj.기준연도 ?? obj.referenceYear) ?? null;
  const sourceParsed = parseSourceField(metaObj.출처 ?? obj.출처 ?? obj.source);
  const cutoffCaution = cleanStr(metaObj.입결주의);
  const dataGrade = cleanStr(metaObj.자료등급);
  const lastChecked = cleanStr(metaObj.최종확인일);
  const scheduleMemo = cleanStr(metaObj.일정메모);

  const univMap = new Map<string, { name: string | null; link: string | null }>();
  if (Array.isArray(obj.대학)) {
    for (const u of obj.대학) {
      if (!u || typeof u !== 'object') continue;
      const uObj = u as Record<string, unknown>;
      const id = cleanStr(uObj.id);
      if (id) {
        univMap.set(id, {
          name: cleanStr(uObj.이름 ?? uObj.대학명 ?? uObj.name),
          link: cleanSafeUrl(uObj.입학처 ?? uObj.url ?? uObj.link),
        });
      }
    }
  }

  const admMap = new Map<string, Record<string, unknown>>();
  if (Array.isArray(obj.전형)) {
    for (const a of obj.전형) {
      if (!a || typeof a !== 'object') continue;
      const aObj = a as Record<string, unknown>;
      const id = cleanStr(aObj.id);
      if (id) admMap.set(id, aObj);
    }
  }

  const programs: UniversityProgram[] = [];
  obj.학과.forEach((rawDept, idx) => {
    if (!rawDept || typeof rawDept !== 'object') return;
    const dObj = rawDept as Record<string, unknown>;

    const univKey = cleanStr(dObj.대학 ?? dObj.대학명);
    const univInfo = univKey ? univMap.get(univKey) : undefined;
    const university = univInfo?.name ?? univKey;
    const univLink = univInfo?.link ?? null;

    const admKey = cleanStr(dObj.전형 ?? dObj.전형id);
    const admInfo = admKey ? admMap.get(admKey) : undefined;

    const department = cleanStr(dObj.학과 ?? dObj.학과명 ?? dObj.department);
    const rawField = cleanStr(dObj.계열 ?? dObj.field);
    const field = normalizeField(rawField);

    const admissionType = cleanStr(admInfo?.유형 ?? dObj.전형유형 ?? dObj.유형);
    const admissionName = cleanStr(admInfo?.전형명 ?? dObj.전형명) ?? (admInfo ? null : admKey);

    const quotaRaw = dObj.모집인원 ?? dObj.quota;
    let quota = cleanStr(quotaRaw);
    if (quota && /^\d+$/.test(quota)) {
      quota = `${quota}명`;
    }

    const eligibility = cleanStr(dObj.지원자격 ?? admInfo?.지원자격);
    const gpaRatio = cleanStr(dObj.선발방법 ?? dObj.학생부반영비율 ?? admInfo?.선발방법);
    const csatMinimum = cleanStr(dObj.수능최저 ?? admInfo?.수능최저);

    const rawSched = (dObj.일정 ?? admInfo?.일정) as Record<string, unknown> | undefined;
    const schedules = parseSchedules({ 일정: rawSched ?? {} });

    const cutoff70 = cleanNum(dObj.입결70컷 ?? dObj.전년도입결);
    const cutoff: CutoffInfo =
      cutoff70 !== null
        ? {
            representative: cutoff70,
            avg: null,
            cut70: cutoff70,
            cut50: null,
            safeThreshold: null,
            fitThreshold: null,
            csatGradeCutoff: null,
            percentileCutoff: null,
            convertedScoreCutoff: null,
            convertedScoreMax: null,
            rawText: `70%컷 ${cutoff70.toFixed(2)}등급`,
          }
        : parseCutoff(dObj.전년도입결 ?? dObj.cutoff);

    const notes = cleanStr(dObj.비고 ?? dObj.notes);
    const link = cleanSafeUrl(dObj.관련링크 ?? dObj.link) ?? univLink;

    programs.push({
      id: cleanStr(dObj.id) ?? `rel-${idx}-${univKey ?? 'u'}-${department ?? 'd'}-${admKey ?? 'a'}`,
      university,
      department,
      field,
      rawField,
      admissionType,
      admissionName,
      quota,
      eligibility,
      gpaRatio,
      csatRatio: null,
      csatMinimum,
      features: null,
      link,
      schedules,
      cutoff,
      referenceYear: rootYear,
      source: sourceParsed.summary,
      notes,
    });
  });

  if (programs.length === 0) return null;

  const jsonChecklists = parseJsonChecklists(obj.checklists ?? obj.체크리스트);
  const jsonNotices = parseJsonNotices(
    obj.notices ?? obj.news ?? obj.공지사항 ?? obj.입시뉴스,
    rootYear,
    sourceParsed.summary
  );

  return {
    referenceYear: rootYear,
    source: sourceParsed.summary,
    sourceList: sourceParsed.list,
    cutoffCaution,
    dataGrade,
    lastChecked,
    scheduleMemo,
    programs,
    jsonChecklists,
    jsonNotices,
    loadedAt: new Date().toISOString(),
  };
}

export function parseAdmissionJson(jsonText: string): {
  dataset: AdmissionDataset | null;
  error: string | null;
} {
  if (!jsonText.trim()) {
    return { dataset: null, error: 'JSON 내용을 입력해 주세요.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 구문 오류';
    return {
      dataset: null,
      error: `JSON 형식이 올바르지 않습니다: ${message}`,
    };
  }

  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.학과)) {
      const relDataset = parseRelationalDataset(obj);
      if (!relDataset) {
        return {
          dataset: null,
          error: '유효한 학과 데이터가 0건입니다. "학과" 배열을 확인해 주세요.',
        };
      }
      return { dataset: relDataset, error: null };
    }
  }

  let rootYear: string | null = null;
  let rootSource: string | null = null;
  let rootSourceList: string[] = [];
  let cutoffCaution: string | null = null;
  let dataGrade: string | null = null;
  let lastChecked: string | null = null;
  let scheduleMemo: string | null = null;
  let rawPrograms: unknown[] = [];
  let jsonChecklists: Record<string, string[]> = {};
  let jsonNotices: NoticeAlertItem[] = [];

  if (Array.isArray(parsed)) {
    rawPrograms = parsed;
  } else if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    const metaObj =
      typeof obj.meta === 'object' && obj.meta !== null
        ? (obj.meta as Record<string, unknown>)
        : {};
    rootYear = cleanStr(
      obj.referenceYear ?? obj.year ?? obj.기준연도 ?? obj['기준 연도'] ?? metaObj.기준
    );
    const sourceParsed = parseSourceField(obj.source ?? obj.출처 ?? obj.dataSource ?? metaObj.출처);
    rootSource = sourceParsed.summary;
    rootSourceList = sourceParsed.list;
    cutoffCaution = cleanStr(metaObj.입결주의);
    dataGrade = cleanStr(metaObj.자료등급);
    lastChecked = cleanStr(metaObj.최종확인일);
    scheduleMemo = cleanStr(metaObj.일정메모);

    const listCandidate =
      obj.programs ??
      obj.universities ??
      obj.departments ??
      obj.items ??
      obj.data ??
      obj.학과목록 ??
      obj.대학목록 ??
      obj.모집단위 ??
      obj.전형목록;

    if (!Array.isArray(listCandidate)) {
      return {
        dataset: null,
        error:
          '대학/학과 목록 배열을 찾을 수 없습니다. 최상위 배열([]), "학과", 또는 "programs" / "학과목록" 키에 배열을 넣어주세요.',
      };
    }
    rawPrograms = listCandidate;
    jsonChecklists = parseJsonChecklists(obj.checklists ?? obj.체크리스트);
    jsonNotices = parseJsonNotices(
      obj.notices ?? obj.news ?? obj.공지사항 ?? obj.입시뉴스,
      rootYear,
      rootSource
    );
  } else {
    return {
      dataset: null,
      error: 'JSON 최상위 구조는 객체({}) 또는 배열([])이어야 합니다.',
    };
  }

  const programs: UniversityProgram[] = [];
  rawPrograms.forEach((item, idx) => {
    const prog = parseProgram(item, idx, rootYear, rootSource);
    if (prog) programs.push(prog);
  });

  if (programs.length === 0) {
    return {
      dataset: null,
      error: '유효한 대학/학과 데이터가 0건입니다. 배열 안에 최소 1개 이상의 학과 객체를 입력해 주세요.',
    };
  }

  return {
    dataset: {
      referenceYear: rootYear ?? programs.find((p) => p.referenceYear)?.referenceYear ?? null,
      source: rootSource ?? programs.find((p) => p.source)?.source ?? null,
      sourceList: rootSourceList,
      cutoffCaution,
      dataGrade,
      lastChecked,
      scheduleMemo,
      programs,
      jsonChecklists,
      jsonNotices,
      loadedAt: new Date().toISOString(),
    },
    error: null,
  };
}

export function displayValue(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === '') return MISSING_TEXT;
  return String(val);
}

function extractDates(raw: string | null): Date[] {
  if (!raw) return [];
  const matches = raw.match(/\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}/g);
  if (!matches) return [];
  const dates: Date[] = [];
  for (const m of matches) {
    const normalized = m.replace(/[./]/g, '-');
    const [y, mo, d] = normalized.split('-').map(Number);
    const dt = new Date(y, mo - 1, d);
    if (!Number.isNaN(dt.getTime())) {
      dt.setHours(0, 0, 0, 0);
      dates.push(dt);
    }
  }
  return dates;
}

export function computeDday(rawDate: string | null, referenceToday?: Date): DdayResult {
  if (!rawDate) {
    return {
      label: MISSING_TEXT,
      status: 'none',
      daysLeft: null,
      formattedDate: MISSING_TEXT,
    };
  }

  const dates = extractDates(rawDate);
  if (dates.length === 0) {
    if (rawDate.includes('없음') || rawDate.includes('미실시')) {
      return {
        label: rawDate,
        status: 'none',
        daysLeft: null,
        formattedDate: rawDate,
      };
    }
    return {
      label: '날짜 형식 확인 필요',
      status: 'none',
      daysLeft: null,
      formattedDate: rawDate,
    };
  }

  const today = referenceToday ? new Date(referenceToday) : new Date();
  today.setHours(0, 0, 0, 0);

  const msPerDay = 1000 * 60 * 60 * 24;

  if (dates.length >= 2) {
    const start = dates[0];
    const end = dates[dates.length - 1];
    const diffStart = Math.round((start.getTime() - today.getTime()) / msPerDay);
    const diffEnd = Math.round((end.getTime() - today.getTime()) / msPerDay);

    if (diffStart > 0) {
      return {
        label: `D-${diffStart}`,
        status: 'upcoming',
        daysLeft: diffStart,
        formattedDate: rawDate,
      };
    }
    if (diffEnd === 0) {
      return {
        label: '오늘 마감',
        status: 'today',
        daysLeft: 0,
        formattedDate: rawDate,
      };
    }
    if (diffEnd > 0) {
      return {
        label: `진행중 (마감 D-${diffEnd})`,
        status: 'ongoing',
        daysLeft: diffEnd,
        formattedDate: rawDate,
      };
    }
    return {
      label: `마감 D+${Math.abs(diffEnd)}`,
      status: 'passed',
      daysLeft: diffEnd,
      formattedDate: rawDate,
    };
  }

  const target = dates[0];
  const diff = Math.round((target.getTime() - today.getTime()) / msPerDay);

  if (diff === 0) {
    return {
      label: 'D-Day',
      status: 'today',
      daysLeft: 0,
      formattedDate: rawDate,
    };
  }
  if (diff > 0) {
    return {
      label: `D-${diff}`,
      status: 'upcoming',
      daysLeft: diff,
      formattedDate: rawDate,
    };
  }
  return {
    label: `D+${Math.abs(diff)}`,
    status: 'passed',
    daysLeft: diff,
    formattedDate: rawDate,
  };
}

/**
 * Generates automatic schedule alerts strictly from the loaded JSON milestones.
 */
export function buildScheduleAlertsFromJson(dataset: AdmissionDataset | null): NoticeAlertItem[] {
  if (!dataset) return [];
  const alerts: NoticeAlertItem[] = [...dataset.jsonNotices];

  for (const p of dataset.programs) {
    const milestones: Array<{
      key: keyof typeof p.schedules;
      label: string;
    }> = [
      { key: 'application', label: '원서 접수' },
      { key: 'document', label: '서류 제출' },
      { key: 'interview', label: '면접' },
      { key: 'announcement', label: '발표일' },
    ];

    for (const m of milestones) {
      const rawDate = p.schedules[m.key];
      if (!rawDate) continue;
      const dday = computeDday(rawDate);

      if (dday.status === 'today' || dday.status === 'ongoing') {
        alerts.push({
          id: `sched-${p.id}-${m.key}`,
          university: p.university,
          department: p.department,
          category: m.key === 'application' ? '원서 접수 시작' : '마감 임박',
          title: `${m.label} ${dday.label} (${p.admissionType ?? '전형 미상'})`,
          schedule: rawDate,
          link: p.link,
          sourceType: 'json-schedule',
          sourceLabel: p.source ?? dataset.source,
          referenceYear: p.referenceYear ?? dataset.referenceYear,
          createdAt: dataset.loadedAt,
        });
      } else if (dday.status === 'upcoming' && dday.daysLeft !== null && dday.daysLeft <= 7) {
        alerts.push({
          id: `sched-${p.id}-${m.key}`,
          university: p.university,
          department: p.department,
          category: '마감 임박',
          title: `${m.label} ${dday.label} 예정 (${p.admissionType ?? '전형 미상'})`,
          schedule: rawDate,
          link: p.link,
          sourceType: 'json-schedule',
          sourceLabel: p.source ?? dataset.source,
          referenceYear: p.referenceYear ?? dataset.referenceYear,
          createdAt: dataset.loadedAt,
        });
      }
    }
  }

  return alerts;
}

export function evaluateGpaPosition(myGpa: number | null, cutoff: CutoffInfo): GpaEvaluation {
  if (myGpa === null || Number.isNaN(myGpa)) {
    return {
      status: '정보 없음',
      diff: null,
      referenceValue: cutoff.representative,
      basisLabel: '내신 입력 대기',
    };
  }

  const ref = cutoff.representative;
  if (ref === null) {
    return {
      status: '정보 없음',
      diff: null,
      referenceValue: null,
      basisLabel: '전년도 입결 정보 없음',
    };
  }

  const diff = Number((myGpa - ref).toFixed(2));
  const basisLabel =
    cutoff.cut70 !== null && cutoff.cut70 === ref
      ? '전년도 70%컷'
      : cutoff.avg !== null && cutoff.avg === ref
      ? '전년도 평균'
      : cutoff.cut50 !== null && cutoff.cut50 === ref
      ? '전년도 50%컷'
      : '전년도 입결';

  if (cutoff.safeThreshold !== null && cutoff.fitThreshold !== null) {
    if (myGpa <= cutoff.safeThreshold) {
      return { status: '안정', diff, referenceValue: ref, basisLabel };
    }
    if (myGpa <= cutoff.fitThreshold) {
      return { status: '적정', diff, referenceValue: ref, basisLabel };
    }
    return { status: '도전', diff, referenceValue: ref, basisLabel };
  }

  if (diff <= -0.2) {
    return { status: '안정', diff, referenceValue: ref, basisLabel };
  }
  if (diff <= 0.15) {
    return { status: '적정', diff, referenceValue: ref, basisLabel };
  }
  return { status: '도전', diff, referenceValue: ref, basisLabel };
}

/**
 * Computes average CSAT grade and converts standard 9-grade scale to approximate percentile midpoint
 * ONLY when CSAT grades are explicitly entered by the user; comparison cutoff strictly uses JSON data.
 */
export function runAdmissionSimulation(
  program: UniversityProgram,
  myGpa: number | null,
  csat: CsatGradesInput,
  userDirectPercentile: number | null
): SimulationResult {
  const gpaEval = evaluateGpaPosition(myGpa, program.cutoff);

  const grades = [csat.korean, csat.math, csat.english, csat.inquiry1, csat.inquiry2].filter(
    (g): g is number => g !== null && !Number.isNaN(g) && g >= 1 && g <= 9
  );
  const csatAvgGrade =
    grades.length > 0 ? Number((grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(2)) : null;

  // Standard Korean CSAT grade-to-cumulative-percentile midpoint reference
  const gradeToPercentile = (g: number): number => {
    const clamped = Math.max(1, Math.min(9, g));
    const table: Record<number, number> = {
      1: 98,
      2: 92,
      3: 83,
      4: 68,
      5: 50,
      6: 31,
      7: 17,
      8: 7,
      9: 2,
    };
    const floor = Math.floor(clamped);
    const ceil = Math.ceil(clamped);
    if (floor === ceil) return table[floor];
    const ratio = clamped - floor;
    return Number((table[floor] * (1 - ratio) + table[ceil] * ratio).toFixed(1));
  };

  const estimatedPercentile =
    userDirectPercentile !== null && !Number.isNaN(userDirectPercentile)
      ? userDirectPercentile
      : csatAvgGrade !== null
      ? gradeToPercentile(csatAvgGrade)
      : null;

  // Compare percentile against JSON percentileCutoff if present
  const cutoffPercentile = program.cutoff.percentileCutoff;
  let percentileStatus: GpaPositionStatus = '정보 없음';
  let percentileDiff: number | null = null;
  if (estimatedPercentile !== null && cutoffPercentile !== null) {
    percentileDiff = Number((estimatedPercentile - cutoffPercentile).toFixed(1));
    if (percentileDiff >= 2.0) percentileStatus = '안정';
    else if (percentileDiff >= -1.5) percentileStatus = '적정';
    else percentileStatus = '도전';
  }

  // Converted score calculation:
  // Only calculate against JSON maxScore/convertedScoreCutoff if present in JSON; never fabricate university formulas.
  const maxScore = program.cutoff.convertedScoreMax;
  const cutoffScore = program.cutoff.convertedScoreCutoff;
  let userConverted: number | null = null;
  let convertedBasis = MISSING_TEXT;

  if (maxScore !== null && myGpa !== null && (program.admissionType?.includes('교과') || program.cutoff.representative !== null)) {
    // Transparent linear conversion from 1~9 grade to maxScore if maxScore is provided in JSON
    const normalizedGpaScore = Math.max(0, Math.min(1, (9 - myGpa) / 8));
    userConverted = Number((normalizedGpaScore * maxScore).toFixed(1));
    convertedBasis = `JSON 만점(${maxScore}점) 기준 내신 비례 환산`;
  } else if (maxScore !== null && estimatedPercentile !== null) {
    userConverted = Number(((estimatedPercentile / 100) * maxScore).toFixed(1));
    convertedBasis = `JSON 만점(${maxScore}점) 기준 백분위 비례 환산`;
  } else if (cutoffScore !== null) {
    convertedBasis = 'JSON에 환산 만점/공식이 없어 사용자 환산점수 산출 불가';
  }

  // Overall status prioritizes GPA evaluation if available, or percentile evaluation if only CSAT cutoff exists
  let overallStatus: GpaPositionStatus = gpaEval.status;
  if (overallStatus === '정보 없음' && percentileStatus !== '정보 없음') {
    overallStatus = percentileStatus;
  } else if (overallStatus === '정보 없음' && csatAvgGrade !== null && program.cutoff.csatGradeCutoff !== null) {
    const cDiff = Number((csatAvgGrade - program.cutoff.csatGradeCutoff).toFixed(2));
    overallStatus = cDiff <= -0.2 ? '안정' : cDiff <= 0.2 ? '적정' : '도전';
  }

  const csatMinimumNote = program.csatMinimum
    ? `JSON 수능 최저: ${program.csatMinimum}`
    : MISSING_TEXT;

  return {
    program,
    overallStatus,
    gpaEval,
    csatAvgGrade,
    estimatedPercentile,
    percentileEval: {
      cutoffPercentile,
      diff: percentileDiff,
      status: percentileStatus,
    },
    convertedScore: {
      userScore: userConverted,
      cutoffScore,
      maxScore,
      basis: convertedBasis,
    },
    csatMinimumNote,
  };
}

export const JSON_TEMPLATE_STRING = JSON.stringify(
  {
    기준연도: '예: 2026학년도 (실제 기준 연도 입력)',
    출처: '예: 대학별 모집요강 / 대입정보포털 어디가 (실제 출처 입력)',
    학과목록: [
      {
        대학명: '',
        학과명: '',
        계열: '전기전자 | 반도체 | 신소재 | 기계 | 화공 | 컴퓨터 | 건축·토목 | 산업 | 자유전공',
        전형유형: '',
        전형명: '',
        모집인원: '',
        지원자격: '',
        학생부반영비율: '',
        수능반영비율: '',
        수능최저: '',
        주요특징: '',
        관련링크: '',
        전년도입결: {
          평균: null,
          '70%컷': null,
          백분위: null,
          환산점수: null,
          환산만점: null,
          설명: '',
        },
        일정: {
          원서접수: 'YYYY-MM-DD ~ YYYY-MM-DD',
          서류제출: 'YYYY-MM-DD ~ YYYY-MM-DD',
          면접: 'YYYY-MM-DD',
          발표일: 'YYYY-MM-DD',
        },
      },
    ],
    공지사항: [
      {
        대학명: '',
        학과명: '',
        유형: '원서 접수 시작 | 마감 임박 | 면접 일정 변경',
        제목: '',
        일정: 'YYYY-MM-DD',
        관련링크: 'https://...',
      },
    ],
    체크리스트: {
      학생부교과: [],
      학생부종합: [],
    },
  },
  null,
  2
);
