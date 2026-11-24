import { useMemo, useState } from 'react';
import { Bell, BellRing, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { AdmissionDataset, MISSING_TEXT, NoticeAlertItem } from '../types/admission';
import { buildScheduleAlertsFromJson, displayValue } from '../utils/jsonParser';
import { SourceBanner } from './SourceBanner';

interface AlertsNewsViewProps {
  dataset: AdmissionDataset | null;
  liveAlerts: NoticeAlertItem[];
  onSetLiveAlerts: (items: NoticeAlertItem[]) => void;
  onOpenJsonModal: () => void;
}

export function AlertsNewsView({
  dataset,
  liveAlerts,
  onSetLiveAlerts,
  onOpenJsonModal,
}: AlertsNewsViewProps) {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pushMessage, setPushMessage] = useState<string | null>(null);

  const jsonAlerts = useMemo(() => buildScheduleAlertsFromJson(dataset), [dataset]);

  const combinedAlerts = useMemo(() => {
    return [...liveAlerts, ...jsonAlerts];
  }, [liveAlerts, jsonAlerts]);

  const universitySiteLinks = useMemo(() => {
    const map = new Map<string, { name: string; url: string }>();
    for (const p of dataset?.programs ?? []) {
      if (p.university && p.link && !map.has(p.link)) {
        map.set(p.link, { name: `${p.university} 입학처`, url: p.link });
      }
    }
    return Array.from(map.values());
  }, [dataset]);

  const requestBrowserPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPushMessage('현재 브라우저 환경에서는 웹 푸시 알림 API를 지원하지 않습니다.');
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      setPushMessage('브라우저 푸시 알림 권한이 허용되었습니다.');
    } else {
      setPushMessage('알림 권한이 거부되었거나 보류되었습니다. 브라우저 설정에서 변경할 수 있습니다.');
    }
  };

  const dispatchPushNotification = (alert: NoticeAlertItem) => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPushMessage('현재 브라우저에서 알림 API를 사용할 수 없습니다.');
      return;
    }
    if (Notification.permission !== 'granted') {
      setPushMessage('먼저 상단의 "브라우저 알림 허용" 버튼을 눌러 권한을 승인해 주세요.');
      return;
    }

    const title = `[${alert.category}] ${displayValue(alert.university)} ${displayValue(alert.department)}`;
    const body = `${alert.title}\n일정: ${displayValue(alert.schedule)}`;
    const notif = new Notification(title, { body });
    if (alert.link) {
      notif.onclick = () => {
        window.focus();
      };
    }
    setPushMessage(`푸시 알림을 발송했습니다: ${displayValue(alert.university)} (${alert.category})`);
  };

  const fetchLiveAdmissionNews = async () => {
    setLoading(true);
    setError(null);
    setPushMessage(null);
    try {
      const universities = Array.from(
        new Set(
          (dataset?.programs ?? [])
            .map((p) => p.university)
            .filter((u): u is string => Boolean(u))
        )
      );

      const response = await fetch('/api/admission-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          universities,
          yearHint: dataset?.referenceYear ?? undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '실시간 입시 뉴스를 불러오지 못했습니다.');
      }
      const fetched: NoticeAlertItem[] = Array.isArray(data.alerts) ? data.alerts : [];
      onSetLiveAlerts(fetched);

      if (fetched.length > 0 && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        const first = fetched[0];
        new Notification(`[입시 알림] ${displayValue(first.university)}`, {
          body: `${first.title} (${displayValue(first.schedule)})`,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '실시간 입시 공지 수집 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-labelledby="alerts-heading">
      <div className="mb-4">
        <h1 id="alerts-heading" className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          실시간 입시 뉴스 및 중요 공지 알림
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          JSON에 등록된 원서 접수·마감 임박·면접 일정 알림과 실시간 입학처 공지사항을 수집하여 브라우저 푸시 알림으로 제공합니다.
        </p>
      </div>

      <SourceBanner dataset={dataset} onOpenJsonModal={onOpenJsonModal} />

      {/* 알림 설정 및 실시간 수집 툴바 */}
      <div className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <BellRing className="h-4 w-4 text-blue-700" aria-hidden="true" />
            푸시 알림 상태:{' '}
            <span className="text-blue-700">
              {permission === 'granted' ? '허용됨' : permission === 'denied' ? '차단/미지원' : '미설정'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            원서 접수 시작, 마감 임박(D-7 이내), 면접 일정 변경 공지를 즉시 알림으로 받을 수 있습니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {permission !== 'granted' && (
            <button
              type="button"
              onClick={requestBrowserPermission}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              <Bell className="h-3.5 w-3.5" aria-hidden="true" />
              브라우저 알림 허용
            </button>
          )}

          <button
            type="button"
            onClick={fetchLiveAdmissionNews}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-60 whitespace-nowrap"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                실시간 공지 수집 중...
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                실시간 입시 공지 수집
              </>
            )}
          </button>
        </div>
      </div>

      {/* 주요 입시 사이트 바로가기 (베리타스알파 + JSON 내 대학 입학처) */}
      <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-semibold text-slate-900">주요 입시 사이트 바로가기</h2>
          <span className="text-xs text-slate-500">
            전형 요약 분석·입시 기사 및 JSON 등록 대학 입학처 원문 이동
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <a
            href="https://www.veritas-a.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-800 transition-colors hover:bg-blue-100 whitespace-nowrap"
          >
            베리타스알파 (입시뉴스 · 요강분석)
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>

          <a
            href="https://www.adiga.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-800 transition-colors hover:bg-blue-100 whitespace-nowrap"
          >
            대입정보포털 대학어디가 (공식 입결)
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>

          <a
            href="https://www.jinhak.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 hover:text-blue-700 whitespace-nowrap"
          >
            진학사 (입시정보 · 공대 생기부)
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
          </a>

          <a
            href="https://www.uway.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 hover:text-blue-700 whitespace-nowrap"
          >
            유웨이 (입시정보 · 모의지원)
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
          </a>

          <a
            href="https://www.uwayapply.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 hover:text-blue-700 whitespace-nowrap"
          >
            유웨이어플라이 (원서접수)
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
          </a>

          {universitySiteLinks.map((site) => (
            <a
              key={site.url}
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 whitespace-nowrap"
            >
              {site.name}
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>

      {pushMessage && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-medium text-blue-800">
          {pushMessage}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700" role="alert">
          {error}
        </div>
      )}

      {combinedAlerts.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm font-medium text-slate-800">
            표시할 입시 뉴스 또는 임박 일정 알림이 없습니다.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            상단의 &ldquo;실시간 입시 공지 수집&rdquo;을 실행하거나, JSON 데이터에 일정/공지사항을 입력해 주세요.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {combinedAlerts.map((alert) => (
            <article
              key={alert.id}
              className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-blue-700">
                    {alert.category}
                  </span>
                  <button
                    type="button"
                    onClick={() => dispatchPushNotification(alert)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
                  >
                    <Bell className="h-3 w-3" aria-hidden="true" />
                    푸시 보내기
                  </button>
                </div>

                <h2 className="mt-1.5 text-sm font-bold text-slate-900 leading-snug">
                  {alert.title}
                </h2>

                <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs">
                  <div>
                    <dt className="text-slate-500">대학명</dt>
                    <dd className="mt-0.5 font-medium text-slate-900">{displayValue(alert.university)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">학과명</dt>
                    <dd className="mt-0.5 font-medium text-slate-900">{displayValue(alert.department)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">일정</dt>
                    <dd className="mt-0.5 font-medium text-slate-900 tabular-nums">
                      {displayValue(alert.schedule)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">관련 링크</dt>
                    <dd className="mt-0.5">
                      {alert.link ? (
                        <a
                          href={alert.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline"
                        >
                          공지 바로가기
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </a>
                      ) : (
                        <span className="text-slate-500">{MISSING_TEXT}</span>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-3 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
                기준 연도: <strong className="text-slate-700">{displayValue(alert.referenceYear)}</strong> · 출처:{' '}
                <strong className="text-slate-700">{displayValue(alert.sourceLabel)}</strong>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
