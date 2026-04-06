import { createContext, useEffect, useState, type ReactNode } from "react";

import { useAuth } from "../../hooks/useAuth";

export type OnboardingTrainingEntry = {
    id: string;
    title: string;
    category: string;
    completionDate: string;
    status: "Valid" | "Expiring Soon" | "Expired";
    persisted: boolean;
};

export interface OnboardingData {
    teacherName: string;
    teacher_id_number: string;
    school: string;
    region: string;
    province: string;
    grade_level_taught: string;
    current_subject: string;
    specialization: string;
    teaching_outside_specialization: boolean;
    years_experience: number;
    num_classes: number;
    students_per_class: number[];
    working_hours_per_week: number;
    last_training_date: string | null;
}

type TeacherProfileApiResponse = {
    profile: {
        teacher_id_number: string | null;
        school: string | null;
        region: string | null;
        province: string | null;
        grade_level_taught: string | null;
        current_subject: string | null;
        specialization: string | null;
        teaching_outside_specialization: boolean;
        years_experience: number | null;
        num_classes: number | null;
        students_per_class: number[] | null;
        working_hours_per_week: number | null;
        last_training_date: string | null;
        onboarding_complete: boolean;
    };
    trainings: Array<{
        id: string;
        training_name: string;
        training_type: string | null;
        date_attended: string | null;
    }>;
    full_name: string | null;
};

