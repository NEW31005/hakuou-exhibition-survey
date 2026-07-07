"use client";

import { useEffect, useMemo, useState } from "react";
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

type EventHeader =
  | "eventSlug"
  | "eventName"
  | "venue"
  | "boothName"
  | "startDate"
  | "endDate"
  | "status"
  | "description"
  | "createdAt"
  | "updatedAt";

type ResponseHeader =
  | "submittedAt"
  | "eventSlug"
  | "eventName"
  | "companyName"
  | "personName"
  | "department"
  | "email"
  | "phone"
  | "interests"
  | "explanationRating"
  | "issues"
  | "automationTasks"
  | "loadWeight"
  | "loadType"
  | "transportDistance"
  | "considerationStatus"
  | "introductionTiming"
  | "budgetStatus"
  | "userRole"
  | "requestedActions"
  | "freeComment"
  | "contactPermission"
  | "leadScore"
  | "leadRank"
  | "userAgent"
  | "sourceUrl";

type SheetRecord = Record<string, string>;
type EventSheetRow = Record<EventHeader, string>;
type ResponseCsvRow = Record<ResponseHeader, string>;
type ResponseSheetRow = ResponseCsvRow & {
  __rowId: string;
  submittedAtText: string;
  leadScoreNumber: number;
};

type GvizPrimitive = string | number | boolean | null;
type GvizCell = { v?: GvizPrimitive; f?: string | null } | null;
type GvizColumn = { id?: string; label?: string };
type GvizRow = { c?: GvizCell[] };
type GvizResponse = {
  table?: {
    cols?: GvizColumn[];
    rows?: GvizRow[];
  };
};

type SheetSummaryResult = {
  data: SurveySummaryData;
  csvRows: ResponseCsvRow[];
};

const initialFilters: DashboardFilters = {
  eventSlug: "",
  leadRank: "",
  requestedAction: "",
  introductionTiming: "",
  contactPermission: "",
  keyword: ""
};

const eventHeaders: EventHeader[] = [
  "eventSlug",
  "eventName",
  "venue",
  "boothName",
  "startDate",
  "endDate",
  "status",
  "description",
  "createdAt",
  "updatedAt"
];

const responseHeaders: ResponseHeader[] = [
  "submittedAt",
  "eventSlug",
  "eventName",
  "companyName",
  "personName",
  "department",
  "email",
  "phone",
  "interests",
  "explanationRating",
  "issues",
  "automationTasks",
  "loadWeight",
  "loadType",
  "transportDistance",
  "considerationStatus",
  "introductionTiming",
  "budgetStatus",
  "userRole",
  "requestedActions",
  "freeComment",
  "contactPermission",
  "leadScore",
  "leadRank",
  "userAgent",
  "sourceUrl"
];

const defaultGasUrl = process.env.NEXT_PUBLIC_GAS_WEB_APP_URL?.trim() || "";
const defaultSpreadsheetId =
  process.env.NEXT_PUBLIC_SPREADSHEET_ID?.trim() || "1m8tRnUM7Y0XkIwjkyG6pv0kGqhjj5PV0zGzwJ5YLJ2Y";
const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const hasGasDataSource = Boolean(defaultGasUrl);
const eventMasterSheetName = "展示会マスタ";
const allResponsesSheetName = "全回答";

