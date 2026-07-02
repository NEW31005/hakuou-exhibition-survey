import { fallbackEvents } from "@/src/lib/survey-options";
import SurveyPageClient from "./SurveyPageClient";

type SurveyPageProps = {
  params: Promise<{
    eventSlug: string;
  }>;
};

export function generateStaticParams() {
  return Object.keys(fallbackEvents).map((eventSlug) => ({ eventSlug }));
}

export default async function SurveyPage({ params }: SurveyPageProps) {
  const { eventSlug } = await params;
  return <SurveyPageClient eventSlug={eventSlug} />;
}
