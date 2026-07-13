import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createQuotaSafeStorage } from '@/lib/safeWebStorage';

export interface FormProgress {
    category: string;
    slug: string;
    sessionId: string;
    currentStep: number;
    formData: Record<string, any>;
    lastUpdated: number;
}

interface FormStore {
    progressBySessionId: Record<string, FormProgress>;
    progress: FormProgress | null;
    saveProgress: (progress: FormProgress) => void;
    getProgress: (sessionId: string) => FormProgress | null;
    getAllProgress: () => FormProgress[];
    clearProgress: (sessionId?: string | null) => void;
    clearAllProgress: () => void;
}

export const useFormStore = create<FormStore>()(
    persist(
        (set, get) => ({
            progressBySessionId: {},
            progress: null,
            saveProgress: (progress) =>
                set((state) => ({
                    progressBySessionId: {
                        ...state.progressBySessionId,
                        [progress.sessionId]: progress,
                    },
                    progress,
                })),
            getProgress: (sessionId) => get().progressBySessionId[sessionId] ?? null,
            getAllProgress: () => Object.values(get().progressBySessionId),
            clearProgress: (sessionId) =>
                set((state) => {
                    if (!sessionId) {
                        return { progressBySessionId: {}, progress: null };
                    }

                    const next = { ...state.progressBySessionId };
                    delete next[sessionId];

                    const activeProgress = state.progress?.sessionId === sessionId
                        ? null
                        : state.progress;

                    return { progressBySessionId: next, progress: activeProgress };
                }),
            clearAllProgress: () => set({ progressBySessionId: {}, progress: null }),
        }),
        {
            name: 'form-progress-storage',
            storage: createJSONStorage(() => createQuotaSafeStorage(localStorage)),
            version: 2,
            migrate: (persistedState: unknown) => {
                const state = (persistedState ?? {}) as {
                    progress?: FormProgress | null;
                    progressBySessionId?: Record<string, FormProgress>;
                };

                if (state.progressBySessionId && typeof state.progressBySessionId === 'object') {
                    const values = Object.values(state.progressBySessionId);
                    return {
                        ...state,
                        progressBySessionId: state.progressBySessionId,
                        progress: state.progress ?? values[0] ?? null,
                    };
                }

                const legacyProgress = state.progress;
                if (legacyProgress?.sessionId) {
                    return {
                        ...state,
                        progressBySessionId: {
                            [legacyProgress.sessionId]: legacyProgress,
                        },
                        progress: legacyProgress,
                    };
                }

                return {
                    ...state,
                    progressBySessionId: {},
                    progress: null,
                };
            },
        }
    )
);
