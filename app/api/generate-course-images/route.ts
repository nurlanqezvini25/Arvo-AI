import { NextResponse } from "next/server";

type CourseModule = {
  id: string;
  title: string;
  summary?: string;
  imageSearchQuery?: string;
};

export async function POST(request: Request) {
  try {
    const apiKey = process.env.PEXELS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "PEXELS_API_KEY tapılmadı." },
        { status: 500 }
      );
    }

    const body = await request.json();

    const modules: CourseModule[] = body.modules || [];

    if (!Array.isArray(modules)) {
      return NextResponse.json(
        { error: "Modullar tapılmadı." },
        { status: 400 }
      );
    }

    const images: Record<string, string> = {};

    for (const module of modules) {
      const query =
        module.imageSearchQuery ||
        "professional workplace training";

      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(
          query
        )}&per_page=3&orientation=landscape`,
        {
          headers: {
            Authorization: apiKey,
          },
        }
      );

      if (!response.ok) {
        continue;
      }

      const data = await response.json();

      const photo = data.photos?.[0];

      if (photo) {
        images[module.id] =
          photo.src?.large2x ||
          photo.src?.large ||
          photo.src?.medium;
      }
    }

    return NextResponse.json({ images });
  } catch (error) {
    console.error("COURSE IMAGE ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Modul şəkilləri tapılarkən xəta baş verdi.",
      },
      { status: 500 }
    );
  }
}