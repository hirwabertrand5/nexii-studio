import { http } from "@/shared/api/http";

function withQuery(path: string, params?: Record<string, unknown>) {
  if (!params) return path;

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null && item !== "") {
          searchParams.append(key, String(item));
        }
      }
      continue;
    }
    searchParams.set(key, String(value));
  }

  const qs = searchParams.toString();
  return qs ? `${path}?${qs}` : path;
}

export type AdminPlanCategory =
  | "bungalow"
  | "duplex"
  | "modern-villa"
  | "small-plot-home"
  | "african-contemporary";

export type AdminPlanStatus = "draft" | "published";
export type AdminRequestStatus =
  | "pending"
  | "under-review"
  | "clarification-needed"
  | "quotation-sent"
  | "approved"
  | "rejected"
  | "in-progress"
  | "completed";
export type AdminPaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type AdminOrderStatus = "processing" | "completed" | "cancelled";
export type AdminAccountStatus = "active" | "suspended";

export interface AdminPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AdminUserSummary {
  _id: string;
  fullName: string;
  email: string;
  country?: string;
  accountStatus: AdminAccountStatus;
  createdAt: string;
}

export interface AdminRecentUser {
  _id: string;
  fullName: string;
  email: string;
  country?: string;
  createdAt: string;
}

