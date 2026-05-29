import { type Request, type Response } from "express";
import { CustomRequest } from "../models/CustomRequest.js";
import { AdminActivityLog } from "../models/AdminActivityLog.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";

// Get all custom requests
export const getAllRequests = asyncHandler(async (req: Request, res: Response) => {
  const { status, search, page = 1, limit = 10, sortBy = "createdAt" } = req.query;

  const filter: Record<string, unknown> = {};

  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { projectTitle: { $regex: String(search), $options: "i" } },
      { description: { $regex: String(search), $options: "i" } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [requests, total] = await Promise.all([
    CustomRequest.find(filter)
      .populate("user", "fullName email country phone")
      .sort({ [String(sortBy)]: -1 })
      .skip(skip)
      .limit(Number(limit)),
    CustomRequest.countDocuments(filter)
  ]);

  res.status(200).json(
    apiResponse(true, "Custom requests retrieved", {
      requests,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    })
  );
});

// Get request details
export const getRequestById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const request = await CustomRequest.findById(id).populate(
    "user",
    "fullName email country phone"
  ).populate("assignedArchitect", "fullName email");

  if (!request) throw new AppError("Request not found", 404);

  res.status(200).json(apiResponse(true, "Request details retrieved", request));
});

// Update request status
export const updateRequestStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = [
    "pending",
    "under-review",
    "clarification-needed",
    "quotation-sent",
    "approved",
    "rejected",
    "in-progress",
    "completed"
  ];

  if (!validStatuses.includes(status)) {
    throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(", ")}`, 400);
  }

  const request = await CustomRequest.findById(id);
  if (!request) throw new AppError("Request not found", 404);

  const oldStatus = request.status;
  request.status = status;

  if (status === "completed") {
    request.completedAt = new Date();
  }

  await request.save();

  // Log activity
  await AdminActivityLog.create({
    admin: (req as any).admin._id,
    action: "custom-request-status-changed",
    targetModel: "CustomRequest",
    targetId: request._id,
    description: `Changed request status from ${oldStatus} to ${status}`,
    changes: {
      status: { before: oldStatus, after: status }
    }
  });

  res.status(200).json(apiResponse(true, "Request status updated", request));
});

// Send quotation
export const sendQuotation = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { amount, currency = "USD", description, timeline, pricingBreakdown = [], notes = "" } = req.body;

  if (!amount || !description || !timeline) {
    throw new AppError("Amount, description, and timeline are required", 400);
  }

  const request = await CustomRequest.findById(id);
  if (!request) throw new AppError("Request not found", 404);

  request.quotation = {
    amount,
    currency,
    description,
    pricingBreakdown,
    estimatedTimeline: timeline,
    notes,
    status: "pending",
    sentAt: new Date(),
    responseDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  };
  request.status = "quotation-sent";
  await request.save();

  // Log activity
  await AdminActivityLog.create({
    admin: (req as any).admin._id,
    action: "quotation-sent",
    targetModel: "CustomRequest",
    targetId: request._id,
    description: `Sent quotation for request: ${request.projectTitle} - Amount: ${amount} ${currency}`
  });

  res.status(200).json(apiResponse(true, "Quotation sent successfully", request));
});

// Add notes to request
export const addNotes = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { notes } = req.body;

  if (!notes) throw new AppError("Notes are required", 400);

  const request = await CustomRequest.findById(id);
  if (!request) throw new AppError("Request not found", 404);

  request.adminNotes = notes;
  await request.save();

  res.status(200).json(apiResponse(true, "Notes added successfully", request));
});

// Get request statistics
export const getRequestStatistics = asyncHandler(async (req: Request, res: Response) => {
  const stats = await CustomRequest.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]);

  const totalRequests = stats.reduce((sum, stat) => sum + stat.count, 0);

  const statusBreakdown: Record<string, number> = {};
  stats.forEach((stat) => {
    statusBreakdown[String(stat._id)] = stat.count;
  });

  res.status(200).json(
    apiResponse(true, "Request statistics retrieved", {
      totalRequests,
      statusBreakdown,
      byStatus: stats
    })
  );
});
