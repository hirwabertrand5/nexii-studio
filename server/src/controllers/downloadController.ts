import type { Request, Response } from "express";
import { prepareSecureDownload } from "../services/downloadService.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { assertValidObjectId, routeParam } from "../utils/validators.js";

export async function downloadPlan(req: Request, res: Response) {
  const userId = req.auth?.userId;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  const planId = routeParam(req.params.planId, "plan id");
  assertValidObjectId(planId, "plan id");
  const download = await prepareSecureDownload(userId, planId);
  return sendSuccess(res, { download });
}
