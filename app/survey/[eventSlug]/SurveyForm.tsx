"use client";

import { useMemo, useState } from "react";
import { submitSurveyResponse } from "@/src/lib/gas-client";
import { calculateLeadScore, getLeadRank } from "@/src/lib/lead-score";
import {
  automationTaskOptions,
  budgetStatusOptions,
  considerationStatusOptions,
  contactPermissionOptions,
  explanationRatingOptions,
  interestOptions,
  introductionTimingOptions,
  issueOptions,
  loadTypeOptions,
  loadWeightOptions,
  requestedActionOptions,
  transportDistanceOptions,
  userRoleOptions
} from "@/src/lib/survey-options";
import type { SurveyEvent, SurveyFormData } from "@/src/types/survey";

type SurveyFormProps = {
  event: SurveyEvent;
};

type ArrayField =
  | "interests"
  | "issues"
  | "automationTasks"
  | "loadType"
  | "requestedActions";

type TextField =
  | "companyName"
  | "personName"
  | "department"
  | "email"
  | "phone"
  | "explanationRating"
  | "loadWeight"
  | "transportDistance"
  | "considerationStatus"
  | "introductionTiming"
  | "budgetStatus"
  | "userRole"
  | "freeComment"
  | "contactPermission";

type Errors = Partial<Record<TextField | ArrayField, string>>;

const QUESTION_TOTAL = 19;

const initialFormData: Omit<SurveyFormData, "eventSlug" | "sourceUrl"> = {
  companyName: "",
  personName: "",
  department: "",
  email: "",
  phone: "",
  interests: [],
  explanationRating: "",
  issues: [],
  automationTasks: [],
  loadWeight: "",
  loadType: [],
  transportDistance: "",
  considerationStatus: "",
  introductionTiming: "",
  budgetStatus: "",
  userRole: "",
  requestedActions: [],
  freeComment: "",
  contactPermission: ""
};

