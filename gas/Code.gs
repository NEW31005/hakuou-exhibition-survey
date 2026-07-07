const DEFAULT_SPREADSHEET_ID = '1m8tRnUM7Y0XkIwjkyG6pv0kGqhjj5PV0zGzwJ5YLJ2Y';
const EVENT_MASTER_SHEET_NAME = '展示会マスタ';
const ALL_RESPONSES_SHEET_NAME = '全回答';
const TIME_ZONE = 'Asia/Tokyo';
const DASHBOARD_ALLOWED_DOMAIN = 'hakuou.co.jp';

const EVENT_HEADERS = [
  'eventSlug',
  'eventName',
  'venue',
  'boothName',
  'startDate',
  'endDate',
  'status',
  'description',
  'createdAt',
  'updatedAt'
];

const RESPONSE_HEADERS = [
  'submittedAt',
  'eventSlug',
  'eventName',
  'companyName',
  'personName',
  'department',
  'email',
  'phone',
  'interests',
  'explanationRating',
  'issues',
  'automationTasks',
  'loadWeight',
  'loadType',
  'transportDistance',
  'considerationStatus',
  'introductionTiming',
  'budgetStatus',
  'userRole',
  'requestedActions',
  'freeComment',
  'contactPermission',
  'leadScore',
  'leadRank',
  'userAgent',
  'sourceUrl'
];

const DEFAULT_EVENTS = [
  {
    eventSlug: 'fooma2026',
    eventName: 'FOOMA JAPAN 2026',
    venue: '東京ビッグサイト',
    boothName: '山善ブース内',
    startDate: '2026-06-02',
    endDate: '2026-06-05',
    status: 'closed',
    description: ''
  },
  {
    eventSlug: 'logis-tech-2026',
    eventName: '国際物流総合展 2026',
    venue: '',
    boothName: '',
    startDate: '',
    endDate: '',
    status: 'draft',
    description: ''
  },
  {
    eventSlug: 'yamazen-private-2026',
    eventName: '山善プライベート展 2026',
    venue: '',
    boothName: '',
    startDate: '',
    endDate: '',
    status: 'draft',
    description: ''
  },
  {
    eventSlug: 'star-seiki-showroom-2026',
    eventName: '(株)スター精機 新ショールーム',
    venue: '〒480-0132 愛知県丹羽郡大口町秋田3丁目136-1',
    boothName: 'スターテクノ併設',
    startDate: '2026-07-14',
    endDate: '2026-07-15',
    status: 'published',
    description: '日程は仮。前日搬入・後日搬出を含め4日間想定。'
  },
  {
    eventSlug: 'prologis-kitakami-kanegasaki-2026',
    eventName: 'プロロジスパーク北上金ヶ崎 内覧会',
    venue: 'プロロジスパーク北上金ヶ崎',
    boothName: '',
    startDate: '2026-07-07',
    endDate: '2026-07-08',
    status: 'published',
    description: ''
  },
  {
    eventSlug: 'prologis-kasugai-2026',
    eventName: 'プロロジスパーク春日井 内覧会',
    venue: 'プロロジスパーク春日井',
    boothName: '',
    startDate: '2026-07-22',
    endDate: '2026-07-23',
    status: 'published',
    description: ''
  },
  {
    eventSlug: 'trc-rodge-seminar-2026',
    eventName: 'TRC-RODGE 物流課題解決セミナー',
    venue: 'TRC-RODGE',
    boothName: '物流課題解決セミナー',
    startDate: '2026-07-15',
    endDate: '2026-07-15',
    status: 'published',
    description: ''
  }
];

