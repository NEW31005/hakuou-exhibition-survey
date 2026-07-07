"use client";

import { useMemo, useState } from "react";
import type {
  SummaryCount,
  SurveyEventSummary,
  SurveyResponseSummary,
  SurveySummaryData,
  SurveySummaryResponse
} from "@/src/types/survey";

type DashboardFilters = {
  eventSlug: string;
  leadRank: string;
  requestedAction: string;
  introductionTiming: string;
  contactPermission: string;
  keyword: string;
};

const initialFilters: DashboardFilters = {
  eventSlug: "",
  leadRank: "",
  requestedAction: "",
  introductionTiming: "",
  contactPermission: "",
  keyword: ""
};

const defaultGasUrl = process.env.NEXT_PUBLIC_GAS_WEB_APP_URL?.trim() || "";
const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function DashboardClient() {
  const [gasUrl, setGasUrl] = useState(() => {
    if (typeof window === "undefined") return defaultGasUrl;
    return sessionStorage.getItem("surveyDashboardGasUrl") || defaultGasUrl;
  });
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem("surveyDashboardApiKey") || "";
  });
  const [filters, setFilters] = useState(initialFilters);
  const [data, setData] = useState<SurveySummaryData | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponseSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const kpis = useMemo(() => {
    const rankMap = toCountMap(data?.summary.rankCounts || []);
    const siteVisitCount = findCount(data?.summary.requestedActionCounts || [], "現地調査を依頼したい");
    const estimateCount = findCount(data?.summary.requestedActionCounts || [], "価格・見積感を知りたい");

    return [
      { label: "全回答", value: data?.summary.responseCount || 0 },
      { label: "Sランク", value: rankMap.S || 0 },
      { label: "Aランク", value: rankMap.A || 0 },
      { label: "現地調査希望", value: siteVisitCount },
      { label: "見積希望", value: estimateCount }
    ];
  }, [data]);

  async function loadSummary(nextFilters = filters) {
    setSelectedResponse(null);
    setError("");

    if (!gasUrl.trim()) {
      setData(null);
      setError("GAS Web App URLを入力してください。GASデプロイ後に発行される /exec のURLです。");
      return;
    }

    sessionStorage.setItem("surveyDashboardGasUrl", gasUrl.trim());
    sessionStorage.setItem("surveyDashboardApiKey", apiKey.trim());
    setIsLoading(true);

    try {
      const response = await fetch(buildGasUrl("summary", nextFilters).toString(), {
        cache: "no-store"
      });
      const payload = await response.json() as SurveySummaryResponse;

      if (!payload.ok || !payload.data) {
        throw new Error(payload.message || "集計データを取得できませんでした。");
      }

      setData(payload.data);
    } catch (fetchError) {
      setData(null);
      setError(fetchError instanceof Error ? fetchError.message : "集計データを取得できませんでした。");
    } finally {
      setIsLoading(false);
    }
  }

  function updateFilter(key: keyof DashboardFilters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function resetFilters() {
    setFilters(initialFilters);
    void loadSummary(initialFilters);
  }

  function buildGasUrl(action: "summary" | "csv", currentFilters = filters, csvType = "all") {
    const url = new URL(gasUrl.trim());
    url.searchParams.set("action", action);

    if (action === "csv") {
      url.searchParams.set("type", csvType);
    }

    Object.entries(currentFilters).forEach(([key, value]) => {
      if (value.trim()) url.searchParams.set(key, value.trim());
    });

    if (apiKey.trim()) {
      url.searchParams.set("apiKey", apiKey.trim());
    }

    return url;
  }

  function openCsv(type: string) {
    if (!gasUrl.trim()) {
      setError("CSV出力にはGAS Web App URLが必要です。");
      return;
    }
    if (type === "event" && !filters.eventSlug) {
      setError("展示会別CSVは、先に展示会を選択してください。");
      return;
    }

    window.open(buildGasUrl("csv", filters, type).toString(), "_blank", "noopener,noreferrer");
  }

  function eventFormUrl(event: SurveyEventSummary) {
    if (event.formUrl.startsWith("http")) return event.formUrl;
    return `${publicBasePath}/survey/${event.eventSlug}/`;
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-hakuou-ink">
      <div className="border-b border-hakuou-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black text-hakuou-blue">HAKUOU ROBOTICS</p>
            <h1 className="text-2xl font-black leading-tight">展示会アンケート集計ダッシュボード</h1>
            <p className="mt-1 text-sm font-bold text-hakuou-muted">
              全展示会の回答状況、見込み度、希望対応、個別回答を横断して確認できます。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="dashboard-button" onClick={() => openCsv("all")} type="button">全回答CSV</button>
            <button className="dashboard-button" onClick={() => openCsv("event")} type="button">展示会別CSV</button>
            <button className="dashboard-button" onClick={() => openCsv("highRank")} type="button">S/A CSV</button>
            <button className="dashboard-button" onClick={() => openCsv("siteVisit")} type="button">現地調査CSV</button>
            <button className="dashboard-button" onClick={() => openCsv("estimate")} type="button">見積CSV</button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <section className="mb-4 rounded-lg border border-hakuou-line bg-white p-4 shadow-panel sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(180px,0.5fr)_auto] lg:items-end">
            <label className="block text-sm font-black">
              GAS Web App URL
              <input
                className="dashboard-input"
                value={gasUrl}
                onChange={(event) => setGasUrl(event.target.value)}
                placeholder="https://script.google.com/macros/s/xxxxx/exec"
              />
            </label>
            <label className="block text-sm font-black">
              閲覧キー
              <input
                className="dashboard-input"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="集計閲覧キー"
                type="password"
              />
            </label>
            <button
              className="dashboard-button dashboard-primary min-h-11"
              disabled={isLoading}
              onClick={() => loadSummary()}
              type="button"
            >
              {isLoading ? "読み込み中" : "集計を読み込む"}
            </button>
          </div>
          <p className="mt-3 text-xs font-bold text-hakuou-muted">
            回答結果には個人情報が含まれるため、閲覧キーはこのブラウザのセッション内だけに保存します。
          </p>
        </section>

        <section className="mb-4 rounded-lg border border-hakuou-line bg-white p-4 shadow-panel sm:p-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <SelectFilter
              label="展示会"
              value={filters.eventSlug}
              options={data?.filters.events || []}
              onChange={(value) => updateFilter("eventSlug", value)}
            />
            <SelectFilter
              label="ランク"
              value={filters.leadRank}
              options={(data?.filters.leadRank || []).map((value) => ({ value, label: value }))}
              onChange={(value) => updateFilter("leadRank", value)}
            />
            <SelectFilter
              label="希望対応"
              value={filters.requestedAction}
              options={(data?.filters.requestedActions || []).map((value) => ({ value, label: value }))}
              onChange={(value) => updateFilter("requestedAction", value)}
            />
            <SelectFilter
              label="導入時期"
              value={filters.introductionTiming}
              options={(data?.filters.introductionTiming || []).map((value) => ({ value, label: value }))}
              onChange={(value) => updateFilter("introductionTiming", value)}
            />
            <SelectFilter
              label="連絡可否"
              value={filters.contactPermission}
              options={(data?.filters.contactPermission || []).map((value) => ({ value, label: value }))}
              onChange={(value) => updateFilter("contactPermission", value)}
            />
            <label className="block text-sm font-black">
              キーワード
              <input
                className="dashboard-input"
                value={filters.keyword}
                onChange={(event) => updateFilter("keyword", event.target.value)}
                placeholder="会社名・氏名など"
                type="search"
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="dashboard-button dashboard-primary" disabled={isLoading} onClick={() => loadSummary()} type="button">
              絞り込み
            </button>
            <button className="dashboard-button" disabled={isLoading} onClick={resetFilters} type="button">
              解除
            </button>
            {data ? (
              <p className="ml-auto self-center text-xs font-bold text-hakuou-muted">
                最終更新 {data.generatedAt}
              </p>
            ) : null}
          </div>
        </section>

        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-hakuou-red">
            {error}
          </div>
        ) : null}

        <section className="mb-4 grid gap-3 md:grid-cols-5">
          {kpis.map((item) => (
            <div key={item.label} className="rounded-lg border border-hakuou-line bg-white p-4 shadow-panel">
              <p className="text-xs font-black text-hakuou-muted">{item.label}</p>
              <p className="mt-3 text-3xl font-black text-hakuou-navy">{item.value}</p>
            </div>
          ))}
        </section>

        <section className="mb-4 rounded-lg border border-hakuou-line bg-white p-4 shadow-panel sm:p-5">
          <h2 className="mb-3 text-lg font-black">展示会別集計</h2>
          <EventSummaryTable events={data?.events || []} formUrlFor={eventFormUrl} />
        </section>

        <div className="mb-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="rounded-lg border border-hakuou-line bg-white p-4 shadow-panel sm:p-5">
            <h2 className="mb-3 text-lg font-black">横断集計</h2>
            <div className="grid gap-5 lg:grid-cols-2">
              <BarList title="希望対応" items={data?.summary.requestedActionCounts || []} />
              <BarList title="導入時期" items={data?.summary.introductionTimingCounts || []} />
              <BarList title="導入検討状況" items={data?.summary.considerationStatusCounts || []} />
              <BarList title="現場課題" items={data?.summary.issueCounts || []} />
              <BarList title="搬送重量" items={data?.summary.loadWeightCounts || []} />
              <BarList title="荷姿" items={data?.summary.loadTypeCounts || []} />
            </div>
          </section>

          <section className="rounded-lg border border-hakuou-line bg-white p-4 shadow-panel sm:p-5">
            <h2 className="mb-3 text-lg font-black">回答詳細</h2>
            <ResponseDetail response={selectedResponse} />
          </section>
        </div>

        <section className="rounded-lg border border-hakuou-line bg-white p-4 shadow-panel sm:p-5">
          <h2 className="mb-3 text-lg font-black">回答一覧</h2>
          <ResponseTable
            responses={data?.responses || []}
            selectedId={selectedResponse?.id || ""}
            onSelect={setSelectedResponse}
          />
        </section>
      </div>
    </main>
  );
}

