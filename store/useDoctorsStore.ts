import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { MOCK_DOCTORS } from "@/lib/mock-data";

export interface DoctorListApiItem {
    doctor_picture: string | null;
    doctor_name: string;
    featured?: number | null;
    display_order?: number | null;
    speciality: string | null;
    year_of_experience: number | null;
    degree: string | null;
    registration_number: string | null;
    languages_spoken: string | null;
}

/** Doctors with `featured: 1` are active and shown on the site. */
export function isActiveDoctor(doctor: DoctorListApiItem): boolean {
    return Number(doctor.featured) === 1;
}

interface DoctorsState {
    doctors: DoctorListApiItem[];
    isLoading: boolean;
    error: string | null;
    lastFetchedAt: number | null;
    fetchDoctors: (force?: boolean) => Promise<DoctorListApiItem[]>;
    isRefreshing: boolean;
}

function normalizeDoctorsPayload(raw: unknown): DoctorListApiItem[] {
    let list: DoctorListApiItem[] = [];

    if (Array.isArray(raw)) {
        list = raw as DoctorListApiItem[];
    } else if (raw && typeof raw === "object") {
        const obj = raw as { data?: unknown };
        if (Array.isArray(obj.data)) list = obj.data as DoctorListApiItem[];
    }

    return list
        .filter(isActiveDoctor)
        .sort((a, b) => (a.display_order ?? Number.MAX_SAFE_INTEGER) - (b.display_order ?? Number.MAX_SAFE_INTEGER));
}

export const useDoctorsStore = create<DoctorsState>()(
    persist(
        (set) => ({
            doctors: [],
            isLoading: false,
            error: null,
            lastFetchedAt: null,
            isRefreshing: false,
            // Static mock data — no API call is made.
            fetchDoctors: async () => {
                const nextDoctors = normalizeDoctorsPayload(MOCK_DOCTORS);
                set({
                    doctors: nextDoctors,
                    isLoading: false,
                    error: null,
                    lastFetchedAt: Date.now(),
                    isRefreshing: false,
                });
                return nextDoctors;
            },
        }),
        {
            name: "doctors-storage-v2-mock",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                doctors: state.doctors,
                lastFetchedAt: state.lastFetchedAt,
            }),
        }
    )
);
