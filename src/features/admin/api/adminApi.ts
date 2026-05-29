import { http } from '@/shared/api/http';

// Dashboard APIs
export const adminDashboardApi = {
  getOverview: () => http.get('/admin/dashboard/overview'),
  getRecentActivity: () => http.get('/admin/dashboard/activity'),
  getMonthlyRevenue: () => http.get('/admin/dashboard/revenue/monthly'),
  getSalesStatistics: () => http.get('/admin/dashboard/statistics'),
};

// Plans APIs
export const adminPlansApi = {
  getAllPlans: (params: Record<string, unknown>) => http.get('/admin/plans', { params }),
  getPlanById: (id: string) => http.get(`/admin/plans/${id}`),
  updatePlan: (id: string, data: Record<string, unknown>) => http.put(`/admin/plans/${id}`, data),
  toggleFeatured: (id: string) => http.patch(`/admin/plans/${id}/featured`),
  publishPlan: (id: string) => http.patch(`/admin/plans/${id}/publish`),
  deletePlan: (id: string) => http.delete(`/admin/plans/${id}`),
  bulkDelete: (ids: string[]) => http.post('/admin/plans/bulk/delete', { ids }),
  bulkPublish: (ids: string[]) => http.post('/admin/plans/bulk/publish', { ids }),
};

// Payments/Orders APIs
export const adminPaymentsApi = {
  getAllOrders: (params: Record<string, unknown>) => http.get('/admin/payments', { params }),
  getOrderById: (id: string) => http.get(`/admin/payments/${id}`),
  updateOrderStatus: (id: string, status: string) => http.put(`/admin/payments/${id}/status`, { orderStatus: status }),
  toggleDownloadAccess: (id: string) => http.patch(`/admin/payments/${id}/download-access`),
  getPaymentHistory: (id: string) => http.get(`/admin/payments/${id}/history`),
};

// Users APIs
export const adminUsersApi = {
  getAllUsers: (params: Record<string, unknown>) => http.get('/admin/users', { params }),
  getUserById: (id: string) => http.get(`/admin/users/${id}`),
  suspendUser: (id: string, reason?: string) => http.patch(`/admin/users/${id}/suspend`, { reason }),
  activateUser: (id: string) => http.patch(`/admin/users/${id}/activate`),
  getUserStatistics: () => http.get('/admin/users/statistics/all'),
};

// Custom Requests APIs
export const adminCustomRequestsApi = {
  getAllRequests: (params: Record<string, unknown>) => http.get('/admin/requests', { params }),
  getRequestById: (id: string) => http.get(`/admin/requests/${id}`),
  updateRequestStatus: (id: string, status: string) => http.put(`/admin/requests/${id}/status`, { status }),
  sendQuotation: (id: string, quotation: { amount: number; description: string; timeline: string }) =>
    http.post(`/admin/requests/${id}/quotation`, quotation),
  addNotes: (id: string, notes: string) => http.put(`/admin/requests/${id}/notes`, { notes }),
  getRequestStatistics: () => http.get('/admin/requests/statistics/all'),
};
