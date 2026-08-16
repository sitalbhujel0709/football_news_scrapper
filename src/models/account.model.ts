import mongoose, { Schema, Document } from "mongoose";

export interface IAccount extends Document {
  userId: mongoose.Types.ObjectId;
  provider: string; 
  passwordHash?: string; 
  providerAccountId?: string; 
  createdAt: Date;
  updatedAt: Date;
}

const accountSchema = new Schema<IAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      unique:true,
      required: true,
    },
    provider: {
      type: String,
      required: true,
      default: "local",
    },
    passwordHash: {
      type: String,
    },
    providerAccountId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Account = mongoose.model<IAccount>("Account", accountSchema);
