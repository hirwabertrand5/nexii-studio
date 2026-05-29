import { type Request, type Response } from "express";
import { CustomRequest, type CustomRequestAttrs } from "../models/CustomRequest.js";
import { AdminActivityLog } from "../models/AdminActivityLog.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";
import { uploadBufferFile } from "../services/fileUploadService.js";

// Create custom request
export const createCustomRequest = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth?.userId;
  if (!userId) throw new AppError("User not authenticated", 401);

  const {
    projectTitle,
    projectType,
    plotSize,
    bedrooms,
    bathrooms,
    floors,
    budget,
    budgetCurrency = "USD",
    country,
    location,
    architecturalStyle,
    description,
    functionalRequirements,
    inspirationPreferences
  } = req.body;

  // Validation
  const requiredFields = [
    "projectTitle",
    "projectType",
    "plotSize",
    "bedrooms",
    "bathrooms",
    "floors",
    "budget",
    "country",
    "location",
    "architecturalStyle",
    "description"
  ];

  for (const field of requiredFields) {
    if (!(field in req.body)) {
      throw new AppError(`${field} is required`, 400);
    }
  }

  const customRequest = await CustomRequest.create({
    user: userId,
    projectTitle,
    projectType,
    plotSize,
    bedrooms,
    bathrooms,
    floors,
    budget,
    budgetCurrency,
    country,
    location,
    architecturalStyle,
    description,
    functionalRequirements: functionalRequirements || [],
    inspirationPreferences: inspirationPreferences || [],
    timeline: [
      {
        stage: "Initial Review",
        description: "Your request will be reviewed by our architectural team",
        status: "pending",
        estimatedDuration: "2-3 days"
      },
      {
        stage: "Consultation",
        description: "We may reach out with clarification questions",
        status: "pending",
        estimatedDuration: "3-5 days"
      },
      {
        stage: "Quotation Preparation",
        description: "We prepare and send you a detailed quotation",
        status: "pending",
        estimatedDuration: "3-5 days"
      },
      {
        stage: "Project Begins",
        description: "Upon approval, your architectural project begins",
        status: "pending",
        estimatedDuration: "Varies by project"
      }
    ],
    uploadedFiles: [],
    clientMessages: [
      {
        senderType: "admin",
        message: `Thank you for submitting your ${projectTitle} request! We've received your details and will review them shortly.`,
        createdAt: new Date()
      }
    ],
    adminNotes: "New request submitted"
  });

  res.status(201).json(
    apiResponse(true, "Custom request created successfully", {
      requestId: customRequest._id,
      status: customRequest.status
    })
  );
});

// Get client's requests
export const getMyRequests = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth?.userId;
  if (!userId) throw new AppError("User not authenticated", 401);

  const { status, page = 1, limit = 10 } = req.query;

  const filter: Record<string, unknown> = { user: userId };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [requests, total] = await Promise.all([
    CustomRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select("-uploadedFiles.storageKey"),
    CustomRequest.countDocuments(filter)
  ]);

  res.status(200).json(
    apiResponse(true, "Your requests retrieved", {
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
export const getRequestDetails = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.auth?.userId;
  if (!userId) throw new AppError("User not authenticated", 401);

  const request = await CustomRequest.findById(id).populate(
    "assignedArchitect",
    "fullName email"
  );

  if (!request) throw new AppError("Request not found", 404);

  // Check ownership
  if (request.user.toString() !== userId) {
    throw new AppError("You don't have access to this request", 403);
  }

  res.status(200).json(apiResponse(true, "Request details retrieved", request));
});

// Upload files to request
export const uploadRequestFiles = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.auth?.userId;
  if (!userId) throw new AppError("User not authenticated", 401);

  const request = await CustomRequest.findById(id);
  if (!request) throw new AppError("Request not found", 404);

  // Check ownership
  if (request.user.toString() !== userId) {
    throw new AppError("You don't have access to this request", 403);
  }
  const files = (req as any).files as Array<{buffer: Buffer; originalname: string; mimetype: string; size: number}> | undefined;
  if (!files || files.length === 0) {
    throw new AppError("Please provide files to upload", 400);
  }

  const uploadedResults = [] as any[];
  for (const f of files) {
    // determine fileType by mime or originalname
    let fileType: "sketch" | "document" | "inspiration" | "other" = "other";
    const name = (f.originalname || "").toLowerCase();
    if (/(sketch|plan|drawing)/i.test(name)) fileType = "sketch";
    else if (/pdf|doc|docx|dwg|dgn/i.test(name)) fileType = "document";
    else if (/inspirat|image|jpg|jpeg|png|gif/i.test(name)) fileType = "inspiration";

    const result = await uploadBufferFile(f.buffer, f.originalname, f.mimetype, f.size, fileType);
    request.uploadedFiles.push(result as any);
    uploadedResults.push(result);
  }

  await request.save();

  // Add message
  request.clientMessages.push({
    senderType: "client",
    message: `Added ${uploadedResults.length} file(s) to the request`,
    createdAt: new Date()
  });
  await request.save();

  res.status(200).json(apiResponse(true, "Files uploaded successfully", { uploaded: uploadedResults, requestId: request._id }));
});

// Respond to quotation
export const respondToQuotation = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.auth?.userId;
  if (!userId) throw new AppError("User not authenticated", 401);

  const { response, message } = req.body; // response: 'accepted' | 'rejected' | 'revision-requested'

  const validResponses = ["accepted", "rejected", "revision-requested"];
  if (!validResponses.includes(response)) {
    throw new AppError("Invalid response", 400);
  }

  const request = await CustomRequest.findById(id);
  if (!request) throw new AppError("Request not found", 404);

  if (request.user.toString() !== userId) {
    throw new AppError("You don't have access to this request", 403);
  }

  if (!request.quotation) throw new AppError("No quotation to respond to", 400);

  request.quotation.clientResponse = {
    status: response as any,
    message: message || "",
    respondedAt: new Date()
  };

  // Update status based on response
  if (response === "accepted") {
    request.status = "approved";
  } else if (response === "rejected") {
    request.status = "rejected";
  } else if (response === "revision-requested") {
    request.status = "clarification-needed";
  }

  await request.save();

  // Add message
  request.clientMessages.push({
    senderType: "client",
    message: `${response === "accepted" ? "Accepted" : response === "rejected" ? "Rejected" : "Requested revision for"} the quotation. ${message}`,
    createdAt: new Date()
  });
  await request.save();

  res.status(200).json(apiResponse(true, "Quotation response recorded", request));
});

// Add message to request
export const addMessageToRequest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.auth?.userId;
  if (!userId) throw new AppError("User not authenticated", 401);

  const { message } = req.body;
  if (!message) throw new AppError("Message is required", 400);

  const request = await CustomRequest.findById(id);
  if (!request) throw new AppError("Request not found", 404);

  if (request.user.toString() !== userId) {
    throw new AppError("You don't have access to this request", 403);
  }

  request.clientMessages.push({
    senderType: "client",
    message,
    createdAt: new Date()
  });

  await request.save();

  res.status(200).json(apiResponse(true, "Message added successfully", request));
});

// Get request timeline
export const getRequestTimeline = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.auth?.userId;
  if (!userId) throw new AppError("User not authenticated", 401);

  const request = await CustomRequest.findById(id).select("timeline status quotation");
  if (!request) throw new AppError("Request not found", 404);

  if (request.user.toString() !== userId) {
    throw new AppError("You don't have access to this request", 403);
  }

  res.status(200).json(apiResponse(true, "Timeline retrieved", request));
});
