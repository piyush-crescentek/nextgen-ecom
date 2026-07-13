/**
 * Validation utilities for form inputs
 */

/**
 * Validates Irish Eircode format
 * Format: A65 F4E2 (3 alphanumeric characters + space + 4 alphanumeric characters)
 * Examples: D02 AF30, T12 C3D4, A65 F4E2
 * 
 * @param postcode - The postcode string to validate
 * @returns boolean - true if valid Irish Eircode format
 */
export const validateIrishPostcode = (postcode: string): boolean => {
    if (!postcode) return false;

    // Remove any extra whitespace and convert to uppercase
    const cleaned = postcode.trim().toUpperCase();

    // Irish Eircode format: XXX XXXX (3 alphanumeric + space + 4 alphanumeric)
    // First character must be a letter (routing key)
    // Format: A65 F4E2
    const eircodeRegex = /^[A-Z]\d{2}\s?[A-Z0-9]{4}$/;

    return eircodeRegex.test(cleaned);
};

/**
 * Formats Irish Eircode to standard format with space
 * @param postcode - The postcode string to format
 * @returns string - Formatted postcode (e.g., "D02 AF30")
 */
export const formatIrishPostcode = (postcode: string): string => {
    if (!postcode) return '';

    // Remove all spaces and convert to uppercase
    const cleaned = postcode.replace(/\s/g, '').toUpperCase();

    // If it's 7 characters, add space after 3rd character
    if (cleaned.length === 7) {
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    }

    return cleaned;
};

/**
 * Gets validation error message for Irish postcode
 * @param postcode - The postcode to validate
 * @returns string | null - Error message or null if valid
 */
export const getIrishPostcodeError = (postcode: string): string | null => {
    if (!postcode || postcode.trim() === '') {
        return 'Postcode is required';
    }

    if (!validateIrishPostcode(postcode)) {
        return 'Please enter a valid Irish Eircode (e.g., D02 AF30, T12 C3D4)';
    }

    return null;
};

export type ContactInquiryUserType = "employers" | "patients";

export type ContactInquiryFormData = {
    full_name: string;
    phone: string;
    email: string;
    user_type: ContactInquiryUserType | "provide";
    message: string;
};

export type ContactInquiryPayload = {
    full_name: string;
    phone: string;
    email: string;
    user_type: ContactInquiryUserType;
    message: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FULL_NAME_REGEX = /^[a-zA-ZÀ-ÿ' -]{2,100}$/;
const PHONE_REGEX = /^\+[0-9]{7,15}$/;

export const validateContactInquiry = (
    data: ContactInquiryFormData,
): Partial<Record<keyof ContactInquiryFormData, string>> => {
    const errors: Partial<Record<keyof ContactInquiryFormData, string>> = {};

    const fullName = data.full_name.trim();
    if (!fullName) {
        errors.full_name = "Full name is required";
    } else if (!FULL_NAME_REGEX.test(fullName)) {
        errors.full_name =
            "Please enter a valid full name (2–100 characters, letters only)";
    }

    const phone = data.phone.trim();
    if (!phone) {
        errors.phone = "Phone number is required";
    } else if (!PHONE_REGEX.test(phone)) {
        errors.phone =
            "Please enter a valid phone number starting with + (e.g. +353851234567)";
    }

    const email = data.email.trim();
    if (!email) {
        errors.email = "Email is required";
    } else if (!EMAIL_REGEX.test(email)) {
        errors.email = "Please enter a valid email address";
    } else if (email.length > 255) {
        errors.email = "Email must not exceed 255 characters";
    }

    if (data.user_type === "provide") {
        errors.user_type = "Please select who you are enquiring as";
    }

    const message = data.message.trim();
    if (!message) {
        errors.message = "Message is required";
    } else if (message.length < 10) {
        errors.message = "Message must be at least 10 characters";
    } else if (message.length > 2000) {
        errors.message = "Message must not exceed 2000 characters";
    }

    return errors;
};

export const buildContactInquiryPayload = (
    data: ContactInquiryFormData,
): ContactInquiryPayload => ({
    full_name: data.full_name.trim(),
    phone: data.phone.trim(),
    email: data.email.trim().toLowerCase(),
    user_type: data.user_type as ContactInquiryUserType,
    message: data.message.trim(),
});
