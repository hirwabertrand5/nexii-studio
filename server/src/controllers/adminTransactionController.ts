import type { Request, Response } from "express";
import { getRevenueAnalytics, listAdminTransactions } from "../services/paymentVerificationService.js";
import { sendSuccess } from "../utils/apiResponse.js";

export async function getAllTransactions(req: Request, res: Response) {
  const data = await listAdminTransactions(req.query);
  return sendSuccess(res, data);
}

export async function getAdminRevenueAnalytics(_req: Request, res: Response) {
  const analytics = await getRevenueAnalytics();
  return sendSuccess(res, { analytics });
}
