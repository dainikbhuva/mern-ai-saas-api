import { Request, Response, NextFunction } from "express";
import { generateWithGemini } from "../services/geminiService.js";
import { generateWithOpenAI } from "../services/openaiService.js";
import { buildContentPrompt, ContentType } from "../services/contentPrompts.js";
import { callAI, getUserWithQuota, saveGeneration } from "../utils/aiHelpers.js";
import Generation from "../models/Generation.js";
import User from "../models/User.js";
import { AuthRequest } from "../middleware/authMiddleware.js";

const CONTENT_TYPES: ContentType[] = [
  "blog",
  "social_media",
  "product_description",
  "seo",
];

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

    const prompt = `Generate Google Ads marketing content for the following:
Product/Service: ${productDescription}
Target Audience: ${targetAudience}

Requirements:
- Create 3 variations of responsive search ads (Google Ads RSA format)
- Each ad must have exactly 3 Headlines (max 30 characters each)
- Each ad must have exactly 2 Descriptions (max 90 characters each)
- Include 8-12 relevant Google Ads keywords for this campaign
- Include 2-3 short marketing tips for running this ad campaign
- Make copy compelling, conversion-focused, and keyword-optimized

Return ONLY valid JSON (no markdown, no code fences) in this exact format:
{
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "marketingTips": ["tip 1", "tip 2"],
  "ads": [
    {
      "variation": 1,
      "headlines": ["Headline 1", "Headline 2", "Headline 3"],
      "descriptions": ["Description 1", "Description 2"],
      "keywords": ["ad-specific keyword 1", "ad-specific keyword 2"]
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

export const generateContent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: "NOT_AUTHENTICATED", message: "User not authenticated" },
      });
    }

    const {
      type,
      topic,
      tone,
      keywords,
      audience,
      platform,
      productName,
      features,
      provider = "gemini",
    } = req.body;

    if (!type || !CONTENT_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_TYPE",
          message: `type must be one of: ${CONTENT_TYPES.join(", ")}`,
        },
      });
    }

    const resolvedTopic = topic || productName;
    if (!resolvedTopic?.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "topic (or productName) is required",
        },
      });
    }

    const user = await getUserWithQuota(userId, res);
    if (!user) return;

    const input = {
      topic: resolvedTopic,
      tone,
      keywords,
      audience,
      platform,
      productName,
      features,
      provider,
    };

    const prompt = buildContentPrompt(type as ContentType, input);

    let generatedContent: string;
    try {
      generatedContent = await callAI(prompt, provider);
    } catch (error: any) {
      return res.status(503).json({
        success: false,
        error: {
          code: "AI_SERVICE_ERROR",
          message: error.message || "AI service error",
        },
      });
    }

    const generation = await saveGeneration(user, {
      userId,
      type,
      input,
      output: generatedContent,
      provider,
    });

    return res.json({
      success: true,
      data: {
        id: generation._id.toString(),
        type,
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
          input: g.input,
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