export interface AdminPlanSummary {
  _id: string;
  title: string;
  description: string;
  category: AdminPlanCategory | string;
  bedrooms: number;
  bathrooms: number;
  floors: number;
  plotSize: number;
  totalArea: number;
  architecturalStyle: string;
  price: number;
  images: string[];
  previewImages?: string[];
  filesIncluded?: string[];
  digitalFiles?: Array<{
    label: string;
    fileName: string;
    contentType?: string;
    sizeInBytes?: number;
    storageKey?: string;
  }>;
  status: AdminPlanStatus | string;
  isFeatured: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminOrderSummary {
  _id: string;
  user: { fullName: string; email: string; country?: string };
  plans: Array<{ plan?: string; title: string; price: number }>;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: AdminPaymentStatus | string;
  orderStatus: AdminOrderStatus | string;
  downloadAccess?: boolean;
  verificationStatus?: string;
  paymentGateway?: string;
  paymentReference?: string;
  paymentDate?: string;
  receiptUrl?: string;
  currency?: string;
  createdAt: string;
  updatedAt?: string;
  transactionReference: string;
}

export interface AdminRequestSummary {
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
  status: AdminRequestStatus;
  user: { fullName: string; email: string; country?: string };
  assignedArchitect?: { fullName: string; email: string };
  quotation?: {
    amount: number;
    currency: string;
    description: string;
    estimatedTimeline: string;
    notes?: string;
    pricingBreakdown?: Array<{ item: string; amount: number }>;
    responseDeadline?: string;
    sentAt: string;
  };
  timeline?: Array<{
    stage: string;
    description: string;
    status: string;
    estimatedDuration: string;
    completedAt?: string;
    notes?: string;
  }>;
  adminNotes?: string;
  uploadedFiles?: Array<{
    fileName: string;
    storageKey: string;
    contentType?: string;
    sizeInBytes?: number;
    fileType: string;
    uploadedAt: string;
    url?: string;
  }>;
  clientMessages?: Array<{
    senderType: "client" | "admin";
    message: string;
    createdAt: string;
  }>;
  completedAt?: string;
  createdAt: string;
}

export interface AdminDashboardOverview {
  totalPlans: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingRequests: number;
  failedPayments: number;
}

export interface AdminDashboardActivity {
  recentOrders: AdminOrderSummary[];
  newUsers: AdminRecentUser[];
  newRequests: AdminRequestSummary[];
  failedPayments: AdminOrderSummary[];
}

export interface AdminPlanListResponse {
  plans: AdminPlanSummary[];
  pagination: AdminPagination;
}

export interface AdminOrderListResponse {
  orders: AdminOrderSummary[];
  pagination: AdminPagination;
}

export interface AdminUserListResponse {
  users: AdminUserSummary[];
  pagination: AdminPagination;
}

export interface AdminUserStatistics {
  activeUsers: number;
  suspendedUsers: number;
  adminUsers: number;
  totalBuyers: number;
  topCountries: Array<{ _id: string; count: number }>;
}

export interface AdminRequestListResponse {
  requests: AdminRequestSummary[];
  pagination: AdminPagination;
}

export const adminDashboardApi = {
  getOverview: () => http<AdminDashboardOverview>("/api/admin/dashboard/overview"),
  getRecentActivity: () => http<AdminDashboardActivity>("/api/admin/dashboard/activity"),
  getMonthlyRevenue: () => http<Array<Record<string, unknown>>>("/api/admin/dashboard/revenue/monthly"),
  getSalesStatistics: () => http<Record<string, unknown>>("/api/admin/dashboard/statistics"),
};

export const adminPlansApi = {
  getAllPlans: (params?: Record<string, unknown>) => http<AdminPlanListResponse>(withQuery("/api/admin/plans", params)),
  getPlanById: (id: string) => http<AdminPlanSummary>(`/api/admin/plans/${id}`),
  createPlan: (data: FormData) =>
    http<AdminPlanSummary>("/api/admin/plans", { method: "POST", body: data }),
  updatePlan: (id: string, data: FormData) =>
    http<AdminPlanSummary>(`/api/admin/plans/${id}`, { method: "PUT", body: data }),
  toggleFeatured: (id: string) => http<AdminPlanSummary>(`/api/admin/plans/${id}/featured`, { method: "PATCH" }),
  publishPlan: (id: string) => http<AdminPlanSummary>(`/api/admin/plans/${id}/publish`, { method: "PATCH" }),
  deletePlan: (id: string) => http<{ id: string }>(`/api/admin/plans/${id}`, { method: "DELETE" }),
  bulkDelete: (ids: string[]) =>
    http<{ deletedCount: number }>("/api/admin/plans/bulk/delete", { method: "POST", body: JSON.stringify({ ids }) }),
  bulkPublish: (ids: string[]) =>
    http<{ modifiedCount: number }>("/api/admin/plans/bulk/publish", { method: "POST", body: JSON.stringify({ ids }) }),
};

export const adminPaymentsApi = {
  getAllOrders: (params?: Record<string, unknown>) => http<AdminOrderListResponse>(withQuery("/api/admin/payments", params)),
  getOrderById: (id: string) => http<AdminOrderSummary>(`/api/admin/payments/${id}`),
  updateOrderStatus: (id: string, status: string) =>
    http<AdminOrderSummary>(`/api/admin/payments/${id}/status`, { method: "PUT", body: JSON.stringify({ orderStatus: status }) }),
  toggleDownloadAccess: (id: string) => http<AdminOrderSummary>(`/api/admin/payments/${id}/download-access`, { method: "PATCH" }),
  getPaymentHistory: (id: string) => http<Record<string, unknown>>(`/api/admin/payments/${id}/history`),
};

export const adminUsersApi = {
  getAllUsers: (params?: Record<string, unknown>) => http<AdminUserListResponse>(withQuery("/api/admin/users", params)),
  getUserById: (id: string) => http<Record<string, unknown>>(`/api/admin/users/${id}`),
  suspendUser: (id: string, reason?: string) =>
    http<AdminUserSummary>(`/api/admin/users/${id}/suspend`, { method: "PATCH", body: JSON.stringify({ reason }) }),
  activateUser: (id: string) => http<AdminUserSummary>(`/api/admin/users/${id}/activate`, { method: "PATCH" }),
  getUserStatistics: () => http<AdminUserStatistics>("/api/admin/users/statistics/all"),
};

export const adminCustomRequestsApi = {
  getAllRequests: (params?: Record<string, unknown>) => http<AdminRequestListResponse>(withQuery("/api/admin/requests", params)),
  getRequestById: (id: string) => http<AdminRequestSummary>(`/api/admin/requests/${id}`),
  updateRequestStatus: (id: string, status: AdminRequestStatus) =>
    http<AdminRequestSummary>(`/api/admin/requests/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
  sendQuotation: (
    id: string,
    quotation: {
      amount: number;
      currency?: string;
      description: string;
      timeline: string;
      pricingBreakdown?: Array<{ item: string; amount: number }>;
      notes?: string;
    }
  ) =>
    http<AdminRequestSummary>(`/api/admin/requests/${id}/quotation`, {
      method: "POST",
      body: JSON.stringify(quotation)
    }),
  addNotes: (id: string, notes: string) => http<AdminRequestSummary>(`/api/admin/requests/${id}/notes`, { method: "PUT", body: JSON.stringify({ notes }) }),
  getRequestStatistics: () => http<Record<string, unknown>>("/api/admin/requests/statistics/all"),
};
