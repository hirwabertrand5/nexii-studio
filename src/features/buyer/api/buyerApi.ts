import { http } from "@/shared/api/http";
import type { ImageAssetLike } from "@/shared/utils/image";

export type BuyerPlanRef = {
  _id: string;
  title: string;
  price: number;
  category?: string;
  architecturalStyle?: string;
  images?: Array<ImageAssetLike>;
  previewImages?: Array<ImageAssetLike>;
  filesIncluded?: string[];
};

export type BuyerOrderPlanItem = {
  plan: BuyerPlanRef | string;
  title: string;
  price: number;
};

export type BuyerOrder = {
  _id: string;
  plans: BuyerOrderPlanItem[];
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  downloadAccess: boolean;
  transactionReference: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
};

export type BuyerQuotation = {
  amount: number;
  currency: string;
  description: string;
  estimatedTimeline: string;
  status: string;
  notes?: string;
  clientResponse?: {
    status: string;
    message: string;
    respondedAt: string;
  };
};

export type BuyerRequest = {
  _id: string;
  projectTitle: string;
  projectType: string;
  plotSize: number;
  bedrooms: number;
  bathrooms: number;
  floors: number;
  budget: number;
  budgetCurrency: string;
  country: string;
  location: string;
  architecturalStyle: string;
  description: string;
  status: string;
  quotation?: BuyerQuotation;
  createdAt: string;
  updatedAt: string;
};

export async function getMyOrders() {
  return http<{ orders: BuyerOrder[] }>("/api/orders/my-orders", { method: "GET" });
}

export async function getMyRequests() {
  return http<{
    requests: BuyerRequest[];
    pagination: { total: number; page: number; limit: number; pages: number };
  }>("/api/requests/mine", { method: "GET" });
}
