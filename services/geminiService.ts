import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Gemini Client
// IMPORTANT: process.env.API_KEY is automatically injected by the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface AnalysisResult {
  season: string;
  faceShape: string;
  contrast: 'Baixo' | 'Médio' | 'Alto';
  traits: string[];
  description: string;
}

/**
 * Analyzes an uploaded user image to determine personal coloring, face shape, and contrast.
 * Uses: gemini-3-pro-preview
 */
export const analyzeUserImage = async (base64Image: string): Promise<AnalysisResult> => {
  try {
    // Strip header if present
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: `Analyze this person's face for a personal image consultation. 
            Return a JSON object with:
            - season: (String) Suggested color season (e.g., "Inverno Brilhante", "Verão Suave", "Outono Profundo", "Primavera Clara").
            - faceShape: (String) Face shape (e.g., Oval, Square, Round).
            - contrast: (String) "Baixo", "Médio", or "Alto".
            - traits: (Array of Strings) 3 distinctive facial features.
            - description: (String) A polite, professional summary of their features in Portuguese.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            season: { type: Type.STRING },
            faceShape: { type: Type.STRING },
            contrast: { type: Type.STRING },
            traits: { type: Type.ARRAY, items: { type: Type.STRING } },
            description: { type: Type.STRING }
          }
        }
      }
    });

    const result = response.text ? JSON.parse(response.text) : null;
    
    // Fallback if parsing fails or returns null
    if (!result) {
       return {
         season: 'Inverno Brilhante',
         faceShape: 'Oval',
         contrast: 'Alto',
         traits: ['Traços marcantes'],
         description: 'Não foi possível analisar detalhadamente, usando perfil padrão.'
       };
    }

    return result as AnalysisResult;

  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
};

/**
 * Generates a high-quality fashion image based on the user's season/context.
 * Uses: gemini-3-pro-image-preview
 * Supports: Resolution (1K, 2K, 4K) and Aspect Ratio.
 */
export const generateFashionLook = async (
  prompt: string, 
  aspectRatio: string = "3:4", 
  resolution: string = "1K"
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio, // "1:1", "3:4", "4:3", "9:16", "16:9"
          imageSize: resolution,    // "1K", "2K", "4K"
        }
      }
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Error generating look:", error);
    throw error;
  }
};

/**
 * Edits an existing image based on a text prompt.
 * Uses: gemini-2.5-flash-image
 */
export const editFashionImage = async (
  base64Image: string,
  prompt: string
): Promise<string> => {
  try {
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png', // Assuming PNG for generated/converted images
              data: cleanBase64
            }
          },
          { text: prompt }
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No edited image generated");
  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
};

/**
 * Provides fashion advice using Search Grounding or Maps Grounding.
 * Uses: gemini-2.5-flash
 */
export const getFashionAdvice = async (
  query: string,
  type: 'search' | 'maps',
  userLocation?: { lat: number, lng: number }
): Promise<{ text: string; chunks: any[] }> => {
  try {
    const tools = [];
    let toolConfig = undefined;

    if (type === 'search') {
      tools.push({ googleSearch: {} });
    } else if (type === 'maps') {
      tools.push({ googleMaps: {} });
      if (userLocation) {
        toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: userLocation.lat,
              longitude: userLocation.lng
            }
          }
        };
      }
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        tools: tools,
        toolConfig: toolConfig
      }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    return {
      text: response.text || "Desculpe, não consegui encontrar essa informação.",
      chunks: groundingChunks
    };

  } catch (error) {
    console.error("Error getting advice:", error);
    return { text: "Erro ao conectar com o assistente.", chunks: [] };
  }

/**
 * Generates a fashion look mockup using the user's actual face photo.
 * This combines the user's selfie with clothing/environment generation.
 * Uses: gemini-3-pro-image-preview with image reference
 */
export const generateLookWithUserFace = async (
  userFaceBase64: string,
  lookPrompt: string,
  aspectRatio: string = "3:4",
  resolution: string = "1K"
): Promise<string> => {
  try {
    const cleanBase64 = userFaceBase64.split(',')[1] || userFaceBase64;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          { 
            text: `Using the person's face in the provided image, generate a realistic full-body fashion photo with the following specifications:
            
${lookPrompt}

IMPORTANT: 
- Keep the person's facial features, skin tone, and hair from the reference image
- Show them wearing the described outfit in a full-body composition
- Maintain photorealistic quality and natural lighting
- Ensure the face matches the reference photo provided` 
          }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: resolution
        }
      }
    });

    // Extract generated image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image generated with user face");
  } catch (error) {
    console.error("Error generating look with user face:", error);
    throw error;
  }
};
};
