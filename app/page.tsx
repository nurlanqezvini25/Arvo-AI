"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type Language = "az" | "en" | "ru";

const translations = {
  az: {
    nav: {
      platform: "Platforma",
      training: "AI Təlim",
      scenario: "Scenario Lab",
      analytics: "Analitika",
      login: "Daxil ol",
    },

    badge: "AI əsaslı əməkdaş hazırlığı platforması",

    heroLine1: "Şirkət biliyini",
    heroHighlight: "iş bacarığına",
    heroLine2: "çevir.",

    heroText:
      "SOP və təlim materiallarını AI ilə tam kursa çevir, əməkdaşları real iş situasiyalarında sına və onların işə hazır olub-olmadığını ölç.",

    manager: "Manager",
    managerText:
      "Kurs yarat, əməkdaşlara təyin et və nəticələri idarə et.",
    managerButton: "Manager kimi daxil ol →",

    employee: "Employee",
    employeeText:
      "Sənə təyin edilmiş kursları keç, biliklərini yoxla və nəticələrini gör.",
    employeeButton: "Employee kimi daxil ol →",

    how: "Necə işləyir?",

    multilingual: "AZ / EN / RU",
    courseBuilder: "AI Course Builder",
    skillAnalytics: "Skill Analytics",

    teamReadiness: "Komandanın hazırlığı",
    employeesReady: "Hazır əməkdaşlar",
    needRetraining: "Yenidən təlim lazımdır",
    weakestSkill: "Ən zəif bacarıq",

    communication: "Kommunikasiya",
    policy: "Prosedur biliyi",
    escalation: "Eskalasiya",

    loopLabel: "VAHİD TƏLİM DÖVRÜ",
    loopTitle: "Sənəddən işə hazır əməkdaşa.",

    flow: [
      "SOP / PDF",
      "AI Kurs",
      "Employee Training",
      "Praktika",
      "Skill Score",
      "READY",
    ],

    built: "REAL İŞ ÜÇÜN QURULUB",
    builtTitle: "Kurs yaratmaq yalnız başlanğıcdır.",

    builtText:
      "ARVO şirkət biliyini öyrənilə bilən, tətbiq edilə bilən və ölçülə bilən təlim sisteminə çevirir.",

    feature1Title: "AI Course Builder",
    feature1Text:
      "SOP və təlim materiallarından avtomatik modul, dərs, quiz və praktik nümunələr yarat.",

    feature2Title: "Employee Practice",
    feature2Text:
      "Əməkdaşları real iş situasiyalarında sına və onların biliklərini ölç.",

    feature3Title: "Skill Intelligence",
    feature3Text:
      "Zəif bacarıqları müəyyən et və əlavə təlim ehtiyaclarını gör.",

    ctaTitle: "Şirkət biliyini performansa çevir.",
    ctaText:
      "Manager və employee üçün vahid AI təlim sistemi.",

    ctaManager: "Manager Login",
    ctaEmployee: "Employee Login",
  },

  en: {
    nav: {
      platform: "Platform",
      training: "AI Training",
      scenario: "Scenario Lab",
      analytics: "Analytics",
      login: "Login",
    },

    badge: "AI-powered employee readiness platform",

    heroLine1: "Turn company knowledge into",
    heroHighlight: "job-ready skills.",
    heroLine2: "",

    heroText:
      "Transform SOPs and training materials into AI-powered courses, train employees and measure workplace readiness.",

    manager: "Manager",
    managerText:
      "Create courses, assign them to employees and manage results.",
    managerButton: "Login as Manager →",

    employee: "Employee",
    employeeText:
      "Complete assigned courses, test your knowledge and track your results.",
    employeeButton: "Login as Employee →",

    how: "How it works",

    multilingual: "AZ / EN / RU",
    courseBuilder: "AI Course Builder",
    skillAnalytics: "Skill Analytics",

    teamReadiness: "Team Readiness",
    employeesReady: "Employees Ready",
    needRetraining: "Need Retraining",
    weakestSkill: "Weakest Skill",

    communication: "Communication",
    policy: "Policy Knowledge",
    escalation: "Escalation",

    loopLabel: "ONE CONTINUOUS TRAINING LOOP",
    loopTitle: "From company knowledge to job-ready employees.",

    flow: [
      "SOP / PDF",
      "AI Course",
      "Employee Training",
      "Practice",
      "Skill Score",
      "READY",
    ],

    built: "BUILT FOR REAL WORK",
    builtTitle: "Creating a course is only the beginning.",

    builtText:
      "ARVO turns company knowledge into training that can be learned, applied and measured.",

    feature1Title: "AI Course Builder",
    feature1Text:
      "Automatically create modules, lessons, quizzes and practical examples from company materials.",

    feature2Title: "Employee Practice",
    feature2Text:
      "Train employees through realistic workplace situations and assessments.",

    feature3Title: "Skill Intelligence",
    feature3Text:
      "Identify skill gaps and understand where additional training is needed.",

    ctaTitle: "Turn company knowledge into performance.",
    ctaText:
      "One AI training system for managers and employees.",

    ctaManager: "Manager Login",
    ctaEmployee: "Employee Login",
  },

  ru: {
    nav: {
      platform: "Платформа",
      training: "AI Обучение",
      scenario: "Scenario Lab",
      analytics: "Аналитика",
      login: "Войти",
    },

    badge: "AI-платформа подготовки сотрудников",

    heroLine1: "Превратите знания компании",
    heroHighlight: "в рабочие навыки.",
    heroLine2: "",

    heroText:
      "Превращайте SOP и учебные материалы в AI-курсы, обучайте сотрудников и измеряйте их готовность к работе.",

    manager: "Manager",
    managerText:
      "Создавайте курсы, назначайте их сотрудникам и управляйте результатами.",
    managerButton: "Войти как Manager →",

    employee: "Employee",
    employeeText:
      "Проходите назначенные курсы, проверяйте знания и отслеживайте результаты.",
    employeeButton: "Войти как Employee →",

    how: "Как это работает?",

    multilingual: "AZ / EN / RU",
    courseBuilder: "AI Course Builder",
    skillAnalytics: "Skill Analytics",

    teamReadiness: "Готовность команды",
    employeesReady: "Готовы к работе",
    needRetraining: "Нужно переобучение",
    weakestSkill: "Самый слабый навык",

    communication: "Коммуникация",
    policy: "Знание процедур",
    escalation: "Эскалация",

    loopLabel: "ЕДИНЫЙ ЦИКЛ ОБУЧЕНИЯ",
    loopTitle: "От документа к готовому сотруднику.",

    flow: [
      "SOP / PDF",
      "AI Курс",
      "Обучение",
      "Практика",
      "Skill Score",
      "READY",
    ],

    built: "СОЗДАНО ДЛЯ РЕАЛЬНОЙ РАБОТЫ",
    builtTitle: "Создание курса — только начало.",

    builtText:
      "ARVO превращает знания компании в обучение, которое можно изучать, применять и измерять.",

    feature1Title: "AI Course Builder",
    feature1Text:
      "Автоматическое создание модулей, уроков, тестов и практических примеров.",

    feature2Title: "Employee Practice",
    feature2Text:
      "Обучение сотрудников через реальные рабочие ситуации и проверки.",

    feature3Title: "Skill Intelligence",
    feature3Text:
      "Выявление пробелов в навыках и дополнительных потребностей в обучении.",

    ctaTitle: "Превратите знания компании в результат.",
    ctaText:
      "Единая AI-система обучения для менеджеров и сотрудников.",

    ctaManager: "Manager Login",
    ctaEmployee: "Employee Login",
  },
};

