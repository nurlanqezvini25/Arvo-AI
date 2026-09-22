import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;

export async function POST(request: NextRequest) {
  try {
    // 1. Login tokenini götür
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization token yoxdur." },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();

    // 2. User-i yoxla
    const supabaseAuth = createClient(
      supabaseUrl,
      supabasePublishableKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Login sessiyası etibarlı deyil." },
        { status: 401 }
      );
    }

    // 3. Admin client
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseSecretKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // 4. Manager profilini tap
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, role, company_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profil tapılmadı." },
        { status: 404 }
      );
    }

    if (profile.role !== "manager") {
      return NextResponse.json(
        { error: "Yalnız manager kurs yarada bilər." },
        { status: 403 }
      );
    }

    if (!profile.company_id) {
      return NextResponse.json(
        { error: "Manager üçün company_id yoxdur." },
        { status: 400 }
      );
    }

    // 5. Workspace-dən gələn məlumat
    const body = await request.json();

    const course = body?.course;

    if (!course) {
      return NextResponse.json(
        { error: "Course məlumatı göndərilməyib." },
        { status: 400 }
      );
    }

    const title =
      course.title ||
      body.documentTitle ||
      "AI Training Course";

    const description =
      course.description ||
      "AI tərəfindən yaradılmış təlim kursu.";

    const modules = Array.isArray(course.modules)
      ? course.modules
      : [];

    if (modules.length === 0) {
      return NextResponse.json(
        { error: "Kursda heç bir modul yoxdur." },
        { status: 400 }
      );
    }

    // 6. Courses cədvəlinə kurs əlavə et
    const { data: savedCourse, error: courseError } =
      await supabaseAdmin
        .from("courses")
        .insert({
          company_id: profile.company_id,
          title,
          description,
          source_document_name:
            body.documentTitle ||
            body.sourceDocumentName ||
            null,
          status: "published",
          created_by: user.id,
        })
        .select()
        .single();

    if (courseError || !savedCourse) {
      console.error("COURSE INSERT ERROR:", courseError);

      return NextResponse.json(
        {
          error:
            courseError?.message ||
            "Kurs database-ə yazılmadı.",
        },
        { status: 500 }
      );
    }

    // 7. Modulları və dərsləri database-ə yaz
    const savedModules: any[] = [];

    for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
      const module = modules[moduleIndex];

      const { data: savedModule, error: moduleError } =
        await supabaseAdmin
          .from("course_modules")
          .insert({
            course_id: savedCourse.id,
            title:
              module.title ||
              `Modul ${moduleIndex + 1}`,
            description:
              module.description || null,
            module_order: moduleIndex,
          })
          .select()
          .single();

      if (moduleError || !savedModule) {
        console.error("MODULE INSERT ERROR:", moduleError);

        // Yarımçıq kurs qalmasın
        await supabaseAdmin
          .from("courses")
          .delete()
          .eq("id", savedCourse.id);

        return NextResponse.json(
          {
            error:
              moduleError?.message ||
              "Modul database-ə yazılmadı.",
          },
          { status: 500 }
        );
      }

      savedModules.push(savedModule);

      // 8. Modulun dərsləri
      const lessons = Array.isArray(module.lessons)
        ? module.lessons
        : [];

      for (
        let lessonIndex = 0;
        lessonIndex < lessons.length;
        lessonIndex++
      ) {
        const lesson = lessons[lessonIndex];

        const sourceFacts = Array.isArray(lesson.sourceFacts)
          ? lesson.sourceFacts
          : [];

        const { error: lessonError } =
          await supabaseAdmin
            .from("course_lessons")
            .insert({
              course_id: savedCourse.id,
              module_id: savedModule.id,
              title:
                lesson.title ||
                `Dərs ${lessonIndex + 1}`,
              objective:
                lesson.objective || null,
              source_facts: sourceFacts,
              lesson_order: lessonIndex,
            });

        if (lessonError) {
          console.error(
            "LESSON INSERT ERROR:",
            lessonError
          );

          // Yarımçıq kurs qalmasın
          await supabaseAdmin
            .from("courses")
            .delete()
            .eq("id", savedCourse.id);

          return NextResponse.json(
            {
              error:
                lessonError.message ||
                "Dərs database-ə yazılmadı.",
            },
            { status: 500 }
          );
        }
      }
    }

    // 9. Şirkətdəki employee-ləri tap
    const { data: employees, error: employeeError } =
      await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("company_id", profile.company_id)
        .eq("role", "employee");

    if (employeeError) {
      console.error(
        "EMPLOYEE FETCH ERROR:",
        employeeError
      );
    }

    // 10. Demo üçün kursu bütün employee-lərə assign et
    if (employees && employees.length > 0) {
      const assignments = employees.map((employee) => ({
        company_id: profile.company_id,
        course_id: savedCourse.id,
        employee_id: employee.id,
        assigned_by: user.id,
        progress: 0,
        status: "assigned",
      }));

      const { error: assignmentError } =
        await supabaseAdmin
          .from("course_assignments")
          .insert(assignments);

      if (assignmentError) {
        console.error(
          "ASSIGNMENT INSERT ERROR:",
          assignmentError
        );

        return NextResponse.json(
          {
            error:
              assignmentError.message ||
              "Kurs employee-lərə assign olunmadı.",
            courseId: savedCourse.id,
          },
          { status: 500 }
        );
      }
    }

    // 11. Nəticə
    return NextResponse.json({
      success: true,
      message: "Kurs uğurla yaradıldı və employee-lərə assign edildi.",
      courseId: savedCourse.id,
      title: savedCourse.title,
      moduleCount: modules.length,
      employeeCount: employees?.length || 0,
    });
  } catch (error: any) {
    console.error("SAVE COURSE API ERROR:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Server xətası baş verdi.",
      },
      { status: 500 }
    );
  }
}