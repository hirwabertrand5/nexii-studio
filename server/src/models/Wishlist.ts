import mongoose, { Schema, type HydratedDocument, type Types } from "mongoose";

export interface WishlistAttrs {
  user: Types.ObjectId;
  plans: Types.ObjectId[];
}

export type WishlistDoc = HydratedDocument<WishlistAttrs>;

const wishlistSchema = new Schema<WishlistAttrs>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    plans: [{ type: Schema.Types.ObjectId, ref: "HousePlan" }]
  },
  { timestamps: true }
);

export const Wishlist = mongoose.model<WishlistAttrs>("Wishlist", wishlistSchema);
