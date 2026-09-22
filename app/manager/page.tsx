"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

type Language = "az" | "en" | "ru";

const translations = {
  az: {
    portal: "MENECER PORTALI",
    title: "Komanda Dashboard-u",
    companyReadiness: "Komanda hazırlığı",
    employees: "Əməkdaşlar",
    ready: "HAZIR",
    retraining: "Əlavə təlim",
    notAssessed: "Qiymətləndirilməyib",
    teamSkills: "Komanda bacarıqları",
    leaderboard: "Leaderboard",
    results: "Əməkdaş nəticələri",
    employee: "Əməkdaş",
    progress: "Tərəqqi",
    exam: "İmtahan",
    readiness: "Hazırlıq",
    status: "Status",
    profile: "Əməkdaş profili",
    knowledge: "Bilik",
    scenario: "Scenario",
    xp: "XP",
    level: "Səviyyə",
    skills: "Skill Profile",
    noSkills: "Hələ skill nəticəsi yoxdur.",
    noExam: "Hələ imtahan verməyib",
    noEmployees: "Bu şirkətdə hələ əməkdaş yoxdur.",
    noLeaderboard: "Hələ XP nəticəsi yoxdur.",
    noTeamSkills: "Hələ komanda skill datası yoxdur.",
    logout: "Çıxış",
    home: "Ana səhifə",
    loading: "Real nəticələr yüklənir...",
  },

  en: {
    portal: "MANAGER PORTAL",
    title: "Team Dashboard",
    companyReadiness: "Team Readiness",
    employees: "Employees",
    ready: "READY",
    retraining: "Retraining",
    notAssessed: "Not assessed",
    teamSkills: "Team Skills",
    leaderboard: "Leaderboard",
    results: "Employee Results",
    employee: "Employee",
    progress: "Progress",
    exam: "Exam",
    readiness: "Readiness",
    status: "Status",
    profile: "Employee Profile",
    knowledge: "Knowledge",
    scenario: "Scenario",
    xp: "XP",
    level: "Level",
    skills: "Skill Profile",
    noSkills: "No skill results yet.",
    noExam: "No assessment yet",
    noEmployees: "No employees in this company yet.",
    noLeaderboard: "No XP results yet.",
    noTeamSkills: "No team skill data yet.",
    logout: "Sign out",
    home: "Home",
    loading: "Loading real results...",
  },

  ru: {
    portal: "ПОРТАЛ МЕНЕДЖЕРА",
    title: "Панель команды",
    companyReadiness: "Готовность команды",
    employees: "Сотрудники",
    ready: "ГОТОВЫ",
    retraining: "Нужно обучение",
    notAssessed: "Не оценены",
    teamSkills: "Навыки команды",
    leaderboard: "Рейтинг",
    results: "Результаты сотрудников",
    employee: "Сотрудник",
    progress: "Прогресс",
    exam: "Экзамен",
    readiness: "Готовность",
    status: "Статус",
    profile: "Профиль сотрудника",
    knowledge: "Знания",
    scenario: "Сценарии",
    xp: "XP",
    level: "Уровень",
    skills: "Профиль навыков",
    noSkills: "Результатов навыков пока нет.",
    noExam: "Экзамен еще не пройден",
    noEmployees: "В компании пока нет сотрудников.",
    noLeaderboard: "Результатов XP пока нет.",
    noTeamSkills: "Данных по навыкам команды пока нет.",
    logout: "Выйти",
    home: "Главная",
    loading: "Загрузка реальных результатов...",
  },
};

