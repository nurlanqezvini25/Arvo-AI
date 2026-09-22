import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type Question = {
  questionType: "knowledge" | "scenario";
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  difficulty?: "easy" | "medium" | "hard";
  skill?: string;
  scenarioTitle?: string;
  scenarioContext?: string;
  imageSearchQuery?: string;
};

export async function POST(request: Request) {
  try {
    // ==========================================
    // 1. AUTH TOKEN
    // ==========================================

    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error: "Authorization token tapılmadı.",
        },
        { status: 401 }
      );
    }

    const accessToken = authHeader
      .replace("Bearer ", "")
      .trim();

    // ==========================================
    // 2. SUPABASE CLIENT
    // ==========================================

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }
    );

    // ==========================================
    // 3. USER VALIDATION
    // ==========================================

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      console.error("AUTH ERROR:", userError);

      return NextResponse.json(
        {
          error: "İstifadəçi təsdiqlənmədi.",
        },
        { status: 401 }
      );
    }

    // ==========================================
    // 4. ADMIN CLIENT
    // ==========================================

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }
    );

    // ==========================================
    // 5. PROFILE
    // ==========================================

    const {
      data: profile,
      error: profileError,
    } = await admin
      .from("profiles")
      .select("id, company_id, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error(
        "PROFILE ERROR:",
        profileError
      );

      return NextResponse.json(
        {
          error: "İstifadəçi profili tapılmadı.",
        },
        { status: 404 }
      );
    }

    if (profile.role !== "employee") {
      return NextResponse.json(
        {
          error:
            "Yalnız employee imtahan nəticəsi göndərə bilər.",
        },
        { status: 403 }
      );
    }

    // ==========================================
    // 6. REQUEST BODY
    // ==========================================

    const body = await request.json();

    const questions =
      body.questions as Question[];

    const answers =
      body.answers as Array<
        number | null
      >;

    const courseId =
      body.courseId ||
      body.course_id ||
      null;

    if (!courseId) {
      return NextResponse.json(
        {
          error:
            "courseId tapılmadı. İmtahan kurs ID-si ilə açılmalıdır.",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(questions)) {
      return NextResponse.json(
        {
          error: "questions düzgün göndərilməyib.",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(answers)) {
      return NextResponse.json(
        {
          error: "answers düzgün göndərilməyib.",
        },
        { status: 400 }
      );
    }

    if (questions.length === 0) {
      return NextResponse.json(
        {
          error: "İmtahan sualları boşdur.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 7. RESULT CALCULATION
    // ==========================================

    let totalCorrect = 0;

    let knowledgeCorrect = 0;
    let knowledgeTotal = 0;

    let scenarioCorrect = 0;
    let scenarioTotal = 0;

    const skillMap = new Map<
      string,
      {
        correct: number;
        total: number;
      }
    >();

    questions.forEach(
      (question, index) => {
        const answer = answers[index];

        const isCorrect =
          answer !== null &&
          answer !== undefined &&
          answer === question.correctIndex;

        if (isCorrect) {
          totalCorrect++;
        }

        // ------------------------------
        // KNOWLEDGE
        // ------------------------------

        if (
          question.questionType ===
          "knowledge"
        ) {
          knowledgeTotal++;

          if (isCorrect) {
            knowledgeCorrect++;
          }
        }

        // ------------------------------
        // SCENARIO
        // ------------------------------

        if (
          question.questionType ===
          "scenario"
        ) {
          scenarioTotal++;

          if (isCorrect) {
            scenarioCorrect++;
          }
        }

        // ------------------------------
        // SKILL
        // ------------------------------

        const skill =
          question.skill?.trim() ||
          "General";

        const current =
          skillMap.get(skill) || {
            correct: 0,
            total: 0,
          };

        current.total++;

        if (isCorrect) {
          current.correct++;
        }

        skillMap.set(
          skill,
          current
        );
      }
    );

    function percent(
      correct: number,
      total: number
    ) {
      if (total === 0) {
        return 0;
      }

      return Math.round(
        (correct / total) * 100
      );
    }

    const score = percent(
      totalCorrect,
      questions.length
    );

    const knowledgeScore = percent(
      knowledgeCorrect,
      knowledgeTotal
    );

    const scenarioScore = percent(
      scenarioCorrect,
      scenarioTotal
    );

    // ==========================================
    // 8. READY / RETRAINING
    // ==========================================

    const ready =
      score >= 80 &&
      knowledgeScore >= 70 &&
      scenarioScore >= 70;

    // ==========================================
    // 9. SAVE EXAM RESULT
    // ==========================================

    const {
      data: examResult,
      error: examError,
    } = await admin
      .from("exam_results")
      .insert({
        company_id:
          profile.company_id,

        employee_id:
          user.id,

        course_id:
          courseId,

        score,

        knowledge_score:
          knowledgeScore,

        scenario_score:
          scenarioScore,

        ready,

        total_questions:
          questions.length,

        correct_answers:
          totalCorrect,
      })
      .select()
      .single();

    if (examError) {
      console.error(
        "EXAM RESULT INSERT ERROR:",
        examError
      );

      return NextResponse.json(
        {
          error:
            "İmtahan nəticəsi database-ə yazılmadı.",
          details:
            examError.message,
          code:
            examError.code,
        },
        { status: 500 }
      );
    }

    // ==========================================
    // 10. SAVE SKILL SCORES
    // ==========================================

    const skillResults =
      Array.from(
        skillMap.entries()
      ).map(
        ([skill, value]) => ({
          skill,
          correct:
            value.correct,
          total:
            value.total,
          score: percent(
            value.correct,
            value.total
          ),
        })
      );

    for (const skill of skillResults) {
      const { error: skillError } =
        await admin
          .from("skill_scores")
          .upsert(
            {
              employee_id:
                user.id,

              company_id:
                profile.company_id,

              course_id:
                courseId,

              skill_name:
                skill.skill,

              score:
                skill.score,
            },
            {
              onConflict:
                "employee_id,course_id,skill_name",
            }
          );

      if (skillError) {
        console.error(
          "SKILL SAVE ERROR:",
          skillError
        );
      }
    }

    // ==========================================
    // 11. UPDATE ASSIGNMENT
    // ==========================================

    const {
      error: assignmentError,
    } = await admin
      .from("course_assignments")
      .update({
        progress: 100,
      })
      .eq(
        "employee_id",
        user.id
      )
      .eq(
        "course_id",
        courseId
      );

    if (assignmentError) {
      console.error(
        "ASSIGNMENT UPDATE ERROR:",
        assignmentError
      );
    }

    // ==========================================
    // 12. XP
    // ==========================================

    const xpEarned = Math.max(
      10,
      score
    );

    const {
      data: currentProfile,
    } = await admin
      .from("profiles")
      .select(
        "xp, level"
      )
      .eq(
        "id",
        user.id
      )
      .single();

    const currentXP =
      Number(
        currentProfile?.xp
      ) || 0;

    const currentLevel =
      Number(
        currentProfile?.level
      ) || 1;

    const newXP =
      currentXP + xpEarned;

    const newLevel =
      Math.max(
        currentLevel,
        Math.floor(
          newXP / 500
        ) + 1
      );

    await admin
      .from("profiles")
      .update({
        xp: newXP,
        level: newLevel,
      })
      .eq(
        "id",
        user.id
      );

    await admin
      .from("xp_transactions")
      .insert({
        employee_id:
          user.id,

        company_id:
          profile.company_id,

        amount:
          xpEarned,

        reason:
          "Exam completed",
      });

    // ==========================================
    // 13. SUCCESS
    // ==========================================

    return NextResponse.json({
      success: true,

      message:
        "İmtahan nəticəsi uğurla yadda saxlanıldı.",

      result: {
        id:
          examResult.id,

        score,

        knowledgeScore,

        scenarioScore,

        correctAnswers:
          totalCorrect,

        totalQuestions:
          questions.length,

        ready,

        skills:
          skillResults,
      },

      xpEarned,
    });
  } catch (error) {
    console.error(
      "SAVE EXAM API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}