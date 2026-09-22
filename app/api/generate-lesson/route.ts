import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function cleanAndParse(text: string) {
  let cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("AI düzgün JSON qaytarmadı.");
  }

  cleaned = cleaned.slice(firstBrace, lastBrace + 1);

  return JSON.parse(cleaned);
}

export async function POST(request: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY tapılmadı." },
        { status: 500 }
      );
    }

    const body = await request.json();

    const {
      title,
      objective,
      sourceFacts,
      moduleTitle,
      language = "az",
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Dərs başlığı tapılmadı." },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(sourceFacts) ||
      sourceFacts.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Bu dərs üçün sourceFacts yoxdur. PDF-i yenidən analiz et.",
        },
        { status: 400 }
      );
    }

    const languages: Record<string, string> = {
      az: "Azerbaijani",
      en: "English",
      ru: "Russian",
    };

    const outputLanguage =
      languages[language] || "Azerbaijani";

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2600,
      temperature: 0.2,

      messages: [
        {
          role: "user",
          content: `
You are the AI Lesson Builder of Praktik AI.

Language:
${outputLanguage}

Module:
${moduleTitle || "Training Module"}

Lesson:
${title}

Objective:
${objective || ""}

Source facts:

${sourceFacts
  .map(
    (fact: string, index: number) =>
      `${index + 1}. ${fact}`
  )
  .join("\n")}

Use ONLY these source facts as the factual basis.

Do not invent company policies, numbers, procedures or rules.

Create:

- introduction
- 2 to 4 teaching sections
- keyPoints
- workplaceExample
- remember
- exactly 2 miniQuiz questions

Each miniQuiz question must have exactly 4 options and one correct answer.

Return ONLY valid JSON.

{
  "introduction": "string",
  "sections": [
    {
      "heading": "string",
      "body": "string"
    }
  ],
  "keyPoints": [
    "string"
  ],
  "workplaceExample": "string",
  "remember": "string",
  "miniQuiz": [
    {
      "question": "string",
      "options": [
        "option A",
        "option B",
        "option C",
        "option D"
      ],
      "correctIndex": 0,
      "explanation": "string"
    }
  ]
}
`,
        },
      ],
    });

    const block = response.content.find(
      (item) => item.type === "text"
    );

    if (!block || block.type !== "text") {
      throw new Error("AI dərs materialı qaytarmadı.");
    }

    const result = cleanAndParse(block.text);

    return NextResponse.json(result);
  } catch (error) {
    console.error("GENERATE LESSON ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Dərs yaradılarkən xəta baş verdi.",
      },
      { status: 500 }
    );
  }
}