function doGet(e) {
  const params = (e && e.parameter) || {};

  try {
    ensureBaseSheets_();

    if (params.action === 'getEvent') {
      const eventSlug = trim_(params.eventSlug || params.eventId);
      const event = getEventBySlug(eventSlug);
      return jsonOutput_(event
        ? { ok: true, event: toPublicEvent_(event) }
        : { ok: false, message: '指定された展示会アンケートが見つかりません' });
    }

    if (params.action === 'summary') {
      assertDashboardAccess_();
      validateApiKey_(params, {});
      return jsonOutput_({
        ok: true,
        data: getSummary_(params)
      });
    }

    if (params.action === 'csv') {
      assertDashboardAccess_();
      validateApiKey_(params, {});
      return csvOutput_(params);
    }

    const page = normalizePage_(params);
    if (page === 'dashboard') {
      assertDashboardAccess_();
    }
    return HtmlService
      .createTemplateFromFile('index')
      .evaluate()
      .setTitle(page === 'dashboard' ? '展示会アンケート集計' : 'HAKUOU ROBOTICS 展示会アンケート')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (error) {
    return jsonOutput_({
      ok: false,
      message: error.message || '処理に失敗しました'
    });
  }
}

function doPost(e) {
  try {
    ensureBaseSheets_();
    const payload = parsePostPayload_(e);
    return jsonOutput_(saveSurveyResponse_(payload, (e && e.parameter) || {}, true));
  } catch (error) {
    return jsonOutput_({
      ok: false,
      message: error.message || '保存に失敗しました'
    });
  }
}

function getSummaryData(filters) {
  ensureBaseSheets_();
  assertDashboardAccess_();
  validateApiKey_(filters || {}, {});
  return getSummary_(filters || {});
}

function getPublicEventsForWeb() {
  ensureBaseSheets_();
  const events = readObjects_(EVENT_MASTER_SHEET_NAME, EVENT_HEADERS)
    .map(toPublicEvent_)
    .filter(event => event.status === 'published');

  return {
    ok: true,
    events
  };
}

function getEventForWeb(eventSlug) {
  ensureBaseSheets_();
  const event = getEventBySlug(eventSlug);
  return event
    ? { ok: true, event: toPublicEvent_(event) }
    : { ok: false, message: '指定された展示会アンケートが見つかりません。' };
}

function submitSurveyFromWeb(payload) {
  ensureBaseSheets_();
  return saveSurveyResponse_(payload || {}, {}, false);
}

function ensureSheet(sheetName) {
  const headers = sheetName === EVENT_MASTER_SHEET_NAME ? EVENT_HEADERS : RESPONSE_HEADERS;
  return ensureSheet_(sheetName, headers).getName();
}

function calculateLeadScore(data) {
  const rules = [
    ['requestedActions', '現地調査を依頼したい', 30],
    ['requestedActions', '価格・見積感を知りたい', 25],
    ['requestedActions', 'Webミーティングで説明を聞きたい', 20],
    ['requestedActions', 'PoCについて相談したい', 25],
    ['introductionTiming', '3ヶ月以内', 30],
    ['introductionTiming', '6ヶ月以内', 20],
    ['introductionTiming', '1年以内', 10],
    ['budgetStatus', '予算化済み', 25],
    ['budgetStatus', 'これから予算申請予定', 15],
    ['userRole', '導入決定者', 20],
    ['userRole', '導入検討の責任者', 20],
    ['issues', 'フォークリフト作業者の人手不足', 10],
    ['issues', '単純な往復搬送が多い', 10],
    ['loadWeight', '300kg〜570kg程度', 10],
    ['automationTasks', 'パレットの定点間搬送', 10]
  ];

  return rules.reduce((score, rule) => {
    const field = rule[0];
    const value = rule[1];
    const points = rule[2];
    const current = data[field];

    if (Array.isArray(current)) {
      return current.indexOf(value) >= 0 ? score + points : score;
    }

    return current === value ? score + points : score;
  }, 0);
}

function getLeadRank(score) {
  if (score >= 80) return 'S';
  if (score >= 50) return 'A';
  if (score >= 25) return 'B';
  return 'C';
}

function getEventBySlug(eventSlug) {
  const slug = normalizeEventSlug_(eventSlug);
  if (!slug) return null;

  const rows = readObjects_(EVENT_MASTER_SHEET_NAME, EVENT_HEADERS);
  const event = rows.find(row => row.eventSlug === slug);
  return event || null;
}

function appendResponse(sheetName, row) {
  const sheet = ensureSheet_(sheetName, RESPONSE_HEADERS);
  sheet.appendRow(row);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function saveSurveyResponse_(payload, params, shouldValidateApiKey) {
  if (shouldValidateApiKey) {
    validateApiKey_(payload, params || {});
  }

  const eventSlug = normalizeEventSlug_(payload.eventSlug || payload.eventId);
  if (!eventSlug) {
    throw new Error('eventSlugが指定されていません。');
  }

  const event = getEventBySlug(eventSlug);
  if (!event) {
    throw new Error('指定された展示会アンケートが見つかりません。');
  }
  if (!isEventOpenForSurvey_(event)) {
    throw new Error('このアンケートは現在回答を受け付けていません。');
  }

  const normalized = normalizeResponsePayload_(payload);
  validateResponsePayload_(normalized);

  const leadScore = calculateLeadScore(normalized);
  const leadRank = getLeadRank(leadScore);
  const submittedAt = new Date();
  const row = buildResponseRow_(normalized, event, submittedAt, leadScore, leadRank);

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    appendResponse(eventSlug, row);
    appendResponse(ALL_RESPONSES_SHEET_NAME, row);
  } finally {
    lock.releaseLock();
  }

  return {
    ok: true,
    message: '回答を保存しました',
    leadScore,
    leadRank
  };
}

function ensureBaseSheets_() {
  ensureEventMasterSheet_();
  ensureSheet_(ALL_RESPONSES_SHEET_NAME, RESPONSE_HEADERS);
}

function ensureEventMasterSheet_() {
  const sheet = ensureSheet_(EVENT_MASTER_SHEET_NAME, EVENT_HEADERS);
  const values = sheet.getDataRange().getValues();
  const existingSlugs = {};

  values.slice(1).forEach(row => {
    const slug = trim_(row[0]);
    if (slug) existingSlugs[slug] = true;
  });

  const nowText = formatDateTime_(new Date());
  const rowsToAppend = DEFAULT_EVENTS
    .filter(event => !existingSlugs[event.eventSlug])
    .map(event => EVENT_HEADERS.map(header => {
      if (header === 'createdAt' || header === 'updatedAt') return nowText;
      return event[header] || '';
    }));

  if (rowsToAppend.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAppend.length, EVENT_HEADERS.length).setValues(rowsToAppend);
  }
}