export default function DashboardClient() {
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window === "undefined" || !hasGasDataSource) return "";
    return sessionStorage.getItem("surveyDashboardApiKey") || "";
  });
  const [filters, setFilters] = useState(initialFilters);
  const [data, setData] = useState<SurveySummaryData | null>(null);
  const [sheetCsvRows, setSheetCsvRows] = useState<ResponseCsvRow[]>([]);
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponseSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadSummary(initialFilters);
    // 初回表示で自動読み込みするため、ここだけ依存配列を固定します。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setIsLoading(true);

    if (hasGasDataSource) {
      sessionStorage.setItem("surveyDashboardApiKey", apiKey.trim());
    }

    try {
      if (hasGasDataSource) {
        const response = await fetch(buildGasUrl("summary", nextFilters).toString(), {
          cache: "no-store"
        });
        const payload = await response.json() as SurveySummaryResponse;

        if (!response.ok || !payload.ok || !payload.data) {
          throw new Error(payload.message || "集計データを取得できませんでした。");
        }

        setSheetCsvRows([]);
        setData(payload.data);
        return;
      }

      const result = await loadSpreadsheetSummary(nextFilters);
      setSheetCsvRows(result.csvRows);
      setData(result.data);
    } catch (fetchError) {
      setData(null);
      setSheetCsvRows([]);
      setError(toDashboardError(fetchError));
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
    const url = new URL(defaultGasUrl);
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
    if (type === "event" && !filters.eventSlug) {
      setError("展示会別CSVは、先に展示会を選択してください。");
      return;
    }

    if (hasGasDataSource) {
      window.open(buildGasUrl("csv", filters, type).toString(), "_blank", "noopener,noreferrer");
      return;
    }

    if (!sheetCsvRows.length) {
      setError("CSV出力には、先に集計データを読み込んでください。");
      return;
    }

    const rows = selectCsvRows(sheetCsvRows, type, filters.eventSlug);
    downloadCsv(rows, type);
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
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(180px,0.45fr)_auto] lg:items-end">
            <div className="min-w-0">
              <p className="text-xs font-black text-hakuou-muted">データ取得元</p>
              <p className="mt-1 text-sm font-black">
                {hasGasDataSource ? "GAS集計API" : "集計スプレッドシート"}
              </p>
              <p className="mt-1 truncate text-xs font-bold text-hakuou-muted" title={defaultSpreadsheetId}>
                {hasGasDataSource ? "サイト設定済みのGASから自動取得" : defaultSpreadsheetId}
              </p>
            </div>
            {hasGasDataSource ? (
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
            ) : (
              <p className="text-xs font-bold leading-relaxed text-hakuou-muted">
                公開読み取りできるスプレッドシートなら自動で読み込みます。
              </p>
            )}
            <button
              className="dashboard-button dashboard-primary min-h-11"
              disabled={isLoading}
              onClick={() => loadSummary()}
              type="button"
            >
              {isLoading ? "読み込み中" : "集計を再読み込み"}
            </button>
          </div>
          <p className="mt-3 text-xs font-bold text-hakuou-muted">
            回答結果には個人情報が含まれます。非公開のまま安全に自動表示する場合は、GASをデプロイしてURLをサイト設定に埋め込む方式を使います。
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

async function loadSpreadsheetSummary(currentFilters: DashboardFilters): Promise<SheetSummaryResult> {
  const [eventRecords, responseRecords] = await Promise.all([
    fetchSheetRecords(eventMasterSheetName),
    fetchSheetRecords(allResponsesSheetName)
  ]);

  const events = eventRecords.map(toEventRow).filter((event) => event.eventSlug);
  const rows = responseRecords.map(toResponseRow).filter((row) => Object.values(row).some(Boolean));
  const filteredRows = rows.filter((row) => matchesSummaryFilters(row, currentFilters));

  return {
    csvRows: rows.map(toCsvRow),
    data: {
      generatedAt: formatDateTime(new Date()),
      filters: buildFilterOptions(rows, events),
      events: buildEventSummaries(events, rows),
      summary: {
        responseCount: filteredRows.length,
        rankCounts: countList(filteredRows, "leadRank"),
        requestedActionCounts: countList(filteredRows, "requestedActions", true),
        introductionTimingCounts: countList(filteredRows, "introductionTiming"),
        considerationStatusCounts: countList(filteredRows, "considerationStatus"),
        issueCounts: countList(filteredRows, "issues", true),
        loadWeightCounts: countList(filteredRows, "loadWeight"),
        loadTypeCounts: countList(filteredRows, "loadType", true)
      },
      responses: filteredRows.map(toPublicResponse)
    }
  };
}

async function fetchSheetRecords(sheetName: string): Promise<SheetRecord[]> {
  const response = await fetch(buildSheetUrl(sheetName).toString(), { cache: "no-store" });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        "集計スプレッドシートが非公開のため、この公開ページから直接読み取れません。非公開のまま安全に自動表示するには、GASをデプロイしてURLをサイト設定に埋め込む必要があります。"
      );
    }
    throw new Error(`集計スプレッドシートを読み取れませんでした。HTTP ${response.status}`);
  }

  const text = await response.text();
  const payload = parseGvizResponse(text);
  const columns = payload.table?.cols || [];
  const rows = payload.table?.rows || [];
  const headers = columns.map((column) => trim(column.label || column.id));

  return rows
    .map((row) => {
      const values = row.c || [];
      return headers.reduce<SheetRecord>((record, header, index) => {
        if (header) record[header] = formatCellValue(values[index]);
        return record;
      }, {});
    })
    .filter((record) => Object.values(record).some(Boolean));
}

