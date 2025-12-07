import { env } from '../config/env';
import { InternalServerError, BadRequestError, UnauthorizedError } from '../utils/custom-errors';
import { logger } from '../utils/logger';

class AiService {
  private readonly KOLOSAL_API_MODEL = "Qwen 3 30BA3B";
  private readonly MAX_TOKENS = 1000;
  private readonly SYSTEM_PROMPT = 'Kamu adalah asisten AI yang sangat terspesialisasi dalam membantu UMKM untuk mengembangkan bisnis mereka di Indonesia. Jawab dengan bahasa Indonesia dan berikan saran yang praktis serta relevan dengan konteks lokal. Gunakan cara menjawab menggunakan poin-poin dan maksimal 150 kata. Target audiens kamu adalah ibu-ibu yang menjual barang mereka lewat whatsapp story. Kamu harus dapat menjawab pertanyaan basic seperti cara promosi, tips penjualan, ide produk, dan strategi pemasaran digital sederhana.';

  async chat(userMessage: string, context?: any[]): Promise<any> {
    if (!env.kolosal.apiKey) {
        logger.error('Kolosal API key is missing');
        throw new InternalServerError('AI service is not configured. Please set KOLOSAL_API_KEY in .env');
    }

    try {
      // Construct messages: System -> Context (History) -> User
      const messages: any[] = [
        {
          "role": "system",
          "content": this.SYSTEM_PROMPT
        }
      ];

      if (context && Array.isArray(context)) {
          messages.push(...context);
      }

      messages.push({
        "role": "user",
        "content": userMessage
      });

      const response = await fetch(env.kolosal.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.kolosal.apiKey}`
        },
        body: JSON.stringify({
          max_tokens: this.MAX_TOKENS,
          messages: messages,
          model: this.KOLOSAL_API_MODEL,
        })
      });

      const responseBody = await response.json();

      if (!response.ok) {
        logger.error('Kolosal API error response', { status: response.status, body: responseBody });
        
        let errorMessage = 'AI Service Error';

        if (response.status === 400 && responseBody.error?.message) {
            errorMessage = responseBody.error.message;
            throw new BadRequestError(`AI Service Error: ${errorMessage}`);
        } else if (response.status === 401 && responseBody.message) {
            errorMessage = responseBody.message;
            throw new UnauthorizedError(`AI Service Error: ${errorMessage}. Check KOLOSAL_API_KEY.`);
        } else if (response.status === 500 && responseBody.error?.message) {
            errorMessage = responseBody.error.message;
            throw new InternalServerError(`AI Service Error: ${errorMessage}`);
        } else {
            throw new InternalServerError(`AI Service Error: ${response.status} - ${JSON.stringify(responseBody)}`);
        }
      }

      // Successful response
      if (responseBody.choices && responseBody.choices.length > 0 && responseBody.choices[0].message?.content) {
        return responseBody.choices[0].message.content;
      } else {
        logger.warn('Kolosal API response missing expected content', { body: responseBody });
        throw new InternalServerError('AI Service: No content in response');
      }

    } catch (error) {
        if (error instanceof BadRequestError || error instanceof UnauthorizedError || error instanceof InternalServerError) {
            throw error; // Re-throw our custom errors
        }
        logger.error('Failed to communicate with AI service', error);
        throw new InternalServerError('Failed to process AI request due to network or unexpected error.');
    }
  }
}

export const aiService = new AiService();
