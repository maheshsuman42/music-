import { GoogleGenAI } from "@google/genai";
import { Product } from '../types';

let ai: GoogleGenAI | null = null;

try {
  if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
} catch (error) {
  console.error("Failed to initialize Gemini:", error);
}

export const generateProductDescription = async (name: string, category: string): Promise<string> => {
  if (!ai) return "Gemini API key is missing. Cannot generate description.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a compelling, professional e-commerce product description for a musical instrument. 
      Product Name: ${name}
      Category: ${category}
      Keep it under 100 words. Focus on tone, build quality, and player experience.`,
    });
    return response.text || "No description generated.";
  } catch (error) {
    console.error("Gemini Generate Error:", error);
    return "Failed to generate description.";
  }
};

export const getShopAssistantResponse = async (
  message: string, 
  history: {role: string, parts: string}[], 
  products: Product[]
): Promise<string> => {
  if (!ai) return "I'm sorry, I'm currently offline (API Key missing).";

  // Create a context string of available products for RAG-like behavior
  const inventoryContext = products.map(p => 
    `- ${p.name} (₹${p.price.toLocaleString('en-IN')}): ${p.description.substring(0, 50)}...`
  ).join('\n');

  const systemInstruction = `You are Melody, the AI sales assistant for MelodyMart. 
  You are helpful, knowledgeable about music, and friendly.
  
  Here is our current inventory:
  ${inventoryContext}
  
  Rules:
  1. Only recommend products from our inventory.
  2. If asked about something we don't have, politely suggest a similar item from inventory or say we don't carry it.
  3. Keep answers concise (under 3 sentences) unless asked for details.
  4. Use emojis occasionally 🎸 🎹.
  5. Prices are in Indian Rupees (₹).
  `;

  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction,
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.parts }]
      }))
    });

    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "I'm having trouble connecting to the server right now. Please try again later.";
  }
};