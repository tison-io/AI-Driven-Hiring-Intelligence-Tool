import { create } from "zustand";

export type ApplyMethod = "resume" | "linkedin";

type ApplyState = {
  fullName: string;
  email: string;
  method: ApplyMethod;
  file: File | null;
  setField: (k: "fullName" | "email", v: string) => void;
  setMethod: (m: ApplyMethod) => void;
  setFile: (f: File | null) => void;
  reset: () => void;
};

export const useApplyStore = create<ApplyState>((set) => ({
  fullName: "",
  email: "",
  method: "resume",
  file: null,
  setField: (k, v) => set({ [k]: v } as any),
  setMethod: (m) => set({ method: m, file: null }),
  setFile: (f) => set({ file: f }),
  reset: () => set({ fullName: "", email: "", method: "resume", file: null }),
}));