interface OnboardingContextType {
    onboardingData: OnboardingData;
    trainings: OnboardingTrainingEntry[];
    isLoading: boolean;
    isSaving: boolean;
    setOnboardingData: (data: OnboardingData) => void;
    resetOnboardingData: () => void;
    updateOnboardingData: (newData: Partial<OnboardingData>) => void;
    addTraining: (entry: Omit<OnboardingTrainingEntry, "id" | "persisted">) => void;
    removeTraining: (id: string) => void;
    saveOnboardingFields: (fields: Partial<OnboardingData>) => Promise<void>;
    saveTrainings: () => Promise<void>;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

const initialData: OnboardingData = {
    teacherName: "",
    teacher_id_number: "",
    school: "",
    region: "",
    province: "",
    grade_level_taught: "",
    current_subject: "",
    specialization: "",
    teaching_outside_specialization: false,
    years_experience: 0,
    num_classes: 0,
    students_per_class: [],
    working_hours_per_week: 0,
    last_training_date: null,
};

const emptyTrainingList: OnboardingTrainingEntry[] = [];

export const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const getTrainingStatus = (dateString: string | null): OnboardingTrainingEntry["status"] => {
    if (!dateString) {
        return "Valid";
    }

    const attendedAt = new Date(dateString);
    const ageInMonths = (Date.now() - attendedAt.getTime()) / (1000 * 60 * 60 * 24 * 30);

    if (ageInMonths > 36) {
        return "Expired";
    }

    if (ageInMonths > 30) {
        return "Expiring Soon";
    }

    return "Valid";
};

const parseDateValue = (value: string | null | undefined) => {
    if (!value) {
        return null;
    }

    return value;
};

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
    const { accessToken, user, setUser, isLoading: isAuthLoading } = useAuth();
    const [onboardingData, setOnboardingData] = useState<OnboardingData>(initialData);
    const [trainings, setTrainings] = useState<OnboardingTrainingEntry[]>(emptyTrainingList);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const authHeaders = accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
        }
        : null;

    const refreshAuthUser = async () => {
        if (!accessToken) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
                headers: authHeaders ?? undefined,
            });

            if (!response.ok) {
                return;
            }

            const currentUser = await response.json();
            setUser(currentUser);
        } catch {
            return;
        }
    };

    const hydrateFromBackend = async () => {
        try {
            if (!accessToken || user?.role !== "teacher") {
                setOnboardingData(initialData);
                setTrainings(emptyTrainingList);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/teachers/me`, {
                headers: authHeaders ?? undefined,
            });

            if (!response.ok) {
                return;
            }

            const payload = (await response.json()) as TeacherProfileApiResponse;
            setOnboardingData({
                teacherName: payload.full_name ?? "",
                teacher_id_number: payload.profile.teacher_id_number ?? "",
                school: payload.profile.school ?? "",
                region: payload.profile.region ?? "",
                province: payload.profile.province ?? "",
                grade_level_taught: payload.profile.grade_level_taught ?? "",
                current_subject: payload.profile.current_subject ?? "",
                specialization: payload.profile.specialization ?? "",
                teaching_outside_specialization: payload.profile.teaching_outside_specialization ?? false,
                years_experience: payload.profile.years_experience ?? 0,
                num_classes: payload.profile.num_classes ?? 0,
                students_per_class: payload.profile.students_per_class ?? [],
                working_hours_per_week: payload.profile.working_hours_per_week ?? 0,
                last_training_date: parseDateValue(payload.profile.last_training_date),
            });
            setTrainings(
                payload.trainings.map((training) => ({
                    id: training.id,
                    title: training.training_name,
                    category: training.training_type ?? "Other",
                    completionDate: training.date_attended ?? "",
                    status: getTrainingStatus(training.date_attended),
                    persisted: true,
                })),
            );
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthLoading) {
            return;
        }

        void hydrateFromBackend();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accessToken, isAuthLoading, user?.role]);

    const resetOnboardingData = () => {
        setOnboardingData(initialData);
        setTrainings(emptyTrainingList);
    };

    const updateOnboardingData = (newData: Partial<OnboardingData>) => {
        setOnboardingData((prev) => ({ ...prev, ...newData }));
    };

    const addTraining = (entry: Omit<OnboardingTrainingEntry, "id" | "persisted">) => {
        setTrainings((prev) => [...prev, { ...entry, id: crypto.randomUUID(), persisted: false }]);
    };

    const removeTraining = (id: string) => {
        setTrainings((prev) => prev.filter((training) => training.id !== id));
    };

    const saveOnboardingFields = async (fields: Partial<OnboardingData>) => {
        if (!accessToken) {
            throw new Error("You must be signed in to save onboarding progress.");
        }

        setIsSaving(true);
        try {
            updateOnboardingData(fields);

            const payload = {
                teacher_id_number: fields.teacher_id_number,
                school: fields.school,
                region: fields.region,
                province: fields.province,
                grade_level_taught: fields.grade_level_taught,
                current_subject: fields.current_subject,
                specialization: fields.specialization,
                teaching_outside_specialization: fields.teaching_outside_specialization,
                years_experience: fields.years_experience,
                num_classes: fields.num_classes,
                students_per_class: fields.students_per_class,
                working_hours_per_week: fields.working_hours_per_week,
                last_training_date: fields.last_training_date,
            };

            const response = await fetch(`${API_BASE_URL}/api/teachers/me`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const payloadError = await response.json().catch(() => null);
                throw new Error(payloadError?.detail || "Failed to save onboarding progress");
            }

            await refreshAuthUser();
        } finally {
            setIsSaving(false);
        }
    };

    const saveTrainings = async () => {
        if (!accessToken) {
            throw new Error("You must be signed in to save trainings.");
        }

        setIsSaving(true);
        try {
            const pendingTrainings = trainings.filter((training) => !training.persisted);

            for (const training of pendingTrainings) {
                const response = await fetch(`${API_BASE_URL}/api/teachers/me/trainings`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...authHeaders,
                    },
                    body: JSON.stringify({
                        training_name: training.title,
                        training_type: training.category,
                        date_attended: training.completionDate || null,
                    }),
                });

                if (!response.ok) {
                    const payloadError = await response.json().catch(() => null);
                    throw new Error(payloadError?.detail || "Failed to save training entry");
                }

                const persistedTraining = await response.json();
                setTrainings((currentTrainings) =>
                    currentTrainings.map((currentTraining) =>
                        currentTraining.id === training.id
                            ? { ...currentTraining, id: persistedTraining.id ?? currentTraining.id, persisted: true }
                            : currentTraining,
                    ),
                );
            }

            await refreshAuthUser();
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <OnboardingContext.Provider
            value={{
                onboardingData,
                trainings,
                isLoading,
                isSaving,
                setOnboardingData,
                resetOnboardingData,
                updateOnboardingData,
                addTraining,
                removeTraining,
                saveOnboardingFields,
                saveTrainings,
            }}
        >
            {children}
        </OnboardingContext.Provider>
    );
};