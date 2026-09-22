"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

type Language = "az" | "en" | "ru";

const translations = {
  az: {
    back: "← Ana səhifə",
    badge: "PRAKTİK AI PORTAL",
    title: "Hesabına daxil ol",
    description:
      "Manager və əməkdaşlar öz şəxsi portalına buradan daxil olur.",
    email: "E-mail",
    password: "Şifrə",
    login: "Daxil ol",
    loading: "Yoxlanılır...",
    manager: "Manager",
    managerText:
      "Komandanın nəticələrini, skill-lərini və readiness göstəricilərini izlə.",
    employee: "Əməkdaş",
    employeeText:
      "Kurslarını, nəticələrini, skill-lərini və XP progressini gör.",
    error: "E-mail və ya şifrə yanlışdır.",
    profileError: "İstifadəçi profili tapılmadı.",
  },

  en: {
    back: "← Home",
    badge: "PRAKTIK AI PORTAL",
    title: "Sign in to your account",
    description:
      "Managers and employees access their personal portal here.",
    email: "Email",
    password: "Password",
    login: "Sign in",
    loading: "Checking...",
    manager: "Manager",
    managerText:
      "Track team results, skills and readiness.",
    employee: "Employee",
    employeeText:
      "View your courses, results, skills and XP progress.",
    error: "Incorrect email or password.",
    profileError: "User profile could not be found.",
  },

  ru: {
    back: "← Главная",
    badge: "PRAKTIK AI PORTAL",
    title: "Войти в аккаунт",
    description:
      "Менеджеры и сотрудники входят в свой личный портал здесь.",
    email: "E-mail",
    password: "Пароль",
    login: "Войти",
    loading: "Проверка...",
    manager: "Менеджер",
    managerText:
      "Просматривайте результаты команды, навыки и готовность.",
    employee: "Сотрудник",
    employeeText:
      "Просматривайте свои курсы, результаты, навыки и XP.",
    error: "Неверный e-mail или пароль.",
    profileError: "Профиль пользователя не найден.",
  },
};

export default function LoginPage() {
  const [language, setLanguage] =
    useState<Language>("az");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const saved =
      localStorage.getItem(
        "praktikLanguage"
      );

    if (
      saved === "az" ||
      saved === "en" ||
      saved === "ru"
    ) {
      setLanguage(saved);
    }
  }, []);

  const t =
    translations[language];

  function changeLanguage(
    lang: Language
  ) {
    setLanguage(lang);

    localStorage.setItem(
      "praktikLanguage",
      lang
    );
  }

  async function handleLogin(
    event: React.FormEvent
  ) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const supabase =
        createClient();

      const {
        data,
        error: loginError,
      } =
        await supabase.auth.signInWithPassword(
          {
            email,
            password,
          }
        );

    if (loginError) {
  console.error("SUPABASE LOGIN ERROR:", loginError);

  setError(
    `Supabase: ${loginError.message}`
  );

  return;
}

if (!data.user) {
  setError(
    "Supabase user qaytarmadı."
  );

  return;
}

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(
          "id, full_name, role, company_id"
        )
        .eq(
          "id",
          data.user.id
        )
        .single();

      if (
        profileError ||
        !profile
      ) {
        setError(
          t.profileError
        );
        return;
      }

      if (
        profile.role ===
        "manager"
      ) {
        window.location.href =
          "/manager";
        return;
      }

      if (
        profile.role ===
        "employee"
      ) {
        window.location.href =
          "/employee";
        return;
      }

      setError(
        t.profileError
      );
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900">

      {/* HEADER */}

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <button
            onClick={() =>
              (window.location.href =
                "/")
            }
            className="text-sm font-bold text-slate-500 transition hover:text-blue-600"
          >
            {t.back}
          </button>

          <div className="flex rounded-xl border border-slate-200 bg-white p-1">

            {(
              [
                "az",
                "en",
                "ru",
              ] as Language[]
            ).map(
              (lang) => (
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
              )
            )}

          </div>

        </div>

      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-2">

        {/* LEFT */}

        <motion.div
          initial={{
            opacity: 0,
            x: -20,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
        >

          <div className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-600">
            {t.badge}
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight md:text-6xl">
            {t.title}
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
            {t.description}
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">

            <div className="rounded-3xl border border-slate-200 bg-white p-6">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 font-black text-blue-600">
                M
              </div>

              <h3 className="mt-5 text-lg font-black">
                {t.manager}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {t.managerText}
              </p>

            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-100 font-black text-yellow-700">
                E
              </div>

              <h3 className="mt-5 text-lg font-black">
                {t.employee}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {t.employeeText}
              </p>

            </div>

          </div>

        </motion.div>

        {/* LOGIN CARD */}

        <motion.div
          initial={{
            opacity: 0,
            x: 20,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 md:p-10"
        >

          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 font-black text-white">
              P
            </div>

            <div>
              <span className="text-xl font-black">
                PRAKTİK
              </span>

              <span className="ml-1 rounded-md bg-yellow-400 px-2 py-1 text-xs font-black">
                AI
              </span>
            </div>

          </div>

          <form
            onSubmit={
              handleLogin
            }
            className="mt-8"
          >

            <label className="text-sm font-black text-slate-700">
              {t.email}
            </label>

            <input
              type="email"
              required
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              placeholder="name@company.com"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />

            <label className="mt-6 block text-sm font-black text-slate-700">
              {t.password}
            </label>

            <input
              type="password"
              required
              value={
                password
              }
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              placeholder="••••••••"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />

            {error && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={
                loading
              }
              className="mt-7 w-full rounded-2xl bg-blue-600 px-6 py-4 font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? t.loading
                : t.login}
            </button>

          </form>

        </motion.div>

      </section>

    </main>
  );
}