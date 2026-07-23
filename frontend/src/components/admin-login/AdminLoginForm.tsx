"use client";

import { useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { ApiError } from "../../lib/apiClient";
import type { useAdminLoginForm } from "./useAdminLoginForm";

interface AdminLoginFormProps {
  form: ReturnType<typeof useAdminLoginForm>;
}

export function AdminLoginForm({ form }: AdminLoginFormProps) {
  const {
    username,
    password,
    isExpanded,
    isLoggingIn,
    loginError,
    setUsername,
    setPassword,
    toggleExpanded,
    handleSubmit,
  } = form;

  const usernameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isExpanded && usernameInputRef.current) {
      usernameInputRef.current.focus();
    }
  }, [isExpanded]);

  return (
    <>
      <button
        type="button"
        aria-expanded={isExpanded}
        onClick={toggleExpanded}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#ead7ad] bg-white px-5 text-sm font-black text-[#3f3a31] transition hover:border-[#ffd66b] hover:text-[#e86f00]"
      >
        관리자 아이디로 로그인
        <ChevronDown size={18} strokeWidth={2.5} className={`transition ${isExpanded ? "rotate-180" : ""}`} />
      </button>

      {isExpanded && (
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm font-bold text-[#3f3a31]">
            아이디
            <input
              ref={usernameInputRef}
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="h-12 rounded-2xl border border-[#ead7ad] bg-white px-4 text-sm font-semibold text-[#222222] outline-none transition focus:border-[#ffd66b] focus:ring-4 focus:ring-[#ffd66b]/25"
              required={isExpanded}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-bold text-[#3f3a31]">
            비밀번호
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 rounded-2xl border border-[#ead7ad] bg-white px-4 text-sm font-semibold text-[#222222] outline-none transition focus:border-[#ffd66b] focus:ring-4 focus:ring-[#ffd66b]/25"
              required={isExpanded}
            />
          </label>

          {loginError && (
            <p className="rounded-2xl bg-[#fff0ed] px-4 py-3 text-sm font-bold text-[#d6452f]">
              {loginError instanceof ApiError ? loginError.message : "로그인에 실패했습니다."}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoggingIn}
            className="h-12 w-full rounded-full bg-[#ffd66b] text-sm font-black text-[#2b2418] shadow-[0_14px_28px_rgba(255,214,107,0.34)] transition hover:bg-[#ffcf4d] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoggingIn ? "로그인 중..." : "로그인"}
          </button>
        </form>
      )}
    </>
  );
}
