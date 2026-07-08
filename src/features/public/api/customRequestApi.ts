import { http } from "@/shared/api/http";

export type CreateCustomRequestInput = {
  projectTitle: string;
  projectType: string;
  plotSize: number;
  bedrooms: number;
  bathrooms: number;
  floors: number;
  budget: number;
  budgetCurrency?: string;
  country: string;
  location: string;
  architecturalStyle: string;
  description: string;
  functionalRequirements?: string[];
  inspirationPreferences?: string[];
};

export async function createCustomRequest(input: CreateCustomRequestInput) {
  return http<{ requestId: string; status: string }>("/api/requests", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
