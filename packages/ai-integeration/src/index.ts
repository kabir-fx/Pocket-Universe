import { getGeminiModel } from "./gemini_client";

export interface CategorizationResult {
    suggestedFolder: string;
    confidence: number;
    alternatives: string[];
    reasoning: string;
}

export interface ContentAnalysis {
    content: string;
    userId: string;
    existingFolders: string[];
    userCorrections?: Array<{
        originalContent: string;
        suggestedFolder: string;
        acceptedFolder: string
    }>;
}

function buildCategorizationPrompt(analysis: ContentAnalysis): string {
    const { content, existingFolders, userCorrections } = analysis;
    let prompt = `Analyze this content and suggest the most appropriate category/folder name for organizing it.

Content to categorize: "${content}"

`;
    if (existingFolders && existingFolders.length > 0) {
        prompt += `Refer these existing categories/folders for more context: ${existingFolders.join(', ')}

`;
    }
    if (userCorrections && userCorrections.length > 0) {
        prompt += `User's past corrections (learn from these patterns):
${userCorrections.map(c =>
            `"${c.originalContent.substring(0, 50)}..." → suggested: "${c.suggestedFolder}" → user chose: "${c.acceptedFolder}"`
        ).join('\n')}

`;
    }

    // Require a compact JSON object
    prompt += `Return ONLY a compact JSON object with exactly these keys and types:
{
  "category": string,
  "confidence": number,  // 0..1
  "reasoning": string,
  "alternatives": string[]
}
No extra text, no code fences.`;

    return prompt;
}

function parseJsonResponse(text: string): CategorizationResult {
    let parsed: any;
    try {
        parsed = JSON.parse(text);
    } catch (e) {
        // Strip code fences if any slipped through
        const cleaned = text.replace(/```json[\r\n]?/gi, '').replace(/```[\r\n]?/g, '').trim();
        parsed = JSON.parse(cleaned);
    }

    if (typeof parsed !== 'object' || parsed === null) throw new Error('Response is not a JSON object');
    const { category, confidence, reasoning, alternatives } = parsed as Record<string, unknown>;
    if (typeof category !== 'string' || category.trim() === '') throw new Error('Invalid category');
    if (typeof confidence !== 'number' || !(confidence >= 0 && confidence <= 1)) throw new Error('Invalid confidence');
    if (typeof reasoning !== 'string') throw new Error('Invalid reasoning');
    if (alternatives !== undefined && !Array.isArray(alternatives)) throw new Error('Invalid alternatives');

    return {
        suggestedFolder: category.trim(),
        confidence,
        alternatives: Array.isArray(alternatives) ? alternatives.filter(x => typeof x === 'string') : [],
        reasoning,
    };
}

export async function categorizeContent(analysis: ContentAnalysis) {
    const model = getGeminiModel();
    const prompt = buildCategorizationPrompt(analysis);

    // Use content parts per official SDK docs to avoid accidental formatting issues
    const result = await model.generateContent([
        { text: prompt }
    ]);
    const responseText = await result.response.text();
    const candidates = (result.response as any).candidates ?? [];
    const finish = candidates[0]?.finishReason;
    const safety = candidates[0]?.safetyRatings;
    if (process.env.NODE_ENV !== 'production') {
        const preview = responseText.slice(0, 500);
        console.log('[AI] Gemini raw response preview:', preview);
        console.log('[AI] finishReason:', finish, 'safety:', JSON.stringify(safety));
        console.log('[AI] candidates:', JSON.stringify(candidates, null, 2));
    }
    if (!responseText || responseText.trim().length === 0) {
        throw new Error(`Empty response from model. finishReason=${String(finish)} safety=${JSON.stringify(safety)}`);
    }
    // Strictly parse model output as JSON
    return parseJsonResponse(responseText);
}