export type QuestionType =
  | "nps_0_10"
  | "stars_1_5"
  | "csat_1_5"
  | "text"
  | "multiple_choice"
  | "yes_no";

export type SurveyType = "nps" | "csat" | "stars" | "mixed";

export interface BusinessUnit {
  id: string;
  name: string;
  slug: string;
  brand_type: "cppem" | "colegio";
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  business_unit_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Survey {
  id: string;
  business_unit_id: string;
  product_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  audience: string | null;
  survey_type: SurveyType;
  public_url: string | null;
  is_active: boolean;
  created_at: string;
  starts_at: string | null;
  ends_at: string | null;
}

export interface SurveyQuestion {
  id: string;
  survey_id: string;
  question_text: string;
  question_type: QuestionType;
  options: string[] | null;
  scale_min: number | null;
  scale_max: number | null;
  is_required: boolean;
  order_index: number;
  created_at: string;
}

export interface SurveyResponse {
  id: string;
  survey_id: string;
  business_unit_id: string;
  product_id: string | null;
  respondent_name: string | null;
  respondent_email: string | null;
  respondent_phone: string | null;
  respondent_type: string | null;
  submitted_at: string;
  user_agent: string | null;
  source: string | null;
}

export interface SurveyAnswer {
  id: string;
  response_id: string;
  question_id: string;
  numeric_value: number | null;
  text_value: string | null;
  choice_value: string | null;
  created_at: string;
}
