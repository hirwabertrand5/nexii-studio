import mongoose, { Schema, type HydratedDocument, type Types } from "mongoose";

export const PAYMENT_METHODS = [
  "card",
  "mobile-money",
  "paystack",
  "flutterwave",
  "bank-transfer"
] as const;

export const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;
export const ORDER_STATUSES = ["processing", "completed", "cancelled"] as const;
export const PAYMENT_GATEWAYS = ["paystack", "flutterwave", "mobile-money", "stripe", "paypal", "bank-transfer"] as const;
export const VERIFICATION_STATUSES = ["pending", "verified", "failed"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentGateway = (typeof PAYMENT_GATEWAYS)[number];
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export interface OrderPlanItem {
  plan: Types.ObjectId;
  title: string;
  price: number;
}

export interface OrderAttrs {
  user: Types.ObjectId;
  plans: OrderPlanItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  downloadAccess: boolean;
  transactionReference: string;
  paymentGateway?: PaymentGateway;
  paymentReference?: string;
  paymentDate?: Date;
  receiptUrl?: string;
  verificationStatus: VerificationStatus;
  currency: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type OrderDoc = HydratedDocument<OrderAttrs>;

const orderPlanItemSchema = new Schema<OrderPlanItem>(
  {
    plan: { type: Schema.Types.ObjectId, ref: "HousePlan", required: true },
    title: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const orderSchema = new Schema<OrderAttrs>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    plans: {
      type: [orderPlanItemSchema],
      required: true,
      validate: {
        validator(value: OrderPlanItem[]) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "Order must include at least one plan"
      }
    },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, required: true, enum: PAYMENT_METHODS, index: true },
    paymentStatus: { type: String, required: true, enum: PAYMENT_STATUSES, default: "pending", index: true },
    orderStatus: { type: String, required: true, enum: ORDER_STATUSES, default: "processing", index: true },
    downloadAccess: { type: Boolean, default: false, index: true },
    transactionReference: { type: String, required: true, unique: true, trim: true, index: true },
    paymentGateway: { type: String, enum: PAYMENT_GATEWAYS, index: true },
    paymentReference: { type: String, trim: true, index: true },
    paymentDate: { type: Date },
    receiptUrl: { type: String, trim: true },
    verificationStatus: { type: String, required: true, enum: VERIFICATION_STATUSES, default: "pending", index: true },
    currency: { type: String, required: true, uppercase: true, trim: true, default: "USD" }
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, orderStatus: 1, createdAt: -1 });
orderSchema.index({ paymentGateway: 1, verificationStatus: 1, createdAt: -1 });

export const Order = mongoose.model<OrderAttrs>("Order", orderSchema);
