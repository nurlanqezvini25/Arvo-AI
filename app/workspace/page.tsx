"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

type Language = "az" | "en" | "ru";

type Question = {
  questionType: "knowledge" | "scenario";
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: string;
  skill: string;
  scenarioTitle?: string;
  scenarioContext?: string;
  imageSearchQuery?: string;
};

type Analysis = {
  documentTitle: string;

  course?: {
    title: string;
    description: string;
    totalModules: number;
    totalLessons: number;
    modules: any[];
  };

  importantKnowledge?: {
    title: string;
    description: string;
    importance: string;
  }[];

  questions: Question[];

  stats?: {
    modules?: number;
    lessons?: number;
    knowledgeQuestions?: number;
    scenarioQuestions?: number;
    totalQuestions?: number;
  };
};

const translations = {
  az: {
    back: "← Ana səhifə",
    badge: "AI COURSE BUILDER",
    title: "Şirkət materialını AI təliminə çevir",
    description:
      "SOP, prosedur və ya təlim PDF-ni yüklə. Praktik AI sənəddən kurs, dərslər və qiymətləndirmə yaradacaq.",
    select: "PDF seç",
    analyze: "AI ilə analiz et",
    analyzing: "AI sənədi analiz edir...",
    noFile: "Əvvəlcə PDF faylı seç.",
    ready: "AI təlim hazırdır",
    modules: "Modul",
    lessons: "Dərs",
    questions: "Sual",
    knowledge: "Əsas biliklər",
    openCourse: "Kursu aç →",
    startExam: "Rəqəmsal imtahana başla →",
    saveCourse: "Kursu şirkət sisteminə əlavə et",
    savingCourse: "Kurs sistemə əlavə olunur...",
    saved: "Kurs uğurla sistemə əlavə edildi!",
    employeeCount: "employee",
    moduleCount: "modul",
    lessonCount: "dərs",
  },

  en: {
    back: "← Home",
    badge: "AI COURSE BUILDER",
    title: "Turn company material into AI training",
    description:
      "Upload an SOP, procedure or training PDF. Praktik AI creates a course, lessons and assessment.",
    select: "Select PDF",
    analyze: "Analyze with AI",
    analyzing: "AI is analyzing the document...",
    noFile: "Please select a PDF first.",
    ready: "AI training is ready",
    modules: "Modules",
    lessons: "Lessons",
    questions: "Questions",
    knowledge: "Key knowledge",
    openCourse: "Open course →",
    startExam: "Start digital assessment →",
    saveCourse: "Add course to company system",
    savingCourse: "Adding course to system...",
    saved: "Course successfully added!",
    employeeCount: "employees",
    moduleCount: "modules",
    lessonCount: "lessons",
  },

  ru: {
    back: "← Главная",
    badge: "AI COURSE BUILDER",
    title: "Превратите материалы компании в AI-обучение",
    description:
      "Загрузите SOP, процедуру или учебный PDF. Praktik AI создаст курс, уроки и оценивание.",
    select: "Выбрать PDF",
    analyze: "Анализировать с AI",
    analyzing: "AI анализирует документ...",
    noFile: "Сначала выберите PDF.",
    ready: "AI-обучение готово",
    modules: "Модули",
    lessons: "Уроки",
    questions: "Вопросы",
    knowledge: "Ключевые знания",
    openCourse: "Открыть курс →",
    startExam: "Начать цифровой экзамен →",
    saveCourse: "Добавить курс в систему компании",
    savingCourse: "Курс добавляется в систему...",
    saved: "Курс успешно добавлен!",
    employeeCount: "сотрудников",
    moduleCount: "модулей",
    lessonCount: "уроков",
  },
};

