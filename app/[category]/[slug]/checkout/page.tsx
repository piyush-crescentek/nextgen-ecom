"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { CardNumberElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import { clearConsultationSessionStorage } from "@/lib/consultationSession";
import { storeStripeCheckoutUrl } from "@/lib/checkoutPayment";
import { extractOhPricingFromConsultation } from "@/lib/oh-prices";
import { getStripeEnvDebug, isDevelopment } from "@/lib/env";
import getStripe from "@/lib/stripe";
import { getIrishPostcodeError } from "@/lib/validation";
import { isValidPhoneNumber } from "react-phone-number-input";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useCheckoutStore } from "@/store/useCheckoutStore";
import { useFormStore } from "@/store/useFormStore";

import CheckoutSkeleton from "@/components/checkout/CheckoutSkeleton";
import PaymentMethodModal from "@/components/checkout/PaymentMethodModal";
import BillingForm from "@/components/checkout/BillingForm";
import OrderSummary from "@/components/checkout/OrderSummary";
import CheckoutBanners from "@/components/checkout/CheckoutBanners";
import WalletOtpModal from "@/components/checkout/WalletOtpModal";

import { getDiscountPercentage, calculateDiscountedPrice, isPaymentMethodAllowed, getVolumeTiers, hasExclusiveDiscount } from "@/lib/visibility";

import type {
    CheckoutFormData,
    ProductDetails,
    SavedCard,
    BillingPayload,
    PaymentPayload,
    PhysicalOrderPayload,
    DigitalOrderPayload,
    MixedOrderPayload,
} from "@/types/checkout";

const stripePromise = getStripe();

const extractPricingFromConsultation = (consultationData: unknown): { label: string; price: number; duration: string | null } | null => {
    const cData = consultationData as Record<string, unknown> | null;
    let data = Array.isArray(consultationData)
        ? consultationData
        : (cData?.vue_form_data as unknown[]) || (cData?.all_fields as unknown[]) || [];

    if (Array.isArray(data) && data.length > 0 && (data[0] as { fields?: unknown })?.fields) {
        data = (data as Array<{ fields?: unknown[] }>).flatMap((section) => section.fields || []);
    }

    if (!Array.isArray(data)) return null;

    const pricingField = data.find((f) => {
        const field = f as { key?: string; title?: string; value?: string | null };
        const key = String(field?.key || "").toLowerCase();
        const title = String(field?.title || "").toLowerCase();
        const value = String(field?.value || "").toLowerCase();
        return (
            key.includes("pricing") ||
            title.includes("pricing") ||
            title.includes("update variation") ||
            value.includes("€")
        );
    }) as { value?: string | null } | undefined;

    if (!pricingField?.value) return null;

    const normalizedValue = String(pricingField.value);
    const match = normalizedValue.replace(/,/g, "").match(/€\s*(\d+\.?\d*)|(\d+\.?\d*)\s*€/);
    const parsedPrice = match?.[1] || match?.[2] ? parseFloat((match[1] || match[2]) as string) : 0;

    const durationMatch = normalizedValue.match(/(\d+)\s*(hour|hours|day|days|week|weeks|min|mins|minute|minutes)\b/i);
    const duration = durationMatch ? `${durationMatch[1]} ${durationMatch[2]}` : null;

    return {
        label: normalizedValue,
        price: Number.isFinite(parsedPrice) ? parsedPrice : 0,
        duration,
    };
};

const isBlankConsultationValue = (value: unknown): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value !== "string") return false;
    const normalized = value.trim().toLowerCase();
    return normalized === "" || normalized === "-" || normalized === "null" || normalized === "undefined";
};

const fieldLooksRequired = (field: { key?: string; title?: string }): boolean => {
    const key = String(field.key || "").toLowerCase();
    const title = String(field.title || "").toLowerCase();
    return (
        title.includes("(required)") ||
        title.includes("*") ||
        key === "first" ||
        key === "last" ||
        key === "first_name" ||
        key === "last_name" ||
        key === "email" ||
        key === "phone" ||
        key === "dob" ||
        key === "date_of_birth" ||
        key === "gender" ||
        key === "sl_reason" ||
        key === "ill_reason" ||
        key === "timeline_ill" ||
        key === "str_date" ||
        key === "end_date"
    );
};

const hasIncompleteConsultationData = (consultationData: unknown): boolean => {
    if (!consultationData || typeof consultationData !== "object") return true;
    const cData = consultationData as Record<string, unknown>;
    const sectionsToCheck = [cData.vue_form_data, cData.vue_form_patient];

    for (const section of sectionsToCheck) {
        if (!Array.isArray(section)) continue;
        for (const group of section) {
            const fields = (group as { fields?: Array<{ key?: string; title?: string; value?: unknown }> })?.fields;
            if (!Array.isArray(fields)) continue;
            const hasBlankRequiredField = fields.some((field) => fieldLooksRequired(field) && isBlankConsultationValue(field.value));
            if (hasBlankRequiredField) return true;
        }
    }

    return false;
};

