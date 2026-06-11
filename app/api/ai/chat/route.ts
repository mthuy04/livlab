import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: Request) {
  try {
    const { message, history } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        reply: "Tính năng chat AI hiện đang bảo trì. Vui lòng thử công cụ Gợi ý AI theo ngân sách hoặc liên hệ Hotline để được hỗ trợ nhé." 
      });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemInstruction = `You are LivLab AI, a friendly and helpful assistant for LivLab - a bathroom visual commerce platform.
Your goals:
1. Answer basic questions about LivLab (what it is, how concept templates and hotspots work).
2. Guide users on how to use LivLab: tell them they can explore concepts, click hotspots to see products, or use the AI Suggestion tool to find a bundle matching their budget.
3. Recommend users to go to /ai-suggestion if they ask for product recommendations or budget fitting.
4. Recommend users to go to /quote if they want an official quotation.
5. Keep answers short, polite, and in Vietnamese. Do not hallucinate products or prices.`;

    // Format history for Gemini SDK
    // @google/genai format: [{ role: 'user' | 'model', parts: [{ text: "..." }] }]
    const formattedHistory = (history || []).map((msg: any) => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

    const chat = ai.chats.create({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    // If there is history, we send it all or use the SDK's chat session history feature
    // Actually, @google/genai chat.create accepts history
    const chatWithHistory = ai.chats.create({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      config: {
        systemInstruction,
        temperature: 0.7,
      },
      history: formattedHistory
    });

    const response = await chatWithHistory.sendMessage({ message });

    return NextResponse.json({ reply: response.text });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ reply: 'Xin lỗi, tôi đang quá tải. Vui lòng sử dụng các kênh liên hệ khác.' }, { status: 500 });
  }
}