function SelectFilter({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-black">
      {label}
      <select className="dashboard-input" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">すべて</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function EventSummaryTable({
  events,
  formUrlFor
}: {
  events: SurveyEventSummary[];
  formUrlFor: (event: SurveyEventSummary) => string;
}) {
  if (!events.length) return <EmptyState text="展示会データはまだ読み込まれていません。" />;

  return (
    <div className="overflow-auto rounded-lg border border-hakuou-line">
      <table className="w-full min-w-[980px] border-collapse text-sm">
        <thead className="bg-slate-100 text-left">
          <tr>
            {["展示会", "開催日", "会場", "状態", "回答", "S", "A", "B", "C", "フォーム"].map((header) => (
              <th key={header} className="border-b border-hakuou-line px-3 py-2 font-black">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.eventSlug} className="border-b border-hakuou-line last:border-0">
              <td className="px-3 py-2">
                <div className="font-black">{event.eventName}</div>
                <div className="text-xs font-bold text-hakuou-muted">{event.eventSlug}</div>
              </td>
              <td className="px-3 py-2">{[event.startDate, event.endDate].filter(Boolean).join(" - ") || "-"}</td>
              <td className="px-3 py-2">{event.venue || "-"}</td>
              <td className="px-3 py-2"><RankChip value={event.status} tone="status" /></td>
              <td className="px-3 py-2 font-black">{event.responseCount}</td>
              <td className="px-3 py-2">{event.rankS}</td>
              <td className="px-3 py-2">{event.rankA}</td>
              <td className="px-3 py-2">{event.rankB}</td>
              <td className="px-3 py-2">{event.rankC}</td>
              <td className="px-3 py-2">
                <a className="font-black text-hakuou-blue underline" href={formUrlFor(event)} rel="noreferrer" target="_blank">
                  開く
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BarList({ title, items }: { title: string; items: SummaryCount[] }) {
  const max = Math.max(1, ...items.map((item) => Number(item.count) || 0));

  return (
    <div>
      <h3 className="mb-3 text-sm font-black">{title}</h3>
      {items.length ? (
        <div className="space-y-2">
          {items.slice(0, 10).map((item) => {
            const width = Math.max(4, Math.round((item.count / max) * 100));
            return (
              <div key={item.name} className="grid grid-cols-[minmax(120px,1fr)_2fr_42px] items-center gap-2">
                <div className="truncate text-xs font-bold" title={item.name}>{item.name}</div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-hakuou-blue" style={{ width: `${width}%` }} />
                </div>
                <div className="text-right text-sm font-black text-hakuou-navy">{item.count}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState text="該当データはありません。" />
      )}
    </div>
  );
}

function ResponseTable({
  responses,
  selectedId,
  onSelect
}: {
  responses: SurveyResponseSummary[];
  selectedId: string;
  onSelect: (response: SurveyResponseSummary) => void;
}) {
  if (!responses.length) return <EmptyState text="回答データはまだ読み込まれていません。" />;

  return (
    <div className="overflow-auto rounded-lg border border-hakuou-line">
      <table className="w-full min-w-[1280px] border-collapse text-sm">
        <thead className="bg-slate-100 text-left">
          <tr>
            {["回答日時", "展示会", "会社名", "氏名", "メール", "電話", "導入状況", "希望対応", "Score", "Rank", "連絡可否", "自由記述"].map((header) => (
              <th key={header} className="border-b border-hakuou-line px-3 py-2 font-black">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {responses.map((response) => (
            <tr
              key={response.id}
              className={[
                "cursor-pointer border-b border-hakuou-line last:border-0 hover:bg-blue-50",
                selectedId === response.id ? "bg-blue-50" : ""
              ].join(" ")}
              onClick={() => onSelect(response)}
            >
              <td className="px-3 py-2">{response.submittedAt}</td>
              <td className="px-3 py-2">{response.eventName}</td>
              <td className="px-3 py-2 font-black">{response.companyName}</td>
              <td className="px-3 py-2">{response.personName}</td>
              <td className="px-3 py-2">{response.email}</td>
              <td className="px-3 py-2">{response.phone}</td>
              <td className="px-3 py-2">{response.considerationStatus}</td>
              <td className="px-3 py-2">{response.requestedActions}</td>
              <td className="px-3 py-2 font-black">{response.leadScore}</td>
              <td className="px-3 py-2"><RankChip value={response.leadRank} /></td>
              <td className="px-3 py-2">{response.contactPermission}</td>
              <td className="max-w-[260px] truncate px-3 py-2" title={response.freeComment}>{response.freeComment}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResponseDetail({ response }: { response: SurveyResponseSummary | null }) {
  if (!response) return <EmptyState text="回答一覧から行を選択してください。" />;

  const fields = [
    ["回答日時", response.submittedAt],
    ["展示会", `${response.eventName} (${response.eventSlug})`],
    ["会社名", response.companyName],
    ["氏名", response.personName],
    ["部署名・役職", response.department],
    ["メール", response.email],
    ["電話", response.phone],
    ["関心内容", response.interests],
    ["説明評価", response.explanationRating],
    ["現場課題", response.issues],
    ["自動化したい作業", response.automationTasks],
    ["重量", response.loadWeight],
    ["荷姿", response.loadType],
    ["搬送距離", response.transportDistance],
    ["導入検討状況", response.considerationStatus],
    ["導入時期", response.introductionTiming],
    ["予算・稟議", response.budgetStatus],
    ["立場", response.userRole],
    ["希望対応", response.requestedActions],
    ["連絡可否", response.contactPermission],
    ["leadScore / Rank", `${response.leadScore} / ${response.leadRank}`],
    ["自由記述", response.freeComment]
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
      {fields.map(([label, value]) => (
        <div key={label} className="border-b border-hakuou-line pb-2">
          <div className="text-xs font-black text-hakuou-muted">{label}</div>
          <div className="mt-1 whitespace-pre-wrap break-words text-sm font-bold">{value || "-"}</div>
        </div>
      ))}
    </div>
  );
}

function RankChip({ value, tone }: { value: string; tone?: "status" }) {
  const className = [
    "inline-flex rounded-full px-2.5 py-1 text-xs font-black",
    tone === "status" && value === "published" ? "bg-emerald-50 text-emerald-700" : "",
    tone === "status" && value !== "published" ? "bg-slate-100 text-slate-600" : "",
    !tone && (value === "S" || value === "A") ? "bg-amber-50 text-amber-700" : "",
    !tone && value === "B" ? "bg-blue-50 text-hakuou-blue" : "",
    !tone && value !== "S" && value !== "A" && value !== "B" ? "bg-slate-100 text-slate-600" : ""
  ].join(" ");

  return <span className={className}>{value || "-"}</span>;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-hakuou-line bg-slate-50 px-4 py-6 text-center text-sm font-bold text-hakuou-muted">
      {text}
    </div>
  );
}

function toCountMap(items: SummaryCount[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item.name] = item.count;
    return acc;
  }, {});
}

function findCount(items: SummaryCount[], name: string) {
  return items.find((item) => item.name === name)?.count || 0;
}