function buildSheetUrl(sheetName: string) {
  const url = new URL(`https://docs.google.com/spreadsheets/d/${defaultSpreadsheetId}/gviz/tq`);
  url.searchParams.set("tqx", "out:json");
  url.searchParams.set("sheet", sheetName);
  url.searchParams.set("headers", "1");
  return url;
}

function parseGvizResponse(text: string): GvizResponse {
  const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?/);
  if (!match) {
    throw new Error("集計スプレッドシートの応答形式を読み取れませんでした。");
  }
  return JSON.parse(match[1]) as GvizResponse;
}

function formatCellValue(cell: GvizCell) {
  if (!cell) return "";
  if (cell.f != null) return trim(cell.f);
  if (cell.v == null) return "";
  return trim(cell.v);
}

function toEventRow(record: SheetRecord): EventSheetRow {
  return eventHeaders.reduce<EventSheetRow>((row, header) => {
    row[header] = trim(record[header]);
    return row;
  }, emptyEventRow());
}

function toResponseRow(record: SheetRecord, index: number): ResponseSheetRow {
  const row = responseHeaders.reduce<ResponseCsvRow>((current, header) => {
    current[header] = trim(record[header]);
    return current;
  }, emptyResponseRow());

  return {
    ...row,
    __rowId: String(index + 2),
    submittedAtText: row.submittedAt,
    leadScoreNumber: Number(row.leadScore || 0)
  };
}

function emptyEventRow(): EventSheetRow {
  return eventHeaders.reduce<EventSheetRow>((row, header) => {
    row[header] = "";
    return row;
  }, {} as EventSheetRow);
}

function emptyResponseRow(): ResponseCsvRow {
  return responseHeaders.reduce<ResponseCsvRow>((row, header) => {
    row[header] = "";
    return row;
  }, {} as ResponseCsvRow);
}

function toCsvRow(row: ResponseSheetRow): ResponseCsvRow {
  return responseHeaders.reduce<ResponseCsvRow>((csvRow, header) => {
    csvRow[header] = row[header];
    return csvRow;
  }, emptyResponseRow());
}

function buildEventSummaries(events: EventSheetRow[], rows: ResponseSheetRow[]): SurveyEventSummary[] {
  return events.map((event) => {
    const eventRows = rows.filter((row) => row.eventSlug === event.eventSlug);
    const rankCounts = toCountMap(countList(eventRows, "leadRank"));

    return {
      eventSlug: event.eventSlug,
      eventName: event.eventName,
      venue: event.venue,
      startDate: event.startDate,
      endDate: event.endDate,
      status: event.status,
      responseCount: eventRows.length,
      rankS: rankCounts.S || 0,
      rankA: rankCounts.A || 0,
      rankB: rankCounts.B || 0,
      rankC: rankCounts.C || 0,
      formUrl: `${publicBasePath}/survey/${event.eventSlug}/`
    };
  });
}

function buildFilterOptions(rows: ResponseSheetRow[], events: EventSheetRow[]) {
  return {
    events: events.map((event) => ({
      value: event.eventSlug,
      label: `${event.eventName} (${event.eventSlug})`
    })),
    leadRank: uniqueSorted(rows.map((row) => row.leadRank)),
    requestedActions: uniqueSorted(splitAll(rows.map((row) => row.requestedActions))),
    introductionTiming: uniqueSorted(rows.map((row) => row.introductionTiming)),
    contactPermission: uniqueSorted(rows.map((row) => row.contactPermission))
  };
}