export default function HomePage() {
  const [language, setLanguage] =
    useState<Language>("az");

  useEffect(() => {
    const savedLanguage =
      localStorage.getItem("praktikLanguage");

    if (
      savedLanguage === "az" ||
      savedLanguage === "en" ||
      savedLanguage === "ru"
    ) {
      setLanguage(savedLanguage);
    }
  }, []);

  function changeLanguage(
    newLanguage: Language
  ) {
    setLanguage(newLanguage);

    localStorage.setItem(
      "praktikLanguage",
      newLanguage
    );
  }

  function goLogin() {
    window.location.href = "/login";
  }

  function scrollToHowItWorks() {
    document
      .getElementById("how-it-works")
      ?.scrollIntoView({
        behavior: "smooth",
      });
  }

  const t = translations[language];

  return (
    <main className="min-h-screen overflow-hidden bg-[#F8FAFC] text-[#0F172A]">

      {/* ================= NAVBAR ================= */}

      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">

          <div className="group flex items-center">
            <button
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                })
              }
              className="relative flex items-center"
              aria-label="ARVO home"
            >
              <span
                className="select-none text-[25px] font-black tracking-[-0.075em] text-[#0B1220] transition-all duration-300 group-hover:tracking-[-0.045em]"
                style={{
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontWeight: 950,
                }}
              >
                ARVO
              </span>
              <span className="ml-2 mt-0.5 h-2 w-2 rounded-full bg-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.10)] transition-transform duration-300 group-hover:scale-125" />
            </button>
          </div>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-500 lg:flex">
            <button
              onClick={() =>
                document
                  .getElementById("platform")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
              className="transition hover:text-blue-600"
            >
              {t.nav.platform}
            </button>

            <button
              onClick={() =>
                document
                  .getElementById("features")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
              className="transition hover:text-blue-600"
            >
              {t.nav.training}
            </button>

            <button
              onClick={() =>
                document
                  .getElementById("how-it-works")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
              className="transition hover:text-blue-600"
            >
              {t.nav.scenario}
            </button>
          </nav>

          <div className="flex items-center gap-3">

            <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
              {(
                ["az", "en", "ru"] as Language[]
              ).map((lang) => (
                <button
                  key={lang}
                  onClick={() =>
                    changeLanguage(lang)
                  }
                  className={`rounded-lg px-3 py-2 text-xs font-black uppercase transition ${
                    language === lang
                      ? "bg-blue-600 text-white"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <button
              onClick={goLogin}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
            >
              {t.nav.login}
            </button>
          </div>
        </div>
      </header>

      {/* ================= HERO ================= */}

      <section
        id="platform"
        className="relative"
      >
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-blue-200/40 blur-[120px]" />

        <div className="absolute -right-40 top-20 h-[420px] w-[420px] rounded-full bg-yellow-200/50 blur-[120px]" />

        <div className="relative mx-auto grid min-h-[700px] max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-2">

          {/* LEFT */}

          <div>

            <motion.div
              initial={{
                opacity: 0,
                y: 15,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700"
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />

              {t.badge}
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
              className="mt-7 max-w-3xl text-5xl font-black leading-[1.05] tracking-[-0.04em] md:text-7xl"
            >
              {t.heroLine1}{" "}

              <span className="text-blue-600">
                {t.heroHighlight}
              </span>{" "}

              {t.heroLine2}
            </motion.h1>

            <motion.p
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.2,
              }}
              className="mt-7 max-w-2xl text-lg leading-8 text-slate-600"
            >
              {t.heroText}
            </motion.p>

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
              className="mt-9 flex flex-col gap-3 sm:flex-row"
            >
              <button
                onClick={goLogin}
                className="rounded-2xl bg-blue-600 px-7 py-4 font-bold text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-1 hover:bg-blue-700"
              >
                {t.managerButton}
              </button>

              <button
                onClick={goLogin}
                className="rounded-2xl border border-slate-200 bg-white px-7 py-4 font-bold text-slate-700 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                {t.employeeButton}
              </button>
            </motion.div>

            <div className="mt-10 flex flex-wrap gap-6 text-sm font-semibold text-slate-500">
              <span>
                ✓ {t.multilingual}
              </span>

              <span>
                ✓ {t.courseBuilder}
              </span>

              <span>
                ✓ {t.skillAnalytics}
              </span>
            </div>

          </div>

          {/* RIGHT DASHBOARD */}

          <motion.div
            initial={{
              opacity: 0,
              x: 40,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.7,
            }}
            className="relative"
          >
            <div className="absolute -inset-8 rounded-[40px] bg-gradient-to-br from-blue-300/30 to-yellow-200/30 blur-3xl" />

            <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_35px_100px_-30px_rgba(15,23,42,0.35)]">

              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <div>
                  <p className="text-xs font-black text-blue-600">
                    ARVO
                  </p>

                  <p className="font-bold">
                    Employee Training
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-500">
                  AI
                </div>
              </div>

              <div className="p-6">

                <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white">
                  <p className="text-sm text-blue-100">
                    {t.teamReadiness}
                  </p>

                  <p className="mt-2 text-4xl font-black">
                    78%
                  </p>

                  <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/20">
                    <motion.div
                      initial={{
                        width: 0,
                      }}
                      animate={{
                        width: "78%",
                      }}
                      transition={{
                        duration: 1.5,
                      }}
                      className="h-full rounded-full bg-yellow-400"
                    />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4">

                  <DashboardCard
                    title={t.employeesReady}
                    value="23"
                    detail="+6"
                  />

                  <DashboardCard
                    title={t.needRetraining}
                    value="7"
                    detail="Action required"
                  />

                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 p-5">

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-500">
                        {t.weakestSkill}
                      </p>

                      <p className="mt-1 text-xl font-black">
                        {t.escalation}
                      </p>
                    </div>

                    <span className="rounded-full bg-red-50 px-3 py-2 text-sm font-black text-red-600">
                      44%
                    </span>
                  </div>

                  <div className="mt-5 space-y-3">
                    <Skill
                      title={t.communication}
                      score={91}
                    />

                    <Skill
                      title={t.policy}
                      score={76}
                    />

                    <Skill
                      title={t.escalation}
                      score={44}
                    />
                  </div>

                </div>

              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= LOGIN ROLES ================= */}

      <section className="border-y border-slate-200 bg-white py-20">

        <div className="mx-auto max-w-6xl px-6">

          <div className="mx-auto max-w-2xl text-center">

            <p className="text-sm font-black tracking-[0.18em] text-blue-600">
              ARVO
            </p>

            <h2 className="mt-3 text-3xl font-black md:text-4xl">
              Sistemə necə daxil olmaq istəyirsən?
            </h2>

            <p className="mt-4 text-slate-500">
              Roluna uyğun hesabla daxil ol və öz iş axınına keç.
            </p>

          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">

            {/* MANAGER */}

            <motion.div
              whileHover={{
                y: -6,
              }}
              className="rounded-[30px] border border-blue-200 bg-blue-50 p-8"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-xl font-black text-white">
                M
              </div>

              <h3 className="mt-6 text-3xl font-black">
                {t.manager}
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                {t.managerText}
              </p>

              <button
                onClick={goLogin}
                className="mt-7 w-full rounded-2xl bg-blue-600 px-6 py-4 font-black text-white transition hover:bg-blue-700"
              >
                {t.managerButton}
              </button>
            </motion.div>

            {/* EMPLOYEE */}

            <motion.div
              whileHover={{
                y: -6,
              }}
              className="rounded-[30px] border border-yellow-200 bg-yellow-50 p-8"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400 text-xl font-black text-slate-900">
                E
              </div>

              <h3 className="mt-6 text-3xl font-black">
                {t.employee}
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                {t.employeeText}
              </p>

              <button
                onClick={goLogin}
                className="mt-7 w-full rounded-2xl bg-yellow-400 px-6 py-4 font-black text-slate-900 transition hover:bg-yellow-300"
              >
                {t.employeeButton}
              </button>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ================= FLOW ================= */}

      <section
        id="how-it-works"
        className="border-y border-slate-200 bg-white py-20"
      >
        <div className="mx-auto max-w-7xl px-6">

          <div className="text-center">
            <p className="text-sm font-black tracking-[0.18em] text-blue-600">
              {t.loopLabel}
            </p>

            <h2 className="mt-3 text-3xl font-black md:text-4xl">
              {t.loopTitle}
            </h2>
          </div>

          <div className="mt-12 grid gap-3 md:grid-cols-6">

            {t.flow.map(
              (item, index) => (
                <motion.div
                  key={`${language}-${item}`}
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
                  transition={{
                    delay: index * 0.08,
                  }}
                  whileHover={{
                    y: -5,
                  }}
                  className="relative rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center transition-shadow hover:shadow-lg"
                >
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white">
                    {index + 1}
                  </div>

                  <p className="mt-4 font-black">
                    {item}
                  </p>

                  {index <
                    t.flow.length - 1 && (
                    <div className="absolute -right-4 top-1/2 z-10 hidden text-xl font-black text-yellow-400 md:block">
                      →
                    </div>
                  )}
                </motion.div>
              )
            )}

          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}

      <section
        id="features"
        className="mx-auto max-w-7xl px-6 py-24"
      >
        <div className="max-w-2xl">

          <p className="text-sm font-black tracking-[0.18em] text-blue-600">
            {t.built}
          </p>

          <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
            {t.builtTitle}
          </h2>

          <p className="mt-4 text-lg leading-8 text-slate-600">
            {t.builtText}
          </p>

        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">

          <FeatureCard
            number="01"
            title={t.feature1Title}
            text={t.feature1Text}
          />

          <FeatureCard
            number="02"
            title={t.feature2Title}
            text={t.feature2Text}
          />

          <FeatureCard
            number="03"
            title={t.feature3Title}
            text={t.feature3Text}
          />

        </div>
      </section>

      {/* ================= CTA ================= */}

      <section className="mx-auto max-w-7xl px-6 pb-24">

        <div className="relative overflow-hidden rounded-[36px] bg-[#0F172A] px-8 py-16 text-white md:px-14">

          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-blue-600/30 blur-3xl" />

          <div className="absolute bottom-0 left-0 h-52 w-52 rounded-full bg-yellow-400/10 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-10 md:flex-row md:items-center">

            <div>
              <p className="text-sm font-black tracking-[0.15em] text-yellow-400">
                ARVO
              </p>

              <h2 className="mt-4 max-w-2xl text-4xl font-black leading-tight">
                {t.ctaTitle}
              </h2>

              <p className="mt-4 text-slate-400">
                {t.ctaText}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">

              <button
                onClick={goLogin}
                className="rounded-2xl bg-blue-600 px-7 py-4 font-black text-white transition hover:bg-blue-700"
              >
                {t.ctaManager}
              </button>

              <button
                onClick={goLogin}
                className="rounded-2xl bg-yellow-400 px-7 py-4 font-black text-slate-950 transition hover:bg-yellow-300"
              >
                {t.ctaEmployee}
              </button>

            </div>

          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}

      <footer className="border-t border-slate-200 bg-white">

        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-6 py-8 text-sm text-slate-500 md:flex-row">

          <div className="font-bold text-slate-800">
            ARVO
          </div>

          <div>
            AI-powered employee readiness platform
          </div>

        </div>
      </footer>

    </main>
  );
}

// =========================================================
// DASHBOARD CARD
// =========================================================

function DashboardCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

      <p className="text-xs font-bold text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-black">
        {value}
      </p>

      <p className="mt-2 text-xs font-semibold text-blue-600">
        {detail}
      </p>

    </div>
  );
}

// =========================================================
// SKILL
// =========================================================

function Skill({
  title,
  score,
}: {
  title: string;
  score: number;
}) {
  return (
    <div>

      <div className="mb-1 flex justify-between text-xs font-bold">
        <span>{title}</span>

        <span>{score}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">

        <motion.div
          initial={{
            width: 0,
          }}
          whileInView={{
            width: `${score}%`,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 1,
          }}
          className="h-full rounded-full bg-blue-600"
        />

      </div>
    </div>
  );
}

// =========================================================
// FEATURE CARD
// =========================================================

function FeatureCard({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <motion.div
      whileHover={{
        y: -7,
      }}
      className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-xl"
    >

      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 font-black text-blue-600">
        {number}
      </div>

      <h3 className="mt-6 text-2xl font-black">
        {title}
      </h3>

      <p className="mt-4 leading-7 text-slate-600">
        {text}
      </p>

    </motion.div>
  );
}