function ensureSheet_(sheetName, headers) {
  const spreadsheet = getSpreadsheet_();
  const safeSheetName = sanitizeSheetName_(sheetName);
  let sheet = spreadsheet.getSheetByName(safeSheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(safeSheetName);
  }

  const currentHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const needsHeader = headers.some((header, index) => currentHeaders[index] !== header);

  if (needsHeader) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#eef3f5');
    sheet.autoResizeColumns(1, headers.length);
  }

  return sheet;
}

function getSpreadsheet_() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const spreadsheetId = scriptProperties.getProperty('SPREADSHEET_ID') || DEFAULT_SPREADSHEET_ID;
  return SpreadsheetApp.openById(spreadsheetId);
}

function parsePostPayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('送信データが空です。');
  }

  try {
    return JSON.parse(e.postData.contents);
  } catch (error) {
    throw new Error('送信JSONを読み取れませんでした。');
  }
}

function validateApiKey_(payload, params) {
  const expectedApiKey = PropertiesService.getScriptProperties().getProperty('SURVEY_API_KEY');
  if (!expectedApiKey) return;

  const receivedApiKey = trim_(payload.apiKey || params.apiKey);
  if (receivedApiKey !== expectedApiKey) {
    throw new Error('APIキーが正しくありません。');
  }
}

function assertDashboardAccess_() {
  const email = trim_(Session.getActiveUser().getEmail()).toLowerCase();
  if (email && email.endsWith(`@${DASHBOARD_ALLOWED_DOMAIN}`)) return;

  throw new Error('集計ダッシュボードはハクオウ社員アカウント限定です。@hakuou.co.jp のGoogleアカウントでログインして開いてください。');
}

