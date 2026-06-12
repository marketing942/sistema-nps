"use client";

import SurveyEditor from "../survey-editor";
import type { SurveyQuestion } from "@/lib/types";

export default function SurveyEditorPanel({
  businessUnits,
  products,
  survey,
  questions,
}: {
  businessUnits: any[];
  products: any[];
  survey: any;
  questions: SurveyQuestion[];
}) {
  return (
    <SurveyEditor
      businessUnits={businessUnits}
      products={products}
      existingSurvey={{
        id: survey.id,
        name: survey.name,
        business_unit_id: survey.business_unit_id,
        product_id: survey.product_id,
        audience: survey.audience,
        description: survey.description,
        survey_type: survey.survey_type,
        is_active: survey.is_active,
        slug: survey.slug,
        starts_at: survey.starts_at,
        ends_at: survey.ends_at,
      }}
      existingQuestions={questions}
    />
  );
}
