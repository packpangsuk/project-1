import { AlertTriangle, CheckCircle2, HelpCircle, Target } from 'lucide-react';
import { GpaPositionStatus } from '../types/admission';

interface StatusLabelProps {
  status: GpaPositionStatus;
}

export function StatusLabel({ status }: StatusLabelProps) {
  if (status === '안정') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 whitespace-nowrap">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        안정
      </span>
    );
  }
  if (status === '적정') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 whitespace-nowrap">
        <Target className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        적정
      </span>
    );
  }
  if (status === '도전') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 whitespace-nowrap">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        도전
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 whitespace-nowrap">
      <HelpCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      정보 없음
    </span>
  );
}
