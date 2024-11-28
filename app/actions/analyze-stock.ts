'use server'

import Anthropic from '@anthropic-ai/sdk';
import { AnalysisError } from '@/types/stock'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function analyzeStock(ticker: string) {
  try {
    const message = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: `Analyze the stock ${ticker} based on publicly available financial information. Provide a comprehensive analysis including:
1. Company Overview
2. Financial Health
3. Market Position
4. Risks and Opportunities
5. Future Outlook

Please structure your response in a clear, organized manner with these sections.`
        }
      ],
      temperature: 0.7,
    });

    return message.content[0].text;
  } catch (error) {
    console.error('Error analyzing stock:', error);
    throw new Error('Failed to analyze stock');
  }
}
