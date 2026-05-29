import type { Request, Response } from "express";
import {
  createCheckoutOrder,
  getBuyerOrders,
  getOrderByIdForUser,
  parseCheckoutInput
} from "../services/orderService.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { assertValidObjectId, routeParam } from "../utils/validators.js";

export async function createCheckout(req: Request, res: Response) {
  const userId = req.auth?.userId;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  const input = parseCheckoutInput(req.body);
  const order = await createCheckoutOrder(userId, input);
  return sendSuccess(res, { order }, 201);
}

export async function getMyOrders(req: Request, res: Response) {
  const userId = req.auth?.userId;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  const orders = await getBuyerOrders(userId);
  return sendSuccess(res, { orders });
}

export async function getSingleOrder(req: Request, res: Response) {
  const userId = req.auth?.userId;
  const role = req.auth?.role;
  if (!userId || !role) return res.status(401).json({ success: false, message: "Unauthorized" });

  const orderId = routeParam(req.params.id, "order id");
  assertValidObjectId(orderId, "order id");
  const order = await getOrderByIdForUser(orderId, { userId, role });
  return sendSuccess(res, { order });
}
