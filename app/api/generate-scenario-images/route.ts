import { NextResponse } from "next/server";

type ScenarioQuestion = {
  questionType?: "knowledge" | "scenario";
  scenarioTitle?: string;
  scenarioContext?: string;
  imagePrompt?: string;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const questions: ScenarioQuestion[] = body.questions || [];

    const apiKey = process.env.PEXELS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "PEXELS_API_KEY tapılmadı." },
        { status: 500 }
      );
    }

    const images: Record<string, string> = {};

    for (let index = 0; index < questions.length; index++) {
      const question = questions[index];

      const isScenario =
        question.questionType === "scenario" || index >= 7;

      if (!isScenario) continue;

      const query =
        question.scenarioTitle ||
        question.scenarioContext ||
        "professional workplace employee customer";

      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(
          query
        )}&per_page=1&orientation=landscape`,
        {
          headers: {
            Authorization: apiKey,
          },
        }
      );

      if (!response.ok) continue;

      const data = await response.json();

      const photo = data.photos?.[0];

      if (photo) {
        images[String(index)] =
          photo.src?.large2x ||
          photo.src?.large ||
          photo.src?.medium;
      }
    }

    return NextResponse.json({ images });
  } catch (error) {
    console.error("PEXELS ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Scenario şəkilləri tapılarkən xəta baş verdi.",
      },
      { status: 500 }
    );
  }
}