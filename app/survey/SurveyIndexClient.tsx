"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function SurveyIndexClient() {
  const searchParams = useSearchParams();
  const eventSlug = searchParams.get("eventSlug") || searchParams.get("eventId");
  const logoSrc = `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/hakuou-robotics-logo.png`;

  useEffect(() => {
    if (eventSlug) {
      window.location.replace(`/survey/${encodeURIComponent(eventSlug)}`);
    }
  }, [eventSlug]);

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-12 text-hakuou-ink">
      <div className="mx-auto max-w-2xl rounded-lg border border-hakuou-line bg-white p-7 shadow-panel">
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm font-bold text-hakuou-blue">HAKUOU ROBOTICS</p>
          <Image
            src={logoSrc}
            alt="HAKUOU ROBOTICS"
            width={2303}
            height={398}
            className="h-8 w-auto max-w-[46vw] object-contain"
            priority
          />
        </div>
        <h1 className="mt-2 text-2xl font-bold">展示会アンケート</h1>
        <p className="mt-4 text-hakuou-muted">
          アンケートURLに展示会IDが指定されていません。
          サンクスメールなどに記載された展示会別URLからアクセスしてください。
        </p>
        <Link
          href="/survey/fooma2026"
          className="mt-6 inline-flex rounded-md bg-hakuou-blue px-4 py-3 text-sm font-bold text-white"
        >
          FOOMA 2026のプレビューを開く
        </Link>
      </div>
    </main>
  );
}
