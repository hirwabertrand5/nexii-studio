import type { Response } from "express";

export function apiResponse<T>(success: boolean, message: string, data?: T) {
  return {
    success,
    message,
    data: data ?? undefined
  };
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data
  });
}

export function sendMessage(res: Response, message: string, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message
  });
}