function matchesSummaryFilters(row: ResponseSheetRow, currentFilters: DashboardFilters) {
  const eventSlug = trim(currentFilters.eventSlug);
  const leadRank = trim(currentFilters.leadRank);
  const requestedAction = trim(currentFilters.requestedAction);
  const introductionTiming = trim(currentFilters.introductionTiming);
  const contactPermission = trim(currentFilters.contactPermission);
  const keyword = trim(currentFilters.keyword).toLowerCase();

  if (eventSlug && row.eventSlug !== eventSlug) return false;
  if (leadRank && row.leadRank !== leadRank) return false;
  if (requestedAction && !splitValues(row.requestedActions).includes(requestedAction)) return false;
  if (introductionTiming && row.introductionTiming !== introductionTiming) return false;
  if (contactPermission && row.contactPermission !== contactPermission) return false;

  if (keyword) {
    const target = [
      row.companyName,
      row.personName,
      row.department,
      row.email,
      row.phone,
      row.issues,
      row.requestedActions,
      row.freeComment
    ].join(" ").toLowerCase();
    if (!target.includes(keyword)) return false;
  }

  return true;
}

function toPublicResponse(row: ResponseSheetRow): SurveyResponseSummary {
  return {
    id: row.__rowId,
    submittedAt: row.submittedAtText,
    eventSlug: row.eventSlug,
    eventName: row.eventName,
    companyName: row.companyName,
    personName: row.personName,
    department: row.department,
    email: row.email,
    phone: row.phone,
    interests: row.interests,
    explanationRating: row.explanationRating,
    issues: row.issues,
    automationTasks: row.automationTasks,
    loadWeight: row.loadWeight,
    loadType: row.loadType,
    transportDistance: row.transportDistance,
    considerationStatus: row.considerationStatus,
    introductionTiming: row.introductionTiming,
    budgetStatus: row.budgetStatus,
    userRole: row.userRole,
    requestedActions: row.requestedActions,
    freeComment: row.freeComment,
    contactPermission: row.contactPermission,
    leadScore: row.leadScoreNumber,
    leadRank: row.leadRank,
    sourceUrl: row.sourceUrl
  };
}

function selectCsvRows(rows: ResponseCsvRow[], type: string, eventSlug: string) {
  if (type === "event") {
    return rows.filter((row) => row.eventSlug === eventSlug);
  }
  if (type === "highRank") {
    return rows.filter((row) => row.leadRank === "S" || row.leadRank === "A");
  }
  if (type === "siteVisit") {
    return rows.filter((row) => splitValues(row.requestedActions).includes("現地調査を依頼したい"));
  }
  if (type === "estimate") {
    return rows.filter((row) => splitValues(row.requestedActions).includes("価格・見積感を知りたい"));
  }
  return rows;
}

function downloadCsv(rows: ResponseCsvRow[], type: string) {
  const csvRows = [
    responseHeaders,
    ...rows.map((row) => responseHeaders.map((header) => row[header] || ""))
  ];
  const csv = `\uFEFF${csvRows.map((row) => row.map(escapeCsv).join(",")).join("\r\n")}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `hakuou-survey-${type}-${formatDateForFile(new Date())}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function countList(rows: ResponseSheetRow[], field: keyof ResponseCsvRow, split = false): SummaryCount[] {
  const counts = rows.reduce<Record<string, number>>((acc, row) => {
    const values = split ? splitValues(row[field]) : [trim(row[field]) || "未入力"];
    values.forEach((value) => {
      acc[value] = (acc[value] || 0) + 1;
    });
    return acc;
  }, {});

  return Object.keys(counts)
    .sort((a, b) => counts[b] - counts[a] || a.localeCompare(b, "ja"))
    .map((name) => ({ name, count: counts[name] }));
}

function splitAll(values: string[]) {
  return values.reduce<string[]>((acc, value) => acc.concat(splitValues(value)), []);
}

function splitValues(value: string) {
  return trim(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.map(trim).filter(Boolean))).sort((a, b) => a.localeCompare(b, "ja"));
}

function escapeCsv(value: string) {
  const normalized = value == null ? "" : String(value);
  if (!/[",\r\n]/.test(normalized)) return normalized;
  return `"${normalized.replace(/"/g, '""')}"`;
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(date);
}

function formatDateForFile(date: Date) {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}${values.month}${values.day}`;
}

function toDashboardError(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "集計データを取得できませんでした。";
}

function trim(value: unknown) {
  return value == null ? "" : String(value).trim();
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
