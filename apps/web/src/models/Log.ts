import { Schema, model, models, type InferSchemaType } from "mongoose";

export const LOG_LEVELS = ["info", "warning", "error"] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

const logSchema = new Schema(
  {
    tokenId: { type: Schema.Types.ObjectId, ref: "Token", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    key: { type: String, required: true, trim: true },
    level: { type: String, enum: LOG_LEVELS, required: true, default: "info" },
    message: { type: String, required: true },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

logSchema.index({ tokenId: 1, createdAt: -1 });

export type Log = InferSchemaType<typeof logSchema> & { _id: Schema.Types.ObjectId };

export const LogModel = models.Log ?? model("Log", logSchema);
