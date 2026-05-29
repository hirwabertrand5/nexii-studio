import mongoose, { Schema, type HydratedDocument, type Types } from "mongoose";
import { PAYMENT_GATEWAYS, PAYMENT_STATUSES, type PaymentGateway, type PaymentStatus } from "./Order.js";

export interface TransactionAttrs {
  user: Types.ObjectId;
  order: Types.ObjectId;
  gateway: PaymentGateway;
  reference: string;
  gatewayReference?: string;
  providerTransactionId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  authorizationUrl?: string;
  receiptUrl?: string;
  failureReason?: string;
  verifiedAt?: Date;
  rawGatewayResponse?: unknown;
}

export type TransactionDoc = HydratedDocument<TransactionAttrs>;

const transactionSchema = new Schema<TransactionAttrs>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    gateway: { type: String, required: true, enum: PAYMENT_GATEWAYS, index: true },
    reference: { type: String, required: true, unique: true, trim: true, index: true },
    gatewayReference: { type: String, trim: true, index: true },
    providerTransactionId: { type: String, trim: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, uppercase: true, trim: true },
    status: { type: String, required: true, enum: PAYMENT_STATUSES, default: "pending", index: true },
    authorizationUrl: { type: String, trim: true },
    receiptUrl: { type: String, trim: true },
    failureReason: { type: String, trim: true },
    verifiedAt: { type: Date },
    rawGatewayResponse: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ gateway: 1, status: 1, createdAt: -1 });
transactionSchema.index({ order: 1, gateway: 1 });

export const Transaction = mongoose.model<TransactionAttrs>("Transaction", transactionSchema);
