export type EventStatus = "draft" | "published" | "closed" | "hidden";

export type LeadRank = "S" | "A" | "B" | "C";

export type SurveyEvent = {
  eventSlug: string;
  eventName: string;
  venue: string;
  boothName: string;
  startDate: string;
  endDate: string;
  status: EventStatus;
  description: string;
};

export type SurveyEventResponse = {
  ok: boolean;
  event?: SurveyEvent;
  message?: string;
};

export type SurveyFormData = {
  eventSlug: string;
  companyName: string;
  personName: string;
  department: string;
  email: string;
  phone: string;
  interests: string[];
  explanationRating: string;
  issues: string[];
  automationTasks: string[];
  loadWeight: string;
  loadType: string[];
  transportDistance: string;
  considerationStatus: string;
  introductionTiming: string;
  budgetStatus: string;
  userRole: string;
  requestedActions: string[];
  freeComment: string;
  contactPermission: string;
  sourceUrl: string;
  userAgent?: string;
  leadScore?: number;
  leadRank?: LeadRank;
};

export type SurveySubmitResponse = {
  ok: boolean;
  message: string;
  leadScore?: number;
  leadRank?: LeadRank;
};

export type SurveyFieldKey = keyof Omit<
  SurveyFormData,
  "eventSlug" | "sourceUrl" | "userAgent" | "leadScore" | "leadRank"
>;

export type OptionGroup = {
  label: string;
  values: string[];
};
