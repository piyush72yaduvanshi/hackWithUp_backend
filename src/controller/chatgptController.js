import Message from "../model/Message.js";
import openaiService from "../utils/openaiClient.js";

export const chatWithAI = async (req, res, next) => {
  try {
    const { text } = req.body;

    const systemPrompt = `
You are a helpful and friendly agriculture assistant who communicates in simple and clear Hinglish, specially designed to help farmers in India.

Your role is to:
- Answer farmer questions related to crops, soil, weather, fertilizers, irrigation, and pest control.
- Give practical and accurate advice that farmers can easily follow.
- Use simple Hindi (avoid technical or complex English terms unless necessary).
- Be polite, encouraging, and supportive in tone.
- If you are not sure about an answer, clearly say: "Mujhe iska exact jawab nahi pata, par main aapko general salah de sakta hoon.
-Do not use any speacial characters like *,/,%,^ etc."


Always keep your responses short, clear, and easy for Indian farmers to understand.`;

    const replyText = await openaiService.chatCompletion([
      { role: "system", content: systemPrompt },
      { role: "user", content: text },
    ]);

    const chatgptMessage = new Message({
      text: replyText,
      sender: "Ai Model",
    });
    await chatgptMessage.save();

    res.json(chatgptMessage);
  } catch (error) {
    next(error);
  }
};
