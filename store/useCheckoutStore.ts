import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createQuotaSafeStorage } from '@/lib/safeWebStorage';

interface FormField {
    key: string;
    title: string;
    value: string | null;
}

interface CheckoutState {
    consultationDataBySessionId: Record<string, FormField[] | Record<string, any>>;
    formTitleBySessionId: Record<string, string>;
    formKeyBySessionId: Record<string, string>;
    consultationData: FormField[] | Record<string, any> | null;
    formTitle: string | null;
    formKey: string | null;
    sessionId: string | null;

    setConsultationData: (data: FormField[] | Record<string, any>, title: string, key: string, sessionId: string) => void;
    getConsultationData: (sessionId: string) => FormField[] | Record<string, any> | null;
    clearCheckoutData: (sessionId?: string | null) => void;
}

export const useCheckoutStore = create<CheckoutState>()(
    persist(
        (set, get) => ({
            consultationDataBySessionId: {},
            formTitleBySessionId: {},
            formKeyBySessionId: {},
            consultationData: null,
            formTitle: null,
            formKey: null,
            sessionId: null,

            setConsultationData: (data, title, key, sessionId) => {
                const persistedData: FormField[] | Record<string, unknown> =
                    Array.isArray(data) ? data : { ...(data as Record<string, unknown>) };

                set((state) => ({
                    consultationDataBySessionId: {
                        ...state.consultationDataBySessionId,
                        [sessionId]: persistedData,
                    },
                    formTitleBySessionId: {
                        ...state.formTitleBySessionId,
                        [sessionId]: title,
                    },
                    formKeyBySessionId: {
                        ...state.formKeyBySessionId,
                        [sessionId]: key,
                    },
                    consultationData: persistedData,
                    formTitle: title,
                    formKey: key,
                    sessionId,
                }));
            },

            getConsultationData: (sessionId) => {
                return get().consultationDataBySessionId[sessionId] ?? null;
            },

            clearCheckoutData: (sessionId) => {
                set((state) => {
                    if (!sessionId) {
                        return {
                            consultationDataBySessionId: {},
                            formTitleBySessionId: {},
                            formKeyBySessionId: {},
                            consultationData: null,
                            formTitle: null,
                            formKey: null,
                            sessionId: null,
                        };
                    }

                    const nextData = { ...state.consultationDataBySessionId };
                    const nextTitle = { ...state.formTitleBySessionId };
                    const nextKey = { ...state.formKeyBySessionId };
                    delete nextData[sessionId];
                    delete nextTitle[sessionId];
                    delete nextKey[sessionId];

                    const isActiveSession = state.sessionId === sessionId;
                    return {
                        consultationDataBySessionId: nextData,
                        formTitleBySessionId: nextTitle,
                        formKeyBySessionId: nextKey,
                        consultationData: isActiveSession ? null : state.consultationData,
                        formTitle: isActiveSession ? null : state.formTitle,
                        formKey: isActiveSession ? null : state.formKey,
                        sessionId: isActiveSession ? null : state.sessionId,
                    };
                });
            },
        }),
        {
            name: 'checkout-storage',
            storage: createJSONStorage(() => createQuotaSafeStorage(sessionStorage)),
            version: 2,
            migrate: (persistedState: unknown) => {
                const state = (persistedState ?? {}) as {
                    consultationDataBySessionId?: Record<string, FormField[] | Record<string, any>>;
                    formTitleBySessionId?: Record<string, string>;
                    formKeyBySessionId?: Record<string, string>;
                    consultationData?: FormField[] | Record<string, any> | null;
                    formTitle?: string | null;
                    formKey?: string | null;
                    sessionId?: string | null;
                };

                if (state.consultationDataBySessionId && typeof state.consultationDataBySessionId === 'object') {
                    return {
                        ...state,
                        consultationDataBySessionId: state.consultationDataBySessionId ?? {},
                        formTitleBySessionId: state.formTitleBySessionId ?? {},
                        formKeyBySessionId: state.formKeyBySessionId ?? {},
                    };
                }

                const legacySessionId = state.sessionId;
                if (legacySessionId && state.consultationData) {
                    return {
                        ...state,
                        consultationDataBySessionId: { [legacySessionId]: state.consultationData },
                        formTitleBySessionId: state.formTitle ? { [legacySessionId]: state.formTitle } : {},
                        formKeyBySessionId: state.formKey ? { [legacySessionId]: state.formKey } : {},
                    };
                }

                return {
                    ...state,
                    consultationDataBySessionId: {},
                    formTitleBySessionId: {},
                    formKeyBySessionId: {},
                    consultationData: state.consultationData ?? null,
                    formTitle: state.formTitle ?? null,
                    formKey: state.formKey ?? null,
                    sessionId: state.sessionId ?? null,
                };
            },
        }
    )
);
