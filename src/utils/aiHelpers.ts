import { Response } from "express";
import { generateWithGemini } from "../services/geminiService.js";
import { generateWithOpenAI } from "../services/openaiService.js";
import Generation from "../models/Generation.js";
import User, { IUser } from "../models/User.js";

export async function getUserWithQuota(
  userId: string,
  res: Response,
): Promise<IUser | null> {
  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({
      success: false,
      error: { code: "USER_NOT_FOUND", message: "User not found" },
    });
    return null;
  }

  if (user.usedThisMonth >= user.monthlyQuota) {
    res.status(429).json({
      success: false,
      error: {
        code: "QUOTA_EXCEEDED",
        message: `You have reached your monthly quota of ${user.monthlyQuota} generations`,
      },
    });
    return null;
  }

  return user;
}

export async function callAI(
  prompt: string,
  provider: string,
): Promise<string> {
  if (provider === "openai") {
    return generateWithOpenAI({ prompt, maxTokens: 2048 });
  }
  return generateWithGemini(prompt);
}

export async function saveGeneration(
  user: IUser,
  data: {
    userId: string;
    type: string;
    input: Record<string, unknown>;
    output: string;
    provider: string;
  },
) {
  const generation = new Generation({
    userId: data.userId,
    type: data.type,
    input: data.input,
    output: data.output,
    provider: data.provider,
    tokensUsed: 0,
  });
  await generation.save();

  user.usedThisMonth += 1;
  await user.save();

  return generation;
}
