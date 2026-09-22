"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "../../lib/supabase/client";

type Language = "az" | "en" | "ru";

type Question = {
  questionType:
    | "knowledge"
    | "scenario";

  question: string;

  options: string[];

  correctIndex: number;

  explanation: string;

  difficulty:
    | "easy"
    | "medium"
    | "hard";

  skill: string;

  scenarioTitle?: string;

  scenarioContext?: string;

  imageSearchQuery?: string;
};

type SkillResult = {
  skill: string;
  correct: number;
  total: number;
  score: number;
};

type Result = {
  score: number;

  knowledgeScore: number;

  scenarioScore: number;

  correctAnswers: number;

  totalQuestions: number;

  ready: boolean;

  skills: SkillResult[];
};

const translations = {
  az: {
    exam: "RƏQƏMSAL QİYMƏTLƏNDİRMƏ",

    knowledge: "Bilik sualı",

    scenario: "İş situasiyası",

    question: "Sual",

    of: "/",

    next: "Növbəti sual →",

    finish: "İmtahanı bitir",

    select: "Cavab seç",

    result: "Qiymətləndirmə tamamlandı",

    overall: "Ümumi nəticə",

    knowledgeScore: "Bilik",

    scenarioScore: "Scenario",

    readiness: "Readiness",

    ready: "READY",

    retraining: "RETRAINING",

    skills: "Skill Profile",

    strong: "Güclü bacarıqlar",

    improve: "İnkişaf etdirilməli bacarıqlar",

    saved:
      "Nəticə employee profilinə və manager dashboard-a yazıldı.",

    notSaved:
      "Nəticə göstərilir, lakin database-ə yazılmadı.",

    loginNeeded:
      "Real nəticəni saxlamaq üçün employee hesabı ilə login ol.",

    saving:
      "Nəticə database-ə yazılır...",

    portal: "Employee Portal →",

    course: "Kursa qayıt",

    noQuestions:
      "İmtahan sualları tapılmadı. PDF-i yenidən analiz et.",

    easy: "ASAN",

    medium: "ORTA",

    hard: "ÇƏTİN",
  },

  en: {
    exam: "DIGITAL ASSESSMENT",

    knowledge: "Knowledge question",

    scenario: "Workplace scenario",

    question: "Question",

    of: "/",

    next: "Next question →",

    finish: "Finish assessment",

    select: "Select an answer",

    result: "Assessment completed",

    overall: "Overall score",

    knowledgeScore: "Knowledge",

    scenarioScore: "Scenario",

    readiness: "Readiness",

    ready: "READY",

    retraining: "RETRAINING",

    skills: "Skill Profile",

    strong: "Strong skills",

    improve: "Skills to improve",

    saved:
      "The result was saved to the employee profile and manager dashboard.",

    notSaved:
      "The result is shown but was not saved to the database.",

    loginNeeded:
      "Sign in with an employee account to save the result.",

    saving:
      "Saving result to database...",

    portal: "Employee Portal →",

    course: "Back to course",

    noQuestions:
      "No assessment questions found. Analyze the PDF again.",

    easy: "EASY",

    medium: "MEDIUM",

    hard: "HARD",
  },

  ru: {
    exam: "ЦИФРОВАЯ ОЦЕНКА",

    knowledge: "Вопрос на знания",

    scenario: "Рабочая ситуация",

    question: "Вопрос",

    of: "/",

    next: "Следующий вопрос →",

    finish: "Завершить тест",

    select: "Выберите ответ",

    result: "Оценка завершена",

    overall: "Общий результат",

    knowledgeScore: "Знания",

    scenarioScore: "Сценарии",

    readiness: "Готовность",

    ready: "ГОТОВ",

    retraining: "НУЖНО ОБУЧЕНИЕ",

    skills: "Профиль навыков",

    strong: "Сильные навыки",

    improve: "Навыки для развития",

    saved:
      "Результат сохранен в профиле сотрудника и панели менеджера.",

    notSaved:
      "Результат показан, но не сохранен в базе.",

    loginNeeded:
      "Войдите как сотрудник, чтобы сохранить результат.",

    saving:
      "Сохранение результата...",

    portal: "Портал сотрудника →",

    course: "Вернуться к курсу",

    noQuestions:
      "Вопросы не найдены. Проанализируйте PDF заново.",

    easy: "ЛЕГКО",

    medium: "СРЕДНЕ",

    hard: "СЛОЖНО",
  },
};

