"use client";

import {
  useEffect,
  useState,
} from "react";

import { motion } from "framer-motion";

import { createClient } from "@/lib/supabase/client";

/* =========================================================
   TYPES
========================================================= */

type Language =
  | "az"
  | "en"
  | "ru";

type SelectedLesson = {
  id: string;

  title: string;

  objective?: string;

  sourceFacts?: string[];

  moduleId?: string;

  moduleTitle?: string;

  moduleImage?: string;
};

type QuizQuestion = {
  question: string;

  options: string[];

  correctIndex: number;

  explanation: string;
};

type LessonContent = {
  introduction: string;

  sections: {
    heading: string;
    body: string;
  }[];

  keyPoints: string[];

  workplaceExample: string;

  remember: string;

  miniQuiz: QuizQuestion[];
};

/* =========================================================
   TRANSLATIONS
========================================================= */

const translations = {
  az: {
    course: "KURSA QAYIT",

    lesson: "AI DƏRS",

    objective:
      "Dərsin məqsədi",

    generating:
      "AI dərsi hazırlayır...",

    generatingText:
      "PDF-dən çıxarılan faktlar əsasında dərs materialı yaradılır.",

    error:
      "Dərs materialını yükləmək mümkün olmadı.",

    retry:
      "Yenidən yoxla",

    keyPoints:
      "Əsas məqamlar",

    workplace:
      "İş nümunəsi",

    remember:
      "Yadda saxla",

    quiz:
      "Mini Quiz",

    correct:
      "Düzgün cavab",

    incorrect:
      "Yanlış cavab",

    complete:
      "Dərsi tamamla",

    saving:
      "Saxlanılır...",

    completed:
      "Dərs tamamlandı",

    loginRequired:
      "Progress-i saxlamaq üçün employee hesabı ilə daxil olmalısan.",

    progressError:
      "Dərs progress-i saxlanılmadı.",

    backModule:
      "Modula qayıt",

    sourceFacts:
      "Bu dərs şirkət materialındakı faktlar əsasında yaradılıb.",

    xp:
      "XP",

    progress:
      "Kurs tərəqqisi",
  },

  en: {
    course: "BACK TO COURSE",

    lesson: "AI LESSON",

    objective:
      "Lesson objective",

    generating:
      "AI is preparing the lesson...",

    generatingText:
      "Training content is being created from facts extracted from the PDF.",

    error:
      "Could not load the lesson content.",

    retry:
      "Try again",

    keyPoints:
      "Key Points",

    workplace:
      "Workplace Example",

    remember:
      "Remember",

    quiz:
      "Mini Quiz",

    correct:
      "Correct",

    incorrect:
      "Incorrect",

    complete:
      "Complete lesson",

    saving:
      "Saving...",

    completed:
      "Lesson completed",

    loginRequired:
      "Sign in with an employee account to save your progress.",

    progressError:
      "Lesson progress could not be saved.",

    backModule:
      "Back to module",

    sourceFacts:
      "This lesson is generated from facts in the company material.",

    xp:
      "XP",

    progress:
      "Course progress",
  },

  ru: {
    course:
      "ВЕРНУТЬСЯ К КУРСУ",

    lesson: "AI-УРОК",

    objective:
      "Цель урока",

    generating:
      "AI готовит урок...",

    generatingText:
      "Учебный материал создается на основе фактов из PDF.",

    error:
      "Не удалось загрузить материал урока.",

    retry:
      "Попробовать снова",

    keyPoints:
      "Ключевые моменты",

    workplace:
      "Рабочий пример",

    remember:
      "Запомните",

    quiz:
      "Мини-тест",

    correct:
      "Правильно",

    incorrect:
      "Неправильно",

    complete:
      "Завершить урок",

    saving:
      "Сохранение...",

    completed:
      "Урок завершен",

    loginRequired:
      "Войдите как сотрудник, чтобы сохранить прогресс.",

    progressError:
      "Не удалось сохранить прогресс урока.",

    backModule:
      "Вернуться к модулю",

    sourceFacts:
      "Этот урок создан на основе фактов из материалов компании.",

    xp:
      "XP",

    progress:
      "Прогресс курса",
  },
};

