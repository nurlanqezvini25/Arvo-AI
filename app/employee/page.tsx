"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

type Language = "az" | "en" | "ru";

const translations = {
  az: {
    portal: "ƏMƏKDAŞ PORTALI",
    welcome: "Xoş gəlmisən",
    exam: "Son imtahan",
    knowledge: "Bilik",
    scenario: "Praktik situasiya",
    readiness: "Hazırlıq",
    ready: "HAZIR",
    retraining: "ƏLAVƏ TƏLİM",
    noResult: "Hələ nəticə yoxdur",
    courses: "Mənim kurslarım",
    noCourses: "Hələ sənə kurs təyin edilməyib.",
    skills: "Mənim bacarıqlarım",
    noSkills: "İmtahandan sonra skill nəticələrin burada görünəcək.",
    xp: "XP",
    level: "Səviyyə",
    recentXp: "Son XP fəaliyyəti",
    noXp: "Hələ XP fəaliyyəti yoxdur.",
    progress: "Tərəqqi",
    openCourse: "Kursa keç",
    logout: "Çıxış",
    home: "Ana səhifə",
    loading: "Məlumatlar yüklənir...",
  },

  en: {
    portal: "EMPLOYEE PORTAL",
    welcome: "Welcome",
    exam: "Latest exam",
    knowledge: "Knowledge",
    scenario: "Scenario",
    readiness: "Readiness",
    ready: "READY",
    retraining: "RETRAINING",
    noResult: "No result yet",
    courses: "My Courses",
    noCourses: "No courses assigned yet.",
    skills: "My Skills",
    noSkills: "Skill results will appear after your assessment.",
    xp: "XP",
    level: "Level",
    recentXp: "Recent XP",
    noXp: "No XP activity yet.",
    progress: "Progress",
    openCourse: "Open course",
    logout: "Sign out",
    home: "Home",
    loading: "Loading data...",
  },

  ru: {
    portal: "ПОРТАЛ СОТРУДНИКА",
    welcome: "Добро пожаловать",
    exam: "Последний экзамен",
    knowledge: "Знания",
    scenario: "Сценарии",
    readiness: "Готовность",
    ready: "ГОТОВ",
    retraining: "НУЖНО ОБУЧЕНИЕ",
    noResult: "Результатов пока нет",
    courses: "Мои курсы",
    noCourses: "Курсы пока не назначены.",
    skills: "Мои навыки",
    noSkills: "Результаты навыков появятся после экзамена.",
    xp: "XP",
    level: "Уровень",
    recentXp: "Последний XP",
    noXp: "Истории XP пока нет.",
    progress: "Прогресс",
    openCourse: "Открыть курс",
    logout: "Выйти",
    home: "Главная",
    loading: "Загрузка данных...",
  },
};