function normalizeResponsePayload_(payload) {
  return {
    companyName: trim_(payload.companyName),
    personName: trim_(payload.personName),
    department: trim_(payload.department),
    email: trim_(payload.email),
    phone: trim_(payload.phone),
    interests: normalizeArray_(payload.interests),
    explanationRating: trim_(payload.explanationRating),
    issues: normalizeArray_(payload.issues),
    automationTasks: normalizeArray_(payload.automationTasks),
    loadWeight: trim_(payload.loadWeight),
    loadType: normalizeArray_(payload.loadType),
    transportDistance: trim_(payload.transportDistance),
    considerationStatus: trim_(payload.considerationStatus),
    introductionTiming: trim_(payload.introductionTiming),
    budgetStatus: trim_(payload.budgetStatus),
    userRole: trim_(payload.userRole),
    requestedActions: normalizeArray_(payload.requestedActions),
    freeComment: trim_(payload.freeComment),
    contactPermission: trim_(payload.contactPermission),
    userAgent: trim_(payload.userAgent),
    sourceUrl: trim_(payload.sourceUrl)
  };
}

function validateResponsePayload_(data) {
  if (!data.companyName) throw new Error('会社名を入力してください。');
  if (!data.personName) throw new Error('お名前を入力してください。');
  if (!data.email) throw new Error('メールアドレスを入力してください。');
  if (data.email.indexOf('@') < 0) throw new Error('メールアドレスの形式をご確認ください。');
  if (data.interests.length === 0) throw new Error('関心を持たれた内容を選択してください。');
  if (data.issues.length === 0) throw new Error('現場課題を選択してください。');
  if (!data.considerationStatus) throw new Error('導入検討状況を選択してください。');
  if (data.requestedActions.length === 0) throw new Error('今後希望される対応を選択してください。');
  if (!data.contactPermission) throw new Error('連絡可否を選択してください。');
}

function buildResponseRow_(data, event, submittedAt, leadScore, leadRank) {
  const valuesByHeader = {
    submittedAt,
    eventSlug: event.eventSlug,
    eventName: event.eventName,
    companyName: data.companyName,
    personName: data.personName,
    department: data.department,
    email: data.email,
    phone: data.phone,
    interests: data.interests.join(', '),
    explanationRating: data.explanationRating,
    issues: data.issues.join(', '),
    automationTasks: data.automationTasks.join(', '),
    loadWeight: data.loadWeight,
    loadType: data.loadType.join(', '),
    transportDistance: data.transportDistance,
    considerationStatus: data.considerationStatus,
    introductionTiming: data.introductionTiming,
    budgetStatus: data.budgetStatus,
    userRole: data.userRole,
    requestedActions: data.requestedActions.join(', '),
    freeComment: data.freeComment,
    contactPermission: data.contactPermission,
    leadScore,
    leadRank,
    userAgent: data.userAgent,
    sourceUrl: data.sourceUrl
  };

  return RESPONSE_HEADERS.map(header => valuesByHeader[header] == null ? '' : valuesByHeader[header]);
}

function getSummary_(filters) {
  const events = readObjects_(EVENT_MASTER_SHEET_NAME, EVENT_HEADERS);
  const rows = readResponseRows_();
  const filteredRows = rows.filter(row => matchesSummaryFilters_(row, filters));
  const eventSummaries = buildEventSummaries_(events, rows);

  return {
    generatedAt: formatDateTime_(new Date()),
    filters: buildFilterOptions_(rows, events),
    events: eventSummaries,
    summary: {
      responseCount: filteredRows.length,
      rankCounts: countList_(filteredRows, 'leadRank'),
      requestedActionCounts: countList_(filteredRows, 'requestedActions', true),
      introductionTimingCounts: countList_(filteredRows, 'introductionTiming'),
      considerationStatusCounts: countList_(filteredRows, 'considerationStatus'),
      issueCounts: countList_(filteredRows, 'issues', true),
      loadWeightCounts: countList_(filteredRows, 'loadWeight'),
      loadTypeCounts: countList_(filteredRows, 'loadType', true)
    },
    responses: filteredRows.map(toPublicResponse_)
  };
}

