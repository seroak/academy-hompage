"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";
import type { ParentProfile } from "../api/schemas/auth.schema";
import { logoutParent } from "../api/auth.api";
import { useApplyReservationMutation } from "./hooks/useApplyReservationMutation";
import { useJoinableGroupsQuery } from "./hooks/useJoinableGroupsQuery";
import { useConfirmedSlotsQuery } from "./hooks/useConfirmedSlotsQuery";
import PreferredSlotsPicker from "../components/PreferredSlotsPicker";
import LevelTestSection from "../components/LevelTestSection";
import { useChildrenQuery } from "../queries/useChildrenQuery";
import {
  CreateReservationInputSchema,
  DAY_OF_WEEK_LABELS,
  timeRangeLabel,
  type CreateReservationInput,
} from "../api/schemas/reservation.schema";

const emptyForm: CreateReservationInput = {
  childId: "",
  childName: "",
  childAge: 4,
  parentName: "",
  parentEmail: "",
  parentPhone: "",
  preferredSlots: [],
  note: "",
  requestedGroupId: undefined,
  levelTestResultId: undefined,
};

const CHILD_AGE_OPTIONS = [4, 5, 6, 7, 8, 9, 10];

function formForParent(parent: ParentProfile | null): CreateReservationInput {
  if (!parent) return emptyForm;

  return {
    ...emptyForm,
    parentName: parent.name ?? "",
    parentEmail: parent.email ?? "",
  };
}

