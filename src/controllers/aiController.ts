import { Request, Response, NextFunction } from "express";
import { generateWithGemini } from "../services/geminiService.js";
import { generateWithOpenAI } from "../services/openaiService.js";
import Generation from "../models/Generation.js";
import User from "../models/User.js";
import { AuthRequest } from "../middleware/authMiddleware.js";

export const generateGoogleAdsCopy = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res
        .status(401)
        .json({
          success: false,
          error: {
            code: "NOT_AUTHENTICATED",
            message: "User not authenticated",
          },
        });
    }

    const {
      productDescription,
      targetAudience,
      provider = "gemini",
    } = req.body;

    if (!productDescription || !targetAudience) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "productDescription and targetAudience are required",
        },
      });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({
          success: false,
          error: { code: "USER_NOT_FOUND", message: "User not found" },
        });
    }

    if (user.usedThisMonth >= user.monthlyQuota) {
      return res.status(429).json({
        success: false,
        error: {
          code: "QUOTA_EXCEEDED",
          message: `You have reached your monthly quota of ${user.monthlyQuota} generations`,
        },
      });
    }

    const prompt = `Generate 3 variations of responsive search ads (Google Ads format) for the following:
                    Product/Service: ${productDescription}
                    Target Audience: ${targetAudience}

                    Requirements:
                    - Each ad should have 3 Headlines (max 30 characters each)
                    - Each ad should have 2 Descriptions (max 90 characters each)
                    - Make them compelling and keyword-optimized
                    - Format as JSON with array of 3 ads

                    Return only valid JSON in this format:
                    {
                      "ads": [
                        {
                          "variation": 1,
                          "headlines": ["Headline 1", "Headline 2", "Headline 3"],
                          "descriptions": ["Description 1", "Description 2"]
                        }
                      ]
                    }`;

    let generatedContent: string;
    try {
      generatedContent = await (provider === "openai"
        ? generateWithOpenAI({ prompt })
        : generateWithGemini(prompt));
    } catch (error: any) {
      return res.status(503).json({
        success: false,
        error: {
          code: "AI_SERVICE_ERROR",
          message: error.message || "AI service error",
        },
      });
    }

    const generation = new Generation({
      userId,
      type: "ads",
      input: { productDescription, targetAudience, provider },
      output: generatedContent,
      provider,
      tokensUsed: 0,
    });
    await generation.save();

    user.usedThisMonth += 1;
    await user.save();

    return res.json({
      success: true,
      data: {
        id: generation._id.toString(),
        output: generatedContent,
        remainingQuota: user.monthlyQuota - user.usedThisMonth,
      },
    });
  } catch (err) {
    return next(err);
  }
};

export const getGenerationHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res
        .status(401)
        .json({
          success: false,
          error: {
            code: "NOT_AUTHENTICATED",
            message: "User not authenticated",
          },
        });
    }

    const generations = await Generation.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();

    return res.json({
      success: true,
      data: {
        generations: generations.map((g) => ({
          id: g._id.toString(),
          type: g.type,
          provider: g.provider,
          output: g.output,
          createdAt: g.createdAt,
        })),
      },
    });
  } catch (err) {
    return next(err);
  }
};

export const getUserQuota = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res
        .status(401)
        .json({
          success: false,
          error: {
            code: "NOT_AUTHENTICATED",
            message: "User not authenticated",
          },
        });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({
          success: false,
          error: { code: "USER_NOT_FOUND", message: "User not found" },
        });
    }

    return res.json({
      success: true,
      data: {
        plan: user.plan,
        monthlyQuota: user.monthlyQuota,
        usedThisMonth: user.usedThisMonth,
        remainingQuota: user.monthlyQuota - user.usedThisMonth,
      },
    });
  } catch (err) {
    return next(err);
  }
};
