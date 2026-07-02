import type { LeadRank, SurveyFormData } from "@/src/types/survey";

type ScoreInput = Pick<
  SurveyFormData,
  | "requestedActions"
  | "introductionTiming"
  | "budgetStatus"
  | "userRole"
  | "issues"
  | "loadWeight"
  | "automationTasks"
>;

const scoreRules: Array<{
  key: keyof ScoreInput;
  value: string;
  points: number;
}> = [
  { key: "requestedActions", value: "現地調査を依頼したい", points: 30 },
  { key: "requestedActions", value: "価格・見積感を知りたい", points: 25 },
  { key: "requestedActions", value: "Webミーティングで説明を聞きたい", points: 20 },
  { key: "requestedActions", value: "PoCについて相談したい", points: 25 },
  { key: "introductionTiming", value: "3ヶ月以内", points: 30 },
  { key: "introductionTiming", value: "6ヶ月以内", points: 20 },
  { key: "introductionTiming", value: "1年以内", points: 10 },
  { key: "budgetStatus", value: "予算化済み", points: 25 },
  { key: "budgetStatus", value: "これから予算申請予定", points: 15 },
  { key: "userRole", value: "導入決定者", points: 20 },
  { key: "userRole", value: "導入検討の責任者", points: 20 },
  { key: "issues", value: "フォークリフト作業者の人手不足", points: 10 },
  { key: "issues", value: "単純な往復搬送が多い", points: 10 },
  { key: "loadWeight", value: "300kg〜570kg程度", points: 10 },
  { key: "automationTasks", value: "パレットの定点間搬送", points: 10 }
];

export function calculateLeadScore(data: ScoreInput): number {
  return scoreRules.reduce((score, rule) => {
    const current = data[rule.key];
    if (Array.isArray(current)) {
      return current.includes(rule.value) ? score + rule.points : score;
    }

    return current === rule.value ? score + rule.points : score;
  }, 0);
}

export function getLeadRank(score: number): LeadRank {
  if (score >= 80) return "S";
  if (score >= 50) return "A";
  if (score >= 25) return "B";
  return "C";
}
