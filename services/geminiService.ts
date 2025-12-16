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
  // New field for the educational/inclusive deeper analysis
  educationalInfo?: string; 
}

// 🔹 PROMPT BASE (SISTEMA)
const SYSTEM_PROMPT = `
Você é um consultor de imagem especializado em visagismo, colorimetria e comunicação visual pessoal, com foco na diversidade brasileira.

Sua função é analisar rostos, cores e estilo de forma respeitosa, clara e educativa.
Nunca use linguagem estética julgadora.
Sempre explique o motivo das recomendações.
Fale com tom humano, acessível e confiante.
Seu objetivo é ajudar a pessoa a se expressar melhor visualmente, não a mudar quem ela é.
`;

/**
 * Analyzes an uploaded user image using the Vizuhalizando Architecture (Prompts 1, 2, Extra).
 * Uses: gemini-3-pro-preview
 */
export const analyzeUserImage = async (base64Image: string): Promise<AnalysisResult> => {
  try {
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    // Combined Prompt: System + Visagism + Colorimetry + Personality
    const fullPrompt = `
    ${SYSTEM_PROMPT}

    TAREFA: Analise a imagem fornecida seguindo os passos abaixo.

    🔹 PASSO 1: VISAGISMO (ROSTO)
    Analise o rosto considerando: formato predominante, proporções faciais, linhas (retas, curvas ou mistas) e a impressão visual inicial transmitida.
    Explique como essas características influenciam a forma como a pessoa é percebida visualmente.
    Use linguagem simples e inclusiva.
    
    🔹 PASSO 2: COLORIMETRIA
    Identifique o tom e subtom de pele (quente, frio, neutro), contraste (alto, médio, baixo) e harmonia geral.
    Sugira uma paleta pessoal aproximada (ex: Inverno Brilhante, Verão Suave, Outono Profundo, Primavera Clara).
    Explique de forma didática por que essas cores funcionam.

    🔹 PASSO 3: PERSONALIDADE VISUAL
    Com base no conjunto, descreva a personalidade visual percebida, focando em possibilidades de expressão.

    SAÍDA ESPERADA (JSON):
    Retorne apenas um objeto JSON com:
    - season: (String) Nome da paleta sugerida.
    - faceShape: (String) Formato do rosto.
    - contrast: (String) "Baixo", "Médio" ou "Alto".
    - traits: (Array de Strings) 3 pontos fortes visuais (ex: "Linhas de autoridade", "Olhar acessível").
    - description: (String) Um parágrafo curto (max 40 palavras) que sintetiza a análise com tom de valorização da identidade. Ex: "Seu rosto comunica equilíbrio...".
    `;

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
          { text: fullPrompt }
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
    
    if (!result) {
       return {
         season: 'Inverno Brilhante',
         faceShape: 'Oval',
         contrast: 'Alto',
         traits: ['Expressão marcante', 'Linhas equilibradas', 'Alto contraste'],
         description: 'Sua imagem transmite uma naturalidade elegante que pode ser potencializada com cores intensas e linhas definidas.'
       };
    }

    return result as AnalysisResult;

  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
};

/**
 * Generates the specific fashion image.
 * Uses: gemini-3-pro-image-preview
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
          aspectRatio: aspectRatio,
          imageSize: resolution,
        }
      }
    });

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
 * PROMPT 3 — GERAÇÃO DE LOOK (TEXTO EXPLICATIVO)
 * Generates the "Why this works" explanation.
 */
export const generateLookExplanation = async (
  userProfile: Partial<AnalysisResult>,
  objective: string,
  objectiveDesc: string
): Promise<string> => {
  try {
    const prompt = `
    ${SYSTEM_PROMPT}

    CONTEXTO:
    Você acabou de sugerir um look para uma pessoa com as seguintes características:
    - Rosto: ${userProfile.faceShape}
    - Paleta: ${userProfile.season}
    - Contraste: ${userProfile.contrast}
    - Objetivo do Look: ${objective} (${objectiveDesc})

    TAREFA:
    Explique em 2 a 3 frases curtas por que essas escolhas (cores e modelagens implícitas para esse perfil) funcionam bem para ela.
    Use tom consultivo, não publicitário. Fale diretamente com ela ("Para você...").
    Destaque como o look valoriza o visagismo dela.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        maxOutputTokens: 100,
        temperature: 0.7
      }
    });

    return response.text || "Este look foi selecionado para harmonizar com seus traços naturais e comunicar seu objetivo com clareza.";
  } catch (error) {
    console.error("Error generating explanation:", error);
    return "Look personalizado para harmonizar com sua coloração pessoal e geometria facial.";
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
              mimeType: 'image/png',
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
};