function readResponseRows_() {
  return readObjects_(ALL_RESPONSES_SHEET_NAME, RESPONSE_HEADERS).map((row, index) => {
    row.__rowId = String(index + 2);
    row.submittedAtText = row.submittedAt instanceof Date ? formatDateTime_(row.submittedAt) : trim_(row.submittedAt);
    row.leadScore = Number(row.leadScore || 0);
    row.leadRank = trim_(row.leadRank);
    return row;
  });
}

function readObjects_(sheetName, headers) {
  const sheet = ensureSheet_(sheetName, headers);
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  return values.slice(1)
    .filter(row => row.some(value => trim_(value)))
    .map(row => {
      const object = {};
      headers.forEach((header, index) => {
        object[header] = row[index];
      });
      return object;
    });
}

function buildEventSummaries_(events, rows) {
  return events.map(event => {
    const eventRows = rows.filter(row => row.eventSlug === event.eventSlug);
    const rankCounts = countMap_(eventRows, 'leadRank');

    return {
      eventSlug: event.eventSlug,
      eventName: event.eventName,
      venue: event.venue,
      startDate: event.startDate,
      endDate: event.endDate,
      status: getSurveyStatus_(event),
      responseCount: eventRows.length,
      rankS: rankCounts.S || 0,
      rankA: rankCounts.A || 0,
      rankB: rankCounts.B || 0,
      rankC: rankCounts.C || 0,
      formUrl: buildFormUrl_(event.eventSlug)
    };
  });
}

function buildFilterOptions_(rows, events) {
  return {
    events: events.map(event => ({
      value: event.eventSlug,
      label: `${event.eventName} (${event.eventSlug})`
    })),
    leadRank: uniqueSorted_(rows.map(row => row.leadRank)),
    requestedActions: uniqueSorted_(splitAll_(rows.map(row => row.requestedActions))),
    introductionTiming: uniqueSorted_(rows.map(row => row.introductionTiming)),
    contactPermission: uniqueSorted_(rows.map(row => row.contactPermission))
  };
}

function matchesSummaryFilters_(row, filters) {
  const eventSlug = trim_(filters.eventSlug);
  const leadRank = trim_(filters.leadRank);
  const requestedAction = trim_(filters.requestedAction || filters.requestedActions);
  const introductionTiming = trim_(filters.introductionTiming);
  const contactPermission = trim_(filters.contactPermission);
  const keyword = trim_(filters.keyword).toLowerCase();

  if (eventSlug && row.eventSlug !== eventSlug) return false;
  if (leadRank && row.leadRank !== leadRank) return false;
  if (requestedAction && splitValues_(row.requestedActions).indexOf(requestedAction) < 0) return false;
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
    ].join(' ').toLowerCase();
    if (target.indexOf(keyword) < 0) return false;
  }

  return true;
}

function toPublicResponse_(row) {
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
    leadScore: row.leadScore,
    leadRank: row.leadRank,
    sourceUrl: row.sourceUrl
  };
}

function csvOutput_(params) {
  const rows = selectCsvRows_(params);
  const csvRows = [RESPONSE_HEADERS].concat(rows.map(row => RESPONSE_HEADERS.map(header => row[header] || '')));
  const csv = '\uFEFF' + csvRows.map(row => row.map(escapeCsv_).join(',')).join('\r\n');
  return ContentService.createTextOutput(csv).setMimeType(ContentService.MimeType.CSV);
}

function selectCsvRows_(params) {
  const type = trim_(params.type || 'all');
  const eventSlug = trim_(params.eventSlug);
  const rows = readResponseRows_();

  if (type === 'event') {
    return rows.filter(row => row.eventSlug === eventSlug);
  }
  if (type === 'highRank') {
    return rows.filter(row => row.leadRank === 'S' || row.leadRank === 'A');
  }
  if (type === 'siteVisit') {
    return rows.filter(row => splitValues_(row.requestedActions).indexOf('現地調査を依頼したい') >= 0);
  }
  if (type === 'estimate') {
    return rows.filter(row => splitValues_(row.requestedActions).indexOf('価格・見積感を知りたい') >= 0);
  }

  return rows;
}

