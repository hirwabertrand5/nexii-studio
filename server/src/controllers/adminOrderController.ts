import type { Request, Response } from "express";
import {
  getOrderAnalytics,
  listAdminOrders,
  parseOrderUpdateInput,
  updateAdminOrder
} from "../services/orderService.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { assertValidObjectId, routeParam } from "../utils/validators.js";

export async function getAllOrders(req: Request, res: Response) {
  const data = await listAdminOrders(req.query);
  return sendSuccess(res, data);
}

export async function updateOrderStatus(req: Request, res: Response) {
  const orderId = routeParam(req.params.id, "order id");
  assertValidObjectId(orderId, "order id");

  const input = parseOrderUpdateInput(req.body);
  const order = await updateAdminOrder(orderId, input);
  return sendSuccess(res, { order });
}

export async function getAdminOrderAnalytics(_req: Request, res: Response) {
  const analytics = await getOrderAnalytics();
  return sendSuccess(res, { analytics });
}
