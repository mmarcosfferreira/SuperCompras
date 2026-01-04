import { GoogleGenAI } from "@google/genai";
import { CATEGORIES, CategoryType } from "../types";

let ai: GoogleGenAI | null = null;

try {
  // Safe initialization to prevent browser crashes if process is undefined
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  } else {
    console.warn("Gemini API Key is missing or process.env is unavailable.");
  }
} catch (error) {
  console.error("Error initializing Gemini client:", error);
}

export const categorizeItemWithAI = async (itemName: string): Promise<CategoryType | null> => {
  if (!ai) return null;

  try {
    const categoriesString = CATEGORIES.join(", ");
    const prompt = `
      Você é um assistente de lista de compras. 
      Classifique o item: "${itemName}" em UMA das seguintes categorias exatas: ${categoriesString}.
      Responda APENAS com o nome da categoria. Se não tiver certeza, responda "Outros".
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    const text = response.text?.trim();
    
    // Validate if the response is actually a valid category
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
    console.warn("AI service not initialized (Check API Key)");
    return null;
  }

  try {
    // Clean base64 string if it contains the header
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Switched to Flash which supports Vision (Multimodal)
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: `Analise esta imagem de um produto ou prateleira de supermercado. 
            Identifique o NOME principal do produto e o PREÇO visível na etiqueta ou embalagem.
            
            Retorne APENAS um objeto JSON com o seguinte formato, sem markdown:
            { "name": "Nome do Produto", "price": 10.50 }
            
            Se não encontrar preço, envie null no campo price. Se não conseguir identificar nada, retorne null.`
          }
        ]
      },
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) return null;

    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    return null;
  }
};