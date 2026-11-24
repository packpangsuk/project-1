import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function sanitizeSafeUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (u.protocol === 'http:' || u.protocol === 'https:') {
      return u.toString();
    }
    return null;
  } catch {
    return null;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // AI 학과 추천 API (strictly grounded in user-provided JSON programs)
  app.post('/api/recommend-major', async (req, res) => {
    try {
      const { gpa, csatGrades, interests, preferredFields, programs, referenceYear, source } = req.body ?? {};

      if (!Array.isArray(programs) || programs.length === 0) {
        res.status(400).json({
          error: '추천을 위해 먼저 입시 JSON 데이터를 입력해 주세요.',
        });
        return;
      }

      const ai = getAiClient();
      if (!ai) {
        res.status(503).json({
          error: '서버에 GEMINI_API_KEY가 설정되어 있지 않습니다. Settings > Secrets에서 API 키를 확인해 주세요.',
        });
        return;
      }

      const compactPrograms = programs.slice(0, 60).map((p: Record<string, unknown>) => ({
        id: p.id,
        university: p.university ?? '정보 없음',
        department: p.department ?? '정보 없음',
        field: p.field ?? '정보 없음',
        admissionType: p.admissionType ?? '정보 없음',
        admissionName: p.admissionName ?? '정보 없음',
        quota: p.quota ?? '정보 없음',
        gpaRatio: p.gpaRatio ?? '정보 없음',
        csatMinimum: p.csatMinimum ?? '정보 없음',
        features: p.features ?? '정보 없음',
        notes: p.notes ?? null,
        cutoff: p.cutoff ?? null,
        referenceYear: p.referenceYear ?? referenceYear ?? '정보 없음',
        source: p.source ?? source ?? '정보 없음',
      }));

      const prompt = JSON.stringify(
        {
          studentProfile: {
            gpaAverage: gpa ?? '미입력',
            csatGrades: csatGrades ?? '미입력',
            interests: typeof interests === 'string' ? interests.slice(0, 500) : '',
            preferredFields: Array.isArray(preferredFields) ? preferredFields : [],
          },
          availableProgramsFromUserJson: compactPrograms,
        },
        null,
        2
      );

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            '당신은 공대 진학을 준비하는 고등학생을 돕는 입시 분석 도우미입니다. ' +
            '반드시 availableProgramsFromUserJson 배열에 존재하는 학과 중에서만 최대 5개를 추천하세요. ' +
            '절대로 제공된 JSON에 없는 대학, 학과, 커트라인 수치, 특징을 지어내지 마세요. ' +
            'JSON의 features가 "정보 없음"이거나 비어 있으면 features 필드에 반드시 "정보 없음"을 반환하고, ' +
            'cutoff 데이터가 없으면 expectedCutoff에 반드시 "정보 없음"을 반환하며 fitLevel도 "정보 없음"으로 설정하세요. ' +
            'matchReason에는 학생의 성적과 관심사가 해당 학과/전형과 어떻게 연결되는지 한국어로 간결하게 작성하세요. ' +
            'referenceYear와 source도 입력된 JSON 값을 그대로 유지하세요.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    programId: { type: Type.STRING },
                    university: { type: Type.STRING },
                    department: { type: Type.STRING },
                    field: { type: Type.STRING },
                    admissionType: { type: Type.STRING },
                    fitLevel: { type: Type.STRING },
                    matchReason: { type: Type.STRING },
                    features: { type: Type.STRING },
                    expectedCutoff: { type: Type.STRING },
                    referenceYear: { type: Type.STRING },
                    source: { type: Type.STRING },
                  },
                  required: [
                    'programId',
                    'university',
                    'department',
                    'field',
                    'admissionType',
                    'fitLevel',
                    'matchReason',
                    'features',
                    'expectedCutoff',
                    'referenceYear',
                    'source',
                  ],
                },
              },
            },
            required: ['recommendations'],
          },
        },
      });

      const rawText = (response.text ?? '{"recommendations":[]}').trim();
      const parsed = JSON.parse(rawText) as { recommendations?: unknown[] };
      const validIds = new Set(compactPrograms.map((p) => String(p.id)));

      const sanitized = (parsed.recommendations ?? [])
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
        .map((item) => {
          const matched = compactPrograms.find((p) => String(p.id) === String(item.programId));
          const allowedFit = ['안정', '적정', '도전', '정보 없음'];
          const fit = allowedFit.includes(String(item.fitLevel)) ? String(item.fitLevel) : '정보 없음';
          return {
            programId: matched ? String(matched.id) : validIds.has(String(item.programId)) ? String(item.programId) : null,
            university: matched ? String(matched.university) : String(item.university || '정보 없음'),
            department: matched ? String(matched.department) : String(item.department || '정보 없음'),
            field: matched ? String(matched.field) : String(item.field || '정보 없음'),
            admissionType: matched ? String(matched.admissionType) : String(item.admissionType || '정보 없음'),
            fitLevel: fit,
            matchReason: String(item.matchReason || '정보 없음'),
            features:
              matched && matched.features && matched.features !== '정보 없음'
                ? String(matched.features)
                : '정보 없음',
            expectedCutoff: String(item.expectedCutoff || '정보 없음'),
            referenceYear: matched ? String(matched.referenceYear) : String(item.referenceYear || referenceYear || '정보 없음'),
            source: matched ? String(matched.source) : String(item.source || source || '정보 없음'),
          };
        });

      res.json({ recommendations: sanitized });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI 학과 추천 요청 중 오류가 발생했습니다.';
      res.status(500).json({ error: message });
    }
  });

  // 실시간 공대 입시 뉴스 및 중요 공지사항 수집 API (Google Search Grounding)
  app.post('/api/admission-news', async (req, res) => {
    try {
      const { universities, yearHint } = req.body ?? {};
      const ai = getAiClient();
      if (!ai) {
        res.status(503).json({
          error: '서버에 GEMINI_API_KEY가 설정되어 있지 않아 실시간 입시 공지 수집을 실행할 수 없습니다.',
        });
        return;
      }

      const univList = Array.isArray(universities)
        ? universities
            .filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
            .slice(0, 8)
        : [];

      const targetUnivText =
        univList.length > 0
          ? univList.join(', ')
          : '서울대, 연세대, 고려대, 카이스트, 포항공대, 한양대, 성균관대';

      const yearText = typeof yearHint === 'string' && yearHint.trim() ? yearHint.trim() : '2026~2027학년도';

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents:
          `대한민국 주요 공과대학(${targetUnivText}) 입학처 및 대입정보포털 어디가(adiga.kr), 베리타스알파(veritas-a.com), 진학사(jinhak.com), 유웨이(uway.com) 등에서 보도·공지된 ${yearText} 수시/정시 입학 전형 관련 최신 공지사항 및 입시 뉴스(원서 접수 시작, 서류/접수 마감 임박, 면접 일정 변경 또는 공지, 입학처 공지)를 검색해 최대 6건 정리해 주세요.\n` +
          '반드시 검색 결과로 확인된 실제 정보만 사용하고, 확인되지 않은 학과명이나 일정은 "정보 없음"으로 표시하세요.\n' +
          '각 항목은 반드시 다음 JSON 배열 형식의 코드 블록으로만 출력하세요:\n' +
          '[{"university":"대학명","department":"학과명 또는 정보 없음","category":"원서 접수 시작|마감 임박|면접 일정 변경|입시 뉴스","title":"공지 제목","schedule":"YYYY-MM-DD 또는 일정 텍스트 또는 정보 없음"}]',
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const rawText = response.text ?? '';
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
      const groundingLinks = chunks
        .map((c) => {
          const web = c.web;
          const url = sanitizeSafeUrl(web?.uri);
          if (!url) return null;
          return {
            title: typeof web?.title === 'string' ? web.title : url,
            url,
          };
        })
        .filter((x): x is { title: string; url: string } => x !== null);

      let parsedItems: Array<Record<string, unknown>> = [];
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const arr = JSON.parse(jsonMatch[0]);
          if (Array.isArray(arr)) parsedItems = arr;
        } catch {
          parsedItems = [];
        }
      }

      const alerts = parsedItems.map((item, idx) => {
        const univ = typeof item.university === 'string' && item.university.trim() ? item.university.trim() : '정보 없음';
        const matchedLink =
          groundingLinks.find((g) => univ !== '정보 없음' && g.title.includes(univ.replace('학교', ''))) ??
          groundingLinks[idx] ??
          groundingLinks[0] ??
          null;

        const rawCat = String(item.category ?? '');
        const category = rawCat.includes('시작')
          ? '원서 접수 시작'
          : rawCat.includes('마감')
          ? '마감 임박'
          : rawCat.includes('변경')
          ? '면접 일정 변경'
          : '입시 뉴스';

        return {
          id: `live-${Date.now()}-${idx}`,
          university: univ === '정보 없음' ? null : univ,
          department:
            typeof item.department === 'string' && item.department.trim() && item.department.trim() !== '정보 없음'
              ? item.department.trim()
              : null,
          category,
          title: typeof item.title === 'string' && item.title.trim() ? item.title.trim() : '입시 공지',
          schedule:
            typeof item.schedule === 'string' && item.schedule.trim() && item.schedule.trim() !== '정보 없음'
              ? item.schedule.trim()
              : null,
          link: matchedLink?.url ?? null,
          sourceType: 'live-search' as const,
          sourceLabel: matchedLink ? `Google 검색 (${matchedLink.title})` : 'Google 실시간 검색',
          referenceYear: yearText,
          createdAt: new Date().toISOString(),
        };
      });

      res.json({
        alerts,
        groundingLinks,
        fetchedAt: new Date().toISOString(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '실시간 입시 뉴스 수집 중 오류가 발생했습니다.';
      res.status(500).json({ error: message });
    }
  });

  // 진학사(jinhak.com) 공대 생기부/세특 칼럼 실시간 검색 API
  app.post('/api/jinhak-saengibu', async (req, res) => {
    try {
      const { field } = req.body ?? {};
      const ai = getAiClient();
      if (!ai) {
        res.status(503).json({
          error: '서버에 GEMINI_API_KEY가 설정되어 있지 않아 실시간 진학사 칼럼 검색을 실행할 수 없습니다.',
        });
        return;
      }

      const targetField =
        typeof field === 'string' && field.trim() && field !== '전체'
          ? field.trim()
          : '공학계열 전체(전기전자·반도체·기계·화공·컴퓨터·신소재·건축·산업)';

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents:
          `진학사(jinhak.com)에서 제공하는 공과대학 진학 대비 학교생활기록부(생기부) 및 세부능력특기사항(세특) 가이드, 추천 탐구 주제(${targetField}) 관련 공식 칼럼/가이드를 검색해 최대 5건 요약해 주세요.\n` +
          '반드시 검색 결과로 실제 확인된 정보만 작성하고, 확인되지 않은 내용은 "정보 없음"으로 표시하세요.\n' +
          '각 항목은 다음 JSON 배열 형식의 코드 블록으로만 출력하세요:\n' +
          '[{"title":"칼럼/가이드 제목","field":"관련 공대 계열","summary":"핵심 세특/생기부 조언 1~2문장","keywords":["키워드1","키워드2"]}]',
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const rawText = response.text ?? '';
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
      const groundingLinks = chunks
        .map((c) => {
          const web = c.web;
          const url = sanitizeSafeUrl(web?.uri);
          if (!url) return null;
          return {
            title: typeof web?.title === 'string' ? web.title : url,
            url,
          };
        })
        .filter((x): x is { title: string; url: string } => x !== null);

      let parsedItems: Array<Record<string, unknown>> = [];
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const arr = JSON.parse(jsonMatch[0]);
          if (Array.isArray(arr)) parsedItems = arr;
        } catch {
          parsedItems = [];
        }
      }

      const articles = parsedItems.map((item, idx) => {
        const matchedLink =
          groundingLinks.find((g) => g.title.toLowerCase().includes('jinhak') || g.title.includes('진학')) ??
          groundingLinks[idx] ??
          groundingLinks[0] ??
          null;
        return {
          id: `jinhak-art-${idx}`,
          title: typeof item.title === 'string' && item.title.trim() ? item.title.trim() : '진학사 공대 생기부 가이드',
          field: typeof item.field === 'string' && item.field.trim() ? item.field.trim() : targetField,
          summary: typeof item.summary === 'string' && item.summary.trim() ? item.summary.trim() : '정보 없음',
          keywords: Array.isArray(item.keywords)
            ? item.keywords.filter((k): k is string => typeof k === 'string' && k.trim().length > 0).slice(0, 4)
            : [],
          link: matchedLink?.url ?? null,
          sourceTitle: matchedLink?.title ?? '진학사 (jinhak.com)',
        };
      });

      res.json({ articles, groundingLinks });
    } catch (error) {
      const message = error instanceof Error ? error.message : '진학사 생기부 자료 검색 중 오류가 발생했습니다.';
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
