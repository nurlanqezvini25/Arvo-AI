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
      demo: "Demo başlat",
    },

    badge: "AI əsaslı əməkdaş hazırlığı platforması",

    heroLine1: "Şirkət biliyini",
    heroHighlight: "iş bacarığına",
    heroLine2: "çevir.",

    heroText:
      "SOP və təlim materiallarını AI ilə tam kursa çevir, əməkdaşları real iş situasiyalarında sına və onların işə hazır olub-olmadığını ölç.",

    upload: "SOP yüklə və başla →",
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

    thisWeek: "+6 bu həftə",
    actionRequired: "Tədbir tələb olunur",

    coach: "AI COACH",
    gapDetected: "Skill boşluğu aşkarlandı",
    retraining: "Yeni təlim yaradıldı →",

    loopLabel: "VAHİD TƏLİM DÖVRÜ",
    loopTitle: "Sənəddən işə hazır əməkdaşa.",

    flow: [
      "SOP / PDF",
      "AI Kurs",
      "Praktika",
      "Roleplay",
      "Skill Score",
      "READY",
    ],

    built: "REAL İŞ ÜÇÜN QURULUB",
    builtTitle: "Kurs yaratmaq yalnız başlanğıcdır.",
    builtText:
      "Praktik AI əməkdaşın biliyi real situasiyada tətbiq edə bildiyini də yoxlayır.",

    feature1Title: "AI Course Builder",
    feature1Text:
      "SOP və təlim materiallarından avtomatik modul, dərs, quiz və iş nümunələri.",

    feature2Title: "Scenario Lab",
    feature2Text:
      "Əməkdaşı real iş qərarları və situasiyalarla sına.",

    feature3Title: "Skill Intelligence",
    feature3Text:
      "Zəif bacarıqları avtomatik tap və həmin əməkdaş üçün yenidən təlim yarat.",

    cta1: "SOP-u sadəcə saxlamayın.",
    cta2: "Onu performansa çevirin.",
    ctaButton: "İlk AI kursunu yarat →",
  },

  en: {
    nav: {
      platform: "Platform",
      training: "AI Training",
      scenario: "Scenario Lab",
      analytics: "Analytics",
      demo: "Start demo",
    },

    badge: "AI-powered employee readiness platform",

    heroLine1: "Turn company knowledge into",
    heroHighlight: "job-ready skills.",
    heroLine2: "",

    heroText:
      "Transform SOPs and training materials into complete AI courses, test employees in real workplace situations and measure their readiness.",

    upload: "Upload SOP and start →",
    how: "How it works",

    multilingual: "AZ / EN / RU",
    courseBuilder: "AI Course Builder",
    skillAnalytics: "Skill Analytics",

    teamReadiness: "Team Readiness",
    employeesReady: "Employees Ready",
    needRetraining: "Need Retraining",
    weakestSkill: "Weakest skill",
    communication: "Communication",
    policy: "Policy Knowledge",
    escalation: "Escalation",

    thisWeek: "+6 this week",
    actionRequired: "Action required",

    coach: "AI COACH",
    gapDetected: "Skill gap detected",
    retraining: "Retraining generated →",

    loopLabel: "ONE CONTINUOUS TRAINING LOOP",
    loopTitle: "From company knowledge to job-ready employees.",

    flow: [
      "SOP / PDF",
      "AI Course",
      "Practice",
      "Roleplay",
      "Skill Score",
      "READY",
    ],

    built: "BUILT FOR REAL WORK",
    builtTitle: "Creating a course is only the beginning.",
    builtText:
      "Praktik AI also tests whether employees can apply knowledge in real workplace situations.",

    feature1Title: "AI Course Builder",
    feature1Text:
      "Automatically create modules, lessons, quizzes and workplace examples from company materials.",

    feature2Title: "Scenario Lab",
    feature2Text:
      "Test employees with realistic workplace decisions and situations.",

    feature3Title: "Skill Intelligence",
    feature3Text:
      "Detect weak skills automatically and generate targeted retraining.",

    cta1: "Don't just store your SOP.",
    cta2: "Turn it into measurable performance.",
    ctaButton: "Create your first AI course →",
  },

  ru: {
    nav: {
      platform: "Платформа",
      training: "AI Обучение",
      scenario: "Scenario Lab",
      analytics: "Аналитика",
      demo: "Запустить демо",
    },

    badge: "AI-платформа подготовки сотрудников",

    heroLine1: "Превратите знания компании",
    heroHighlight: "в рабочие навыки.",
    heroLine2: "",

    heroText:
      "Превращайте SOP и учебные материалы в полноценные AI-курсы, проверяйте сотрудников в реальных рабочих ситуациях и измеряйте их готовность.",

    upload: "Загрузить SOP и начать →",
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

    thisWeek: "+6 за неделю",
    actionRequired: "Требуется действие",

    coach: "AI COACH",
    gapDetected: "Обнаружен пробел в навыках",
    retraining: "Создано переобучение →",

    loopLabel: "ЕДИНЫЙ ЦИКЛ ОБУЧЕНИЯ",
    loopTitle: "От документа к готовому сотруднику.",

    flow: [
      "SOP / PDF",
      "AI Курс",
      "Практика",
      "Roleplay",
      "Skill Score",
      "READY",
    ],

    built: "СОЗДАНО ДЛЯ РЕАЛЬНОЙ РАБОТЫ",
    builtTitle: "Создание курса — только начало.",
    builtText:
      "Praktik AI также проверяет, способен ли сотрудник применять знания в реальных рабочих ситуациях.",

    feature1Title: "AI Course Builder",
    feature1Text:
      "Автоматическое создание модулей, уроков, тестов и рабочих примеров из материалов компании.",

    feature2Title: "Scenario Lab",
    feature2Text:
      "Проверка сотрудников с помощью реальных рабочих ситуаций и решений.",

    feature3Title: "Skill Intelligence",
    feature3Text:
      "Автоматическое выявление слабых навыков и создание дополнительного обучения.",

    cta1: "Не просто храните SOP.",
    cta2: "Превратите его в измеримый результат.",
    ctaButton: "Создать первый AI-курс →",
  },
};

