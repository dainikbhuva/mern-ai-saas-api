export type ContentType = "blog" | "social_media" | "product_description" | "seo";

export interface ContentInput {
  topic: string;
  tone?: string;
  keywords?: string;
  audience?: string;
  platform?: string;
  productName?: string;
  features?: string;
}

export function buildContentPrompt(
  type: ContentType,
  input: ContentInput,
): string {
  const tone = input.tone || "professional";
  const keywords = input.keywords || "";
  const audience = input.audience || "general audience";

  switch (type) {
    case "blog":
      return `Write a complete blog post with the following details:
Topic: ${input.topic}
Tone: ${tone}
Target Audience: ${audience}
${keywords ? `Keywords to include: ${keywords}` : ""}

Requirements:
- Engaging title and meta description
- Introduction hook, 3-4 body sections with subheadings, and a conclusion
- SEO-friendly, readable, 400-600 words
- Include a call-to-action at the end

Return ONLY valid JSON (no markdown fences):
{
  "title": "Blog title",
  "metaDescription": "150 char meta description",
  "content": "Full blog post in markdown format with ## headings",
  "keywords": ["keyword1", "keyword2"],
  "wordCount": 500
}`;

    case "social_media":
      return `Create social media posts for the following:
Topic/Campaign: ${input.topic}
Platform: ${input.platform || "LinkedIn, Instagram, Twitter"}
Tone: ${tone}
Target Audience: ${audience}

Requirements:
- Create 3 unique posts tailored to the platform
- Include relevant hashtags for each post
- Keep within platform character limits
- Make posts engaging and shareable

Return ONLY valid JSON (no markdown fences):
{
  "platform": "${input.platform || "multi-platform"}",
  "posts": [
    {
      "number": 1,
      "text": "Post content here",
      "hashtags": ["#tag1", "#tag2"],
      "characterCount": 280
    }
  ]
}`;

    case "product_description":
      return `Write compelling product descriptions for:
Product Name: ${input.productName || input.topic}
Key Features: ${input.features || input.topic}
Target Audience: ${audience}
Tone: ${tone}
${keywords ? `Keywords: ${keywords}` : ""}

Requirements:
- Short tagline (under 80 chars)
- Short description (2-3 sentences)
- Long description (detailed, benefit-focused)
- 5-7 bullet points highlighting features/benefits

Return ONLY valid JSON (no markdown fences):
{
  "productName": "Product name",
  "tagline": "Short tagline",
  "shortDescription": "Brief description",
  "longDescription": "Detailed description paragraph",
  "bulletPoints": ["Feature 1", "Feature 2"],
  "keywords": ["keyword1", "keyword2"]
}`;

    case "seo":
      return `Create SEO-optimized content for:
Topic/Keyword Focus: ${input.topic}
Target Keywords: ${keywords || input.topic}
Target Audience: ${audience}
Tone: ${tone}

Requirements:
- SEO title (50-60 chars)
- Meta description (150-160 chars)
- H1 heading
- Full SEO article (300-500 words) with H2 subheadings
- List of 8-12 target keywords
- 3 SEO tips for this content

Return ONLY valid JSON (no markdown fences):
{
  "seoTitle": "SEO optimized title",
  "metaDescription": "Meta description",
  "h1": "Main heading",
  "content": "Full article in markdown with ## subheadings",
  "keywords": ["keyword1", "keyword2"],
  "seoTips": ["tip 1", "tip 2"]
}`;

    default:
      throw new Error(`Unknown content type: ${type}`);
  }
}
