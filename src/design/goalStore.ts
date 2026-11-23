"use client";

// 目標（自分の目標に採用した単元）の共有状態の下書き用ストア（2026-11-23）。
// 目標は1つだけ：新しい単元で設定すると前の目標は外れる（ホームの目標帯が1つしか
// 表示できないため）。コース一覧の旗トグルと単元画面の帯ボタンが同じ状態を見る。
// 初期値はダミーの学習中単元（二分探索）で、ホームの目標帯フィクスチャと合わせる。
import { useSyncExternalStore } from "react";

const DEFAULT_GOAL = "course-algorithm-binary-search-v1";

let goalCourseId: string | null = DEFAULT_GOAL;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export const goalStore = {
  get: () => goalCourseId,
  set: (id: string | null) => {
    goalCourseId = id;
    emit();
  },
  toggle: (id: string) => {
    goalCourseId = goalCourseId === id ? null : id;
    emit();
  },
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export const useGoalCourseId = (): string | null =>
  useSyncExternalStore(goalStore.subscribe, goalStore.get, () => DEFAULT_GOAL);
