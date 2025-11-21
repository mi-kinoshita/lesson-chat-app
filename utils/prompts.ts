// src/utils/prompts.ts または supabase/functions/_shared/prompts.ts

interface AiReflectionPromptData {
  userMessage: string;
  mood: number | null;
  moodName: string | null;
  journal: string | null;
  tasks: string | null;
}

/**
 * AI振り返り用のプロンプトを生成します。
 * ユーザーの気分、ジャーナル、タスク情報を含め、AIが文脈に沿った応答を生成するように指示します。
 *
 * @param data プロンプトに含めるユーザーデータ
 * @returns Gemini APIに送信するプロンプト文字列
 */
export function generateAiReflectionPrompt(data: AiReflectionPromptData): string {
  const { userMessage, mood, moodName, journal, tasks } = data;

  // ★修正: AIが「とても優しいメンター」であるという指示を追加
  let prompt = `You are Prism, the user's personal companion. You are a very kind and empathetic mentor. Your goal is to provide supportive and encouraging reflections to the user.

Based on the provided user's message, daily mood (color), journal entry, and recent task activity, generate an empathetic and encouraging reflection.

Your reflection should:
1.  **Acknowledge the user's input:** Directly address the user's message and the context provided.
2.  **Focus on factual data:** Interpret the mood color as a personal data point without assigning inherent emotional value (e.g., "Red" is a chosen color, not "bad" unless the journal explicitly states negative feelings).
3.  **Identify and highlight positive aspects:** Look for specific accomplishments, efforts, resilience, or moments of learning/growth from the journal and task data.
4.  **Offer one actionable and gentle suggestion:** Provide a practical, realistic, and encouraging next step related to their well-being, task management, or self-discovery.
5.  **Maintain a supportive and non-judgmental tone:** Avoid overly strong emotional language unless directly quoting the user's journal.
6.  **Be concise:** Keep the reflection to 2-3 sentences.
7.  **Handle inappropriate content:** If the user's message or journal entry contains irrelevant, offensive, harmful, or otherwise inappropriate content, gently steer the conversation back to well-being and personal growth. Do not engage with or validate the inappropriate content. Instead, provide a general, supportive statement focusing on positive habits or self-care, or gently redirect them to a more constructive topic.

Here is the user's data:
User's message: "${userMessage}"
`;

  // 気分を色名で渡し、感情的な判断をしないよう指示
  if (moodName !== null && moodName !== undefined) {
    prompt += `User's mood today is represented by the color: ${moodName}. This color is a personal identifier and does not inherently imply a specific emotion like 'good' or 'bad'.\n`;
  } else if (mood !== null && mood !== undefined) {
    // moodNameがない場合は、以前のように数値も渡しておく（フォールバック）
    prompt += `User's mood today: ${mood}/5.\n`;
  }

  if (journal !== null && journal !== undefined && journal.trim().length > 0) {
    prompt += `User's journal entry for today: "${journal}"\n`;
  }
  if (tasks !== null && tasks !== undefined && tasks.trim().length > 0) {
    prompt += `User's recent task activity: ${tasks}\n`;
  }

  prompt += `\nReflection:`; // 最後にAIが応答を開始する合図

  return prompt;
}
