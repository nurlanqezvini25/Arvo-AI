import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    // ==========================================
    // 1. AUTH TOKEN
    // ==========================================

    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization token yoxdur." },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // ==========================================
    // 2. ENVIRONMENT VARIABLES
    // ==========================================

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const secretKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !publishableKey || !secretKey) {
      return NextResponse.json(
        {
          error:
            "Supabase environment variables tapılmadı.",
        },
        { status: 500 }
      );
    }

    // ==========================================
    // 3. USER AUTH
    // ==========================================

    const authClient = createClient(
      supabaseUrl,
      publishableKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser(token);

    if (authError || !user) {
      console.error("AUTH ERROR:", authError);

      return NextResponse.json(
        {
          error:
            authError?.message ||
            "İstifadəçi təsdiqlənmədi.",
        },
        { status: 401 }
      );
    }

    // ==========================================
    // 4. ADMIN CLIENT
    // ==========================================

    const admin = createClient(
      supabaseUrl,
      secretKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // ==========================================
    // 5. EMPLOYEE PROFILE
    // ==========================================

    const {
      data: profile,
      error: profileError,
    } = await admin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error(
        "PROFILE ERROR:",
        profileError
      );

      return NextResponse.json(
        {
          error:
            profileError?.message ||
            "Employee profile tapılmadı.",
        },
        { status: 404 }
      );
    }

    if (profile.role !== "employee") {
      return NextResponse.json(
        {
          error:
            "Bu əməliyyat yalnız employee hesabı üçündür.",
        },
        { status: 403 }
      );
    }

    // ==========================================
    // 6. REQUEST BODY
    // ==========================================

    const body = await request.json();

    const courseFromClient = body.course || {};

    const requestedCourseId =
      body.courseId || null;

    const lessonId =
      body.lessonId;

    const totalLessons = Math.max(
      Number(body.totalLessons || 1),
      1
    );

    if (!lessonId) {
      return NextResponse.json(
        {
          error:
            "lessonId göndərilməyib.",
        },
        { status: 400 }
      );
    }

    const courseTitle =
      courseFromClient.title ||
      "Praktik AI Course";

    const courseDescription =
      courseFromClient.description ||
      "";

    // ==========================================
    // 7. COURSE TAP
    // ==========================================

    let courseId = requestedCourseId;

    let courseRecord = null;

    if (courseId) {
      const {
        data,
        error,
      } = await admin
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .eq(
          "company_id",
          profile.company_id
        )
        .maybeSingle();

      if (error) {
        console.error(
          "COURSE ID LOOKUP ERROR:",
          error
        );

        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      courseRecord = data;
    }

    // Əgər localStorage-da DB ID yoxdursa,
    // şirkət daxilində title ilə axtarırıq.

    if (!courseRecord) {
      const {
        data,
        error,
      } = await admin
        .from("courses")
        .select("*")
        .eq(
          "company_id",
          profile.company_id
        )
        .eq(
          "title",
          courseTitle
        )
        .maybeSingle();

      if (error) {
        console.error(
          "COURSE SEARCH ERROR:",
          error
        );

        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      courseRecord = data;
    }

    // ==========================================
    // 8. COURSE YARAT
    // ==========================================

    if (!courseRecord) {
      const {
        data,
        error,
      } = await admin
        .from("courses")
        .insert({
          company_id:
            profile.company_id,

          title:
            courseTitle,

          description:
            courseDescription,

          source_document_name:
            body.sourceDocumentName ||
            null,

          status:
            "active",

          created_by:
            user.id,
        })
        .select()
        .single();

      if (error || !data) {
        console.error(
          "CREATE COURSE ERROR:",
          error
        );

        return NextResponse.json(
          {
            error:
              error?.message ||
              "Course database-ə yazılmadı.",
          },
          { status: 500 }
        );
      }

      courseRecord = data;
    }

    courseId = courseRecord.id;

    console.log(
      "COURSE ID:",
      courseId
    );

    // ==========================================
    // 9. COURSE ASSIGNMENT TAP
    // ==========================================

    const {
      data: existingAssignment,
      error: assignmentLookupError,
    } = await admin
      .from("course_assignments")
      .select("*")
      .eq(
        "course_id",
        courseId
      )
      .eq(
        "employee_id",
        user.id
      )
      .maybeSingle();

    if (assignmentLookupError) {
      console.error(
        "ASSIGNMENT LOOKUP ERROR:",
        assignmentLookupError
      );

      return NextResponse.json(
        {
          error:
            assignmentLookupError.message,
        },
        { status: 500 }
      );
    }

    let assignment =
      existingAssignment;

    // ==========================================
    // 10. ASSIGNMENT YARAT
    // ==========================================

    if (!assignment) {
      const {
        data,
        error,
      } = await admin
        .from("course_assignments")
        .insert({
          company_id:
            profile.company_id,

          course_id:
            courseId,

          employee_id:
            user.id,

          assigned_by:
            user.id,

          progress: 0,

          status:
            "in_progress",
        })
        .select()
        .single();

      if (error || !data) {
        console.error(
          "CREATE ASSIGNMENT ERROR:",
          error
        );

        return NextResponse.json(
          {
            error:
              error?.message ||
              "Course assignment yaradıla bilmədi.",
          },
          { status: 500 }
        );
      }

      assignment = data;
    }

    // ==========================================
    // 11. LESSON PROGRESS YOXLA
    // ==========================================

    const {
      data: existingProgress,
      error: progressLookupError,
    } = await admin
      .from("lesson_progress")
      .select("*")
      .eq(
        "course_id",
        courseId
      )
      .eq(
        "employee_id",
        user.id
      )
      .eq(
        "lesson_id",
        lessonId
      )
      .maybeSingle();

    if (progressLookupError) {
      console.error(
        "PROGRESS LOOKUP ERROR:",
        progressLookupError
      );

      return NextResponse.json(
        {
          error:
            progressLookupError.message,
        },
        { status: 500 }
      );
    }

    // ==========================================
    // 12. LESSON PROGRESS YARAT
    // ==========================================

    let newLessonCompleted = false;

    if (!existingProgress) {
      const {
        error,
      } = await admin
        .from("lesson_progress")
        .insert({
          company_id:
            profile.company_id,

          course_id:
            courseId,

          employee_id:
            user.id,

          lesson_id:
            String(lessonId),

          completed:
            true,

          completed_at:
            new Date().toISOString(),
        });

      if (error) {
        console.error(
          "INSERT LESSON PROGRESS ERROR:",
          error
        );

        return NextResponse.json(
          {
            error:
              error.message,
          },
          { status: 500 }
        );
      }

      newLessonCompleted = true;
    }

    // ==========================================
    // 13. COMPLETED LESSONS COUNT
    // ==========================================

    const {
      data: completedLessons,
      error: completedLessonsError,
    } = await admin
      .from("lesson_progress")
      .select("lesson_id")
      .eq(
        "company_id",
        profile.company_id
      )
      .eq(
        "course_id",
        courseId
      )
      .eq(
        "employee_id",
        user.id
      )
      .eq(
        "completed",
        true
      );

    if (completedLessonsError) {
      console.error(
        "COUNT LESSONS ERROR:",
        completedLessonsError
      );

      return NextResponse.json(
        {
          error:
            completedLessonsError.message,
        },
        { status: 500 }
      );
    }

    const completedCount =
      completedLessons?.length || 0;

    // ==========================================
    // 14. PROGRESS %
    // ==========================================

    const progress = Math.min(
      100,
      Math.round(
        (completedCount /
          totalLessons) *
          100
      )
    );

    const courseCompleted =
      completedCount >=
      totalLessons;

    // ==========================================
    // 15. ASSIGNMENT UPDATE
    // ==========================================

    const updateData: Record<
      string,
      unknown
    > = {
      progress,

      status:
        courseCompleted
          ? "completed"
          : "in_progress",
    };

    if (courseCompleted) {
      updateData.completed_at =
        new Date().toISOString();
    }

    const {
      error:
        assignmentUpdateError,
    } = await admin
      .from("course_assignments")
      .update(updateData)
      .eq(
        "id",
        assignment.id
      );

    if (assignmentUpdateError) {
      console.error(
        "UPDATE ASSIGNMENT ERROR:",
        assignmentUpdateError
      );

      return NextResponse.json(
        {
          error:
            assignmentUpdateError.message,
        },
        { status: 500 }
      );
    }

    // ==========================================
    // 16. XP
    // ==========================================

    let xpAward = 0;

    if (newLessonCompleted) {
      xpAward = 20;

      if (courseCompleted) {
        xpAward += 100;
      }

      const currentXP =
        Number(profile.xp || 0);

      const newXP =
        currentXP + xpAward;

      const newLevel =
        Math.floor(
          newXP / 500
        ) + 1;

      const {
        error: xpError,
      } = await admin
        .from("profiles")
        .update({
          xp: newXP,
          level: newLevel,
        })
        .eq(
          "id",
          user.id
        );

      if (xpError) {
        console.error(
          "XP UPDATE ERROR:",
          xpError
        );
      }

      // XP transaction
      const {
        error:
          xpTransactionError,
      } = await admin
        .from("xp_transactions")
        .insert({
          company_id:
            profile.company_id,

          employee_id:
            user.id,

          amount:
            xpAward,

          reason:
            courseCompleted
              ? "Course completed"
              : "Lesson completed",
        });

      if (xpTransactionError) {
        console.error(
          "XP TRANSACTION ERROR:",
          xpTransactionError
        );
      }
    }

    // ==========================================
    // 17. FINAL PROFILE
    // ==========================================

    const {
      data: updatedProfile,
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

    // ==========================================
    // 18. SUCCESS
    // ==========================================

    return NextResponse.json({
      success: true,

      message:
        "Dərs və kurs progress-i database-ə yazıldı.",

      courseId,

      assignmentId:
        assignment.id,

      lessonId:

        String(lessonId),

      completedLessons:
        completedCount,

      totalLessons,

      progress,

      courseCompleted,

      xpAward,

      totalXP:
        updatedProfile?.xp ||
        0,

      level:
        updatedProfile?.level ||
        1,
    });

  } catch (error) {
    console.error(
      "COMPLETE LESSON API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Naməlum server xətası.",
      },
      { status: 500 }
    );
  }
}