export default function ManagerPage() {
  const [language, setLanguage] = useState<Language>("az");

  const [manager, setManager] = useState<any>(null);
  const [companyName, setCompanyName] = useState("Praktik AI");

  const [employees, setEmployees] = useState<any[]>([]);
  const [examResults, setExamResults] = useState<any[]>([]);
  const [skillScores, setSkillScores] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  const [selectedEmployeeId, setSelectedEmployeeId] =
    useState<string | null>(null);

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

    const { data: managerProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userData.user.id)
      .single();

    if (!managerProfile) {
      window.location.href = "/login";
      return;
    }

    if (managerProfile.role !== "manager") {
      window.location.href = "/employee";
      return;
    }

    setManager(managerProfile);

    if (managerProfile.company_id) {
      const { data: company } = await supabase
        .from("companies")
        .select("name")
        .eq("id", managerProfile.company_id)
        .single();

      if (company?.name) {
        setCompanyName(company.name);
      }
    }

    const [
      employeeResult,
      examResult,
      skillResult,
      assignmentResult,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("role", "employee"),

      supabase
        .from("exam_results")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
        .from("skill_scores")
        .select("*"),

      supabase
        .from("course_assignments")
        .select("*"),
    ]);

    const realEmployees = employeeResult.data || [];

    setEmployees(realEmployees);
    setExamResults(examResult.data || []);
    setSkillScores(skillResult.data || []);
    setAssignments(assignmentResult.data || []);

    if (realEmployees.length > 0) {
      setSelectedEmployeeId(realEmployees[0].id);
    }

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

  function getLatestExam(employeeId: string) {
    return examResults.find(
      (exam) => exam.employee_id === employeeId
    );
  }

  function getEmployeeSkills(employeeId: string) {
    return skillScores.filter(
      (skill) => skill.employee_id === employeeId
    );
  }

  function getEmployeeProgress(employeeId: string) {
    const employeeAssignments = assignments.filter(
      (item) => item.employee_id === employeeId
    );

    if (employeeAssignments.length === 0) {
      return null;
    }

    const total = employeeAssignments.reduce(
      (sum, item) => sum + Number(item.progress || 0),
      0
    );

    return Math.round(total / employeeAssignments.length);
  }

  const latestExams = useMemo(() => {
    return employees
      .map((employee) => ({
        employee,
        exam: getLatestExam(employee.id),
      }))
      .filter((item) => item.exam);
  }, [employees, examResults]);

  const teamReadiness = useMemo(() => {
    if (latestExams.length === 0) {
      return null;
    }

    const total = latestExams.reduce(
      (sum, item) => sum + item.exam.score,
      0
    );

    return Math.round(total / latestExams.length);
  }, [latestExams]);

  const readyCount = latestExams.filter(
    (item) => item.exam.ready
  ).length;

  const retrainingCount = latestExams.filter(
    (item) => !item.exam.ready
  ).length;

  const notAssessedCount =
    employees.length - latestExams.length;

  const teamSkills = useMemo(() => {
    const map = new Map<
      string,
      { total: number; count: number }
    >();

    skillScores.forEach((skill) => {
      const current = map.get(skill.skill_name) || {
        total: 0,
        count: 0,
      };

      current.total += Number(skill.score || 0);
      current.count += 1;

      map.set(skill.skill_name, current);
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({
        name,
        score: Math.round(value.total / value.count),
      }))
      .sort((a, b) => b.score - a.score);
  }, [skillScores]);

  const leaderboard = useMemo(() => {
    return [...employees]
      .sort((a, b) => Number(b.xp || 0) - Number(a.xp || 0))
      .filter((employee) => Number(employee.xp || 0) > 0);
  }, [employees]);

  const selectedEmployee =
    employees.find((employee) => employee.id === selectedEmployeeId) ||
    null;

  const selectedExam = selectedEmployee
    ? getLatestExam(selectedEmployee.id)
    : null;

  const selectedSkills = selectedEmployee
    ? getEmployeeSkills(selectedEmployee.id)
    : [];

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

          <div>
            <p className="text-xs font-black text-blue-600">
              {t.portal}
            </p>

            <h1 className="mt-1 text-2xl font-black">
              {t.title}
            </h1>
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
              onClick={() => (window.location.href = "/workspace")}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              AI Course Builder →
            </button>

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

          <p className="text-sm font-bold text-blue-300">
            {companyName}
          </p>

          <h2 className="mt-3 text-4xl font-black">
            {manager?.full_name || "Manager"}
          </h2>

        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">

          <StatCard
            label={t.companyReadiness}
            value={teamReadiness !== null ? `${teamReadiness}%` : "—"}
          />

          <StatCard
            label={t.employees}
            value={String(employees.length)}
          />

          <StatCard
            label={t.ready}
            value={String(readyCount)}
          />

          <StatCard
            label={t.retraining}
            value={String(retrainingCount)}
            detail={
              notAssessedCount > 0
                ? `${notAssessedCount} ${t.notAssessed}`
                : undefined
            }
          />

        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">

          <div className="rounded-[28px] border border-slate-200 bg-white p-7">

            <h2 className="text-2xl font-black">{t.teamSkills}</h2>

            {teamSkills.length === 0 ? (
              <p className="mt-5 text-slate-500">{t.noTeamSkills}</p>
            ) : (
              <div className="mt-7 space-y-5">

                {teamSkills.map((skill) => (
                  <Skill
                    key={skill.name}
                    name={skill.name}
                    score={skill.score}
                  />
                ))}

              </div>
            )}

          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-7">

            <h2 className="text-2xl font-black">{t.leaderboard}</h2>

            {leaderboard.length === 0 ? (
              <p className="mt-5 text-slate-500">
                {t.noLeaderboard}
              </p>
            ) : (
              <div className="mt-6 space-y-3">

                {leaderboard.slice(0, 5).map((employee, index) => (
                  <div
                    key={employee.id}
                    className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4"
                  >

                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl font-black ${
                        index === 0
                          ? "bg-yellow-400"
                          : "bg-white"
                      }`}
                    >
                      #{index + 1}
                    </div>

                    <div className="flex-1">
                      <p className="font-black">
                        {employee.full_name}
                      </p>

                      <p className="text-xs text-slate-400">
                        {employee.job_title || "Employee"}
                      </p>
                    </div>

                    <p className="font-black text-blue-600">
                      {employee.xp || 0} XP
                    </p>

                  </div>
                ))}

              </div>
            )}

          </div>

        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">

          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">

            <div className="border-b border-slate-100 p-6">
              <h2 className="text-2xl font-black">{t.results}</h2>
            </div>

            {employees.length === 0 ? (
              <p className="p-6 text-slate-500">{t.noEmployees}</p>
            ) : (
              <div className="overflow-x-auto">

                <table className="w-full min-w-[700px]">

                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs font-black text-slate-400">
                      <th className="px-6 py-4">{t.employee}</th>
                      <th className="px-4 py-4">{t.progress}</th>
                      <th className="px-4 py-4">{t.exam}</th>
                      <th className="px-4 py-4">{t.readiness}</th>
                      <th className="px-4 py-4">{t.status}</th>
                    </tr>
                  </thead>

                  <tbody>

                    {employees.map((employee) => {
                      const exam = getLatestExam(employee.id);
                      const progress = getEmployeeProgress(employee.id);

                      return (
                        <tr
                          key={employee.id}
                          onClick={() => setSelectedEmployeeId(employee.id)}
                          className={`cursor-pointer border-b border-slate-50 ${
                            selectedEmployeeId === employee.id
                              ? "bg-blue-50"
                              : "hover:bg-slate-50"
                          }`}
                        >

                          <td className="px-6 py-4">
                            <p className="font-black">
                              {employee.full_name || "Employee"}
                            </p>

                            <p className="text-xs text-slate-400">
                              {employee.job_title || ""}
                            </p>
                          </td>

                          <td className="px-4 py-4 font-bold">
                            {progress !== null ? `${progress}%` : "—"}
                          </td>

                          <td className="px-4 py-4 font-bold">
                            {exam ? `${exam.score}%` : "—"}
                          </td>

                          <td className="px-4 py-4 font-bold text-blue-600">
                            {exam ? `${exam.score}%` : "—"}
                          </td>

                          <td className="px-4 py-4">
                            {!exam ? (
                              <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-500">
                                {t.notAssessed}
                              </span>
                            ) : exam.ready ? (
                              <span className="rounded-full bg-green-50 px-3 py-2 text-xs font-black text-green-700">
                                {t.ready}
                              </span>
                            ) : (
                              <span className="rounded-full bg-yellow-50 px-3 py-2 text-xs font-black text-yellow-700">
                                {t.retraining}
                              </span>
                            )}
                          </td>

                        </tr>
                      );
                    })}

                  </tbody>

                </table>

              </div>
            )}

          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6">

            <p className="text-xs font-black text-slate-400">
              {t.profile}
            </p>

            {!selectedEmployee ? (
              <p className="mt-5 text-slate-500">—</p>
            ) : (
              <>
                <h3 className="mt-4 text-2xl font-black">
                  {selectedEmployee.full_name}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {selectedEmployee.job_title || ""}
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3">

                  <MiniStat
                    label={t.exam}
                    value={selectedExam ? `${selectedExam.score}%` : "—"}
                  />

                  <MiniStat
                    label={t.knowledge}
                    value={
                      selectedExam?.knowledge_score !== null &&
                      selectedExam?.knowledge_score !== undefined
                        ? `${selectedExam.knowledge_score}%`
                        : "—"
                    }
                  />

                  <MiniStat
                    label={t.scenario}
                    value={
                      selectedExam?.scenario_score !== null &&
                      selectedExam?.scenario_score !== undefined
                        ? `${selectedExam.scenario_score}%`
                        : "—"
                    }
                  />

                  <MiniStat
                    label={t.xp}
                    value={String(selectedEmployee.xp || 0)}
                  />

                </div>

                <h4 className="mt-7 font-black">{t.skills}</h4>

                {selectedSkills.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-500">
                    {t.noSkills}
                  </p>
                ) : (
                  <div className="mt-5 space-y-4">

                    {selectedSkills.map((skill) => (
                      <Skill
                        key={skill.id}
                        name={skill.skill_name}
                        score={skill.score}
                      />
                    ))}

                  </div>
                )}
              </>
            )}

          </div>

        </div>

      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-6">
      <p className="text-sm font-bold text-slate-400">{label}</p>
      <p className="mt-3 text-4xl font-black">{value}</p>

      {detail && (
        <p className="mt-2 text-xs font-semibold text-slate-500">
          {detail}
        </p>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
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
    <div>

      <div className="flex justify-between gap-4 text-sm font-bold">
        <span>{name}</span>
        <span>{score}%</span>
      </div>

      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          className="h-full bg-blue-600"
        />
      </div>

    </div>
  );
}