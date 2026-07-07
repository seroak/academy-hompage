"use client";

import { Fragment, useState } from "react";

import { useRouter } from "next/navigation";
import type { ParentProfile } from "../api/schemas/auth.schema";
import { logoutParent } from "../api/auth.api";
import { useApplyReservationMutation } from "./hooks/useApplyReservationMutation";
import {
  CreateReservationInputSchema,
  DAY_OF_WEEK_OPTIONS,
  DAY_OF_WEEK_LABELS,
  HOUR_OPTIONS,
  hourLabel,
  type CreateReservationInput,
  type PreferredSlot,
} from "../api/schemas/reservation.schema";

const emptyForm: CreateReservationInput = {
  childName: "",
  childAge: 4,
  parentName: "",
  parentEmail: "",
  parentPhone: "",
  preferredSlots: [],
  note: "",
};

const CHILD_AGE_OPTIONS = [4, 5, 6, 7, 8, 9, 10];

function slotKey(slot: Pick<PreferredSlot, "dayOfWeek" | "hour">): string {
  return `${slot.dayOfWeek}-${slot.hour}`;
}

function formForParent(parent: ParentProfile): CreateReservationInput {
  return {
    ...emptyForm,
    parentName: parent.name ?? "",
    parentEmail: parent.email ?? "",
  };
}

export default function ApplyPage({ initialParent: parent }: { initialParent: ParentProfile }) {
  const router = useRouter();
  const { apply, isSubmitting, isSuccess, reset } = useApplyReservationMutation();
  const [form, setForm] = useState<CreateReservationInput>(() => formForParent(parent));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSwitchAccount() {
    await logoutParent();
    router.refresh();
  }

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = CreateReservationInputSchema.safeParse(form);

    if (!result.success) {
      const errors: Record<string, string> = {};

      for (const issue of result.error.issues) {
        errors[String(issue.path[0])] = issue.message;
      }

      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitError(null);

    try {
      await apply(result.data);
      setForm(formForParent(parent));
    } catch {
      setSubmitError("신청 접수에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  function applyAgain() {
    reset();
    setForm(formForParent(parent));
  }

  function isPreferredSlotSelected(slot: Pick<PreferredSlot, "dayOfWeek" | "hour">): boolean {
    const key = slotKey(slot);
    return form.preferredSlots.some((selected) => slotKey(selected) === key);
  }

  function togglePreferredSlot(slot: Pick<PreferredSlot, "dayOfWeek" | "hour">) {
    const key = slotKey(slot);
    setForm((current) => {
      const isSelected = current.preferredSlots.some((selected) => slotKey(selected) === key);
      return {
        ...current,
        preferredSlots: isSelected
          ? current.preferredSlots.filter((selected) => slotKey(selected) !== key)
          : [...current.preferredSlots, slot],
      };
    });
  }

  if (isSuccess) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900">접수 완료</h1>
        <p className="mt-3 text-sm text-slate-600">
          수업 신청이 접수되었습니다. 비슷한 신청이 모이면 그룹 편성 결과를 이메일로 안내드리겠습니다.
        </p>
        <button
          type="button"
          onClick={applyAgain}
          className="mt-6 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          다시 신청하기
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900">수업 신청</h1>
      <p className="mt-2 text-sm text-slate-600">
        그룹을 직접 모으지 못하셨다면, 아래 정보를 남겨 주세요. 비슷한 희망 시간대의 신청이 모이면 그룹을 편성해
        안내드립니다.
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm text-slate-700">
          <span className="font-semibold text-slate-900">{parent.name ?? parent.email ?? "보호자"}</span>님 계정으로
          신청합니다.
        </p>
        <button
          type="button"
          onClick={handleSwitchAccount}
          className="text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          다른 계정으로 로그인
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2"
      >
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          아이 이름
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.childName}
            onChange={(e) => setForm({ ...form, childName: e.target.value })}
          />
          {fieldErrors.childName && <span className="text-xs text-red-600">{fieldErrors.childName}</span>}
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          나이(만)
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.childAge}
            onChange={(e) => setForm({ ...form, childAge: Number(e.target.value) })}
          >
            {CHILD_AGE_OPTIONS.map((age) => (
              <option key={age} value={age}>
                만 {age}세
              </option>
            ))}
          </select>
          {fieldErrors.childAge && <span className="text-xs text-red-600">{fieldErrors.childAge}</span>}
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          보호자 이름
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.parentName}
            onChange={(e) => setForm({ ...form, parentName: e.target.value })}
          />
          {fieldErrors.parentName && <span className="text-xs text-red-600">{fieldErrors.parentName}</span>}
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          이메일
          <input
            type="email"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.parentEmail}
            onChange={(e) => setForm({ ...form, parentEmail: e.target.value })}
          />
          {fieldErrors.parentEmail && <span className="text-xs text-red-600">{fieldErrors.parentEmail}</span>}
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          전화번호(선택)
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.parentPhone}
            onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
          />
        </label>

        <fieldset className="col-span-full">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <legend className="text-sm font-medium text-slate-800">가능한 시간</legend>
            <span className="text-xs text-slate-500">선택된 시간 {form.preferredSlots.length}개</span>
          </div>
          <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-brand-50/40 p-2">
            <div className="grid min-w-[560px] grid-cols-[64px_repeat(6,minmax(72px,1fr))] gap-1">
              <div />
              {DAY_OF_WEEK_OPTIONS.map((day) => (
                <div key={day} className="px-2 py-1 text-center text-xs font-semibold text-slate-600">
                  {DAY_OF_WEEK_LABELS[day]}
                </div>
              ))}
              {HOUR_OPTIONS.map((hour) => (
                <Fragment key={hour}>
                  <div
                    key={`${hour}-label`}
                    className="flex min-h-11 items-center justify-center text-xs font-medium text-slate-500"
                  >
                    {hourLabel(hour)}
                  </div>
                  {DAY_OF_WEEK_OPTIONS.map((day) => {
                    const slot = { dayOfWeek: day, hour };
                    const selected = isPreferredSlotSelected(slot);
                    return (
                      <button
                        key={`${day}-${hour}`}
                        type="button"
                        aria-pressed={selected}
                        aria-label={`${DAY_OF_WEEK_LABELS[day]}요일 ${hourLabel(hour)} 선택`}
                        onClick={() => togglePreferredSlot(slot)}
                        className={`min-h-11 rounded-lg border px-2 text-xs font-semibold transition ${
                          selected
                            ? "border-brand-700 bg-brand-600 text-white shadow-sm"
                            : "border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:bg-white"
                        }`}
                      >
                        {selected ? "가능" : "선택"}
                      </button>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            수업이 가능한 시간을 모두 선택해 주세요. 비슷한 신청이 모이면 그중 한 시간으로 안내드립니다.
          </p>
          {fieldErrors.preferredSlots && (
            <span className="mt-1 block text-xs text-red-600">{fieldErrors.preferredSlots}</span>
          )}
        </fieldset>

        <label className="col-span-full flex flex-col gap-1 text-sm text-slate-700">
          요청사항(선택)
          <textarea
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            rows={3}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </label>

        {submitError && <p className="col-span-full text-sm text-red-600">{submitError}</p>}

        <div className="col-span-full">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            신청하기
          </button>
        </div>
      </form>
    </div>
  );
}
