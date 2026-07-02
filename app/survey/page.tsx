import { Suspense } from "react";
import SurveyIndexClient from "./SurveyIndexClient";

export default function SurveyIndexPage() {
  return (
    <Suspense fallback={null}>
      <SurveyIndexClient />
    </Suspense>
  );
}