/* =========================================================
   PAGE
========================================================= */

export default function LessonPage() {
  const [
    language,
    setLanguage,
  ] =
    useState<Language>("az");

  const [
    languageReady,
    setLanguageReady,
  ] =
    useState(false);

  const [
    selectedLesson,
    setSelectedLesson,
  ] =
    useState<SelectedLesson | null>(
      null
    );

  const [
    lessonContent,
    setLessonContent,
  ] =
    useState<LessonContent | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    quizAnswers,
    setQuizAnswers,
  ] =
    useState<
      Record<number, number>
    >({});

  const [
    savingCompletion,
    setSavingCompletion,
  ] =
    useState(false);

  const [
    completionError,
    setCompletionError,
  ] =
    useState("");

  const [
    completionInfo,
    setCompletionInfo,
  ] =
    useState<{
      xpAward: number;
      progress: number;
    } | null>(null);

  const t =
    translations[language];

  /* =========================================================
     LOAD LANGUAGE + SELECTED LESSON
  ========================================================= */

  useEffect(() => {
    const savedLanguage =
      localStorage.getItem(
        "praktikLanguage"
      );

    if (
      savedLanguage === "az" ||
      savedLanguage === "en" ||
      savedLanguage === "ru"
    ) {
      setLanguage(
        savedLanguage
      );
    }

    setLanguageReady(true);

    const lessonRaw =
      localStorage.getItem(
        "praktikSelectedLesson"
      );

    if (!lessonRaw) {
      setError(
        "Seçilmiş dərs tapılmadı."
      );

      setLoading(false);

      return;
    }

    try {
      const lesson =
        JSON.parse(
          lessonRaw
        );

      setSelectedLesson(
        lesson
      );
    } catch {
      setError(
        "Dərs məlumatı düzgün deyil."
      );

      setLoading(false);
    }
  }, []);

  /* =========================================================
     GENERATE / LOAD CACHED AI LESSON
  ========================================================= */

  useEffect(() => {
    if (
      !selectedLesson ||
      !languageReady
    ) {
      return;
    }

    loadLessonContent();
  }, [
    selectedLesson,
    language,
    languageReady,
  ]);

  async function loadLessonContent(
    force = false
  ) {
    if (!selectedLesson) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const cacheKey =
        `praktikLessonContent:${language}:${selectedLesson.id}`;

      if (!force) {
        const cached =
          localStorage.getItem(
            cacheKey
          );

        if (cached) {
          try {
            const parsed =
              JSON.parse(
                cached
              );

            setLessonContent(
              parsed
            );

            setLoading(false);

            return;
          } catch {
            localStorage.removeItem(
              cacheKey
            );
          }
        }
      }

      const sourceFacts =
        Array.isArray(
          selectedLesson.sourceFacts
        )
          ? selectedLesson.sourceFacts
          : [];

      if (
        sourceFacts.length === 0
      ) {
        throw new Error(
          "Bu dərs üçün sourceFacts yoxdur. PDF-i yenidən analiz et."
        );
      }

      const response =
        await fetch(
          "/api/generate-lesson",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                title:
                  selectedLesson.title,

                objective:
                  selectedLesson.objective ||
                  "",

                sourceFacts,

                moduleTitle:
                  selectedLesson.moduleTitle ||
                  "",

                language,
              }),
          }
        );

      const rawResponse =
        await response.text();

      if (!rawResponse) {
        throw new Error(
          "AI server boş cavab qaytardı."
        );
      }

      let data;

      try {
        data =
          JSON.parse(
            rawResponse
          );
      } catch {
        console.error(
          "LESSON RAW RESPONSE:",
          rawResponse
        );

        throw new Error(
          "AI düzgün JSON qaytarmadı."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            t.error
        );
      }

      setLessonContent(
        data
      );

      localStorage.setItem(
        cacheKey,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error(
        "LESSON LOAD ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : t.error
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     LANGUAGE
  ========================================================= */

  function changeLanguage(
    newLanguage: Language
  ) {
    setLanguage(
      newLanguage
    );

    localStorage.setItem(
      "praktikLanguage",
      newLanguage
    );

    setLessonContent(
      null
    );

    setQuizAnswers({});
  }

  /* =========================================================
     QUIZ
  ========================================================= */

  function selectQuizAnswer(
    questionIndex: number,
    optionIndex: number
  ) {
    setQuizAnswers(
      (previous) => ({
        ...previous,

        [questionIndex]:
          optionIndex,
      })
    );
  }

  /* =========================================================
     COMPLETE LESSON
  ========================================================= */

  async function completeLesson() {
    if (!selectedLesson) {
      return;
    }

    try {
      setSavingCompletion(
        true
      );

      setCompletionError(
        ""
      );

      setCompletionInfo(
        null
      );

      /* -------------------------
         COURSE FROM LOCAL STORAGE
      ------------------------- */

      const courseRaw =
        localStorage.getItem(
          "praktikCourse"
        );

      if (!courseRaw) {
        throw new Error(
          "Course məlumatı tapılmadı."
        );
      }

      const course =
        JSON.parse(
          courseRaw
        );

      /* -------------------------
         EXISTING DATABASE COURSE ID
      ------------------------- */

      const existingCourseId =
        localStorage.getItem(
          "praktikCourseDbId"
        );

      /* -------------------------
         SUPABASE SESSION
      ------------------------- */

      const supabase =
        createClient();

      const {
        data: sessionData,
      } =
        await supabase.auth.getSession();

      const session =
        sessionData.session;

      if (!session) {
        setCompletionError(
          t.loginRequired
        );

        setTimeout(() => {
          window.location.href =
            "/login";
        }, 1200);

        return;
      }

      /* -------------------------
         API
      ------------------------- */

      const response =
        await fetch(
          "/api/complete-lesson",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${session.access_token}`,
            },

            body:
              JSON.stringify({
                courseId:
                  existingCourseId ||
                  null,

                course: {
                  title:
                    course.title,

                  description:
                    course.description ||
                    "",
                },

                lessonId:
                  selectedLesson.id,

                totalLessons:
                  course.totalLessons,
              }),
          }
        );

      const raw =
        await response.text();

      if (!raw) {
        throw new Error(
          "Server boş cavab qaytardı."
        );
      }

      let data;

      try {
        data =
          JSON.parse(raw);
      } catch {
        console.error(
          "COMPLETE LESSON RAW:",
          raw
        );

        throw new Error(
          "Server düzgün JSON qaytarmadı."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            t.progressError
        );
      }

      /* -------------------------
         SAVE DATABASE COURSE ID
      ------------------------- */

      if (data.courseId) {
        localStorage.setItem(
          "praktikCourseDbId",
          data.courseId
        );
      }

      /* -------------------------
         KEEP LOCAL PROGRESS TOO
      ------------------------- */

      const completedRaw =
        localStorage.getItem(
          "praktikCompletedLessons"
        );

      let completed:
        string[] = [];

      if (completedRaw) {
        try {
          completed =
            JSON.parse(
              completedRaw
            );
        } catch {
          completed = [];
        }
      }

      if (
        !completed.includes(
          selectedLesson.id
        )
      ) {
        completed.push(
          selectedLesson.id
        );

        localStorage.setItem(
          "praktikCompletedLessons",
          JSON.stringify(
            completed
          )
        );
      }

      /* -------------------------
         SHOW SUCCESS
      ------------------------- */

      setCompletionInfo({
        xpAward:
          Number(
            data.xpAward
          ) || 0,

        progress:
          Number(
            data.progress
          ) || 0,
      });

      /* -------------------------
         RETURN TO MODULE
      ------------------------- */

      setTimeout(() => {
        window.location.href =
          "/course/module";
      }, 1200);
    } catch (error) {
      console.error(
        "COMPLETE LESSON ERROR:",
        error
      );

      setCompletionError(
        error instanceof Error
          ? error.message
          : t.progressError
      );
    } finally {
      setSavingCompletion(
        false
      );
    }
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-6">

        <div className="text-center">

          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <h2 className="mt-6 text-xl font-black text-slate-900">
            {t.generating}
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {
              t.generatingText
            }
          </p>

        </div>

      </main>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (
    error ||
    !selectedLesson ||
    !lessonContent
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-6">

        <div className="w-full max-w-lg rounded-[30px] border border-slate-200 bg-white p-8 text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-xl">
            !
          </div>

          <h1 className="mt-5 text-2xl font-black">
            {t.error}
          </h1>

          <p className="mt-3 leading-7 text-slate-500">
            {error}
          </p>

          {selectedLesson && (
            <button
              onClick={() =>
                loadLessonContent(
                  true
                )
              }
              className="mt-6 w-full rounded-2xl bg-blue-600 px-6 py-4 font-black text-white"
            >
              {t.retry}
            </button>
          )}

          <button
            onClick={() =>
              (window.location.href =
                "/course/module")
            }
            className="mt-3 w-full rounded-2xl border border-slate-200 px-6 py-4 font-black text-slate-700"
          >
            {t.backModule}
          </button>

        </div>

      </main>
    );
  }

  /* =========================================================
     MAIN PAGE
  ========================================================= */

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">

        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">

          <button
            onClick={() =>
              (window.location.href =
                "/course/module")
            }
            className="text-sm font-black text-slate-500 transition hover:text-blue-600"
          >
            ← {t.course}
          </button>

          <div className="flex items-center gap-3">

            <div className="hidden rounded-xl border border-slate-200 bg-white p-1 sm:flex">

              {(
                [
                  "az",
                  "en",
                  "ru",
                ] as Language[]
              ).map((lang) => (
                <button
                  key={lang}
                  onClick={() =>
                    changeLanguage(
                      lang
                    )
                  }
                  className={`rounded-lg px-3 py-2 text-xs font-black uppercase transition ${
                    language ===
                    lang
                      ? "bg-blue-600 text-white"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {lang}
                </button>
              ))}

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-black text-white">
              P
            </div>

          </div>

        </div>

      </header>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative overflow-hidden bg-[#0F172A] text-white">

        <div className="absolute -right-20 top-0 h-80 w-80 rounded-full bg-blue-600/25 blur-3xl" />

        <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-yellow-400/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-6 py-12 md:py-16">

          <div className="grid items-center gap-8 lg:grid-cols-[1fr_360px]">

            <div>

              <div className="inline-flex rounded-full bg-blue-500/15 px-4 py-2 text-xs font-black tracking-[0.15em] text-blue-200">
                {t.lesson}
              </div>

              <p className="mt-6 text-sm font-bold text-blue-300">
                {
                  selectedLesson.moduleTitle
                }
              </p>

              <h1 className="mt-2 max-w-3xl text-4xl font-black leading-tight md:text-5xl">
                {
                  selectedLesson.title
                }
              </h1>

              {selectedLesson.objective && (
                <div className="mt-6 max-w-3xl">

                  <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">
                    {t.objective}
                  </p>

                  <p className="mt-2 text-lg leading-8 text-slate-300">
                    {
                      selectedLesson.objective
                    }
                  </p>

                </div>
              )}

            </div>

            {selectedLesson.moduleImage && (
              <div className="overflow-hidden rounded-[28px] border border-white/10">

                <img
                  src={
                    selectedLesson.moduleImage
                  }
                  alt={
                    selectedLesson.moduleTitle ||
                    selectedLesson.title
                  }
                  className="h-[240px] w-full object-cover"
                />

              </div>
            )}

          </div>

        </div>

      </section>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <section className="mx-auto max-w-5xl px-6 py-12">

        {/* SOURCE NOTE */}

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">

          <p className="text-sm font-bold text-blue-700">
            ✓ {t.sourceFacts}
          </p>

        </div>

        {/* INTRODUCTION */}

        <motion.div
          initial={{
            opacity: 0,
            y: 15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="mt-8 rounded-[28px] border border-slate-200 bg-white p-7 md:p-9"
        >

          <p className="text-lg leading-8 text-slate-700">
            {
              lessonContent.introduction
            }
          </p>

        </motion.div>

        {/* SECTIONS */}

        <div className="mt-6 space-y-6">

          {lessonContent.sections?.map(
            (
              section,
              index
            ) => (
              <motion.div
                key={`${section.heading}-${index}`}
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{
                  once: true,
                }}
                className="rounded-[28px] border border-slate-200 bg-white p-7 md:p-9"
              >

                <div className="flex items-start gap-4">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-black text-blue-600">
                    {index + 1}
                  </div>

                  <div>

                    <h2 className="text-2xl font-black">
                      {
                        section.heading
                      }
                    </h2>

                    <p className="mt-4 whitespace-pre-line text-base leading-8 text-slate-600">
                      {
                        section.body
                      }
                    </p>

                  </div>

                </div>

              </motion.div>
            )
          )}

        </div>

        {/* KEY POINTS */}

        {lessonContent.keyPoints?.length >
          0 && (
          <div className="mt-6 rounded-[28px] border border-blue-200 bg-blue-50 p-7 md:p-9">

            <p className="text-sm font-black tracking-[0.15em] text-blue-600">
              PRAKTİK AI
            </p>

            <h2 className="mt-2 text-2xl font-black">
              {t.keyPoints}
            </h2>

            <div className="mt-6 space-y-3">

              {lessonContent.keyPoints.map(
                (
                  point,
                  index
                ) => (
                  <div
                    key={index}
                    className="flex gap-3 rounded-2xl bg-white/70 p-4"
                  >

                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">
                      ✓
                    </div>

                    <p className="leading-7 text-slate-700">
                      {point}
                    </p>

                  </div>
                )
              )}

            </div>

          </div>
        )}

        {/* WORKPLACE EXAMPLE */}

        {lessonContent.workplaceExample && (
          <div className="mt-6 rounded-[28px] border border-yellow-200 bg-yellow-50 p-7 md:p-9">

            <p className="text-sm font-black tracking-[0.15em] text-yellow-700">
              REAL WORK
            </p>

            <h2 className="mt-2 text-2xl font-black">
              {t.workplace}
            </h2>

            <p className="mt-4 leading-8 text-yellow-950/80">
              {
                lessonContent.workplaceExample
              }
            </p>

          </div>
        )}

        {/* REMEMBER */}

        {lessonContent.remember && (
          <div className="mt-6 rounded-[28px] bg-[#0F172A] p-7 text-white md:p-9">

            <p className="text-sm font-black tracking-[0.15em] text-yellow-400">
              {t.remember}
            </p>

            <p className="mt-4 text-xl font-bold leading-8 text-slate-200">
              {
                lessonContent.remember
              }
            </p>

          </div>
        )}

        {/* =================================================
            MINI QUIZ
        ================================================= */}

        {lessonContent.miniQuiz?.length >
          0 && (
          <div className="mt-10">

            <div>

              <p className="text-sm font-black tracking-[0.15em] text-blue-600">
                PRACTICE
              </p>

              <h2 className="mt-2 text-3xl font-black">
                {t.quiz}
              </h2>

            </div>

            <div className="mt-6 space-y-6">

              {lessonContent.miniQuiz.map(
                (
                  quiz,
                  questionIndex
                ) => {
                  const selected =
                    quizAnswers[
                      questionIndex
                    ];

                  const answered =
                    selected !==
                    undefined;

                  const correct =
                    selected ===
                    quiz.correctIndex;

                  return (
                    <div
                      key={
                        questionIndex
                      }
                      className="rounded-[28px] border border-slate-200 bg-white p-7"
                    >

                      <p className="text-sm font-black text-blue-600">
                        {questionIndex +
                          1}
                        /
                        {
                          lessonContent
                            .miniQuiz
                            .length
                        }
                      </p>

                      <h3 className="mt-3 text-xl font-black leading-8">
                        {
                          quiz.question
                        }
                      </h3>

                      <div className="mt-6 space-y-3">

                        {quiz.options.map(
                          (
                            option,
                            optionIndex
                          ) => {
                            const isSelected =
                              selected ===
                              optionIndex;

                            const isCorrectAnswer =
                              optionIndex ===
                              quiz.correctIndex;

                            let className =
                              "border-slate-200 bg-white hover:border-blue-200";

                            if (
                              answered &&
                              isCorrectAnswer
                            ) {
                              className =
                                "border-green-400 bg-green-50";
                            } else if (
                              answered &&
                              isSelected &&
                              !isCorrectAnswer
                            ) {
                              className =
                                "border-red-300 bg-red-50";
                            } else if (
                              isSelected
                            ) {
                              className =
                                "border-blue-500 bg-blue-50";
                            }

                            return (
                              <button
                                key={
                                  optionIndex
                                }
                                disabled={
                                  answered
                                }
                                onClick={() =>
                                  selectQuizAnswer(
                                    questionIndex,
                                    optionIndex
                                  )
                                }
                                className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${className}`}
                              >

                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-black text-slate-600">
                                  {String.fromCharCode(
                                    65 +
                                      optionIndex
                                  )}
                                </div>

                                <span className="font-semibold leading-6">
                                  {
                                    option
                                  }
                                </span>

                              </button>
                            );
                          }
                        )}

                      </div>

                      {answered && (
                        <motion.div
                          initial={{
                            opacity: 0,
                            y: 8,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          className={`mt-5 rounded-2xl p-5 ${
                            correct
                              ? "bg-green-50 text-green-800"
                              : "bg-red-50 text-red-800"
                          }`}
                        >

                          <p className="font-black">
                            {correct
                              ? `✓ ${t.correct}`
                              : `✕ ${t.incorrect}`}
                          </p>

                          <p className="mt-2 text-sm leading-6">
                            {
                              quiz.explanation
                            }
                          </p>

                        </motion.div>
                      )}

                    </div>
                  );
                }
              )}

            </div>

          </div>
        )}

        {/* =================================================
            COMPLETE LESSON
        ================================================= */}

        <div className="mt-10 rounded-[30px] border border-slate-200 bg-white p-7 md:p-9">

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">

            <div>

              <p className="text-sm font-black tracking-[0.15em] text-blue-600">
                PRAKTİK AI
              </p>

              <h2 className="mt-2 text-2xl font-black">
                {t.complete}
              </h2>

            </div>

            <button
              onClick={
                completeLesson
              }
              disabled={
                savingCompletion ||
                Boolean(
                  completionInfo
                )
              }
              className="rounded-2xl bg-blue-600 px-8 py-4 font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingCompletion
                ? t.saving
                : completionInfo
                  ? `✓ ${t.completed}`
                  : t.complete}
            </button>

          </div>

          {completionInfo && (
            <motion.div
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="mt-6 grid gap-3 sm:grid-cols-2"
            >

              <div className="rounded-2xl bg-green-50 p-4">

                <p className="text-xs font-black text-green-600">
                  +{t.xp}
                </p>

                <p className="mt-1 text-2xl font-black text-green-800">
                  +
                  {
                    completionInfo.xpAward
                  }{" "}
                  XP
                </p>

              </div>

              <div className="rounded-2xl bg-blue-50 p-4">

                <p className="text-xs font-black text-blue-600">
                  {t.progress}
                </p>

                <p className="mt-1 text-2xl font-black text-blue-800">
                  {
                    completionInfo.progress
                  }
                  %
                </p>

              </div>

            </motion.div>
          )}

          {completionError && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {
                completionError
              }
            </div>
          )}

        </div>

      </section>

    </main>
  );
}