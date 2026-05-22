export type FieldType = "text" | "textarea" | "tel" | "email" | "date" | "number" | "radio" | "checkbox" | "consent";

export interface Field {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string; emoji?: string }[];
  showWhen?: { fieldId: string; equals: string };
}

export interface QuizStep {
  id: string;
  emoji: string;
  title: string;
  description: string;
  encouragement?: string;
  fields: Field[];
}