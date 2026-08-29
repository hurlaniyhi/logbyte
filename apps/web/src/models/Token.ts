import { Schema, model, models, type InferSchemaType } from "mongoose";

const tokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    alias: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

export type Token = InferSchemaType<typeof tokenSchema> & { _id: Schema.Types.ObjectId };

export const TokenModel = models.Token ?? model("Token", tokenSchema);