function CheckoutContent() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("sessionId");
    const slug = params?.slug as string;

    const { user, isAuthenticated, fetchProfile } = useAuthStore();
    const { items: cartItems, totalAmount: cartTotalAmount, removeItem } = useCartStore();
    const { clearCheckoutData, getConsultationData } = useCheckoutStore();
    const { clearProgress } = useFormStore();
    const consultationData = sessionId ? getConsultationData(sessionId) : null;

    const stripe = useStripe();
    const elements = useElements();

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [product, setProduct] = useState<ProductDetails | null>(null);
    const [formData, setFormData] = useState<CheckoutFormData>({
        email: "",
        first_name: "",
        last_name: "",
        country: "Ireland",
        street_address: "",
        street_address_2: "",
        city: "",
        county: "",
        postcode: "",
        phone: "",
        order_notes: "",
    });

    const [paymentMethod, setPaymentMethod] = useState("stripe");
    const [saveCard, setSaveCard] = useState(true);
    const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [isFetchingCards, setIsFetchingCards] = useState(false);
    const [useWallet, setUseWallet] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isWalletOtpModalOpen, setIsWalletOtpModalOpen] = useState(false);
    const [consultationPrice, setConsultationPrice] = useState(0);
    const [consultationLabel, setConsultationLabel] = useState("");
    const [consultationDuration, setConsultationDuration] = useState<string | null>(null);

    const hasRedirected = useRef(false);
    const hasFetchedCards = useRef(false);

    const isPhysicalProduct = product?.type === "physical";

    useEffect(() => {
        const stripeEnv = getStripeEnvDebug();
        console.warn("[checkout] Stripe publishable key", {
            stripePublishableKey: stripeEnv.stripePublishableKey,
            source: stripeEnv.source,
            mode: stripeEnv.mode,
            masked: stripeEnv.masked,
        });
    }, []);

    useEffect(() => {
        const ohPricing = extractOhPricingFromConsultation(consultationData);
        if (ohPricing) {
            setConsultationLabel(ohPricing.label);
            setConsultationDuration(ohPricing.duration);
            if (ohPricing.price > 0) {
                setConsultationPrice(ohPricing.price);
            }
            return;
        }

        const selectedPricing = extractPricingFromConsultation(consultationData);
        if (!selectedPricing) return;
        setConsultationLabel(selectedPricing.label);
        setConsultationDuration(selectedPricing.duration);
        if (selectedPricing.price > 0) {
            setConsultationPrice(selectedPricing.price);
        }
    }, [consultationData]);

    useEffect(() => {
        if (!consultationData) return;
        const cData = consultationData as any;
        let patientData = cData?.vue_form_patient || [];
        
        // Flatten nested patient data if present (e.g. for occupational health structured data)
        if (patientData.length > 0 && patientData[0]?.fields && Array.isArray(patientData[0].fields)) {
            patientData = patientData.flatMap((section: any) => section.fields);
        }

        if (patientData.length > 0) {
            const getValue = (key: string) => {
                const field = patientData.find((p: any) => p.key === key);
                return field && field.value !== '-' ? field.value : null;
            };

            const first = getValue('first');
            const last = getValue('last');
            const email = getValue('email');
            const phone = getValue('phone');

            setFormData((prev) => ({
                ...prev,
                first_name: prev.first_name || first || "",
                last_name: prev.last_name || last || "",
                email: (isAuthenticated && user?.email) ? user.email : (prev.email || email || ""),
                phone: prev.phone || phone || "",
            }));
        }
    }, [consultationData, isAuthenticated, user?.email]);

    useEffect(() => {
        const loadInitialData = async () => {
            if (!slug) return;
            if (!sessionId) {
                if (!hasRedirected.current) {
                    hasRedirected.current = true;
                    toast.error("Invalid session. Please start from the product page.");
                    router.push("/");
                }
                return;
            }
            const hasAccess = sessionStorage.getItem(`checkout_access_${sessionId}`);
            const hasConsultationData = Boolean(getConsultationData(sessionId));
            if (!hasAccess) {
                if (!hasRedirected.current) {
                    hasRedirected.current = true;
                    toast.error("Access denied. Please complete the consultation form first.");
                    router.push("/");
                }
                return;
            }
            if (!hasConsultationData) {
                if (!hasRedirected.current) {
                    hasRedirected.current = true;
                    toast.error("Session data missing. Please resume your form first.");
                    router.push(`/${params?.category}/${slug}/form?sessionId=${sessionId}`);
                }
                return;
            }
            try {
                const productRes = await api.get(API_ENDPOINTS.PRODUCT_DETAILS(slug));
                setProduct(productRes.data.data);
                const savedBilling = sessionStorage.getItem(`billing_info_${sessionId}`);
                if (savedBilling) {
                    try {
                        setFormData((prev) => ({ ...prev, ...JSON.parse(savedBilling) }));
                    } catch {
                        console.warn("Failed to parse saved billing info");
                    }
                }
            } catch {
                toast.error("Failed to load product details");
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, [slug, sessionId, router, getConsultationData, params?.category]);

    useEffect(() => {
        if (!isAuthenticated || hasFetchedCards.current) return;
        hasFetchedCards.current = true;
        (async () => {
            try {
                await fetchProfile();
                const { user: updatedUser } = useAuthStore.getState();
                await fetchSavedCards(updatedUser?.stripe_payment_method_id);
            } catch {
                toast.error("Failed to load saved cards");
            }
        })();
    }, [isAuthenticated, fetchProfile]);

    useEffect(() => {
        if (!user) return;
        const addr = typeof user.address === "object" ? user.address : null;
        setFormData((prev) => ({
            ...prev,
            email: user.email || prev.email || "",
            first_name: prev.first_name || user.first_name || user.name?.split(" ")[0] || "",
            last_name: prev.last_name || user.last_name || user.name?.split(" ").slice(1).join(" ") || "",
            phone: prev.phone || user.phone || "",
            street_address: prev.street_address || addr?.address || (typeof user.address === "string" ? user.address : "") || "",
            city: prev.city || addr?.city || user.city || "",
            postcode: prev.postcode || addr?.postcode || user.postcode || "",
            county: prev.county || addr?.state || user.county || "",
        }));
    }, [user]);

    const fetchSavedCards = async (paymentMethodId?: string | null) => {
        if (!paymentMethodId) return;
        setIsFetchingCards(true);
        try {
            const response = await api.get(API_ENDPOINTS.CARD_DETAILS, {
                params: { payment_method_id: paymentMethodId },
            });
            const data = response.data;
            let cards: SavedCard[] = [];
            if (Array.isArray(data)) cards = data;
            else if (data?.id) cards = [data];
            else if (Array.isArray(data?.data)) cards = data.data;
            setSavedCards(cards);
            if (cards.length > 0) setSelectedCardId(cards[0].id);
        } catch (error: unknown) {
            const status = (error as { response?: { status?: number } })?.response?.status;
            if (status !== 400 && status !== 422) {
                console.error("Failed to fetch saved cards:", error);
            }
            setSavedCards([]);
        } finally {
            setIsFetchingCards(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (name === "postcode") {
            setErrors((prev) => ({ ...prev, postcode: getIrishPostcodeError(value) || "" }));
        } else if (errors[name] && value) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    };

    const validateBillingForm = () => {
        const required: Array<keyof CheckoutFormData> = ["email", "first_name", "last_name", "street_address", "city", "postcode", "phone"];
        const newErrors: Record<string, string> = {};
        for (const field of required) {
            if (field === "postcode") {
                const err = getIrishPostcodeError(formData.postcode);
                if (err) newErrors.postcode = err;
            } else if (field === "phone") {
                if (!formData.phone) {
                    newErrors.phone = "Phone number is required";
                } else if (!isValidPhoneNumber(formData.phone)) {
                    newErrors.phone = "Please enter a valid phone number";
                }
            } else if (!formData[field]) {
                newErrors[field as string] = `${(field as string).replace(/_/g, " ")} is required`;
            }
        }
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            toast.error(Object.values(newErrors)[0]);
            return false;
        }
        return true;
    };

    const parseAmount = (val: string | number | null | undefined): number => {
        const str = String(val ?? "").replace(/[^0-9.]/g, "");
        const num = parseFloat(str);
        return isNaN(num) ? 0 : num;
    };

    const isExclusive = (product && user?.business_group && hasExclusiveDiscount({ id: product.id || product.pk, category_id: product.category_id }, user.business_group)) || 
                        cartItems.some(item => (item.id && user?.business_group && hasExclusiveDiscount({ id: item.id, category_id: (item as any).category_id }, user.business_group)));

    const productTiers = (product && user?.business_group && !isExclusive) ? getVolumeTiers({ id: product.id || product.pk, category_id: product.category_id }, user.business_group) : null;
    const productDiscount = (product && user?.business_group && (isExclusive || !productTiers || productTiers.tiers.length === 0)) ? getDiscountPercentage({ id: product.id || product.pk, category_id: product.category_id }, user.business_group) : 0;

    const cartDiscountedTotal = cartItems.reduce((acc, item) => {
        const tiers = (item.id && user?.business_group && !isExclusive) ? getVolumeTiers({ id: item.id, category_id: (item as any).category_id }, user.business_group) : null;
        const itemDiscount = (item.id && user?.business_group && (isExclusive || !tiers || tiers.tiers.length === 0)) ? getDiscountPercentage({ id: item.id, category_id: (item as any).category_id }, user.business_group) : 0;
        return acc + (calculateDiscountedPrice(item.price, itemDiscount) * item.quantity);
    }, 0);

    const hasAnyBusinessGroupDiscount = productDiscount > 0 || cartItems.some(item => {
        const tiers = (item.id && user?.business_group) ? getVolumeTiers({ id: item.id, category_id: (item as any).category_id }, user.business_group) : null;
        const d = (item.id && user?.business_group && (!tiers || tiers.tiers.length === 0)) ? getDiscountPercentage({ id: item.id, category_id: (item as any).category_id }, user.business_group) : 0;
        return d > 0;
    });

    const finalIsExclusive = isExclusive || hasAnyBusinessGroupDiscount;

    const hasAnyVolumeDiscount = (productTiers && productTiers.tiers.length > 0) || cartItems.some(item => {
        const tiers = (item.id && user?.business_group && !finalIsExclusive) ? getVolumeTiers({ id: item.id, category_id: (item as any).category_id }, user.business_group) : null;
        return tiers && tiers.tiers.length > 0;
    });

    const totalAmount = (consultationPrice > 0 ? consultationPrice : parseAmount(
        typeof product?.product_display?.price_range === "object"
            ? product.product_display.price_range.min
            : product?.product_display?.price_range
    ));

    const finalTotalAmount = isPhysicalProduct ? cartDiscountedTotal : (calculateDiscountedPrice(totalAmount, productDiscount) + cartDiscountedTotal);
    const walletBalance = parseAmount(user?.wallet_balance);
    const isBalanceEnough = walletBalance >= finalTotalAmount;

    const handleWalletToggle = (checked: boolean) => {
        if (!isBalanceEnough && checked) {
            toast.error("Insufficient wallet balance");
            return;
        }
        setUseWallet(checked);
        setPaymentMethod(checked ? "wallet" : "stripe");
    };

    const handlePlaceOrderClick = async () => {
        if (!validateBillingForm()) return;
        if (useWallet) {
            try {
                setIsSubmitting(true);
                await api.post(API_ENDPOINTS.SEND_WALLET_OTP, { email: formData.email });
                setIsWalletOtpModalOpen(true);
            } catch (error: unknown) {
                const err = error as { response?: { data?: { message?: string } } };
                toast.error(err.response?.data?.message || "Failed to send verification code");
            } finally {
                setIsSubmitting(false);
            }
        }
        else setIsPaymentModalOpen(true);
    };

    const buildBilling = (): BillingPayload => ({
        email: (isAuthenticated && user?.email) ? user.email : formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        street_address: formData.street_address,
        street_address_2: formData.street_address_2 || undefined,
        city: formData.city,
        county: formData.county || undefined,
        postcode: formData.postcode,
        phone: formData.phone,
        country: formData.country || "Ireland",
    });

    const buildPayment = (paymentMethodId: string | null, otp?: string): PaymentPayload => ({
        method: paymentMethod as "stripe" | "wallet",
        payment_method_id: paymentMethodId,
        save_card: saveCard,
        ...(otp ? { otp } : {})
    });

    const normalizeConsultationDataAndExtractIdProof = (
        baseConsultationData: any,
        noOfDays: unknown
    ): { consultationData: any; idProofValue?: string } => {
        const shouldIncludeNoOfDays = !(noOfDays === undefined || noOfDays === null || noOfDays === "");
        const noOfDaysField = { key: "no_of_days", title: "No Of Days", value: String(noOfDays ?? "") };
        let extractedIdProofValue: string | undefined;

        const tryCaptureIdProof = (val: unknown) => {
            if (extractedIdProofValue) return;
            if (val === undefined || val === null || val === "") return;
            extractedIdProofValue = String(val);
        };

        if (Array.isArray(baseConsultationData)) {
            const hasGroupedSections =
                baseConsultationData.length > 0 &&
                typeof baseConsultationData[0] === "object" &&
                baseConsultationData[0] !== null &&
                Array.isArray(baseConsultationData[0]?.fields);

            if (hasGroupedSections) {
                const cleanedSections = baseConsultationData.map((group: any) => {
                    const existingFields = Array.isArray(group?.fields) ? group.fields : [];
                    const filteredFields = existingFields.filter((f: any) => {
                        const key = String(f?.key || "").toLowerCase();
                        if (key === "id_proof" || key === "vue_form_upload_id_proof") {
                            tryCaptureIdProof(f?.value);
                        }
                        return key !== "id_proof" && key !== "vue_form_upload_id_proof" && key !== "no_of_days";
                    });
                    return { ...group, fields: filteredFields };
                });

                const generalIndex = cleanedSections.findIndex(
                    (group: any) => String(group?.key || "").toLowerCase() === "general"
                );

                const extraFields: Array<{ key: string; title: string; value: string }> = [];
                if (shouldIncludeNoOfDays) extraFields.push(noOfDaysField);
                if (extraFields.length === 0) return { consultationData: cleanedSections, idProofValue: extractedIdProofValue };

                if (generalIndex !== -1) {
                    return {
                        consultationData: cleanedSections.map((group: any, idx: number) => {
                        if (idx !== generalIndex) return group;
                        return { ...group, fields: [...group.fields, ...extraFields] };
                        }),
                        idProofValue: extractedIdProofValue,
                    };
                }

                return {
                    consultationData: [
                        {
                            key: "general",
                            title: "General",
                            fields: extraFields,
                        },
                        ...cleanedSections,
                    ],
                    idProofValue: extractedIdProofValue,
                };
            }

            const filteredFlat = baseConsultationData.filter((f: any) => {
                const key = String(f?.key || "").toLowerCase();
                if (key === "id_proof" || key === "vue_form_upload_id_proof") {
                    tryCaptureIdProof(f?.value);
                }
                return key !== "id_proof" && key !== "vue_form_upload_id_proof" && key !== "no_of_days";
            });

            if (shouldIncludeNoOfDays) filteredFlat.push(noOfDaysField as any);
            return { consultationData: filteredFlat, idProofValue: extractedIdProofValue };
        }

        if (baseConsultationData && typeof baseConsultationData === "object") {
            const next: Record<string, unknown> = { ...baseConsultationData };
            tryCaptureIdProof(next.id_proof);
            tryCaptureIdProof(next.vue_form_upload_id_proof);
            delete next.id_proof;
            delete next.vue_form_upload_id_proof;
            delete next.no_of_days;
            if (shouldIncludeNoOfDays) next.no_of_days = String(noOfDays);
            return { consultationData: next, idProofValue: extractedIdProofValue };
        }

        const minimal: Record<string, string> = {};
        if (shouldIncludeNoOfDays) minimal.no_of_days = String(noOfDays);
        return { consultationData: minimal, idProofValue: extractedIdProofValue };
    };

    const buildPhysicalPayload = (paymentMethodId: string | null, otp?: string): PhysicalOrderPayload => {
        const cData = consultationData as any;
        const isStructured = cData && (cData.vue_form_data || cData.all_fields);

        return {
            order_type: "physical",
            session_id: sessionId,
            billing: buildBilling(),
            payment: buildPayment(paymentMethodId, otp),
            order: {
                physical_items: cartItems.map((item) => ({
                    product_id: item.id,
                    slug: item.slug,
                    name: item.name,
                    quantity: item.quantity,
                    unit_price: item.price,
                    total_price: parseFloat((item.price * item.quantity).toFixed(2)),
                    volumn: (user?.business_group && !isExclusive) ? getVolumeTiers({ id: item.id, category_id: (item as any).category_id }, user.business_group) || undefined : undefined
                })),
                ...(isStructured ? {
                    patient_info: cData.patient_info,
                    contact_info: cData.contact_info,
                    vue_form_data: cData.vue_form_data,
                    vue_form_patient: cData.vue_form_patient,
                    vue_form_employer: cData.vue_form_employer,
                    vue_form_upload_id_proof: cData.vue_form_upload_id_proof,
                } : {}),
                physical_total: parseFloat(cartTotalAmount().toFixed(2)),
                currency: "EUR",
                delivery_address: {
                    address_line_1: formData.street_address,
                    address_line_2: formData.street_address_2 || undefined,
                    city: formData.city,
                    postcode: formData.postcode,
                    country: formData.country || "Ireland",
                },
                delivery_notes: sessionStorage.getItem(`delivery_notes_${sessionId}`) || undefined,
                order_notes: formData.order_notes || undefined,
                discount: user?.business_group ? {
                    group_id: user.business_group.id,
                    name: user.business_group.name,
                    percentage: cartItems.length > 0 
                        ? ((item => {
                            const tiers = getVolumeTiers({ id: item.id, category_id: (item as any).category_id }, user?.business_group);
                            return (!tiers || tiers.tiers.length === 0) ? getDiscountPercentage({ id: item.id, category_id: (item as any).category_id }, user.business_group) : 0;
                          })(cartItems[0]))
                        : 0
                } : undefined,
                volumn: (cartItems.length > 0 && !isExclusive) 
                    ? getVolumeTiers({ id: cartItems[0].id, category_id: (cartItems[0] as any).category_id }, user?.business_group)
                    : undefined
            },
        };
    };

    const buildDigitalPayload = (paymentMethodId: string | null, otp?: string): DigitalOrderPayload => {
        const cData = consultationData as any;
        const isStructured = cData && (cData.vue_form_data || cData.all_fields);
        const baseConsultationData = cData?.vue_form_data || cData?.all_fields || cData;
        const {
            consultationData: consultationDataWithNoOfDays,
            idProofValue: idProofFromConsultationData,
        } = normalizeConsultationDataAndExtractIdProof(baseConsultationData, cData?.no_of_days);

        return {
            order_type: "digital",
            session_id: sessionId,
            slug,
            billing: buildBilling(),
            payment: buildPayment(paymentMethodId, otp),
            order: {
                product_id: product?.id,
                consultation_details: consultationDuration || consultationLabel,
                consultation_data: consultationDataWithNoOfDays,
                ...(isStructured ? {
                    patient_info: cData.patient_info,
                    contact_info: cData.contact_info,
                    vue_form_data: cData.vue_form_data,
                    vue_form_patient: cData.vue_form_patient,
                    vue_form_employer: cData.vue_form_employer,
                    vue_form_upload_id_proof: idProofFromConsultationData || cData.vue_form_upload_id_proof,
                } : {}),
                price: totalAmount,
                currency: "EUR",
                order_notes: formData.order_notes || undefined,
                appointment: cData?.appointment || undefined,
                discount: user?.business_group ? {
                    group_id: user.business_group.id,
                    name: user.business_group.name,
                    percentage: productDiscount
                } : undefined,
                volumn: (!isExclusive) ? (getVolumeTiers({ id: product?.id || product?.pk, category_id: product?.category_id }, user?.business_group) || undefined) : undefined
            },
        };
    };

    const buildMixedPayload = (paymentMethodId: string | null, otp?: string): MixedOrderPayload => {
        const cData = consultationData as any;
        const isStructured = cData && (cData.vue_form_data || cData.all_fields);
        const baseConsultationData = cData?.vue_form_data || cData?.all_fields || cData;
        const {
            consultationData: consultationDataWithNoOfDays,
            idProofValue: idProofFromConsultationData,
        } = normalizeConsultationDataAndExtractIdProof(baseConsultationData, cData?.no_of_days);

        return {
            order_type: "mixed",
            session_id: sessionId,
            billing: buildBilling(),
            payment: buildPayment(paymentMethodId, otp),
            order: {
                currency: "EUR",
                physical_total: parseFloat(cartTotalAmount().toFixed(2)),
                digital_total: totalAmount,
                delivery_address: {
                    address_line_1: formData.street_address,
                    address_line_2: formData.street_address_2 || undefined,
                    city: formData.city,
                    postcode: formData.postcode,
                    country: formData.country || "Ireland",
                },
                physical_items: cartItems.map((item) => ({
                    product_id: item.id,
                    slug: item.slug,
                    name: item.name,
                    quantity: item.quantity,
                    unit_price: item.price,
                    total_price: parseFloat((item.price * item.quantity).toFixed(2)),
                    volumn: getVolumeTiers({ id: item.id, category_id: (item as any).category_id }, user?.business_group) || undefined
                })),
                digital_items: [
                    {
                        product_id: product?.id,
                        slug,
                        price: totalAmount,
                        consultation_details: consultationDuration || consultationLabel,
                        consultation_data: consultationDataWithNoOfDays,
                        ...(isStructured ? {
                            patient_info: cData.patient_info,
                            contact_info: cData.contact_info,
                            vue_form_data: cData.vue_form_data,
                            vue_form_patient: cData.vue_form_patient,
                            vue_form_employer: cData.vue_form_employer,
                            vue_form_upload_id_proof: idProofFromConsultationData || cData.vue_form_upload_id_proof,
                            appointment: cData?.appointment || undefined,
                        } : {}),
                        volumn: (!isExclusive) ? (getVolumeTiers({ id: product?.id || product?.pk, category_id: product?.category_id }, user?.business_group) || undefined) : undefined
                    } as any,
                ],
                order_notes: formData.order_notes || undefined,
                discount: user?.business_group ? {
                    group_id: user.business_group.id,
                    name: user.business_group.name,
                    percentage: productDiscount || (cartItems.length > 0 
                        ? ((item => {
                            const tiers = getVolumeTiers({ id: item.id, category_id: (item as any).category_id }, user?.business_group);
                            return (!tiers || tiers.tiers.length === 0) ? getDiscountPercentage({ id: item.id, category_id: (item as any).category_id }, user.business_group) : 0;
                          })(cartItems[0]))
                        : 0)
                } : undefined,
                volumn: (!isExclusive) ? (getVolumeTiers({ id: product?.id || product?.pk, category_id: product?.category_id }, user?.business_group) 
                    || (cartItems.length > 0 ? getVolumeTiers({ id: cartItems[0].id, category_id: (cartItems[0] as any).category_id }, user?.business_group) : undefined)) : undefined
            },
        };
    };

    const processFinalOrder = async (otp?: string) => {
        if (!validateBillingForm()) return;
        if (hasIncompleteConsultationData(consultationData)) {
            clearCheckoutData(sessionId);
            clearProgress(sessionId);
            clearConsultationSessionStorage(sessionId);
            toast.error("We found incomplete consultation details in your session. Please submit the consultation form again from the product page.");
            router.push(`/${params?.category}/${slug}`);
            return;
        }
        setIsSubmitting(true);
        try {
            const clearPostOrderSessionState = () => {
                if (isPhysicalProduct || cartItems.length > 0) {
                    cartItems.forEach((item) => removeItem(item.id));
                }
                clearCheckoutData(sessionId);
                clearProgress(sessionId);
                clearConsultationSessionStorage(sessionId);
            };
            let paymentMethodId = selectedCardId;

            if (paymentMethod === "stripe" && !selectedCardId) {
                if (!stripe || !elements) {
                    toast.error("Stripe has not loaded yet. Please try again.");
                    return;
                }
                const cardElement = elements.getElement(CardNumberElement);
                if (!cardElement) {
                    toast.error("Payment details not found.");
                    return;
                }
                const { error, paymentMethod: stripeMethod } = await stripe.createPaymentMethod({
                    type: "card",
                    card: cardElement,
                    billing_details: {
                        email: formData.email,
                        name: `${formData.first_name} ${formData.last_name}`,
                        phone: formData.phone,
                        address: {
                            line1: formData.street_address,
                            line2: formData.street_address_2,
                            city: formData.city,
                            state: formData.county,
                            postal_code: formData.postcode,
                            country: "IE",
                        },
                    },
                });
                if (error) {
                    toast.error(error.message || "Failed to process card details");
                    return;
                }
                paymentMethodId = stripeMethod.id;
            } else if (paymentMethod === "wallet") {
                paymentMethodId = null;
            }

            const payload: PhysicalOrderPayload | DigitalOrderPayload | MixedOrderPayload = isPhysicalProduct
                ? buildPhysicalPayload(paymentMethodId, otp)
                : cartItems.length > 0
                    ? buildMixedPayload(paymentMethodId, otp)
                    : buildDigitalPayload(paymentMethodId, otp);

            if (isDevelopment) {
                console.log("Place Order Payload:", payload);
            }

            const response = await api.post(API_ENDPOINTS.PLACE_ORDER, payload);
            const resultData = response.data as {
                transaction_id?: number | string;
                digital_order_id?: number | string;
                physical_order_id?: number | string;
                order_type?: string;
                product_type?: string;
                status?: string;
                client_secret?: string;
                redirect_url?: string;
                success?: boolean;
                message?: string;
                data?: {
                    id?: number | string;
                    order_id?: number | string;
                    client_secret?: string;
                    redirect_url?: string;
                    transaction_id?: string;
                    status?: string;
                };
            };

            const flat = resultData?.success && resultData?.data ? resultData.data : resultData;
            const clientSecret = flat?.client_secret;
            const redirectUrl = flat?.redirect_url;
            const apiOrderType = resultData?.order_type || resultData?.product_type || (isPhysicalProduct ? "physical" : cartItems.length > 0 ? "mixed" : "digital");
            const digitalOrderId = resultData?.digital_order_id;
            const physicalOrderId = resultData?.physical_order_id;
            const singleOrderId = (flat as { id?: number | string; order_id?: number | string })?.id
                || (flat as { id?: number | string; order_id?: number | string })?.order_id;

            const buildThankYouUrl = () => {
                const qs = new URLSearchParams();
                qs.set("orderType", apiOrderType);
                if (digitalOrderId) qs.set("digitalOrderId", String(digitalOrderId));
                if (physicalOrderId) qs.set("physicalOrderId", String(physicalOrderId));
                if (singleOrderId && !digitalOrderId && !physicalOrderId) qs.set("orderId", String(singleOrderId));
                if (sessionId) qs.set("sessionId", sessionId);
                if (slug) qs.set("slug", slug);
                return `/thank-you?${qs.toString()}`;
            };

            let stripePaymentSucceeded = false;

            if (clientSecret && stripe) {
                const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret);
                if (confirmError) {
                    toast.error(confirmError.message || "Payment authentication failed");
                    return;
                }
                if (paymentIntent?.status !== "succeeded") {
                    toast.error("Payment was not successful. Please try again.");
                    return;
                }
                stripePaymentSucceeded = true;
            } else if (redirectUrl && flat?.status !== "requires_action") {
                storeStripeCheckoutUrl(redirectUrl, flat?.transaction_id);
                clearPostOrderSessionState();
                window.location.href = redirectUrl;
                return;
            }

            const isSuccess =
                stripePaymentSucceeded ||
                Boolean(flat?.transaction_id) ||
                flat?.status === "succeeded" ||
                Boolean(singleOrderId) ||
                Boolean(digitalOrderId) ||
                Boolean(physicalOrderId);

            if (isSuccess) {
                toast.success("Order placed successfully!");
                clearPostOrderSessionState();
                router.push(buildThankYouUrl());
            } else {
                toast.error(resultData?.message || "Something went wrong. Please check your order status.");
            }
        } catch (error: unknown) {
            const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
            if (axiosError.response?.status === 413) {
                toast.error("Upload is too large for the server. Please use a smaller/compressed ID document.");
            } else {
                toast.error(axiosError.response?.data?.message || "Failed to prepare order. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <CheckoutSkeleton />;

    return (
        <div className="bg-white min-h-screen">
            <main className="pt-24 lg:pt-32 pb-20 px-4 md:px-0">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-3 mb-8 min-w-0">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="inline-flex size-10 shrink-0 items-center justify-center text-(--maincolor) hover:opacity-80"
                            aria-label="Go back"
                        >
                            <ArrowLeft className="size-7" />
                        </button>
                        <h1 className="text-xl md:text-3xl leading-none font-bold text-(--maincolor) font-mainfont truncate min-w-0">
                            {product?.name || "Checkout"}
                        </h1>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        <div className="lg:col-span-7 space-y-6">
                            <CheckoutBanners
                                isAuthenticated={isAuthenticated}
                                onLoginClick={() => router.push("/my-account")}
                            />

                            <BillingForm
                                formData={formData}
                                errors={errors}
                                isAuthenticated={isAuthenticated}
                                onChange={handleInputChange}
                                onPhoneChange={(value) => {
                                    setFormData(prev => ({ ...prev, phone: value }));
                                    if (!value) {
                                        setErrors(prev => ({ ...prev, phone: "Phone number is required" }));
                                    } else if (!isValidPhoneNumber(value)) {
                                        setErrors(prev => ({ ...prev, phone: "Please enter a valid phone number" }));
                                    } else {
                                        setErrors(prev => {
                                            const newErrors = { ...prev };
                                            delete newErrors.phone;
                                            return newErrors;
                                        });
                                    }
                                }}
                                onPostcodeBlur={(formatted) =>
                                    setFormData((prev) => ({ ...prev, postcode: formatted }))
                                }
                            />
                        </div>

                        <div className="lg:col-span-5">
                            <OrderSummary
                                productName={product?.name}
                                isPhysicalProduct={isPhysicalProduct}
                                consultationData={consultationData as any}
                                consultationLabel={consultationLabel}
                                totalAmount={totalAmount}
                                finalTotalAmount={finalTotalAmount}
                                cartItems={cartItems}
                                walletBalance={walletBalance}
                                isBalanceEnough={isBalanceEnough}
                                canShowWallet={isAuthenticated && isPaymentMethodAllowed('Wallet Balance', user?.business_group)}
                                useWallet={useWallet}
                                isSubmitting={isSubmitting}
                                savedCards={savedCards}
                                appointment={(consultationData as any)?.appointment}
                                onWalletToggle={handleWalletToggle}
                                onRemoveCartItem={(id) => {
                                    removeItem(id);
                                    toast.info("Item removed from cart");
                                }}
                                onPlaceOrder={handlePlaceOrderClick}
                                isStripeAllowed={isPaymentMethodAllowed("Stripe", user?.business_group)}
                                showPayAsYouGoWalletHint={
                                    Boolean(isAuthenticated && user?.customer_type === 2 && user?.employer_type === 3)
                                }
                                hasVolumeDiscount={hasAnyVolumeDiscount && !finalIsExclusive}
                                volumeDiscount={finalIsExclusive ? null : user?.volume_discount}
                             />
                        </div>
                    </div>
                </div>
            </main>

            <PaymentMethodModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                savedCards={savedCards}
                selectedCardId={selectedCardId}
                setSelectedCardId={setSelectedCardId}
                isFetchingCards={isFetchingCards}
                saveCard={saveCard}
                setSaveCard={setSaveCard}
                isAuthenticated={isAuthenticated}
                onConfirm={() => processFinalOrder()}
                isSubmitting={isSubmitting}
            />

            <WalletOtpModal
                isOpen={isWalletOtpModalOpen}
                onClose={() => setIsWalletOtpModalOpen(false)}
                onConfirm={(otp) => {
                    setIsWalletOtpModalOpen(false);
                    processFinalOrder(otp);
                }}
                isSubmitting={isSubmitting}
                email={formData.email}
            />
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<CheckoutSkeleton />}>
            <Elements stripe={stripePromise}>
                <CheckoutContent />
            </Elements>
        </Suspense>
    );
}