export default function ExamPage() {
  const searchParams = useSearchParams();

  /*
   * URL-dən courseId götürürük.
   *
   * Məsələn:
   * /exam?courseId=123
   *
   * burada courseId = 123 olacaq.
   */
  const courseId =
    searchParams.get("courseId");

  const [language, setLanguage] =
    useState<Language>("az");

  const [questions, setQuestions] =
    useState<Question[]>([]);

  const [answers, setAnswers] =
    useState<
      Array<number | null>
    >([]);

  const [
    currentQuestion,
    setCurrentQuestion,
  ] = useState(0);

  const [
    scenarioImages,
    setScenarioImages,
  ] = useState<
    Record<string, string>
  >({});

  const [loading, setLoading] =
    useState(true);

  const [finished, setFinished] =
    useState(false);

  const [result, setResult] =
    useState<Result | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [saveMessage, setSaveMessage] =
    useState("");

  const [saveSuccess, setSaveSuccess] =
    useState(false);

  const t =
    translations[language];

  /*
   * =========================================
   * LOAD LANGUAGE + QUESTIONS
   * =========================================
   */

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

    const stored =
      localStorage.getItem(
        "praktikExamQuestions"
      );

    if (!stored) {
      setLoading(false);
      return;
    }

    try {
      const parsed =
        JSON.parse(stored);

      if (
        Array.isArray(parsed)
      ) {
        setQuestions(parsed);

        setAnswers(
          new Array(
            parsed.length
          ).fill(null)
        );
      }
    } catch (error) {
      console.error(
        "QUESTION PARSE ERROR:",
        error
      );
    }

    setLoading(false);
  }, []);

  /*
   * =========================================
   * SCENARIO IMAGES
   * =========================================
   */

  useEffect(() => {
    if (
      questions.length === 0
    ) {
      return;
    }

    async function loadImages() {
      try {
        const response =
          await fetch(
            "/api/generate-scenario-images",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                questions,
              }),
            }
          );

        if (!response.ok) {
          return;
        }

        const rawResponse =
          await response.text();

        if (!rawResponse) {
          throw new Error(
            "Server boş cavab qaytardı."
          );
        }

        let data;

        try {
          data =
            JSON.parse(
              rawResponse
            );
        } catch {
          throw new Error(
            "Server düzgün JSON cavabı qaytarmadı."
          );
        }

        setScenarioImages(
          data.images || {}
        );
      } catch (error) {
        console.error(
          "SCENARIO IMAGE ERROR:",
          error
        );
      }
    }

    loadImages();
  }, [questions]);

  /*
   * =========================================
   * LOCAL RESULT CALCULATION
   * =========================================
   */

  function calculateResult(): Result {
    let totalCorrect = 0;

    let knowledgeCorrect = 0;
    let knowledgeTotal = 0;

    let scenarioCorrect = 0;
    let scenarioTotal = 0;

    const skillMap =
      new Map<
        string,
        {
          correct: number;
          total: number;
        }
      >();

    questions.forEach(
      (
        question,
        index
      ) => {
        const isCorrect =
          answers[index] ===
          question.correctIndex;

        if (isCorrect) {
          totalCorrect++;
        }

        if (
          question.questionType ===
          "knowledge"
        ) {
          knowledgeTotal++;

          if (isCorrect) {
            knowledgeCorrect++;
          }
        }

        if (
          question.questionType ===
          "scenario"
        ) {
          scenarioTotal++;

          if (isCorrect) {
            scenarioCorrect++;
          }
        }

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
      if (!total) {
        return 0;
      }

      return Math.round(
        (correct / total) *
          100
      );
    }

    const score =
      percent(
        totalCorrect,
        questions.length
      );

    const knowledgeScore =
      percent(
        knowledgeCorrect,
        knowledgeTotal
      );

    const scenarioScore =
      percent(
        scenarioCorrect,
        scenarioTotal
      );

    const skills =
      Array.from(
        skillMap.entries()
      )
        .map(
          ([
            skill,
            value,
          ]) => ({
            skill,

            correct:
              value.correct,

            total:
              value.total,

            score:
              percent(
                value.correct,
                value.total
              ),
          })
        )
        .sort(
          (a, b) =>
            b.score -
            a.score
        );

    return {
      score,

      knowledgeScore,

      scenarioScore,

      correctAnswers:
        totalCorrect,

      totalQuestions:
        questions.length,

      ready:
        score >= 80 &&
        knowledgeScore >= 70 &&
        scenarioScore >= 70,

      skills,
    };
  }

  /*
   * =========================================
   * SAVE RESULT TO DATABASE
   * =========================================
   */

  async function saveResult(
    finalAnswers: Array<
      number | null
    >
  ) {
    try {
      setSaving(true);

      setSaveMessage("");

      setSaveSuccess(false);

      /*
       * Ən vacib yoxlama:
       * courseId URL-dən gəlməlidir.
       */

      if (!courseId) {
        throw new Error(
          "courseId tapılmadı. İmtahan kurs ID-si ilə açılmayıb."
        );
      }

      const supabase =
        createClient();

      const {
        data: sessionData,
        error: sessionError,
      } =
        await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(
          `Session xətası: ${sessionError.message}`
        );
      }

      const session =
        sessionData.session;

      if (!session) {
        setSaveSuccess(false);

        setSaveMessage(
          t.loginNeeded
        );

        return;
      }

      /*
       * API-yə:
       * courseId
       * questions
       * answers
       * göndəririk.
       */

      const response =
        await fetch(
          "/api/save-exam-result",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${session.access_token}`,
            },

            body: JSON.stringify({
              courseId,

              questions,

              answers:
                finalAnswers,
            }),
          }
        );

      const rawResponse =
        await response.text();

      console.log(
        "SAVE EXAM STATUS:",
        response.status
      );

      console.log(
        "SAVE EXAM RAW RESPONSE:",
        rawResponse
      );

      if (!rawResponse) {
        throw new Error(
          `Save API boş cavab qaytardı. HTTP status: ${response.status}`
        );
      }

      let data: any;

      try {
        data =
          JSON.parse(
            rawResponse
          );
      } catch {
        throw new Error(
          `Save API JSON qaytarmadı: ${rawResponse.slice(
            0,
            300
          )}`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Nəticə saxlanılmadı. HTTP ${response.status}`
        );
      }

      /*
       * API uğurlu oldu.
       */

      setSaveSuccess(true);

      setSaveMessage(
        t.saved
      );

      /*
       * Serverin hesabladığı
       * nəticəni ekranda göstəririk.
       */

      if (data.result) {
        setResult(
          data.result
        );
      }
    } catch (error) {
      console.error(
        "SAVE RESULT ERROR:",
        error
      );

      setSaveSuccess(false);

      setSaveMessage(
        error instanceof Error
          ? error.message
          : t.notSaved
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * =========================================
   * ANSWER
   * =========================================
   */

  function chooseAnswer(
    optionIndex: number
  ) {
    setAnswers(
      (previous) => {
        const copy = [
          ...previous,
        ];

        copy[
          currentQuestion
        ] = optionIndex;

        return copy;
      }
    );
  }

  /*
   * =========================================
   * NEXT / FINISH
   * =========================================
   */

  async function next() {
    if (
      answers[
        currentQuestion
      ] === null
    ) {
      return;
    }

    if (
      currentQuestion <
      questions.length - 1
    ) {
      setCurrentQuestion(
        (value) =>
          value + 1
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    /*
     * Son sualdır.
     */

    const localResult =
      calculateResult();

    setResult(
      localResult
    );

    setFinished(true);

    /*
     * Database-ə yaz.
     */

    await saveResult(
      answers
    );
  }

  /*
   * =========================================
   * PROGRESS
   * =========================================
   */

  const progress =
    questions.length > 0
      ? ((currentQuestion +
          1) /
          questions.length) *
        100
      : 0;

  const question =
    questions[
      currentQuestion
    ];

  const strongSkills =
    useMemo(
      () =>
        result?.skills.filter(
          (skill) =>
            skill.score >= 80
        ) || [],
      [result]
    );

  const weakSkills =
    useMemo(
      () =>
        result?.skills.filter(
          (skill) =>
            skill.score < 80
        ) || [],
      [result]
    );

  /*
   * =========================================
   * LOADING
   * =========================================
   */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </main>
    );
  }

  /*
   * =========================================
   * NO QUESTIONS
   * =========================================
   */

  if (
    questions.length === 0
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-6">
        <div className="max-w-lg rounded-[30px] border border-slate-200 bg-white p-10 text-center">
          <h1 className="text-2xl font-black">
            Praktik AI
          </h1>

          <p className="mt-4 leading-7 text-slate-500">
            {t.noQuestions}
          </p>

          <button
            onClick={() =>
              (window.location.href =
                "/workspace")
            }
            className="mt-7 rounded-xl bg-blue-600 px-6 py-3 font-black text-white"
          >
            Workspace
          </button>
        </div>
      </main>
    );
  }

  /*
   * =========================================
   * RESULTS
   * =========================================
   */

  if (
    finished &&
    result
  ) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] px-6 py-12 text-slate-900">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="overflow-hidden rounded-[34px] border border-slate-200 bg-white"
          >
            <div className="bg-[#0F172A] p-8 text-white md:p-10">
              <p className="text-sm font-black tracking-[0.15em] text-blue-300">
                PRAKTİK AI
              </p>

              <h1 className="mt-3 text-3xl font-black md:text-5xl">
                {t.result}
              </h1>

              <div className="mt-8 flex flex-wrap items-end gap-7">
                <div>
                  <p className="text-sm text-slate-400">
                    {t.overall}
                  </p>

                  <p className="mt-1 text-6xl font-black">
                    {
                      result.score
                    }
                    %
                  </p>
                </div>

                <span
                  className={`rounded-full px-5 py-3 text-sm font-black ${
                    result.ready
                      ? "bg-green-500/15 text-green-300"
                      : "bg-yellow-400/15 text-yellow-300"
                  }`}
                >
                  {result.ready
                    ? t.ready
                    : t.retraining}
                </span>
              </div>
            </div>

            <div className="p-8 md:p-10">
              <div className="grid gap-4 md:grid-cols-3">
                <ResultCard
                  label={
                    t.knowledgeScore
                  }
                  value={`${result.knowledgeScore}%`}
                />

                <ResultCard
                  label={
                    t.scenarioScore
                  }
                  value={`${result.scenarioScore}%`}
                />

                <ResultCard
                  label={`${result.correctAnswers} / ${result.totalQuestions}`}
                  value={`${result.score}%`}
                />
              </div>

              {saving && (
                <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 font-bold text-blue-700">
                  {t.saving}
                </div>
              )}

              {saveMessage && (
                <div
                  className={`mt-6 rounded-2xl border p-5 text-sm font-bold ${
                    saveSuccess
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-yellow-200 bg-yellow-50 text-yellow-800"
                  }`}
                >
                  {saveMessage}
                </div>
              )}

              <div className="mt-10">
                <p className="text-sm font-black tracking-[0.15em] text-blue-600">
                  AI SKILL ANALYTICS
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  {t.skills}
                </h2>

                <div className="mt-7 grid gap-5 md:grid-cols-2">
                  {result.skills.map(
                    (skill) => (
                      <SkillResultCard
                        key={
                          skill.skill
                        }
                        skill={
                          skill
                        }
                      />
                    )
                  )}
                </div>
              </div>

              <div className="mt-10 grid gap-6 md:grid-cols-2">
                <div className="rounded-3xl border border-green-200 bg-green-50 p-6">
                  <h3 className="text-lg font-black text-green-800">
                    ✓ {t.strong}
                  </h3>

                  <div className="mt-4 space-y-2">
                    {strongSkills.length >
                    0 ? (
                      strongSkills.map(
                        (
                          skill
                        ) => (
                          <p
                            key={
                              skill.skill
                            }
                            className="font-bold text-green-700"
                          >
                            {
                              skill.skill
                            }{" "}
                            —{" "}
                            {
                              skill.score
                            }
                            %
                          </p>
                        )
                      )
                    ) : (
                      <p className="text-sm text-green-700">
                        —
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-6">
                  <h3 className="text-lg font-black text-yellow-800">
                    ↗ {t.improve}
                  </h3>

                  <div className="mt-4 space-y-2">
                    {weakSkills.length >
                    0 ? (
                      weakSkills.map(
                        (
                          skill
                        ) => (
                          <p
                            key={
                              skill.skill
                            }
                            className="font-bold text-yellow-800"
                          >
                            {
                              skill.skill
                            }{" "}
                            —{" "}
                            {
                              skill.score
                            }
                            %
                          </p>
                        )
                      )
                    ) : (
                      <p className="text-sm text-yellow-800">
                        —
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() =>
                    (window.location.href =
                      "/employee")
                  }
                  className="rounded-2xl bg-blue-600 px-7 py-4 font-black text-white"
                >
                  {t.portal}
                </button>

                <button
                  onClick={() =>
                    (window.location.href =
                      courseId
                        ? `/course?courseId=${courseId}`
                        : "/course")
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-7 py-4 font-black text-slate-700"
                >
                  {t.course}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    );
  }

  /*
   * =========================================
   * EXAM
   * =========================================
   */

  const selectedAnswer =
    answers[
      currentQuestion
    ];

  const scenarioImage =
    scenarioImages[
      String(
        currentQuestion
      )
    ];

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-black tracking-[0.14em] text-blue-600">
              {t.exam}
            </p>

            <p className="mt-1 font-black">
              {t.question}{" "}
              {currentQuestion +
                1}{" "}
              {t.of}{" "}
              {questions.length}
            </p>
          </div>

          <span
            className={`rounded-full px-4 py-2 text-xs font-black ${
              question.questionType ===
              "scenario"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-blue-50 text-blue-700"
            }`}
          >
            {question.questionType ===
            "scenario"
              ? t.scenario
              : t.knowledge}
          </span>
        </div>

        <div className="h-1.5 bg-slate-100">
          <motion.div
            animate={{
              width: `${progress}%`,
            }}
            className="h-full bg-blue-600"
          />
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-10">
        <motion.div
          key={
            currentQuestion
          }
          initial={{
            opacity: 0,
            y: 15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-sm md:p-9"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-600">
              {question.skill}
            </span>

            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-500">
              {question.difficulty ===
              "easy"
                ? t.easy
                : question.difficulty ===
                    "hard"
                  ? t.hard
                  : t.medium}
            </span>
          </div>

          {question.questionType ===
            "scenario" && (
            <div className="mt-7">
              {scenarioImage && (
                <img
                  src={
                    scenarioImage
                  }
                  alt={
                    question.scenarioTitle ||
                    "Scenario"
                  }
                  className="h-[240px] w-full rounded-3xl object-cover md:h-[320px]"
                />
              )}

              <div className="mt-5 rounded-2xl bg-slate-50 p-5">
                <h2 className="text-xl font-black">
                  {
                    question.scenarioTitle
                  }
                </h2>

                <p className="mt-3 leading-7 text-slate-600">
                  {
                    question.scenarioContext
                  }
                </p>
              </div>
            </div>
          )}

          <h1 className="mt-7 text-2xl font-black leading-tight md:text-3xl">
            {question.question}
          </h1>

          <div className="mt-7 space-y-3">
            {question.options.map(
              (
                option,
                index
              ) => {
                const selected =
                  selectedAnswer ===
                  index;

                return (
                  <button
                    key={index}
                    onClick={() =>
                      chooseAnswer(
                        index
                      )
                    }
                    className={`flex w-full items-center gap-4 rounded-2xl border p-5 text-left transition ${
                      selected
                        ? "border-blue-500 bg-blue-50 ring-4 ring-blue-50"
                        : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                        selected
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {String.fromCharCode(
                        65 +
                          index
                      )}
                    </div>

                    <span className="font-semibold leading-6">
                      {option}
                    </span>
                  </button>
                );
              }
            )}
          </div>

          <button
            disabled={
              selectedAnswer ===
              null
            }
            onClick={next}
            className="mt-8 w-full rounded-2xl bg-blue-600 px-7 py-4 font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {currentQuestion ===
            questions.length - 1
              ? t.finish
              : t.next}
          </button>
        </motion.div>
      </section>
    </main>
  );
}

function ResultCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-6">
      <p className="text-sm font-bold text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black">
        {value}
      </p>
    </div>
  );
}

function SkillResultCard({
  skill,
}: {
  skill: SkillResult;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-5">
      <div className="flex justify-between gap-4">
        <div>
          <p className="font-black">
            {skill.skill}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {skill.correct} /{" "}
            {skill.total}{" "}
            correct
          </p>
        </div>

        <p className="text-xl font-black text-blue-600">
          {skill.score}%
        </p>
      </div>

      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <motion.div
          initial={{
            width: 0,
          }}
          animate={{
            width: `${skill.score}%`,
          }}
          className="h-full rounded-full bg-blue-600"
        />
      </div>
    </div>
  );
}