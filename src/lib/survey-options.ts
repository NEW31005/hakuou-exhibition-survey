import type { SurveyEvent } from "@/src/types/survey";

export const interestOptions = [
  "AutoFork Lite",
  "AutoFork Standard",
  "自動運転フォークリフト全般",
  "パレット搬送の自動化",
  "省人化・人手不足対策",
  "フォークリフト作業の安全対策",
  "倉庫・工場内物流の自動化",
  "価格・費用感",
  "導入事例・PoC事例",
  "その他"
];

export const explanationRatingOptions = [
  "非常に分かりやすかった",
  "分かりやすかった",
  "どちらとも言えない",
  "やや分かりにくかった",
  "詳しい説明をもう一度聞きたい"
];

export const issueOptions = [
  "フォークリフト作業者の人手不足",
  "作業者の高齢化",
  "夜間・早朝・休日の搬送対応",
  "単純な往復搬送が多い",
  "作業者による搬送品質のばらつき",
  "接触事故・ヒヤリハットの削減",
  "教育・免許取得の負担",
  "人件費の上昇",
  "既存設備との連携",
  "現時点では大きな課題はない",
  "その他"
];

export const automationTaskOptions = [
  "パレットの定点間搬送",
  "ラインから仮置き場への搬送",
  "仮置き場から倉庫・出荷場への搬送",
  "入庫・出庫作業",
  "エレベーターを使ったフロア間搬送",
  "複数拠点への搬送",
  "夜間・無人時間帯の搬送",
  "まだ具体的には決まっていない",
  "その他"
];

export const loadWeightOptions = [
  "300kg未満",
  "300kg〜570kg程度",
  "570kg〜1,000kg程度",
  "1,000kg以上",
  "搬送物によって異なる",
  "分からない"
];

export const loadTypeOptions = [
  "木製パレット",
  "樹脂パレット",
  "鉄パレット",
  "カゴ台車",
  "専用台車",
  "ボビン・ロール材",
  "コンテナ・通い箱",
  "その他",
  "分からない"
];

export const transportDistanceOptions = [
  "10m未満",
  "10m〜30m程度",
  "30m〜80m程度",
  "80m以上",
  "複数ルートがある",
  "分からない"
];

export const considerationStatusOptions = [
  "具体的に導入を検討している",
  "情報収集を始めた段階",
  "将来的に検討したい",
  "社内で課題はあるが、まだ検討は始まっていない",
  "現時点では導入予定はない"
];

export const introductionTimingOptions = [
  "3ヶ月以内",
  "6ヶ月以内",
  "1年以内",
  "1年以上先",
  "時期未定",
  "現時点では検討していない"
];

export const budgetStatusOptions = [
  "予算化済み",
  "これから予算申請予定",
  "費用感を確認してから検討したい",
  "稟議・承認フローを確認中",
  "まだ未定",
  "回答しない"
];

export const userRoleOptions = [
  "導入決定者",
  "導入検討の責任者",
  "現場担当者",
  "技術・設備担当者",
  "購買・調達担当者",
  "情報収集担当",
  "その他"
];

export const requestedActionOptions = [
  "詳しい製品資料がほしい",
  "価格・見積感を知りたい",
  "Webミーティングで説明を聞きたい",
  "現地調査を依頼したい",
  "デモ・テスト走行を見たい",
  "PoCについて相談したい",
  "代理店・販売店経由で相談したい",
  "今は情報提供のみでよい",
  "特に希望はない"
];

export const contactPermissionOptions = [
  "はい、連絡を希望します",
  "必要に応じて連絡しても構いません",
  "今回は連絡不要です"
];

export const fallbackEvents: Record<string, SurveyEvent> = {
  fooma2026: {
    eventSlug: "fooma2026",
    eventName: "FOOMA JAPAN 2026",
    venue: "東京ビッグサイト",
    boothName: "山善ブース内",
    startDate: "2026-06-02",
    endDate: "2026-06-05",
    status: "published",
    description: ""
  },
  "logis-tech-2026": {
    eventSlug: "logis-tech-2026",
    eventName: "国際物流総合展 2026",
    venue: "",
    boothName: "",
    startDate: "",
    endDate: "",
    status: "draft",
    description: ""
  },
  "yamazen-private-2026": {
    eventSlug: "yamazen-private-2026",
    eventName: "山善プライベート展 2026",
    venue: "",
    boothName: "",
    startDate: "",
    endDate: "",
    status: "draft",
    description: ""
  }
};