export default function SurveyForm({ event }: SurveyFormProps) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submittedMessage, setSubmittedMessage] = useState("");

  const leadScore = useMemo(() => calculateLeadScore(formData), [formData]);
  const leadRank = useMemo(() => getLeadRank(leadScore), [leadScore]);

  function updateText(field: TextField, value: string) {
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function toggleArrayValue(field: ArrayField, value: string) {
    setFormData((current) => {
      const currentValues = current[field];
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

      return { ...current, [field]: nextValues };
    });
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(eventSubmit: React.FormEvent<HTMLFormElement>) {
    eventSubmit.preventDefault();
    setSubmitError("");
    setSubmittedMessage("");

    const nextErrors = validateForm(formData);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      const firstError = document.querySelector("[data-error='true']");
      firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setIsSubmitting(true);
    const payload: SurveyFormData = {
      ...formData,
      eventSlug: event.eventSlug,
      sourceUrl: window.location.href,
      userAgent: window.navigator.userAgent,
      leadScore,
      leadRank
    };

    try {
      const response = await submitSurveyResponse(payload);

      if (!response.ok) {
        setSubmitError(response.message || "送信に失敗しました。時間をおいて再度お試しください。");
        return;
      }

      setSubmittedMessage(
        "ご回答いただき、誠にありがとうございました。\n\n内容を確認のうえ、必要に応じて弊社担当者よりご連絡させていただきます。\n今後ともハクオウロボティクスをよろしくお願いいたします。"
      );
      setFormData(initialFormData);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setSubmitError("送信に失敗しました。通信環境をご確認のうえ、再度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submittedMessage) {
    return (
      <section className="rounded-lg border border-emerald-200 bg-white p-7 shadow-panel">
        <p className="text-sm font-black text-hakuou-mint">送信完了</p>
        <h2 className="mt-2 text-2xl font-black">ありがとうございました</h2>
        <p className="mt-5 whitespace-pre-line leading-8 text-hakuou-muted">{submittedMessage}</p>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <FormSection title="基本情報">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="会社名"
            questionNumber={1}
            required
            value={formData.companyName}
            error={errors.companyName}
            autoComplete="organization"
            onChange={(value) => updateText("companyName", value)}
          />
          <TextInput
            label="お名前"
            questionNumber={2}
            required
            value={formData.personName}
            error={errors.personName}
            autoComplete="name"
            onChange={(value) => updateText("personName", value)}
          />
          <TextInput
            label="部署名・役職"
            questionNumber={3}
            value={formData.department}
            autoComplete="organization-title"
            onChange={(value) => updateText("department", value)}
          />
          <TextInput
            label="メールアドレス"
            questionNumber={4}
            required
            type="email"
            value={formData.email}
            error={errors.email}
            autoComplete="email"
            onChange={(value) => updateText("email", value)}
          />
          <TextInput
            label="電話番号"
            questionNumber={5}
            type="tel"
            value={formData.phone}
            autoComplete="tel"
            onChange={(value) => updateText("phone", value)}
          />
        </div>
      </FormSection>

      <FormSection title="展示内容について">
        <ChoiceGroup
          label="展示会で特に関心を持たれた内容"
          questionNumber={6}
          required
          multiple
          options={interestOptions}
          values={formData.interests}
          error={errors.interests}
          onToggle={(value) => toggleArrayValue("interests", value)}
        />
        <ChoiceGroup
          label="弊社ブース・製品説明について、どのように感じられましたか"
          questionNumber={7}
          options={explanationRatingOptions}
          values={formData.explanationRating}
          onSelect={(value) => updateText("explanationRating", value)}
        />
      </FormSection>

      <FormSection title="現場課題">
        <ChoiceGroup
          label="現在、物流・搬送現場で課題に感じていること"
          questionNumber={8}
          required
          multiple
          options={issueOptions}
          values={formData.issues}
          error={errors.issues}
          onToggle={(value) => toggleArrayValue("issues", value)}
        />
        <ChoiceGroup
          label="自動化を検討したい搬送作業"
          questionNumber={9}
          multiple
          options={automationTaskOptions}
          values={formData.automationTasks}
          onToggle={(value) => toggleArrayValue("automationTasks", value)}
        />
      </FormSection>

      <FormSection title="搬送条件">
        <ChoiceGroup
          label="搬送物の重量"
          questionNumber={10}
          options={loadWeightOptions}
          values={formData.loadWeight}
          onSelect={(value) => updateText("loadWeight", value)}
        />
        <ChoiceGroup
          label="主に使用している荷姿"
          questionNumber={11}
          multiple
          options={loadTypeOptions}
          values={formData.loadType}
          onToggle={(value) => toggleArrayValue("loadType", value)}
        />
        <ChoiceGroup
          label="搬送距離の目安"
          questionNumber={12}
          options={transportDistanceOptions}
          values={formData.transportDistance}
          onSelect={(value) => updateText("transportDistance", value)}
        />
      </FormSection>

      <FormSection title="導入検討状況">
        <ChoiceGroup
          label="自動搬送・AGFの導入検討状況"
          questionNumber={13}
          required
          options={considerationStatusOptions}
          values={formData.considerationStatus}
          error={errors.considerationStatus}
          onSelect={(value) => updateText("considerationStatus", value)}
        />
        <ChoiceGroup
          label="導入を検討される場合、想定時期"
          questionNumber={14}
          options={introductionTimingOptions}
          values={formData.introductionTiming}
          onSelect={(value) => updateText("introductionTiming", value)}
        />
        <ChoiceGroup
          label="ご予算・稟議状況"
          questionNumber={15}
          options={budgetStatusOptions}
          values={formData.budgetStatus}
          onSelect={(value) => updateText("budgetStatus", value)}
        />
        <ChoiceGroup
          label="導入検討におけるお立場"
          questionNumber={16}
          options={userRoleOptions}
          values={formData.userRole}
          onSelect={(value) => updateText("userRole", value)}
        />
      </FormSection>

      <FormSection title="次回対応">
        <ChoiceGroup
          label="今後、希望される対応"
          questionNumber={17}
          required
          multiple
          options={requestedActionOptions}
          values={formData.requestedActions}
          error={errors.requestedActions}
          onToggle={(value) => toggleArrayValue("requestedActions", value)}
        />
        <label className="block">
          <span className="mb-2 flex flex-wrap items-center gap-2 text-sm font-black">
            <QuestionNumber value={18} />
            <span>ご相談内容・確認したいこと</span>
          </span>
          <textarea
            value={formData.freeComment}
            onChange={(changeEvent) => updateText("freeComment", changeEvent.target.value)}
            placeholder="搬送物の重量、現場の通路幅、搬送距離、パレット形状、費用感、導入までの流れなど"
            className="min-h-32 w-full rounded-md border border-hakuou-line bg-white px-3 py-3 outline-none transition focus:border-hakuou-blue focus:ring-4 focus:ring-blue-100"
          />
        </label>
        <ChoiceGroup
          label="ご回答内容に基づき、弊社担当者よりご連絡してもよろしいでしょうか"
          questionNumber={19}
          required
          options={contactPermissionOptions}
          values={formData.contactPermission}
          error={errors.contactPermission}
          onSelect={(value) => updateText("contactPermission", value)}
        />
      </FormSection>

      <div className="sticky bottom-0 z-10 -mx-4 border-t border-hakuou-line bg-white/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-bold text-hakuou-muted">
            ご回答いただいた内容は、今後のご提案・情報提供および必要に応じた弊社からのご連絡に利用します。
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-12 rounded-md bg-hakuou-blue px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/15 transition hover:bg-hakuou-navy disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting ? "送信中..." : "回答を送信する"}
          </button>
        </div>
        {submitError ? (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-hakuou-red">
            {submitError}
          </p>
        ) : null}
      </div>
    </form>
  );
}

function FormSection({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-6 rounded-lg border border-hakuou-line bg-white p-4 shadow-panel sm:p-6">
      <h2 className="border-b border-hakuou-line pb-3 text-lg font-black">{title}</h2>
      {children}
    </section>
  );
}

function TextInput({
  label,
  questionNumber,
  value,
  onChange,
  required = false,
  type = "text",
  autoComplete,
  error
}: {
  label: string;
  questionNumber: number;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <label className="block" data-error={error ? "true" : undefined}>
      <span className="mb-2 flex flex-wrap items-center gap-2 text-sm font-black">
        <QuestionNumber value={questionNumber} />
        <span>
          {label}
          {required ? <RequiredMark /> : null}
        </span>
      </span>
      <input
        value={value}
        type={type}
        autoComplete={autoComplete}
        onChange={(changeEvent) => onChange(changeEvent.target.value)}
        className="min-h-12 w-full rounded-md border border-hakuou-line bg-white px-3 py-2 outline-none transition focus:border-hakuou-blue focus:ring-4 focus:ring-blue-100"
        aria-invalid={Boolean(error)}
      />
      <FieldError message={error} />
    </label>
  );
}

function ChoiceGroup({
  label,
  questionNumber,
  options,
  values,
  required = false,
  multiple = false,
  error,
  onSelect,
  onToggle
}: {
  label: string;
  questionNumber: number;
  options: string[];
  values: string | string[];
  required?: boolean;
  multiple?: boolean;
  error?: string;
  onSelect?: (value: string) => void;
  onToggle?: (value: string) => void;
}) {
  return (
    <fieldset className="space-y-3" data-error={error ? "true" : undefined}>
      <legend className="text-sm font-black">
        <span className="flex flex-wrap items-center gap-2">
          <QuestionNumber value={questionNumber} />
          <span>
            {label}
            {required ? <RequiredMark /> : null}
          </span>
        </span>
      </legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const checked = Array.isArray(values) ? values.includes(option) : values === option;
          return (
            <label
              key={option}
              className={[
                "flex min-h-12 cursor-pointer items-start gap-3 rounded-md border px-3 py-3 text-sm font-bold transition",
                checked
                  ? "border-hakuou-blue bg-blue-50 text-hakuou-navy"
                  : "border-hakuou-line bg-white text-hakuou-ink hover:border-blue-200"
              ].join(" ")}
            >
              <input
                type={multiple ? "checkbox" : "radio"}
                checked={checked}
                onChange={() => (multiple ? onToggle?.(option) : onSelect?.(option))}
                className="mt-1 size-4 accent-hakuou-blue"
              />
              <span>{option}</span>
            </label>
          );
        })}
      </div>
      <FieldError message={error} />
    </fieldset>
  );
}

function QuestionNumber({ value }: { value: number }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-hakuou-blue ring-1 ring-blue-100">
      設問 {value}/{QUESTION_TOTAL}
    </span>
  );
}

function RequiredMark() {
  return <span className="ml-1 text-hakuou-red">必須</span>;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-2 text-sm font-bold text-hakuou-red">{message}</p>;
}

function validateForm(data: typeof initialFormData): Errors {
  const nextErrors: Errors = {};

  if (!data.companyName.trim()) nextErrors.companyName = "会社名を入力してください。";
  if (!data.personName.trim()) nextErrors.personName = "お名前を入力してください。";
  if (!data.email.trim()) {
    nextErrors.email = "メールアドレスを入力してください。";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    nextErrors.email = "メールアドレスの形式をご確認ください。";
  }
  if (data.interests.length === 0) nextErrors.interests = "1つ以上選択してください。";
  if (data.issues.length === 0) nextErrors.issues = "1つ以上選択してください。";
  if (!data.considerationStatus) nextErrors.considerationStatus = "1つ選択してください。";
  if (data.requestedActions.length === 0) nextErrors.requestedActions = "1つ以上選択してください。";
  if (!data.contactPermission) nextErrors.contactPermission = "1つ選択してください。";

  return nextErrors;
}
