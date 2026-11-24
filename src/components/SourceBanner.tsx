import { useState } from 'react';
import { ChevronDown, ChevronUp, Database, ExternalLink, FileUp } from 'lucide-react';
import { AdmissionDataset, MISSING_TEXT } from '../types/admission';

interface SourceBannerProps {
  dataset: AdmissionDataset | null;
  onOpenJsonModal: () => void;
}

function splitSourceLine(entry: string): { label: string; url: string | null } {
  const match = entry.match(/https?:\/\/\S+/);
  if (!match) return { label: entry, url: null };
  const rawUrl = match[0];
  let safeUrl: string | null = null;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      safeUrl = parsed.toString();
    }
  } catch {
    safeUrl = null;
  }
  const label = entry.replace(rawUrl, '').trim() || rawUrl;
  return { label, url: safeUrl };
}

export function SourceBanner({ dataset, onOpenJsonModal }: SourceBannerProps) {
  const [expanded, setExpanded] = useState(false);

  const referenceYear = dataset?.referenceYear ?? MISSING_TEXT;
  const source = dataset?.source ?? MISSING_TEXT;
  const count = dataset?.programs.length ?? 0;
  const hasMetaDetails = Boolean(
    dataset &&
      (dataset.sourceList.length > 0 ||
        dataset.cutoffCaution ||
        dataset.dataGrade ||
        dataset.lastChecked ||
        dataset.scheduleMemo)
  );

  return (
    <div className="mb-6 border-b border-slate-200 pb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-900">
            <Database className="h-4 w-4 text-blue-700 shrink-0" aria-hidden="true" />
            기준: <strong className="font-semibold tabular-nums">{referenceYear}</strong>
          </span>
          <span className="text-slate-300" aria-hidden="true">·</span>
          <span>
            출처: <strong className="font-semibold text-slate-900">{source}</strong>
          </span>
          <span className="text-slate-300" aria-hidden="true">·</span>
          <span className="tabular-nums text-slate-500">
            등록 학과 {count}건
          </span>
          {dataset?.lastChecked && (
            <>
              <span className="text-slate-300" aria-hidden="true">·</span>
              <span className="tabular-nums text-slate-500">
                확인일 {dataset.lastChecked}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasMetaDetails && (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              aria-expanded={expanded}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 whitespace-nowrap"
            >
              출처 · 유의사항
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onOpenJsonModal}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 whitespace-nowrap shrink-0"
          >
            <FileUp className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
            {dataset ? 'JSON 데이터 교체 / 편집' : 'JSON 데이터 입력하기'}
          </button>
        </div>
      </div>

      {expanded && dataset && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-600 space-y-2 leading-relaxed">
          {dataset.cutoffCaution && (
            <p>
              <strong className="font-semibold text-slate-800">입결 주의:</strong> {dataset.cutoffCaution}
            </p>
          )}
          {dataset.dataGrade && (
            <p>
              <strong className="font-semibold text-slate-800">자료 등급:</strong> {dataset.dataGrade}
            </p>
          )}
          {dataset.scheduleMemo && (
            <p>
              <strong className="font-semibold text-slate-800">일정 메모:</strong> {dataset.scheduleMemo}
            </p>
          )}
          {dataset.sourceList.length > 0 && (
            <div className="pt-1 border-t border-slate-100">
              <p className="font-semibold text-slate-800 mb-1">세부 출처 ({dataset.sourceList.length}건)</p>
              <ul className="space-y-1">
                {dataset.sourceList.map((entry, idx) => {
                  const { label, url } = splitSourceLine(entry);
                  return (
                    <li key={idx} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-slate-700">• {label}</span>
                      {url && (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-700 hover:underline break-all"
                        >
                          원문 보기
                          <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
