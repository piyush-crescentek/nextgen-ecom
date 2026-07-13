"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MOCK_LANDING_PAGE } from '@/lib/mock-data';

// --- Types ---

export interface Step {
    title: string;
    description: string;
}

export interface SideCard {
    image: string;
    description: string;
}

export interface MiddleCard {
    text: string;
    image: string;
}

export interface DoctorSectionData {
    steps: Step[];
    sideCards: SideCard[];
    middleCard: MiddleCard;
    stepsTitle: string;
    headerTitle: string;
    comfortTitle: string;
    headerDescription: string;
}

export interface FaqItem {
    question: string;
    answer: string;
}

export interface FaqCategory {
    categoryTitle: string;
    items: FaqItem[];
}

export interface FaqSectionData {
    title: string;
    subtitle: string;
    faqCategories: FaqCategory[];
}

export interface OrgSectionData {
    ctaLink: string | null;
    ctaText: string;
    mainImage: string;
    headerTitle: string;
    contentTitle: string;
    contentDescription: string;
}

export interface LandingPageData {
    doctorSection: DoctorSectionData | null;
    faqSection: FaqSectionData | null;
    orgSection: OrgSectionData | null;
}

interface LandingPageContextType {
    data: LandingPageData;
    loading: boolean;
    error: Error | null;
}

// --- Context ---

const LandingPageContext = createContext<LandingPageContextType | undefined>(undefined);

export function LandingPageProvider({ children }: { children: ReactNode }) {
    // Static mock data — no API call is made.
    const [data, setData] = useState<LandingPageData>({
        doctorSection: null,
        faqSection: null,
        orgSection: null,
    });
    const [loading, setLoading] = useState(true);
    const [error] = useState<Error | null>(null);

    useEffect(() => {
        setData({
            doctorSection: (MOCK_LANDING_PAGE.doctorSection as DoctorSectionData) || null,
            faqSection: (MOCK_LANDING_PAGE.faqSection as FaqSectionData) || null,
            orgSection: (MOCK_LANDING_PAGE.orgSection as OrgSectionData) || null,
        });
        setLoading(false);
    }, []);

    return (
        <LandingPageContext.Provider value={{ data, loading, error }}>
            {children}
        </LandingPageContext.Provider>
    );
}

export function useLandingPage() {
    const context = useContext(LandingPageContext);
    if (context === undefined) {
        throw new Error('useLandingPage must be used within a LandingPageProvider');
    }
    return context;
}
