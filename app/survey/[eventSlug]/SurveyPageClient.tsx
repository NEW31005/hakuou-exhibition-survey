"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { getSurveyEvent } from "@/src/lib/gas-client";
import type { EventStatus, SurveyEvent, SurveyEventResponse } from "@/src/types/survey";
import SurveyForm from "./SurveyForm";

type SurveyPageClientProps = {
  eventSlug: string;
};

const statusMessages: Record<Exclude<EventStatus, "published">, string> = {
  draft: "このアンケートは現在公開されていません",
  hidden: "このアンケートは現在公開されていません",
  closed: "このアンケートの受付は終了しました"
};

export default function SurveyPageClient({ eventSlug }: SurveyPageClientProps) {
  const [result, setResult] = useState<SurveyEventResponse | null>(null);

  useEffect(() => {
    let mounted = true;

    getSurveyEvent(eventSlug).then((response) => {
      if (mounted) setResult(response);
    });

    return () => {
      mounted = false;
    };
  }, [eventSlug]);

  if (!result) {
    return (
      <SurveyShell>
        <StatusPanel title="読み込み中です" description="展示会情報を確認しています。" />
      </SurveyShell>
    );
  }

  if (!result.ok || !result.event) {
    return (
      <SurveyShell>
        <StatusPanel
          title="指定された展示会アンケートが見つかりません"
          description={result.message || "URLをご確認ください。"}
        />
      </SurveyShell>
    );
  }

  if (result.event.status !== "published") {
    return (
      <SurveyShell event={result.event}>
        <StatusPanel
          title={statusMessages[result.event.status]}
          description="公開状態は展示会マスタで管理されています。"
        />
      </SurveyShell>
    );
  }

  return (
    <SurveyShell event={result.event}>
      <SurveyForm event={result.event} />
    </SurveyShell>
  );
}

function SurveyShell({
  event,
  children
}: {
  event?: SurveyEvent;
  children: React.ReactNode;
}) {
  const logoSrc = `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/hakuou-robotics-logo.png`;

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-hakuou-ink">
      <div className="border-b border-hakuou-line bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-black tracking-normal text-hakuou-blue">HAKUOU ROBOTICS</p>
            <p className="text-sm font-bold text-hakuou-muted">展示会ご来場アンケート</p>
          </div>
          <div className="flex items-center justify-end gap-4">
            {event ? (
              <div className="hidden text-right text-xs font-bold text-hakuou-muted md:block">
                <div>{event.venue || "会場未設定"}</div>
                <div>{[event.startDate, event.endDate].filter(Boolean).join(" - ")}</div>
              </div>
            ) : null}
            <div className="rounded bg-black px-2 py-1">
              <Image
                src={logoSrc}
                alt="HAKUOU ROBOTICS"
                width={180}
                height={72}
                className="h-8 w-auto sm:h-10"
                priority
              />
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-9">
        {event ? (
          <header className="mb-6 rounded-lg border border-hakuou-line bg-white p-5 shadow-panel sm:p-7">
            <p className="text-sm font-bold text-hakuou-blue">{event.eventSlug}</p>
            <h1 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">
              {event.eventName} ご来場アンケート
            </h1>
            <div className="mt-4 space-y-3 text-sm leading-7 text-hakuou-muted sm:text-base">
              <p>
                {event.eventName}
                では、ハクオウロボティクスの展示ブースへお立ち寄りいただき、誠にありがとうございました。
              </p>
              <p>
                今後のご提案や情報提供の参考とさせていただくため、簡単なアンケートにご協力いただけますと幸いです。
                所要時間は約3分です。
              </p>
            </div>
          </header>
        ) : null}
        {children}
      </div>
    </main>
  );
}

function StatusPanel({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-lg border border-hakuou-line bg-white p-7 shadow-panel">
      <h1 className="text-xl font-black">{title}</h1>
      <p className="mt-3 text-hakuou-muted">{description}</p>
    </section>
  );
}
