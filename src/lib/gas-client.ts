import { fallbackEvents } from "@/src/lib/survey-options";
import type {
  SurveyEventResponse,
  SurveyFormData,
  SurveySubmitResponse
} from "@/src/types/survey";

const gasWebAppUrl = process.env.NEXT_PUBLIC_GAS_WEB_APP_URL?.trim() || "";

export async function getSurveyEvent(eventSlug: string): Promise<SurveyEventResponse> {
  if (!eventSlug) {
    return {
      ok: false,
      message: "指定された展示会アンケートが見つかりません"
    };
  }

  if (!gasWebAppUrl) {
    const event = fallbackEvents[eventSlug];
    return event
      ? { ok: true, event }
      : { ok: false, message: "指定された展示会アンケートが見つかりません" };
  }

  const url = new URL(gasWebAppUrl);
  url.searchParams.set("action", "getEvent");
  url.searchParams.set("eventSlug", eventSlug);

  try {
    const response = await fetch(url.toString(), {
      cache: "no-store",
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      return {
        ok: false,
        message: "展示会情報を取得できませんでした"
      };
    }

    return await response.json() as SurveyEventResponse;
  } catch {
    const event = fallbackEvents[eventSlug];
    return event
      ? { ok: true, event }
      : { ok: false, message: "展示会情報を取得できませんでした" };
  }
}

export async function submitSurveyResponse(
  data: SurveyFormData
): Promise<SurveySubmitResponse> {
  if (!gasWebAppUrl) {
    return {
      ok: false,
      message: "GAS Web App URLが設定されていません"
    };
  }

  const apiKey = process.env.NEXT_PUBLIC_SURVEY_API_KEY?.trim();
  const body = apiKey ? { ...data, apiKey } : data;

  const response = await fetch(gasWebAppUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(body),
    redirect: "follow"
  });

  const text = await response.text();

  try {
    return JSON.parse(text) as SurveySubmitResponse;
  } catch {
    return {
      ok: false,
      message: text || "送信結果を読み取れませんでした"
    };
  }
}