export default function ApplyPage({
  initialParent: parent,
  isAdminPreview = false,
}: {
  initialParent: ParentProfile | null;
  isAdminPreview?: boolean;
}) {
  const router = useRouter();
  const { apply, isSubmitting, isSuccess, reset } = useApplyReservationMutation();
  const { joinableGroups } = useJoinableGroupsQuery();
  const { confirmedSlots } = useConfirmedSlotsQuery();
  const { children, isLoading: isChildrenLoading } = useChildrenQuery();
  const [form, setForm] = useState<CreateReservationInput>(() => formForParent(parent));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const matchingGroups = joinableGroups.filter(
    (group) => form.childAge >= group.minAge && form.childAge <= group.maxAge,
  );
  const requestedGroup = matchingGroups.find((group) => group.id === form.requestedGroupId) ?? null;

  function selectChild(childId: string) {
    const child = children.find((candidate) => candidate.id === childId);
    if (!child) return;
    setForm((current) => ({
      ...current,
      childId: child.id,
      childName: child.name,
      childAge: child.age,
      requestedGroupId: undefined,
      preferredSlots: [],
      levelTestResultId: undefined,
    }));
  }

  async function handleSwitchAccount() {
    await logoutParent();
    router.refresh();
  }

  function joinGroup(groupId: string) {
    const group = matchingGroups.find((candidate) => candidate.id === groupId);
    if (!group) return;
    setForm({
      ...form,
      requestedGroupId: group.id,
      preferredSlots: group.slots.map((slot) => ({ ...slot })),
    });
  }

  function cancelJoinRequest() {
    setForm({ ...form, requestedGroupId: undefined, preferredSlots: [] });
  }

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isAdminPreview) {
      alert("관리자는 상담 신청을 할 수 없습니다.");
      return;
    }

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

  if (isSuccess) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900">접수 완료</h1>
        <p className="mt-3 text-sm text-slate-600">
          수업 신청이 접수되었습니다. 모집 중인 반에 합류를 신청하셨다면 관리자 확인 후, 그렇지 않다면 비슷한
          신청이 모이면 그룹 편성 결과를 이메일로 안내드리겠습니다.
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
        지금 모집 중인 반이 있으면 바로 합류를 신청할 수 있고, 없다면 비슷한 희망 시간대의 신청이 모일 때
        그룹을 편성해 안내드립니다.
      </p>
      {parent && (
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
      )}

      {isAdminPreview && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          관리자 미리보기 화면입니다. 신청하기를 눌러도 실제로 접수되지 않습니다.
        </div>
      )}

      {!isAdminPreview && !isChildrenLoading && children.length === 0 ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">먼저 자녀를 등록해 주세요</h2>
          <p className="mt-2 text-sm text-slate-600">등록한 자녀 정보로 상담 신청과 레벨테스트를 편리하게 진행할 수 있습니다.</p>
          <button type="button" onClick={() => router.push('/children')} className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">자녀 등록하기</button>
        </div>
      ) : (

      <form
        onSubmit={handleSubmit}
        className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2"
      >
        {isAdminPreview ? <>
          <label className="flex flex-col gap-1 text-sm text-slate-700">아이 이름<input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.childName} onChange={(e) => setForm({ ...form, childName: e.target.value })} /></label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">나이(만)<select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.childAge} onChange={(e) => setForm({ ...form, childAge: Number(e.target.value) })}>{CHILD_AGE_OPTIONS.map((age) => <option key={age} value={age}>만 {age}세</option>)}</select></label>
        </> : <>
          <label className="flex flex-col gap-1 text-sm text-slate-700">신청할 자녀
            <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.childId} onChange={(e) => selectChild(e.target.value)}>
              <option value="">자녀를 선택해 주세요</option>
              {children.map((child) => <option key={child.id} value={child.id}>{child.name} · 만 {child.age}세</option>)}
            </select>
          </label>
          {form.childId && <div className="flex flex-col gap-1 text-sm text-slate-700"><span>아이 정보</span><p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">{form.childName} · 만 {form.childAge}세</p></div>}
        </>}

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
          전화번호
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.parentPhone}
            onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
          />
          {fieldErrors.parentPhone && <span className="text-xs text-red-600">{fieldErrors.parentPhone}</span>}
        </label>

        {form.childId && (
          <LevelTestSection
            key={form.childAge}
            childId={form.childId}
            childName={form.childName}
            childAge={form.childAge}
            completedResultId={form.levelTestResultId ?? null}
            onCompleted={(resultId) => setForm((current) => ({ ...current, levelTestResultId: resultId }))}
          />
        )}

        {matchingGroups.length > 0 && (
          <div className="col-span-full rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-800">
              만 {form.childAge}세가 합류할 수 있는 모집 중인 반이 있어요.
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {matchingGroups.map((group) => (
                <li key={group.id}>
                  <button
                    type="button"
                    onClick={() => joinGroup(group.id)}
                    disabled={form.requestedGroupId === group.id}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      form.requestedGroupId === group.id
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-emerald-300 bg-white text-emerald-700 hover:border-emerald-500'
                    }`}
                  >
                    {group.label} ({group.filledCount}/{group.capacity}명) ·{' '}
                    {group.slots
                      .map((slot) => `${DAY_OF_WEEK_LABELS[slot.dayOfWeek]} ${timeRangeLabel(slot.startMinute, slot.endMinute)}`)
                      .join(', ')}
                    {form.requestedGroupId === group.id ? ' · 합류 신청됨' : ' · 이 반에 합류 신청'}
                  </button>
                </li>
              ))}
            </ul>
            {requestedGroup && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-emerald-800">
                <span>
                  "{requestedGroup.label}" 반에 합류를 신청했습니다. 아래 희망 시간이 자동으로 채워졌습니다.
                </span>
                <button
                  type="button"
                  onClick={cancelJoinRequest}
                  className="font-semibold text-emerald-700 underline hover:text-emerald-900"
                >
                  합류 신청 취소
                </button>
              </div>
            )}
          </div>
        )}

        <fieldset className="col-span-full">
          <legend className="text-sm font-medium text-slate-800">가능한 시간</legend>
          <PreferredSlotsPicker
            value={form.preferredSlots}
            onChange={(slots) => setForm({ ...form, preferredSlots: slots, requestedGroupId: undefined })}
            joinableGroups={matchingGroups}
            confirmedSlots={confirmedSlots}
            childAge={form.childAge}
          />
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
      )}
    </div>
  );
}
