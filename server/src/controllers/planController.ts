import type { Request, Response } from "express";
import {
  createPlan,
  deletePlan,
  getPlanWithRelated,
  listPlans,
  parseCreatePlanInput,
  parseUpdatePlanInput,
  toObjectId,
  updatePlan
} from "../services/planService.js";
import { sendMessage, sendSuccess } from "../utils/apiResponse.js";
import { assertValidObjectId } from "../utils/validators.js";

function routeParam(value: string | string[] | undefined, label: string) {
  if (typeof value !== "string") {
    throw new Error(`${label} is required`);
  }
  return value;
}

export async function getPlans(req: Request, res: Response) {
  const data = await listPlans(req.query);
  return sendSuccess(res, data);
}

export async function getAdminPlans(req: Request, res: Response) {
  const data = await listPlans(req.query, true);
  return sendSuccess(res, data);
}

export async function getPlan(req: Request, res: Response) {
  const planId = routeParam(req.params.id, "plan id");
  assertValidObjectId(planId, "plan id");
  const data = await getPlanWithRelated(planId);
  return sendSuccess(res, data);
}

export async function createHousePlan(req: Request, res: Response) {
  const userId = req.auth?.userId;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  const input = parseCreatePlanInput(req.body);
  const plan = await createPlan(input, toObjectId(userId));
  return sendSuccess(res, { plan }, 201);
}

export async function updateHousePlan(req: Request, res: Response) {
  const planId = routeParam(req.params.id, "plan id");
  assertValidObjectId(planId, "plan id");
  const input = parseUpdatePlanInput(req.body);
  const plan = await updatePlan(planId, input);
  return sendSuccess(res, { plan });
}

export async function deleteHousePlan(req: Request, res: Response) {
  const planId = routeParam(req.params.id, "plan id");
  assertValidObjectId(planId, "plan id");
  await deletePlan(planId);
  return sendMessage(res, "House plan deleted");
}
