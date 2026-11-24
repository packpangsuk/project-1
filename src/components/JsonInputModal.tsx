import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy, Download, FileJson, Trash2, Upload, X } from 'lucide-react';
import { JSON_TEMPLATE_STRING, parseAdmissionJson } from '../utils/jsonParser';
import { AdmissionDataset } from '../types/admission';
import userDefaultData from '../data/userAdmissions2027.json';

interface JsonInputModalProps {
  isOpen: boolean;
  initialRawJson: string;
  currentDataset: AdmissionDataset | null;
  onClose: () => void;
  onApplyDataset: (dataset: AdmissionDataset, rawJson: string) => void;
  onClearDataset: () => void;
}

export function JsonInputModal({
  isOpen,
  initialRawJson,
  currentDataset,
  onClose,
  onApplyDataset,
  onClearDataset,
}: JsonInputModalProps) {
  const [text, setText] = useState<string>(initialRawJson);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setText(initialRawJson);
      setError(null);
    }
  }, [isOpen, initialRawJson]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      setText(content);
      setError(null);
    };
    reader.onerror = () => {
      setError('파일을 읽는 중 오류가 발생했습니다.');
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const handleApply = () => {
    const { dataset, error: parseErr } = parseAdmissionJson(text);
    if (parseErr || !dataset) {
      setError(parseErr ?? 'JSON 데이터를 처리할 수 없습니다.');
      return;
    }
    setError(null);
    onApplyDataset(dataset, text);
    onClose();
  };

  const handleCopyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(JSON_TEMPLATE_STRING);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setText(JSON_TEMPLATE_STRING);
    }
  };

  const handleInsertTemplate = () => {
    setText(JSON_TEMPLATE_STRING);
    setError(null);
  };

  const handleRestoreSkyData = () => {
    setText(JSON.stringify(userDefaultData, null, 2));
    setError(null);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([JSON_TEMPLATE_STRING], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gongdae-admission-template.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="json-modal-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-t-2xl border border-slate-200 bg-white shadow-xl sm:rounded-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <FileJson className="h-5 w-5 text-blue-700" aria-hidden="true" />
            <h2 id="json-modal-title" className="text-base font-semibold text-slate-900">
              입시 정보 JSON 데이터 입력 및 관리
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-600">
            <p className="font-medium text-slate-800">데이터 원칙 안내</p>
            <p className="mt-1">
              이 앱은 사용자가 직접 입력하거나 업로드한 JSON 데이터만 표시합니다. JSON에 누락되거나 비어 있는 항목은 임의로 생성하지 않고 모두 <strong className="text-slate-900">&ldquo;정보 없음&rdquo;</strong>으로 표시됩니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
            >
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              JSON 파일 업로드
            </button>
            <button
              type="button"
              onClick={handleRestoreSkyData}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-800 transition-colors hover:bg-blue-100 whitespace-nowrap"
            >
              2027 기본 데이터 채우기 (서울대·연세대·고려대)
            </button>
            <button
              type="button"
              onClick={handleInsertTemplate}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
            >
              빈 양식 채우기
            </button>
            <button
              type="button"
              onClick={handleCopyTemplate}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                  양식 복사됨
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  표준 JSON 양식 복사
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              양식 파일 저장
            </button>
          </div>

          <div>
            <label htmlFor="json-textarea" className="mb-1.5 block text-xs font-medium text-slate-700">
              JSON 데이터 직접 붙여넣기
            </label>
            <textarea
              id="json-textarea"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (error) setError(null);
              }}
              rows={13}
              spellCheck={false}
              placeholder='{"기준연도": "2026학년도", "출처": "대학별 모집요강", "학과목록": [ ... ]}'
              className="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 font-mono text-xs leading-relaxed text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700" role="alert">
              {error}
            </div>
          )}

          <div className="text-xs text-slate-500 leading-relaxed">
            지원 구조: <code className="font-mono text-slate-700">{'{ meta, 대학, 전형, 학과 }'}</code> 관계형 JSON 및{' '}
            <code className="font-mono text-slate-700">{'{ 기준연도, 출처, 학과목록 }'}</code> / 영문(<code className="font-mono text-slate-700">referenceYear, source, programs</code>) 키 모두 자동 인식됩니다.
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-3.5">
          <div>
            {currentDataset && (
              <button
                type="button"
                onClick={() => {
                  onClearDataset();
                  setText('');
                  setError(null);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 whitespace-nowrap"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                저장된 데이터 초기화
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap"
            >
              JSON 적용하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