function countList_(rows, field, split) {
  const counts = split ? countSplitMap_(rows, field) : countMap_(rows, field);
  return Object.keys(counts)
    .sort((a, b) => counts[b] - counts[a] || a.localeCompare(b, 'ja'))
    .map(name => ({ name, count: counts[name] }));
}

function countMap_(rows, field) {
  return rows.reduce((acc, row) => {
    const value = trim_(row[field]) || '未入力';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function countSplitMap_(rows, field) {
  return rows.reduce((acc, row) => {
    splitValues_(row[field]).forEach(value => {
      acc[value] = (acc[value] || 0) + 1;
    });
    return acc;
  }, {});
}

function splitAll_(values) {
  return values.reduce((acc, value) => acc.concat(splitValues_(value)), []);
}

function splitValues_(value) {
  return trim_(value)
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function uniqueSorted_(values) {
  const map = {};
  values.map(trim_).filter(Boolean).forEach(value => {
    map[value] = true;
  });
  return Object.keys(map).sort((a, b) => a.localeCompare(b, 'ja'));
}

function normalizeArray_(value) {
  if (Array.isArray(value)) {
    return value.map(trim_).filter(Boolean);
  }
  return splitValues_(value);
}

function normalizePage_(params) {
  const page = trim_(params && params.page).toLowerCase();
  if (page === 'dashboard') return 'dashboard';
  if (page === 'survey' || params.eventSlug || params.eventId) return 'survey';
  return 'home';
}

function normalizeEventSlug_(value) {
  const slug = trim_(value).toLowerCase();
  return /^[a-z0-9][a-z0-9-]{1,80}$/.test(slug) ? slug : '';
}

function sanitizeSheetName_(value) {
  const name = trim_(value).replace(/[\\/?*\[\]:]/g, '-').slice(0, 90);
  if (!name) throw new Error('シート名が空です。');
  return name;
}

function buildFormUrl_(eventSlug) {
  const scriptProperties = PropertiesService.getScriptProperties();
  const baseUrl = scriptProperties.getProperty('PUBLIC_FORM_BASE_URL') || '';
  const query = `?eventSlug=${encodeURIComponent(eventSlug)}`;
  return baseUrl ? `${baseUrl.replace(/[?#].*$/, '')}${query}` : query;
}

function toPublicEvent_(event) {
  return {
    eventSlug: trim_(event.eventSlug),
    eventName: trim_(event.eventName),
    venue: trim_(event.venue),
    boothName: trim_(event.boothName),
    startDate: formatDateValue_(event.startDate),
    endDate: formatDateValue_(event.endDate),
    status: getSurveyStatus_(event),
    description: trim_(event.description),
    formUrl: buildFormUrl_(event.eventSlug)
  };
}

function isEventOpenForSurvey_(event) {
  return getSurveyStatus_(event) === 'published';
}

function getSurveyStatus_(event) {
  const status = trim_(event.status);
  if (status === 'published' && isPastEndDate_(event.endDate)) {
    return 'closed';
  }
  return status;
}

function isPastEndDate_(value) {
  const endDate = formatDateValue_(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) return false;

  const today = Utilities.formatDate(new Date(), TIME_ZONE, 'yyyy-MM-dd');
  return endDate < today;
}

function jsonOutput_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function escapeCsv_(value) {
  const text = value instanceof Date ? formatDateTime_(value) : String(value == null ? '' : value);
  return `"${text.replace(/"/g, '""')}"`;
}

function formatDateTime_(date) {
  return Utilities.formatDate(date, TIME_ZONE, 'yyyy-MM-dd HH:mm:ss');
}

function formatDateValue_(value) {
  return value instanceof Date ? Utilities.formatDate(value, TIME_ZONE, 'yyyy-MM-dd') : trim_(value);
}

function trim_(value) {
  return String(value == null ? '' : value).trim();
}
