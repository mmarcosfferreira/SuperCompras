import { GoogleGenAI } from "@google/genai";
import { CATEGORIES, CategoryType } from "../types";

// Helper to get API Key from various environments (Vite, CRA, Next.js, etc.)
const getApiKey = (): string | undefined => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_API_KEY;
  }
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.API_KEY) return process.env.API_KEY;
    if (process.env.REACT_APP_API_KEY) return process.env.REACT_APP_API_KEY;
  }
  return undefined;
};

let ai: GoogleGenAI | null = null;
const apiKey = getApiKey();

if (apiKey) {
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (error) {
    console.error("Error initializing Gemini client:", error);
  }
} else {
  console.warn("Gemini API Key missing. Please check your environment variables (VITE_API_KEY or API_KEY).");
}

export const categorizeItemWithAI = async (itemName: string): Promise<CategoryType | null> => {
  if (!ai) return null;

  try {
    const categoriesString = CATEGORIES.join(", ");
    const prompt = `
      Classifique o item: "${itemName}" em UMA destas categorias: ${categoriesString}.
      Responda APENAS com a categoria. Padrão: "Outros".
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    const text = response.text?.trim();
    
    if (text && CATEGORIES.includes(text as CategoryType)) {
      return text as CategoryType;
    }
    return "Outros";
  } catch (error) {
    console.error("Gemini Categorization Error:", error);
    return null;
  }
};

export const identifyProductFromImage = async (base64Image: string): Promise<{ name: string; price?: number } | null> => {
  if (!ai) {
    console.error("AI service not initialized. Missing API Key.");
    throw new Error("API Key não configurada");
  }

  try {
    // Clean base64 string
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Flash is faster and supports multimodal
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: `Identifique o produto nesta imagem e o preço se visível.
            Retorne APENAS um JSON puro (sem markdown, sem crases) neste formato:
            { "name": "Nome curto do produto", "price": 0.00 }
            Se não houver preço, use null. Se não identificar produto, use null.`
          }
        ]
      },
      config: {
        responseMimeType: 'application/json'
      }
    });

    let text = response.text;
    if (!text) return null;

    // Sanitize JSON (Remove markdown code blocks if present)
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const result = JSON.parse(text);
    
    // Fallback validation
    if (!result.name) return null;
    
    return {
      name: result.name,
      price: typeof result.price === 'number' ? result.price : undefined
    };

  } catch (error) {
    console.error("Gemini Vision Error:", error);
    return null;
  }
};