export default function PreviewPage() {
  const [language, setLanguage] = useState<Language>("az");

  useEffect(() => {
    const savedLanguage = localStorage.getItem("praktikLanguage");

    if (
      savedLanguage === "az" ||
      savedLanguage === "en" ||
      savedLanguage === "ru"
    ) {
      setLanguage(savedLanguage);
    }
  }, []);

  function changeLanguage(newLanguage: Language) {
    setLanguage(newLanguage);

    localStorage.setItem(
      "praktikLanguage",
      newLanguage
    );
  }

  const t = translations[language];

  return (
    <main className="min-h-screen overflow-hidden bg-[#F8FAFC] text-[#0F172A]">

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          {/* LOGO */}
          <div className="flex items-center gap-2">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-black text-white">
              P
            </div>

            <div>
              <span className="text-xl font-black tracking-tight">
                PRAKTİK
              </span>

              <span className="ml-1 rounded-md bg-yellow-400 px-2 py-1 text-xs font-black">
                AI
              </span>
            </div>

          </div>

          {/* NAV */}
          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-500 lg:flex">
            <span>{t.nav.platform}</span>
            <span>{t.nav.training}</span>
            <span>{t.nav.scenario}</span>
            <span>{t.nav.analytics}</span>
          </nav>

          {/* LANGUAGE + DEMO */}
          <div className="flex items-center gap-3">

            <div className="flex rounded-xl border border-slate-200 bg-white p-1">

              {(["az", "en", "ru"] as Language[]).map(
                (lang) => (
                  <button
                    key={lang}
                    onClick={() =>
                      changeLanguage(lang)
                    }
                    className={`rounded-lg px-3 py-2 text-xs font-black uppercase transition ${
                      language === lang
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {lang}
                  </button>
                )
              )}

            </div>

            <button className="hidden rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 sm:block">
              {t.nav.demo}
            </button>

          </div>

        </div>

      </header>

      {/* HERO */}
      <section className="relative">

        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-blue-200/40 blur-[120px]" />

        <div className="absolute -right-40 top-20 h-[420px] w-[420px] rounded-full bg-yellow-200/50 blur-[120px]" />

        <div className="relative mx-auto grid min-h-[760px] max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-2">

          {/* LEFT */}
          <div>

            <motion.div
              key={`badge-${language}`}
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
              key={`title-${language}`}
              initial={{
                opacity: 0,
                y: 25,
              }}
              animate={{
                opacity: 1,
                y: 0,
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
              key={`description-${language}`}
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="mt-7 max-w-2xl text-lg leading-8 text-slate-600"
            >
              {t.heroText}
            </motion.p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">

              <button className="rounded-2xl bg-blue-600 px-7 py-4 font-bold text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-1 hover:bg-blue-700">
                {t.upload}
              </button>

              <button className="rounded-2xl border border-slate-200 bg-white px-7 py-4 font-bold text-slate-700 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                {t.how}
              </button>

            </div>

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

          {/* PRODUCT MOCKUP */}
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
                    PRAKTİK AI
                  </p>

                  <p className="font-bold">
                    Employee Training
                  </p>
                </div>

                <div className="h-10 w-10 rounded-full bg-slate-100" />

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
                    detail={t.thisWeek}
                  />

                  <DashboardCard
                    title={t.needRetraining}
                    value="7"
                    detail={t.actionRequired}
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

            <motion.div
              animate={{
                y: [0, -8, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
              }}
              className="absolute -bottom-8 -left-8 hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xl md:block"
            >

              <p className="text-xs font-bold text-slate-400">
                {t.coach}
              </p>

              <p className="mt-1 font-black">
                {t.gapDetected}
              </p>

              <p className="mt-1 text-sm text-blue-600">
                {t.retraining}
              </p>

            </motion.div>

          </motion.div>

        </div>

      </section>

      {/* FLOW */}
      <section className="border-y border-slate-200 bg-white py-16">

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
                    delay:
                      index * 0.08,
                  }}
                  whileHover={{
                    y: -5,
                  }}
                  className="relative rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center"
                >

                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white">
                    {index + 1}
                  </div>

                  <p className="mt-4 font-black">
                    {item}
                  </p>

                  {index <
                    t.flow.length -
                      1 && (
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

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-6 py-24">

        <div className="max-w-2xl">

          <p className="text-sm font-black tracking-[0.18em] text-blue-600">
            {t.built}
          </p>

          <h2 className="mt-4 text-4xl font-black tracking-tight">
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

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-24">

        <div className="relative overflow-hidden rounded-[36px] bg-[#0F172A] px-8 py-16 text-white md:px-14">

          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-blue-600/30 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-10 md:flex-row md:items-center">

            <div>

              <p className="text-sm font-black tracking-[0.15em] text-yellow-400">
                PRAKTİK AI
              </p>

              <h2 className="mt-4 max-w-2xl text-4xl font-black leading-tight">
                {t.cta1}
                <br />
                {t.cta2}
              </h2>

            </div>

            <button className="shrink-0 rounded-2xl bg-yellow-400 px-8 py-5 font-black text-slate-950 transition hover:-translate-y-1 hover:bg-yellow-300">
              {t.ctaButton}
            </button>

          </div>

        </div>

      </section>

    </main>
  );
}

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