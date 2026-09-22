"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "../../lib/supabase/client";

type Lesson = {
  id: string;
  title: string;
  objective: string;
  sourceFacts?: string[];
  moduleId?: string;
  moduleTitle?: string;
  moduleImage?: string;
};

type Module = {
  id: string;
  title: string;
  summary: string;
  lessons: Lesson[];
  coverImage?: string;
  imageSearchQuery?: string;
};

type Course = {
  id: string;
  title: string;
  description: string;
  totalModules: number;
  totalLessons: number;
  modules: Module[];
};

export default function CoursePage() {
  const supabase = createClient();

  const [course, setCourse] = useState<Course | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imagesLoading, setImagesLoading] = useState(false);

  // =========================================================
  // LOAD COURSE FROM SUPABASE
  // =========================================================

  useEffect(() => {
    loadCourse();
  }, []);

  async function loadCourse() {
    try {
      setLoading(true);
      setError("");

      // -----------------------------------------------------
      // SESSION
      // -----------------------------------------------------

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/login";
        return;
      }

      // -----------------------------------------------------
      // PROFILE
      // -----------------------------------------------------

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("id, role, company_id")
          .eq("id", session.user.id)
          .single();

      if (profileError || !profile) {
        throw new Error("İstifadəçi profili tapılmadı.");
      }

      // Manager kurs keçmir
      if (profile.role === "manager") {
        window.location.href = "/manager";
        return;
      }

      if (profile.role !== "employee") {
        throw new Error("Bu səhifəyə giriş icazən yoxdur.");
      }

      // -----------------------------------------------------
      // COURSE ID
      // -----------------------------------------------------

      let courseId = "";

      // URL-dən:
      // /course?courseId=XXXX
      const urlParams = new URLSearchParams(
        window.location.search
      );

      courseId = urlParams.get("courseId") || "";

      // Əgər URL-də yoxdursa, localStorage fallback
      if (!courseId) {
        courseId =
          localStorage.getItem("praktikActiveCourseId") ||
          localStorage.getItem("praktikCourseDbId") ||
          "";
      }

      if (!courseId) {
        throw new Error(
          "Kurs ID-si tapılmadı. Employee Portal-dan kursu seç."
        );
      }

      // -----------------------------------------------------
      // COURSE
      // -----------------------------------------------------

      const { data: courseData, error: courseError } =
        await supabase
          .from("courses")
          .select("*")
          .eq("id", courseId)
          .eq("company_id", profile.company_id)
          .single();

      if (courseError || !courseData) {
        console.error("COURSE ERROR:", courseError);

        throw new Error(
          "Kurs Supabase-də tapılmadı."
        );
      }

      // -----------------------------------------------------
      // MODULES
      // -----------------------------------------------------

      const { data: moduleData, error: moduleError } =
        await supabase
          .from("course_modules")
          .select("*")
          .eq("course_id", courseId)
          .order("module_order", {
            ascending: true,
          });

      if (moduleError) {
        console.error("MODULE ERROR:", moduleError);

        throw new Error(
          "Kurs modullarını yükləmək mümkün olmadı."
        );
      }

      // -----------------------------------------------------
      // LESSONS
      // -----------------------------------------------------

      const { data: lessonData, error: lessonError } =
        await supabase
          .from("course_lessons")
          .select("*")
          .eq("course_id", courseId)
          .order("lesson_order", {
            ascending: true,
          });

      if (lessonError) {
        console.error("LESSON ERROR:", lessonError);

        throw new Error(
          "Kurs dərslərini yükləmək mümkün olmadı."
        );
      }

      // -----------------------------------------------------
      // COMPLETED LESSONS
      // -----------------------------------------------------

      const { data: progressData, error: progressError } =
        await supabase
          .from("lesson_progress")
          .select("lesson_id, completed")
          .eq("course_id", courseId)
          .eq("employee_id", session.user.id)
          .eq("completed", true);

      if (progressError) {
        console.warn(
          "Progress yüklənmədi:",
          progressError
        );
      }

      const completedIds =
        progressData?.map(
          (item) => String(item.lesson_id)
        ) || [];

      setCompletedLessons(completedIds);

      // -----------------------------------------------------
      // BUILD FRONTEND COURSE OBJECT
      // -----------------------------------------------------

      const builtModules: Module[] = (
        moduleData || []
      ).map((module) => {
        const moduleLessons: Lesson[] = (
          lessonData || []
        )
          .filter(
            (lesson) =>
              lesson.module_id === module.id
          )
          .map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            objective:
              lesson.objective || "",
            sourceFacts: Array.isArray(
              lesson.source_facts
            )
              ? lesson.source_facts
              : [],
            moduleId: module.id,
            moduleTitle: module.title,
          }));

        return {
          id: module.id,
          title: module.title,
          summary:
            module.description || "",
          lessons: moduleLessons,
        };
      });

      const builtCourse: Course = {
        id: courseData.id,
        title: courseData.title,
        description:
          courseData.description || "",
        totalModules: builtModules.length,
        totalLessons: builtModules.reduce(
          (total, module) =>
            total + module.lessons.length,
          0
        ),
        modules: builtModules,
      };

      setCourse(builtCourse);

      // -----------------------------------------------------
      // KEEP LOCAL STORAGE FOR OLD PAGES
      // -----------------------------------------------------

      localStorage.setItem(
        "praktikActiveCourseId",
        courseData.id
      );

      localStorage.setItem(
        "praktikCourseDbId",
        courseData.id
      );

      localStorage.setItem(
        "praktikCourse",
        JSON.stringify(builtCourse)
      );

      // Generate images after course loads
      loadCourseImages(builtCourse);
    } catch (err) {
      console.error("COURSE PAGE ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Kurs yüklənmədi."
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // COURSE IMAGES
  // =========================================================

  async function loadCourseImages(
    currentCourse: Course
  ) {
    if (!currentCourse.modules.length) {
      return;
    }

    try {
      const cachedImagesRaw =
        localStorage.getItem(
          `praktikCourseImages:${currentCourse.id}`
        );

      let cachedImages: Record<
        string,
        string
      > = {};

      if (cachedImagesRaw) {
        try {
          cachedImages =
            JSON.parse(cachedImagesRaw);
        } catch {
          cachedImages = {};
        }
      }

      const modulesWithoutImages =
        currentCourse.modules.filter(
          (module) =>
            !cachedImages[module.id]
        );

      if (
        modulesWithoutImages.length === 0
      ) {
        const updatedCourse = {
          ...currentCourse,
          modules:
            currentCourse.modules.map(
              (module) => ({
                ...module,
                coverImage:
                  cachedImages[
                    module.id
                  ],
              })
            ),
        };

        setCourse(updatedCourse);

        localStorage.setItem(
          "praktikCourse",
          JSON.stringify(updatedCourse)
        );

        return;
      }

      setImagesLoading(true);

      const response = await fetch(
        "/api/generate-course-images",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            modules:
              modulesWithoutImages.map(
                (module) => ({
                  id: module.id,
                  title: module.title,
                  summary: module.summary,
                })
              ),
          }),
        }
      );

      const raw = await response.text();

      if (!raw) {
        return;
      }

      let data;

      try {
        data = JSON.parse(raw);
      } catch {
        console.error(
          "COURSE IMAGE RAW:",
          raw
        );
        return;
      }

      if (!response.ok) {
        console.error(
          "COURSE IMAGE ERROR:",
          data.error
        );
        return;
      }

      const images =
        data.images || {};

      cachedImages = {
        ...cachedImages,
        ...images,
      };

      localStorage.setItem(
        `praktikCourseImages:${currentCourse.id}`,
        JSON.stringify(cachedImages)
      );

      const updatedCourse = {
        ...currentCourse,
        modules:
          currentCourse.modules.map(
            (module) => ({
              ...module,
              coverImage:
                cachedImages[
                  module.id
                ],
            })
          ),
      };

      setCourse(updatedCourse);

      localStorage.setItem(
        "praktikCourse",
        JSON.stringify(updatedCourse)
      );
    } catch (err) {
      console.error(
        "COURSE IMAGE ERROR:",
        err
      );
    } finally {
      setImagesLoading(false);
    }
  }

  // =========================================================
  // PROGRESS
  // =========================================================

  const totalLessons =
    course?.totalLessons || 0;

  const overallProgress = useMemo(() => {
    if (!totalLessons) {
      return 0;
    }

    return Math.round(
      (completedLessons.length /
        totalLessons) *
        100
    );
  }, [
    completedLessons,
    totalLessons,
  ]);

  // =========================================================
  // OPEN MODULE
  // =========================================================

  function openModule(module: Module) {
    if (!course) {
      return;
    }

    // Mövcud module/page.tsx üçün
    localStorage.setItem(
      "praktikSelectedModule",
      JSON.stringify(module)
    );

    // Course məlumatını da saxlayırıq
    localStorage.setItem(
      "praktikCourse",
      JSON.stringify(course)
    );

    localStorage.setItem(
      "praktikActiveCourseId",
      course.id
    );

    localStorage.setItem(
      "praktikCourseDbId",
      course.id
    );

    window.location.href =
      `/course/module?courseId=${course.id}&moduleId=${module.id}`;
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <h2 className="mt-6 text-xl font-black text-slate-900">
            Kurs yüklənir...
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Kurs məlumatları şirkət sistemindən
            gətirilir.
          </p>
        </div>
      </main>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error || !course) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-lg rounded-[30px] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-xl font-black text-red-600">
            !
          </div>

          <h1 className="mt-5 text-2xl font-black text-slate-900">
            Kurs yüklənmədi
          </h1>

          <p className="mt-3 leading-7 text-slate-500">
            {error ||
              "Kurs məlumatı tapılmadı."}
          </p>

          <button
            onClick={() =>
              (window.location.href =
                "/employee")
            }
            className="mt-6 w-full rounded-2xl bg-blue-600 px-6 py-4 font-black text-white"
          >
            Employee Portal-a qayıt
          </button>
        </div>
      </main>
    );
  }

  // =========================================================
  // MAIN
  // =========================================================

  return (
    <main className="min-h-screen bg-slate-50">
      {/* HEADER */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div
            onClick={() =>
              (window.location.href =
                "/employee")
            }
            className="cursor-pointer"
          >
            <span className="text-xl font-black text-blue-600">
              PRAKTİK
            </span>

            <span className="ml-1 rounded-md bg-yellow-400 px-2 py-1 text-sm font-black text-slate-900">
              AI
            </span>
          </div>

          <button
            onClick={() =>
              (window.location.href =
                "/employee")
            }
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            ← Employee Portal
          </button>
        </div>
      </header>

      {/* HERO */}

      <section className="relative overflow-hidden bg-white">
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-blue-100 blur-3xl" />

        <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-yellow-100 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-14">
          <motion.div
            initial={{
              opacity: 0,
              y: -10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-600"
          >
            ✨ Şirkət təlim kursu
          </motion.div>

          <motion.h1
            initial={{
              opacity: 0,
              y: 25,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.1,
            }}
            className="mt-5 max-w-4xl text-4xl font-black leading-tight text-slate-900 md:text-6xl"
          >
            {course.title}
          </motion.h1>

          <motion.p
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              delay: 0.2,
            }}
            className="mt-5 max-w-3xl text-lg leading-8 text-slate-600"
          >
            {course.description}
          </motion.p>

          {/* STATS */}

          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.3,
            }}
            className="mt-10 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4"
          >
            <Stat
              value={course.totalModules}
              label="Modul"
            />

            <Stat
              value={course.totalLessons}
              label="Dərs"
            />

            <Stat
              value={`${overallProgress}%`}
              label="Tamamlanıb"
            />

            <Stat
              value="AI"
              label="Təlim"
            />
          </motion.div>

          {/* PROGRESS */}

          <div className="mt-10 max-w-4xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex justify-between text-sm">
              <span className="font-bold text-slate-800">
                Kurs irəliləyişi
              </span>

              <span className="text-slate-500">
                {completedLessons.length}/
                {totalLessons} dərs
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={{
                  width: 0,
                }}
                animate={{
                  width: `${overallProgress}%`,
                }}
                transition={{
                  duration: 1.2,
                }}
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-yellow-400"
              />
            </div>
          </div>
        </div>
      </section>

      {/* MODULES */}

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-8">
          <p className="text-sm font-black tracking-wider text-blue-600">
            KURSUN MƏZMUNU
          </p>

          <h2 className="mt-2 text-3xl font-black text-slate-900">
            Təlim modulları
          </h2>

          <p className="mt-2 text-slate-500">
            Modulları ardıcıllıqla tamamla və
            kurs üzrə irəlilə.
          </p>

          {imagesLoading && (
            <p className="mt-3 text-sm font-semibold text-blue-600">
              ✨ Modul şəkilləri hazırlanır...
            </p>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {course.modules.map(
            (module, moduleIndex) => {
              const completedInModule =
                module.lessons.filter(
                  (lesson) =>
                    completedLessons.includes(
                      lesson.id
                    )
                ).length;

              const moduleProgress =
                module.lessons.length > 0
                  ? Math.round(
                      (completedInModule /
                        module.lessons.length) *
                        100
                    )
                  : 0;

              const completed =
                moduleProgress === 100;

              return (
                <motion.div
                  key={module.id}
                  initial={{
                    opacity: 0,
                    y: 30,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay:
                      moduleIndex * 0.1,
                  }}
                  whileHover={{
                    y: -5,
                  }}
                  className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-xl"
                >
                  {/* COVER */}

                  <div className="relative h-52 overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-blue-800">
                    {module.coverImage && (
                      <img
                        src={
                          module.coverImage
                        }
                        alt={module.title}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />

                    <div className="absolute left-5 top-5 rounded-full bg-white/90 px-4 py-2 text-xs font-black text-blue-700">
                      MODUL{" "}
                      {String(
                        moduleIndex + 1
                      ).padStart(2, "0")}
                    </div>

                    {completed && (
                      <div className="absolute right-5 top-5 rounded-full bg-green-500 px-4 py-2 text-xs font-bold text-white">
                        ✓ TAMAMLANDI
                      </div>
                    )}

                    <h3 className="absolute bottom-5 left-6 right-6 text-2xl font-black text-white">
                      {module.title}
                    </h3>
                  </div>

                  {/* BODY */}

                  <div className="p-6">
                    <p className="min-h-[48px] text-sm leading-6 text-slate-600">
                      {module.summary}
                    </p>

                    <div className="mt-5 flex gap-5 text-sm font-semibold text-slate-500">
                      <span>
                        📚{" "}
                        {module.lessons.length}{" "}
                        dərs
                      </span>

                      <span>
                        ⚡ {moduleProgress}%
                      </span>
                    </div>

                    {/* PROGRESS */}

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                      <motion.div
                        initial={{
                          width: 0,
                        }}
                        animate={{
                          width: `${moduleProgress}%`,
                        }}
                        transition={{
                          duration: 0.8,
                        }}
                        className="h-full bg-blue-600"
                      />
                    </div>

                    {/* LESSON PREVIEW */}

                    <div className="mt-6 space-y-2">
                      {module.lessons
                        .slice(0, 3)
                        .map(
                          (
                            lesson,
                            lessonIndex
                          ) => {
                            const lessonDone =
                              completedLessons.includes(
                                lesson.id
                              );

                            return (
                              <div
                                key={
                                  lesson.id
                                }
                                className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3"
                              >
                                <div
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                                    lessonDone
                                      ? "bg-green-500 text-white"
                                      : "bg-blue-100 text-blue-700"
                                  }`}
                                >
                                  {lessonDone
                                    ? "✓"
                                    : lessonIndex +
                                      1}
                                </div>

                                <span className="truncate text-sm font-medium text-slate-700">
                                  {lesson.title}
                                </span>
                              </div>
                            );
                          }
                        )}
                    </div>

                    {/* OPEN MODULE */}

                    <motion.button
                      whileHover={{
                        scale: 1.01,
                      }}
                      whileTap={{
                        scale: 0.98,
                      }}
                      onClick={() =>
                        openModule(module)
                      }
                      className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-4 font-bold text-white transition hover:bg-blue-700"
                    >
                      {completed
                        ? "Modula yenidən bax"
                        : moduleProgress > 0
                        ? "Davam et →"
                        : "Modula başla →"}
                    </motion.button>
                  </div>
                </motion.div>
              );
            }
          )}
        </div>

        {/* FINAL ASSESSMENT */}

        <motion.div
          initial={{
            opacity: 0,
            y: 30,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="mt-12 rounded-3xl border border-yellow-300 bg-gradient-to-r from-yellow-50 to-blue-50 p-8"
        >
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <span className="rounded-full bg-yellow-400 px-4 py-2 text-xs font-black text-slate-900">
                FINAL ASSESSMENT
              </span>

              <h3 className="mt-5 text-3xl font-black text-slate-900">
                Biliklərini praktikada yoxla
              </h3>

              <p className="mt-3 max-w-2xl text-slate-600">
                Kursu tamamladıqdan sonra bilik və
                real iş situasiyalarından ibarət
                AI qiymətləndirməsinə keç.
              </p>
            </div>

            <motion.button
              whileHover={{
                scale: 1.04,
              }}
              whileTap={{
                scale: 0.97,
              }}
              onClick={() => {
                if (!course) return;

                localStorage.setItem(
                  "praktikActiveCourseId",
                  course.id
                );

                window.location.href =
                  `/exam?courseId=${course.id}`;
              }}
              className="shrink-0 rounded-xl bg-yellow-400 px-7 py-4 font-black text-slate-900 transition hover:bg-yellow-300"
            >
              İmtahana keç →
            </motion.button>
          </div>
        </motion.div>
      </section>
    </main>
  );
}

// =========================================================
// STAT
// =========================================================

function Stat({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-2xl font-black text-slate-900">
        {value}
      </div>

      <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </div>
    </div>
  );
}