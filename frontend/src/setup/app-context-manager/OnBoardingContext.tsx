import { createContext, useState } from "react";

//Types
export type teacherName = string;
export type teacher_id_number = string;
export type school = string;
export type region = string;
export type province = string;
export type grade_level_taught = string;
export type current_subject = string;
export type specialization = string;
export type teaching_outside_specialization = boolean;
export type years_experience = number;
export type num_classes = number;
export type student_per_class = number[];
export type working_hours_per_week = number;
export type last_training_date = Date;  
export type trainingsAttended = string[];


//Data Shape
interface OnboardingData {
    teacherName: teacherName;
    teacher_id_number: teacher_id_number;
    school: school;
    region: region;
    province: province;
    grade_level_taught: grade_level_taught;
    current_subject: current_subject;
    specialization: specialization;
    teaching_outside_specialization: teaching_outside_specialization;
    years_experience: years_experience;
    num_classes: num_classes;
    students_per_class: student_per_class;
    working_hours_per_week: working_hours_per_week;
    last_training_date: last_training_date;
}


//Context Shape
interface OnboardingContextType {
    onboardingData: OnboardingData;
    setOnboardingData: (data: OnboardingData) => void;
    resetOnboardingData: () => void;
    updateOnboardingData: (newData: Partial<OnboardingData>) => void;
}

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
    last_training_date: new Date(),
};

export const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider = ({ children }: { children: React.ReactNode }) => {
    const [onboardingData, setOnboardingData] = useState<OnboardingData>(initialData);

    const resetOnboardingData = () => {
        setOnboardingData(initialData);
    }

    const updateOnboardingData = (newData: Partial<OnboardingData>) => {
        setOnboardingData(prev => ({ ...prev, ...newData }));
    };

    return (
        <OnboardingContext.Provider value={{ onboardingData, setOnboardingData, resetOnboardingData, updateOnboardingData }}>
            {children}
        </OnboardingContext.Provider>
    );
}