export default function WorkspacePage() {
  const [language, setLanguage] = useState<Language>("az");
  const [languageLocked, setLanguageLocked] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  const [loading, setLoading] = useState(false);
  const [savingCourse, setSavingCourse] = useState(false);

  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const [savedCourseId, setSavedCourseId] = useState("");

  const supabase = createClient();

  useEffect(() => {
    async function checkManager() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/login";
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (!profile || profile.role !== "manager") {
        window.location.href = "/login";
        return;
      }
    }

    checkManager();

  }, []);

  const t = translations[language];

  function chooseCourseLanguage(newLanguage: Language) {
    if (languageLocked) return;

    setLanguage(newLanguage);
    setLanguageLocked(true);
    localStorage.setItem("praktikCourseLanguageDraft", newLanguage);
  }

  async function analyzePdf() {
    if (!languageLocked) {
      setError("Əvvəlcə kursun dilini seç: AZ, EN və ya RU.");
      return;
    }

    if (!file) {
      setError(t.noFile);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSaveMessage("");
      setAnalysis(null);
      setSavedCourseId("");

      const formData = new FormData();

      formData.append("file", file);
      formData.append("language", language);

      const response = await fetch(
        "/api/analyze",
        {
          method: "POST",
          body: formData,
        }
      );

      const text = await response.text();

      let data: any;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          text ||
            "AI serverindən düzgün cavab gəlmədi."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "AI analiz zamanı xəta baş verdi."
        );
      }

      setAnalysis(data);

      if (data.course) {
        localStorage.setItem(
          "praktikCourse",
          JSON.stringify(data.course)
        );
      }

      if (Array.isArray(data.questions)) {
        localStorage.setItem(
          "praktikExamQuestions",
          JSON.stringify(data.questions)
        );
      }

      localStorage.setItem(
        "praktikLanguage",
        language
      );

      localStorage.removeItem(
        "praktikSelectedModule"
      );

      localStorage.removeItem(
        "praktikSelectedLesson"
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Xəta baş verdi."
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveCourseToDatabase() {
    if (!analysis?.course) {
      setError(
        "Əvvəlcə PDF-i AI ilə analiz et."
      );
      return;
    }

    try {
      setSavingCourse(true);
      setError("");
      setSaveMessage("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        "/api/save-course",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            documentTitle:
              analysis.documentTitle,

            course: analysis.course,
            language,
          }),
        }
      );

      const text = await response.text();

      let data: any;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          text ||
            "Serverdən düzgün cavab gəlmədi."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Kurs database-ə yazılmadı."
        );
      }

      setSavedCourseId(
        data.courseId || ""
      );

      setSaveMessage(
        `${t.saved} ${data.employeeCount || 0} ${t.employeeCount}, ${data.moduleCount || 0} ${t.moduleCount}, ${data.lessonCount || 0} ${t.lessonCount}.`
      );

      if (data.courseId) {
        localStorage.setItem(
          "praktikActiveCourseId",
          data.courseId
        );

        const { error: languageUpdateError } = await supabase
          .from("courses")
          .update({ language })
          .eq("id", data.courseId);

        if (languageUpdateError) {
          throw new Error(
            `Kurs dili database-ə yazılmadı: ${languageUpdateError.message}`
          );
        }

        localStorage.setItem("praktikCourseLanguage", language);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Kurs yadda saxlanılarkən xəta baş verdi."
      );
    } finally {
      setSavingCourse(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900">

      {/* HEADER */}

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <button
            onClick={() =>
              (window.location.href = "/")
            }
            className="font-semibold text-slate-500 transition hover:text-blue-600"
          >
            {t.back}
          </button>

          {languageLocked && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black uppercase text-slate-600">
              Kurs dili: {language} 🔒
            </div>
          )}

        </div>

      </header>

      {/* MAIN */}

      <section className="mx-auto max-w-6xl px-6 py-16">

        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="mx-auto max-w-3xl text-center"
        >

          <div className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-600">
            ✨ {t.badge}
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight md:text-6xl">
            {t.title}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            {t.description}
          </p>

        </motion.div>

        {/* COURSE LANGUAGE */}

        <div className="mx-auto mt-10 max-w-3xl rounded-[28px] border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                Kurs dili
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Kurs yaradıldıqdan sonra bu dil dəyişdirilməyəcək.
              </p>
            </div>
            {languageLocked && (
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700">
                🔒 Locked
              </span>
            )}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {([
              ["az", "🇦🇿 Azərbaycan"],
              ["en", "🇬🇧 English"],
              ["ru", "🇷🇺 Русский"],
            ] as [Language, string][]).map(([lang, label]) => (
              <button
                key={lang}
                type="button"
                disabled={languageLocked}
                onClick={() => chooseCourseLanguage(lang)}
                className={`rounded-2xl border px-4 py-4 text-sm font-black transition ${
                  language === lang
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"
                } ${languageLocked && language !== lang ? "cursor-not-allowed opacity-50" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* UPLOAD */}

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
            delay: 0.15,
          }}
          className="mx-auto mt-12 max-w-3xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40"
        >

          <label className="block cursor-pointer rounded-3xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-10 text-center transition hover:border-blue-400 hover:bg-blue-50">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-2xl text-white">
              ↑
            </div>

            <p className="mt-5 text-lg font-black">
              {file
                ? file.name
                : t.select}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              PDF
            </p>

            <input
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(event) => {
                const selected =
                  event.target.files?.[0];

                if (selected) {
                  setFile(selected);
                  setAnalysis(null);
                  setError("");
                  setSaveMessage("");
                  setSavedCourseId("");
                }
              }}
            />

          </label>

          {file && (
            <p className="mt-4 text-center text-sm text-slate-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          )}

          <motion.button
            whileHover={{
              scale: 1.01,
            }}
            whileTap={{
              scale: 0.98,
            }}
            disabled={loading}
            onClick={analyzePdf}
            className="mt-6 w-full rounded-2xl bg-blue-600 px-7 py-5 text-lg font-black text-white shadow-xl shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? t.analyzing
              : t.analyze}
          </motion.button>

          {loading && (
            <div className="mt-6">

              <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                <motion.div
                  initial={{
                    width: "10%",
                  }}
                  animate={{
                    width: [
                      "10%",
                      "45%",
                      "70%",
                      "90%",
                    ],
                  }}
                  transition={{
                    duration: 8,
                  }}
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-yellow-400"
                />

              </div>

              <p className="mt-3 text-center text-sm text-slate-500">
                PDF → Knowledge → Course → Assessment
              </p>

            </div>
          )}

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 font-semibold text-red-700">
              {error}
            </div>
          )}

        </motion.div>

        {/* RESULT */}

        {analysis && (
          <motion.div
            initial={{
              opacity: 0,
              y: 30,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mx-auto mt-10 max-w-5xl"
          >

            <div className="rounded-[32px] border border-green-200 bg-white p-8 shadow-sm">

              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">

                <div>

                  <span className="rounded-full bg-green-50 px-4 py-2 text-sm font-black text-green-700">
                    ✓ {t.ready}
                  </span>

                  <h2 className="mt-5 text-3xl font-black">
                    {analysis.course?.title ||
                      analysis.documentTitle}
                  </h2>

                  {analysis.course?.description && (
                    <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                      {analysis.course.description}
                    </p>
                  )}

                </div>

              </div>

              {/* STATS */}

              <div className="mt-8 grid gap-4 sm:grid-cols-3">

                <ResultCard
                  value={
                    analysis.course
                      ?.totalModules ||
                    analysis.stats?.modules ||
                    0
                  }
                  label={t.modules}
                />

                <ResultCard
                  value={
                    analysis.course
                      ?.totalLessons ||
                    analysis.stats?.lessons ||
                    0
                  }
                  label={t.lessons}
                />

                <ResultCard
                  value={
                    analysis.questions?.length ||
                    0
                  }
                  label={t.questions}
                />

              </div>

              {/* KNOWLEDGE */}

              {analysis.importantKnowledge &&
                analysis.importantKnowledge.length >
                  0 && (
                  <div className="mt-9">

                    <h3 className="text-xl font-black">
                      {t.knowledge}
                    </h3>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">

                      {analysis.importantKnowledge.map(
                        (item, index) => (
                          <div
                            key={index}
                            className="rounded-2xl bg-slate-50 p-5"
                          >

                            <p className="font-black text-slate-900">
                              {item.title}
                            </p>

                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {item.description}
                            </p>

                          </div>
                        )
                      )}

                    </div>

                  </div>
                )}

              {/* SAVE */}

              {!savedCourseId && (
                <div className="mt-9 rounded-3xl border border-blue-100 bg-blue-50/60 p-6">

                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                    <div>

                      <p className="text-lg font-black">
                        Kurs hazırdır
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Kursu şirkətin sisteminə əlavə et.
                        Bundan sonra employee öz portalında
                        bu kursu görə biləcək.
                      </p>

                    </div>

                    <button
                      onClick={
                        saveCourseToDatabase
                      }
                      disabled={
                        savingCourse
                      }
                      className="rounded-2xl bg-blue-600 px-7 py-4 font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingCourse
                        ? t.savingCourse
                        : t.saveCourse}
                    </button>

                  </div>

                </div>
              )}

              {/* SUCCESS */}

              {saveMessage && (
                <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5 font-bold text-green-700">
                  ✓ {saveMessage}
                </div>
              )}

              {/* ACTIONS */}

              {savedCourseId && (
                <button
                  onClick={() => {
                    setFile(null);
                    setAnalysis(null);
                    setSavedCourseId("");
                    setSaveMessage("");
                    setError("");
                    setLanguageLocked(false);
                    localStorage.removeItem("praktikCourseLanguageDraft");
                    localStorage.removeItem("praktikCourseLanguage");
                  }}
                  className="mt-6 w-full rounded-2xl border-2 border-yellow-400 bg-yellow-50 px-7 py-4 font-black text-slate-900 hover:bg-yellow-100"
                >
                  + Yeni kurs yarat
                </button>
              )}

              <div className="mt-9 grid gap-4 md:grid-cols-2">

                <motion.button
                  whileHover={{
                    y: -3,
                  }}
                  whileTap={{
                    scale: 0.98,
                  }}
                  onClick={() => {
                    window.location.href =
                      savedCourseId
                        ? `/course?courseId=${savedCourseId}`
                        : "/course";
                  }}
                  className="rounded-2xl bg-yellow-400 px-7 py-5 text-lg font-black text-slate-950 transition hover:bg-yellow-300"
                >
                  {t.openCourse}
                </motion.button>

                <motion.button
                  whileHover={{
                    y: -3,
                  }}
                  whileTap={{
                    scale: 0.98,
                  }}
                  onClick={() => {
                    window.location.href =
                      "/exam";
                  }}
                  className="rounded-2xl bg-blue-600 px-7 py-5 text-lg font-black text-white transition hover:bg-blue-700"
                >
                  {t.startExam}
                </motion.button>

              </div>

            </div>

          </motion.div>
        )}

      </section>

    </main>
  );
}

function ResultCard({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-6">

      <p className="text-3xl font-black text-blue-600">
        {value}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-500">
        {label}
      </p>

    </div>
  );
}