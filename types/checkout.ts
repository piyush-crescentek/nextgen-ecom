import { VolumeTier, VolumeDiscount } from "@/lib/visibility";

export interface BillingPayload {
    email: string;
    first_name: string;
    last_name: string;
    street_address: string;
    street_address_2?: string;
    city: string;
    county?: string;
    postcode: string;
    phone: string;
    country: string;
}

export interface PaymentPayload {
    method: 'stripe' | 'wallet';
    payment_method_id: string | null;
    save_card: boolean;
    otp?: string;
}

export interface VueFormPatient {
    key: string;
    label: string;
    value: string;
}

export interface VueFormData {
    key: string;
    title: string;
    fields: Array<{ key: string; title: string; value: string | null }>;
}

export interface DiscountPayload {
    group_id: number;
    name: string;
    percentage: number;
}

export interface PhysicalOrderPayload {
    order_type: 'physical';
    session_id: string | null;
    billing: BillingPayload;
    payment: PaymentPayload;
    order: {
        physical_items: Array<{
            product_id: string | number;
            slug: string;
            name: string;
            quantity: number;
            unit_price: number;
            total_price: number;
            volumn?: VolumeDiscount | null;
        }>;
        physical_total: number;
        currency: string;
        delivery_address: {
            address_line_1: string;
            address_line_2?: string;
            city: string;
            postcode: string;
            country: string;
        };
        delivery_notes?: string;
        order_notes?: string;
        patient_info?: any;
        contact_info?: any;
        vue_form_data?: VueFormData[];
        vue_form_patient?: VueFormPatient[];
        vue_form_upload_id_proof?: string | null;
        discount?: DiscountPayload;
        volumn?: VolumeDiscount | null;
    };
}

export interface DigitalOrderPayload {
    order_type: 'digital';
    session_id: string | null;
    slug: string;
    billing: BillingPayload;
    payment: PaymentPayload;
    order: {
        product_id: number | undefined;
        consultation_details: string;
        consultation_data: any;
        price: number;
        currency: string;
        order_notes?: string;
        patient_info?: any;
        contact_info?: any;
        vue_form_data?: VueFormData[];
        vue_form_patient?: VueFormPatient[];
        vue_form_upload_id_proof?: string | null;
        appointment?: any;
        discount?: DiscountPayload;
        volumn?: VolumeDiscount | null;
    };
}

export interface MixedOrderPayload {
    order_type: 'mixed';
    session_id: string | null;
    billing: BillingPayload;
    payment: PaymentPayload;
    order: {
        currency: string;
        physical_total: number;
        digital_total: number;
        delivery_address: {
            address_line_1: string;
            address_line_2?: string;
            city: string;
            postcode: string;
            country: string;
        };
        physical_items: Array<{
            product_id: string | number;
            slug: string;
            name: string;
            quantity: number;
            unit_price: number;
            total_price: number;
            volumn?: VolumeDiscount | null;
        }>;
        digital_items: Array<{
            product_id: number | undefined;
            slug: string;
            price: number;
            consultation_details?: string;
            consultation_data?: any;
            patient_info?: any;
            contact_info?: any;
            vue_form_data?: VueFormData[];
            vue_form_patient?: VueFormPatient[];
            vue_form_upload_id_proof?: string | null;
            appointment?: any;
            volumn?: VolumeDiscount | null;
        }>;
        order_notes?: string;
        discount?: DiscountPayload;
        volumn?: VolumeDiscount | null;
    };
}

export interface CheckoutFormData {
    email: string;
    first_name: string;
    last_name: string;
    country: string;
    street_address: string;
    street_address_2?: string;
    city: string;
    county: string;
    postcode: string;
    phone: string;
    order_notes?: string;
}

export interface ProductDetails {
    id: number;
    pk?: number;
    category_id?: number;
    name: string;
    type?: string;
    product_display: {
        price_range: {
            min: string | number;
            max: string | number;
            currency: string;
        } | string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

export interface SavedCard {
    id: string;
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
}
