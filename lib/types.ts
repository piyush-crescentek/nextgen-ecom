export interface ProductBadge {
    title: string;
    imgUrl: string;
}

export interface ProductSliderImage {
    imgUrl: string;
    altText: string | null;
}

export interface ProductSectionHighlight {
    text: string;
}

export interface ProductSection {
    key: string;
    type: string;
    title: string;
    description: string;
    imageUrl: string;
    imagePosition: 'left' | 'right';
    subsections: any[];
    steps: any[];
    sub_title: string;
    sub_description: string;
    highlights_title: string;
    highlights: ProductSectionHighlight[];
    note: string | null;
}

export interface ProcessCard {
    title: string;
    description: string;
    iconUrl: string;
}

export interface ProcessCards {
    key: string;
    title: string | null;
    cards: ProcessCard[];
}

export interface FAQSubItem {
    question: string;
    answer: string;
}

export interface FAQItem {
    question: string;
    sub_items: FAQSubItem[];
}

export interface ProductFAQ {
    title: string;
    subtitle: string;
    items: FAQItem[];
}

export interface PhysicalDetailFeature {
    id: number;
    title: string;
    content: string;
    iconUrl: string;
}

export interface PhysicalDetails {
    title: string;
    description: string;
    image_url: string;
    features: PhysicalDetailFeature[];
}

export interface PhysicalKitUsage {
    title: string;
    subtitle: string;
    video_title: string;
    video_subtitle: string | null;
    video_url: string;
    video_thumbnail_url: string;
    list_title: string;
    list_items: string[];
    note_content: string;
}

export interface PhysicalHowItWorksStep {
    id: number;
    title: string;
    iconUrl: string;
    description: string;
}

export interface PhysicalHowItWorks {
    title: string;
    subtitle: string;
    steps: PhysicalHowItWorksStep[];
}

export interface PhysicalWhatToExpectStage {
    id: number;
    title: string;
    imageUrl: string;
    description: string;
}

export interface PhysicalWhatToExpect {
    title: string;
    subtitle: string;
    stages: PhysicalWhatToExpectStage[];
}

export interface ProductPricingOption {
    title: string;
    key: string;
    duration?: number;
    durationUnit?: string;
    price: number;
    discountType?: string;
    discountValue?: number | string;
    finalAmount?: number | string;
}

export interface ProductPricingField {
    type?: string;
    label?: string;
    pricingOptions?: ProductPricingOption[];
}

export interface OhPrice {
    duration: string;
    duration_unit: string;
    amount: string;
    label: string;
    discount_type?: string | null;
    discount_value?: string | null;
    discounted_amount?: string | null;
}

export interface ProductDisplay {
    slug: string;
    short_description: string;
    price_range: {
        currency: string;
        min: string | null;
        max: string | null;
        price: string;
        discounted_price: string;
        discount_percentage: string;
    };
    cta_text: string;
    slider_images: ProductSliderImage[];
    badges: ProductBadge[];
    highlights: string[];
    sections: ProductSection[];
    process_cards: ProcessCards;
    faq: ProductFAQ;
    status: string;
    physical_details?: PhysicalDetails;
    physical_kit_usage?: PhysicalKitUsage;
    physical_how_it_works?: PhysicalHowItWorks;
    physical_what_to_expect?: PhysicalWhatToExpect;
}

export interface Product {
    id: number;
    type: string;
    type_label: string;
    category_id: number;
    category_name: string;
    subcategory_id: number | null;
    subcategory_name: string | null;
    name: string;
    sku: string;
    slug: string;
    category_slug: string;
    subcategory_slug: string | null;
    price: number | null;
    session_duration: number | null;
    description: string | null;
    conditions_treated?: string | null;
    pre_service_guidelines?: string | null;
    during_service_guidelines?: string | null;
    post_service_guidelines?: string | null;
    result_template_ids: number[];
    wp_form_url: string | null;
    form_id: number | null;
    oh_form_recipient?: 'both' | 'employer' | 'employee' | null;
    oh_forms?: { id: number; title: string; type: 'employer' | 'employee' }[];
    oh_prices?: OhPrice[];
    forms_pricing?: ProductPricingField | null;
    product_display: ProductDisplay;
    related_product_ids: number[];
    related_kit_ids?: number[];
    // Physical product specific fields
    turnaround_time?: string | null;
    results_delivery?: string | null;
    test_type?: string | null;
    product_id?: number | string | null;
    pk?: number | string | null;
}