export default function EmployeePage() {
  const [language, setLanguage] = useState<Language>("az");

  const [profile, setProfile] = useState<any>(null);
  const [companyName, setCompanyName] = useState("Praktik AI");

  const [exams, setExams] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [xpHistory, setXpHistory] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const t = translations[language];

  useEffect(() => {
    const saved = localStorage.getItem("praktikLanguage");

    if (saved === "az" || saved === "en" || saved === "ru") {
      setLanguage(saved);
    }

    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      window.location.href = "/login";
      return;
    }

    const userId = userData.user.id;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!profileData) {
      window.location.href = "/login";
      return;
    }

    if (profileData.role === "manager") {
      window.location.href = "/manager";
      return;
    }

    setProfile(profileData);

    if (profileData.company_id) {
      const { data: company } = await supabase
        .from("companies")
        .select("name")
        .eq("id", profileData.company_id)
        .single();

      if (company?.name) {
        setCompanyName(company.name);
      }
    }

    const [
      examResult,
      skillResult,
      assignmentResult,
      xpResult,
    ] = await Promise.all([
      supabase
        .from("exam_results")
        .select("*")
        .eq("employee_id", userId)
        .order("created_at", { ascending: false }),

      supabase
        .from("skill_scores")
        .select("*")
        .eq("employee_id", userId)
        .order("score", { ascending: false }),

      supabase
        .from("course_assignments")
        .select(`
          *,
          courses(
            title,
            description
          )
        `)
        .eq("employee_id", userId)
        .order("assigned_at", { ascending: false }),

      supabase
        .from("xp_transactions")
        .select("*")
        .eq("employee_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    setExams(examResult.data || []);
    setSkills(skillResult.data || []);
    setAssignments(assignmentResult.data || []);
    setXpHistory(xpResult.data || []);

    setLoading(false);
  }

  function changeLanguage(lang: Language) {
    setLanguage(lang);
    localStorage.setItem("praktikLanguage", lang);
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const latestExam = exams[0] || null;

  const xp = profile?.xp || 0;
  const level = profile?.level || Math.floor(xp / 500) + 1;

  const levelProgress = useMemo(() => {
    const start = (level - 1) * 500;
    return Math.min(100, Math.max(0, ((xp - start) / 500) * 100));
  }, [xp, level]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="mt-5 font-bold text-slate-500">{t.loading}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900">

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-black text-white">
              P
            </div>

            <div>
              <span className="font-black">PRAKTİK</span>
              <span className="ml-1 rounded bg-yellow-400 px-1.5 py-0.5 text-[10px] font-black">
                AI
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">

            <div className="flex rounded-xl border border-slate-200 p-1">
              {(["az", "en", "ru"] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => changeLanguage(lang)}
                  className={`rounded-lg px-3 py-2 text-xs font-black uppercase ${
                    language === lang
                      ? "bg-blue-600 text-white"
                      : "text-slate-500"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <button
              onClick={() => (window.location.href = "/")}
              className="hidden rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold md:block"
            >
              {t.home}
            </button>

            <button
              onClick={logout}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white"
            >
              {t.logout}
            </button>

          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">

        <div className="rounded-[30px] bg-[#0F172A] p-8 text-white">
          <p className="text-sm font-black text-blue-300">{t.portal}</p>

          <h1 className="mt-3 text-4xl font-black">
            {t.welcome}, {profile?.full_name || "Employee"} 👋
          </h1>

          <p className="mt-3 text-slate-400">
            {companyName}
            {profile?.job_title ? ` • ${profile.job_title}` : ""}
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">

          <StatCard
            label={t.exam}
            value={latestExam ? `${latestExam.score}%` : "—"}
          />

          <StatCard
            label={t.knowledge}
            value={
              latestExam?.knowledge_score !== null &&
              latestExam?.knowledge_score !== undefined
                ? `${latestExam.knowledge_score}%`
                : "—"
            }
          />

          <StatCard
            label={t.scenario}
            value={
              latestExam?.scenario_score !== null &&
              latestExam?.scenario_score !== undefined
                ? `${latestExam.scenario_score}%`
                : "—"
            }
          />

          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <p className="text-sm font-bold text-slate-400">
              {t.readiness}
            </p>

            {latestExam ? (
              <span
                className={`mt-4 inline-flex rounded-full px-4 py-2 text-xs font-black ${
                  latestExam.ready
                    ? "bg-green-50 text-green-700"
                    : "bg-yellow-50 text-yellow-700"
                }`}
              >
                {latestExam.ready ? t.ready : t.retraining}
              </span>
            ) : (
              <p className="mt-3 text-3xl font-black">—</p>
            )}
          </div>

        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">

          <div className="rounded-[28px] border border-slate-200 bg-white p-7">

            <p className="text-sm font-bold text-yellow-600">
              {t.level} {level}
            </p>

            <p className="mt-3 text-5xl font-black">{xp}</p>
            <p className="text-sm font-bold text-slate-400">{t.xp}</p>

            <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${levelProgress}%` }}
                className="h-full bg-yellow-400"
              />
            </div>

            <h3 className="mt-8 font-black">{t.recentXp}</h3>

            {xpHistory.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">{t.noXp}</p>
            ) : (
              <div className="mt-4 space-y-3">
                {xpHistory.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between rounded-xl bg-slate-50 p-3"
                  >
                    <span className="text-sm font-semibold">
                      {item.reason}
                    </span>

                    <span className="font-black text-green-600">
                      +{item.amount} XP
                    </span>
                  </div>
                ))}
              </div>
            )}

          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-7">

            <h2 className="text-2xl font-black">{t.courses}</h2>

            {assignments.length === 0 ? (
              <p className="mt-5 rounded-2xl bg-slate-50 p-5 text-slate-500">
                {t.noCourses}
              </p>
            ) : (
              <div className="mt-6 space-y-4">

                {assignments.map((assignment) => {
                  const course = Array.isArray(assignment.courses)
                    ? assignment.courses[0]
                    : assignment.courses;

                  return (
                    <div
                      key={assignment.id}
                      className="rounded-2xl border border-slate-200 p-5"
                    >

                      <div className="flex justify-between gap-4">

                        <div>
                          <h3 className="font-black">
                            {course?.title || "Course"}
                          </h3>

                          <p className="mt-2 text-sm text-slate-500">
                            {t.progress}: {assignment.progress}%
                          </p>
                        </div>

                        <button
                          onClick={() => {
  window.location.href = `/course?courseId=${assignment.course_id}`;
}}
                          className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white"
                        >
                          {t.openCourse}
                        </button>

                      </div>

                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          style={{ width: `${assignment.progress}%` }}
                          className="h-full bg-blue-600"
                        />
                      </div>

                    </div>
                  );
                })}

              </div>
            )}

          </div>
        </div>

        <div className="mt-6 rounded-[28px] border border-slate-200 bg-white p-7">

          <h2 className="text-2xl font-black">{t.skills}</h2>

          {skills.length === 0 ? (
            <p className="mt-5 rounded-2xl bg-slate-50 p-5 text-slate-500">
              {t.noSkills}
            </p>
          ) : (
            <div className="mt-7 grid gap-5 md:grid-cols-2">

              {skills.map((skill) => (
                <Skill
                  key={skill.id}
                  name={skill.skill_name}
                  score={skill.score}
                />
              ))}

            </div>
          )}

        </div>

      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6">
      <p className="text-sm font-bold text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-black">{value}</p>
    </div>
  );
}

function Skill({
  name,
  score,
}: {
  name: string;
  score: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-5">

      <div className="flex justify-between gap-4">
        <p className="font-black">{name}</p>
        <p className="font-black text-blue-600">{score}%</p>
      </div>

      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          className="h-full bg-blue-600"
        />
      </div>

    </div>
  );
}