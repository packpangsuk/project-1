import { useState } from 'react';
import { Check, Copy, FileJson, Upload } from 'lucide-react';
import { JSON_TEMPLATE_STRING } from '../utils/jsonParser';

interface EmptyDataStateProps {
  title?: string;
  description?: string;
  onOpenJsonModal: () => void;
}

export function EmptyDataState({
  title = '입력된 입시 JSON 데이터가 없습니다',
  description = '이 앱은 사용자가 직접 입력한 JSON 데이터만 표시합니다. JSON 파일 또는 텍스트를 입력하면 대학별 비교표, D-day 일정, 내신·수능 합격 예측 및 AI 학과 추천이 즉시 활성화됩니다.',
  onOpenJsonModal,
}: EmptyDataStateProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON_TEMPLATE_STRING);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      onOpenJsonModal();
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 text-center sm:p-10">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
        <FileJson className="h-5 w-5" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-slate-900 sm:text-lg">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-600">{description}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onOpenJsonModal}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap"
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          JSON 데이터 입력하기
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              표준 양식 복사됨
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" aria-hidden="true" />
              표준 JSON 양식 복사
            </>
          )}
        </button>
      </div>
    </div>
  );
}
