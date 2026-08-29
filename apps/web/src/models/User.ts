import { Schema, model, models, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true },
);

export type User = InferSchemaType<typeof userSchema> & { _id: Schema.Types.ObjectId };

export const UserModel = models.User ?? model("User", userSchema);
