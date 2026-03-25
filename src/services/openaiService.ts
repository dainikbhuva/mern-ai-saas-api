export interface OpenAIGenerateOptions {
  prompt: string
  maxTokens?: number
}

export async function generateWithOpenAI(options: OpenAIGenerateOptions): Promise<string> {
  const { prompt, maxTokens = 1024 } = options
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set')
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No content generated from OpenAI API')
    }

    return content
  } catch (error: any) {
    throw new Error(`OpenAI generation failed: ${error.message}`)
  }
}
