"use client";

import Image from "next/image";
import StripeRedirectLoader from "@/components/StripeRedirectLoader";
import ForgotPasswordModal from "@/components/auth/ForgotPasswordModal";
import CustomDatePicker from "@/components/forms/CustomDatePicker";
import FormSkeleton from "@/components/forms/FormSkeleton";
import GhcPhoneInput, { isValidPhoneNumber } from "@/components/forms/GhcPhoneInput";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import {
  deserializeFormDataFromPersist,
  serializeFormDataForPersist,
} from "@/lib/formPersistFiles";
import {
  getFileTooLargeMessage,
  getIdProofTooLargeMessage,
  isFileWithinUploadLimit,
} from "@/lib/formUpload";
import {
  calculateInclusiveDateDiffInDays,
  getSickCertEndDateBounds,
  getSickCertStartDateBounds,
  parseDateOnlyLocal,
  toLocalDateIso,
  validateSickCertEndDate,
  validateSickCertStartDate,
} from "@/lib/formSickCertDates";
import {
  isIdProofField,
  prepareIdProofFileForUpload,
} from "@/lib/idProofUpload";
import { useAuthStore } from "@/store/useAuthStore";
import { useCheckoutStore } from "@/store/useCheckoutStore";
import { useFormStore } from "@/store/useFormStore";
import type { FormProgress } from "@/store/useFormStore";
import { useCartStore } from "@/store/useCartStore";
import { QUESTIONS_WITH_FOLLOW_UP } from "@/lib/form-questions";
import { AnimatePresence, motion } from "framer-motion";
import Cookies from "js-cookie";
import {
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  Upload,
  User,
  X,
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import OhPricingSelector from "@/components/products/OhPricingSelector";
import PricingDiscountBadge from "@/components/products/PricingDiscountBadge";
import {
  buildOhSelectedPricePayload,
  loadOhSelectedPriceFromSession,
  OH_PRICING_ERROR_KEY,
  saveOhSelectedPriceToSession,
} from "@/lib/oh-prices";
import {
  getEffectivePricingAmount,
  getPricingDiscountBadge,
  parsePricingAmount,
} from "@/lib/pricing-options";
import type { OhPrice, ProductPricingOption } from "@/lib/types";

interface Choice {
  label: string;
  value: string;
  image?: string;
}

type PricingOption = ProductPricingOption;

interface PharmacyRecord {
  ID: number;
  Title: string;
  county?: string;
  town?: string;
  zip_code?: string;
  registration_number?: number | string;
}

interface FormField {
  id: string;
  type: string;
  label: string;
  description?: string;
  consentText?: string;
  placeholder?: string;
  required?: boolean;
  columnWidth?: string;
  choices?: Choice[];
  rows?: number | Choice[];
  columns?: Choice[];
  content?: string;
  cost?: number;
  pricingOptions?: PricingOption[];
  doctors?: { id: string | number; name: string; image: string }[];
  selectedDoctorIds?: (string | number)[];
  timeSlots?: { morning: string[]; afternoon: string[]; evening: string[] };
  enableConditionalLogic?: boolean;
  conditionalLogic?: {
    action?: "show" | "hide";
    logic?: "all" | "any";
    rules?: Array<{
      fieldId: string;
      operator: string;
      value?: string | number | boolean;
    }>;
  };
}

interface FormStep {
  id: number;
  title: string;
  fields: FormField[];
}

interface FormState {
  [key: string]:
    | string
    | number
    | boolean
    | string[]
    | File
    | Record<string, string>
    | { doctorId?: string; date?: string; time?: string; clinicId?: number }
    | undefined;
}

// ─── Appointment API types ────────────────────────────────────────────────────
interface DoctorSpecialization {
  id: number;
  name: string;
}

interface DoctorInfo {
  doctor_id: number;
  name: string;
  avatar: string | null;
  doctor_picture?: string | null;
  doctor_name?: string | null;
  medical_council_registration_number: string | null;
  registration_number?: string | null;
  medical_degree: string | null;
  degree?: string | null;
  area_of_expertise: string | null;
  speciality?: string | null;
  exp_years?: number;
  year_of_experience?: number;
  languages_spoken?: string | null;
  booking_delay?: number;
  specializations: DoctorSpecialization[];
}

interface AvailabilitySlot {
  time: string;
  clinic_id: number;
}

interface AvailabilityDoctor {
  doctor_id: number;
  slots: AvailabilitySlot[];
}

interface AvailabilityDateGroup {
  date: string;
  display_date: string;
  availabilities: AvailabilityDoctor[];
}

function parseAppointmentSlotMinutes(timeStr: string): number {
  const normalized = timeStr.trim().toUpperCase();
  const match = normalized.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/);
  if (!match) return Number.MAX_SAFE_INTEGER;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3];

  if (meridiem) {
    if (meridiem === "AM" && hours === 12) hours = 0;
    if (meridiem === "PM" && hours < 12) hours += 12;
  }

  return hours * 60 + minutes;
}

function getDublinNow(): { todayStr: string; nowMinutes: number } {
  const now = new Date();
  const todayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Dublin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const timeParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Dublin",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(now);
  const hour = parseInt(
    timeParts.find((p) => p.type === "hour")?.value || "0",
    10,
  );
  const minute = parseInt(
    timeParts.find((p) => p.type === "minute")?.value || "0",
    10,
  );

  return { todayStr, nowMinutes: hour * 60 + minute };
}

function filterBookableSlots(
  slots: AvailabilitySlot[],
  date: string,
  bookingDelay: number,
): AvailabilitySlot[] {
  const { todayStr, nowMinutes } = getDublinNow();
  if (date !== todayStr) return slots;

  if (bookingDelay > 0) {
    const minMinutes = nowMinutes + bookingDelay;
    return slots.filter(
      (slot) => parseAppointmentSlotMinutes(slot.time) >= minMinutes,
    );
  }

  return slots.filter(
    (slot) => parseAppointmentSlotMinutes(slot.time) > nowMinutes,
  );
}

interface ProductData {
  id: number;
  name: string;
  form_id: number;
  category_slug: string;
  subcategory_slug: string | null;
  session_duration?: number;
  oh_forms?: { id: number; title: string; type: "employer" | "employee" }[];
  oh_prices?: OhPrice[];
  forms_pricing?: { pricingOptions?: ProductPricingOption[] };
  product_display?: { price_range?: { currency?: string } };
}

interface SubmittedField {
  key: string;
  title: string;
  value: string | null;
}

interface PharmacyChoice {
  id: number;
  label: string;
  value: string;
  searchText: string;
}

let pharmacyChoicesCache: PharmacyChoice[] | null = null;
let pharmacyChoicesPromise: Promise<PharmacyChoice[]> | null = null;

function buildPharmacyLabel(item: PharmacyRecord): string {
  const parts = [item.Title, item.town, item.county, item.zip_code].filter(
    Boolean,
  );
  return parts.join(", ");
}

async function getPharmacyChoices(): Promise<PharmacyChoice[]> {
  if (pharmacyChoicesCache) return pharmacyChoicesCache;
  if (pharmacyChoicesPromise) return pharmacyChoicesPromise;

  pharmacyChoicesPromise = import("@/app/pharmacy.json").then((mod) => {
    const rows = (mod.default || []) as PharmacyRecord[];
    const mapped = rows.map((row) => {
      const label = buildPharmacyLabel(row);
      const registration = row.registration_number
        ? String(row.registration_number)
        : "";
      const searchText = [
        row.Title,
        row.town,
        row.county,
        row.zip_code,
        registration,
        label,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return {
        id: row.ID,
        label,
        value: label,
        searchText,
      };
    });

    pharmacyChoicesCache = mapped;
    return mapped;
  });

  return pharmacyChoicesPromise;
}
function getSafePhoneValue(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmedValue = value.trim();
  if (!trimmedValue) return "";
  try {
    return isValidPhoneNumber(trimmedValue) ? trimmedValue : "";
  } catch {
    return "";
  }
}

type AppointmentFormValue = {
  doctorId?: string;
  date?: string;
  time?: string;
  clinicId?: number;
};

function isAppointmentValueComplete(val: unknown): boolean {
  if (
    typeof val !== "object" ||
    val === null ||
    val instanceof File ||
    Array.isArray(val)
  ) {
    return false;
  }
  const appt = val as AppointmentFormValue;
  return Boolean(appt.doctorId && appt.date && appt.time);
}

function isPricingValueSelected(
  val: unknown,
  options?: PricingOption[],
): boolean {
  if (!options?.length) return true;
  if (val === undefined || val === null || val === "") return false;
  return options.some((option) => option.key === val);
}

function evaluateConditionalRule(
  operator: string,
  actualValue: unknown,
  expectedValue: unknown,
): boolean {
  const normalize = (val: unknown): string =>
    String(val ?? "")
      .trim()
      .toLowerCase();
  const actualNormalized = normalize(actualValue);
  const expectedNormalized = normalize(expectedValue);

  switch ((operator || "").toLowerCase()) {
    case "is":
    case "equals":
      return actualNormalized === expectedNormalized;
    case "is_not":
    case "not_equals":
      return actualNormalized !== expectedNormalized;
    case "contains":
      return actualNormalized.includes(expectedNormalized);
    case "not_contains":
      return !actualNormalized.includes(expectedNormalized);
    case "is_empty":
      return actualNormalized === "";
    case "is_not_empty":
      return actualNormalized !== "";
    default:
      return actualNormalized === expectedNormalized;
  }
}

function normalizeMatrixOptions(options: unknown): Choice[] {
  if (!Array.isArray(options)) return [];

  return options
    .map((item, index) => {
      if (typeof item === "string") {
        const normalized = item.trim();
        if (!normalized) return null;
        return {
          label: normalized,
          value:
            normalized.toLowerCase().replace(/\s+/g, "_") || `option_${index}`,
        };
      }

      if (item && typeof item === "object") {
        const candidate = item as { label?: unknown; value?: unknown };
        const rawLabel =
          typeof candidate.label === "string" ? candidate.label.trim() : "";
        const rawValue =
          typeof candidate.value === "string" ? candidate.value.trim() : "";
        const finalLabel = rawLabel || rawValue || `Option ${index + 1}`;
        const finalValue =
          rawValue ||
          rawLabel.toLowerCase().replace(/\s+/g, "_") ||
          `option_${index}`;
        return { label: finalLabel, value: finalValue };
      }

      return null;
    })
    .filter((entry): entry is Choice => Boolean(entry));
}

/** Strip trailing "(Required)" and normalize for label comparisons. */
function normalizeFieldLabel(label: string): string {
  return label.replace(/\(Required\)$/i, "").trim().toLowerCase();
}

export default function FormRenderPage() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <FormContent />
    </Suspense>
  );
}

function FormContent(): React.JSX.Element | null {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const slug = params?.slug as string;
  const category = params?.category as string;
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormState>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isIdProofUploading, setIsIdProofUploading] = useState(false);
  const [isRedirectingToStripe] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [productTitle, setProductTitle] = useState("");
  const [formKey, setFormKey] = useState("");
  const [steps, setSteps] = useState<FormStep[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showErrorBanner, setShowErrorBanner] = useState(false);
  const { isAuthenticated, user, fetchProfile } = useAuthStore();
  const { setConsultationData, clearCheckoutData } = useCheckoutStore();
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [lastCheckedEmail, setLastCheckedEmail] = useState("");
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [wpBannerMessage, setWpBannerMessage] = useState<string | undefined>(
    undefined,
  );
  const [authLoading, setAuthLoading] = useState(false);
  const [hasSentOtp, setHasSentOtp] = useState(false);
  const [doctorList, setDoctorList] = useState<DoctorInfo[]>([]);
  const [doctorAvailabilities, setDoctorAvailabilities] = useState<
    AvailabilityDateGroup[]
  >([]);
  const [productData, setProductData] = useState<ProductData | null>(null);
  const emailCheckTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { clearCart } = useCartStore();
  const {
    progress,
    saveProgress,
    clearProgress,
    clearAllProgress,
    getProgress,
    getAllProgress,
  } = useFormStore();
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictProgress, setConflictProgress] = useState<FormProgress | null>(
    null,
  );
  const [formInstanceKey, setFormInstanceKey] = useState(0);
  const [ohRole, setOhRole] = useState<string | null>(null);
  const [selectedOhPriceIndex, setSelectedOhPriceIndex] = useState<number | null>(
    null,
  );
  const hasAttemptedRestore = useRef(false);
  const hasAttemptedProfileFill = useRef(false);
  const forceFreshFormState = useRef(false);
  const lastSessionId = useRef<string | null>(null);
  const persistSaveSeq = useRef(0);
  const formStepScrollRef = useRef<HTMLDivElement | null>(null);
  const scrollFormStepIntoViewAfterNav = useRef(false);

  const showOhPricing =
    (productData?.category_slug === "occupational-health" ||
      productData?.subcategory_slug === "occupational-health") &&
    (productData?.oh_prices?.length ?? 0) > 0;
  const ohPriceCurrency =
    productData?.product_display?.price_range?.currency || "€";

  useEffect(() => {
    if (!sessionId || !showOhPricing) return;
    const saved = loadOhSelectedPriceFromSession(sessionId);
    if (saved) {
      setSelectedOhPriceIndex(saved.index);
    }
  }, [sessionId, showOhPricing]);

  const handleOhPriceSelect = useCallback(
    (index: number) => {
      setSelectedOhPriceIndex(index);
      setErrors((prev) => {
        if (!prev[OH_PRICING_ERROR_KEY]) return prev;
        const next = { ...prev };
        delete next[OH_PRICING_ERROR_KEY];
        return next;
      });
      if (sessionId && productData?.oh_prices?.[index]) {
        saveOhSelectedPriceToSession(
          sessionId,
          buildOhSelectedPricePayload(
            productData.oh_prices[index],
            index,
            ohPriceCurrency,
          ),
        );
      }
    },
    [sessionId, productData?.oh_prices, ohPriceCurrency],
  );

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo(0, 0);
  }, [slug, sessionId, category]);

  useLayoutEffect(() => {
    if (!scrollFormStepIntoViewAfterNav.current) return;
    scrollFormStepIntoViewAfterNav.current = false;
    formStepScrollRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [currentStep]);

  useEffect(() => {
    const fetchForm = async () => {
      if (!slug) return;

      // Reset restoration flag if session ID changed (to handle navigation between sessions)
      if (sessionId !== lastSessionId.current) {
        hasAttemptedRestore.current = false;
        lastSessionId.current = sessionId;
      }

      if (typeof window !== "undefined") {
        if (!sessionId) {
          toast.error("Invalid session. Please consult from the product page.");
          router.push("/");
          return;
        }
        const hasAccess = sessionStorage.getItem(`form_access_${sessionId}`);
        const hasPersistedAccess = Boolean(getProgress(sessionId));
        if (!hasAccess && !hasPersistedAccess) {
          toast.error("Access denied. Please consult from the product page.");
          router.push("/");
          return;
        }
      }

      try {
        setIsLoading(true);
        // ALWAYS fetch product details to get the product title and for category-specific logic
        const endpoint = API_ENDPOINTS.PRODUCT_DETAILS(slug);
        const productResponse = await api.get(endpoint);
        const pData = productResponse.data.data;
        setProductData(pData);
        setProductTitle(pData.name);

        let actualFormId = pData.form_id;

        // For Occupational Health, determine which form to use based on the selected role
        if (
          (pData.subcategory_slug === "occupational-health" ||
            pData.category_slug === "occupational-health") &&
          sessionId
        ) {
          const role = sessionStorage.getItem(`oh_role_${sessionId}`);
          setOhRole(role);
          if (role && pData.oh_forms) {
            const specificForm = pData.oh_forms.find(
              (f: { type: string }) => f.type === role,
            );
            if (specificForm) {
              actualFormId = specificForm.id;
            }
          }
        }

        if (!actualFormId) {
          toast.error("This product does not have an associated form.");
          router.push("/");
          return;
        }

        if (typeof window !== "undefined" && sessionId) {
          sessionStorage.setItem(`form_id_${sessionId}`, String(actualFormId));
        }
        const response = await api.get(
          `${API_ENDPOINTS.GET_FORM}/${actualFormId}`,
        );
        const formResponse = response.data.data;
        const rawJson =
          typeof formResponse.json === "string"
            ? JSON.parse(formResponse.json)
            : formResponse.json;

        const rawFields = (rawJson.fields as FormField[]) || [];
        const expandedFields: FormField[] = [];

        rawFields.forEach((f) => {
          if (f.type === "referral_employer") {
            // Section Header
            expandedFields.push({
              id: `${f.id}_header`,
              type: "subtitle",
              label: "Employer Information",
              columnWidth: "100",
            });
            // Sub-fields
            expandedFields.push(
              {
                id: `${f.id}_use_account_details`,
                type: "checkbox",
                label: "Fill with my account details",
                columnWidth: "100",
              },
              {
                id: `${f.id}_manager_name`,
                type: "text",
                label: "Manager Name (Required)",
                placeholder: "Enter manager name",
                required: true,
                columnWidth: "50",
              },
              {
                id: `${f.id}_employer_name`,
                type: "text",
                label: "Employer Name (Required)",
                placeholder: "Enter employer name",
                required: true,
                columnWidth: "50",
              },
              {
                id: `${f.id}_manager_email`,
                type: "email",
                label: "Manager Email (Required)",
                placeholder: "Enter manager email",
                required: true,
                columnWidth: "50",
              },
              {
                id: `${f.id}_manager_contact`,
                type: "phone",
                label: "Manager Contact Phone (Required)",
                placeholder: "Enter manager contact phone",
                required: true,
                columnWidth: "50",
              },
              {
                id: `${f.id}_work_location`,
                type: "textarea",
                label: "Work Location / Company Address (Required)",
                placeholder: "Enter work location",
                required: true,
                columnWidth: "100",
                rows: 2,
              },
            );
          } else if (f.type === "employee_details") {
            // Section Header
            expandedFields.push({
              id: `${f.id}_header`,
              type: "subtitle",
              label: "Employee Information",
              columnWidth: "100",
            });
            // Sub-fields
            expandedFields.push(
              {
                id: `${f.id}_use_account_details`,
                type: "checkbox",
                label: "I am the Employee (Use my account details)",
                columnWidth: "100",
              },
              {
                id: `${f.id}_first_name`,
                type: "text",
                label: "Employee First Name (Required)",
                placeholder: "Enter first name",
                required: true,
                columnWidth: "50",
              },
              {
                id: `${f.id}_last_name`,
                type: "text",
                label: "Employee Last Name (Required)",
                placeholder: "Enter last name",
                required: true,
                columnWidth: "50",
              },
              {
                id: `${f.id}_employee_job_title`,
                type: "text",
                label: "Employee Job Title (Required)",
                placeholder: "Enter job title",
                required: true,
                columnWidth: "50",
              },
              {
                id: `${f.id}_employee_email`,
                type: "email",
                label: "Employee Email Address (Required)",
                placeholder: "Enter email address",
                required: true,
                columnWidth: "50",
              },
              {
                id: `${f.id}_employee_phone_number`,
                type: "phone",
                label: "Employee Phone Number (Required)",
                placeholder: "Enter phone number",
                required: true,
                columnWidth: "50",
              },
              {
                id: `${f.id}_employee_date_of_birth`,
                type: "date",
                label: "Employee Date of Birth (Required)",
                required: true,
                columnWidth: "50",
              },
              {
                id: `${f.id}_employee_gender`,
                type: "radio",
                label: "Employee Gender (Required)",
                required: true,
                columnWidth: "100",
                choices: [
                  { label: "Male", value: "male" },
                  { label: "Female", value: "female" },
                  { label: "Other", value: "other" },
                ],
              },
            );
          } else {
            expandedFields.push(f);
          }
        });

        const fields = expandedFields.map((f) => {
          if (f.label.toLowerCase().includes("for which minor illness")) {
            if (f.choices && Array.isArray(f.choices)) {
              f.choices.sort((a, b) => a.label.localeCompare(b.label));
            }
          }
          return f;
        });

        // Check for appointment fields and fetch doctor availabilities.
        // Support both `selectedDoctorIds` and `doctors[]` as the source of IDs.
        const appointmentFields = fields.filter(
          (f) =>
            f.type === "appointment" &&
            ((f.selectedDoctorIds && f.selectedDoctorIds.length > 0) ||
              (f.doctors && f.doctors.length > 0)),
        );
        if (appointmentFields.length > 0) {
          for (const field of appointmentFields) {
            try {
              const doctorIds =
                field.selectedDoctorIds && field.selectedDoctorIds.length > 0
                  ? field.selectedDoctorIds
                  : (field.doctors || []).map((d) => d.id);

              const [doctorsRes, availRes] = await Promise.all([
                api.get(API_ENDPOINTS.DOCTORS, {
                  params: { doctor_ids: doctorIds.join(",") },
                }),
                api.get(API_ENDPOINTS.DOCTOR_AVAILABILITIES, {
                  params: { doctor_ids: doctorIds.join(",") },
                }),
              ]);

              const doctorsPayload = doctorsRes.data?.data ?? doctorsRes.data;
              const doctors: DoctorInfo[] = Array.isArray(doctorsPayload)
                ? doctorsPayload
                : [];
              setDoctorList(doctors);

              const availPayload = availRes.data?.data ?? availRes.data;
              const avail: AvailabilityDateGroup[] = Array.isArray(availPayload)
                ? availPayload
                : [];
              setDoctorAvailabilities(avail);

              // Auto-select: first doctor + today's date (if available)
              if (doctors.length > 0) {
                const { todayStr } = getDublinNow();
                const firstDoc = doctors[0];
                const firstDocId = String(firstDoc.doctor_id);
                const bookingDelay = firstDoc.booking_delay ?? 0;
                const todayHasSlots = avail.some((g) => {
                  if (g.date !== todayStr) return false;
                  const doctorInGroup = g.availabilities.find(
                    (a) => String(a.doctor_id) === firstDocId,
                  );
                  if (!doctorInGroup?.slots.length) return false;
                  return (
                    filterBookableSlots(
                      doctorInGroup.slots,
                      g.date,
                      bookingDelay,
                    ).length > 0
                  );
                });
                setFormData((prev) => ({
                  ...prev,
                  [field.id]: {
                    doctorId: firstDocId,
                    date: todayHasSlots ? todayStr : undefined,
                    time: undefined,
                  },
                }));
              }
            } catch (err) {
              console.error(`Failed to fetch doctor data for ${field.id}`, err);
              setDoctorList([]);
              setDoctorAvailabilities([]);
            }
          }
        }

        setFormTitle(formResponse.title);
        setFormKey(rawJson.key || formResponse.id);
        const groupedSteps: FormStep[] = [];
        let currentFields: FormField[] = [];
        let stepCount = 0;
        fields.forEach((field) => {
          if (field.type === "page") {
            if (currentFields.length > 0) {
              groupedSteps.push({
                id: ++stepCount,
                title: `Step ${stepCount}`,
                fields: currentFields,
              });
            }
            currentFields = [];
          } else {
            currentFields.push(field);
          }
        });
        if (currentFields.length > 0) {
          groupedSteps.push({
            id: ++stepCount,
            title: `Step ${stepCount}`,
            fields: currentFields,
          });
        }

        // INJECT ACCOUNT EMAIL INTO STEP 1 PERMANENTLY
        if (groupedSteps.length > 0) {
          const accountEmailField: FormField = {
            id: "account_email",
            type: "email",
            label: "Your Account Email",
            required: true,
            placeholder: "Enter your email address",
            columnWidth: "100",
            description: "We will use this to manage your consultation",
          };
          // Ensure it's not already duplicated
          if (!groupedSteps[0].fields.some((f) => f.id === "account_email")) {
            groupedSteps[0].fields.unshift(accountEmailField);
          }
        }

        const refinedSteps = groupedSteps.map((step) => {
          const titleField = step.fields.find(
            (f) => f.type === "title" || f.type === "section",
          );
          if (titleField) {
            const cleaned = titleField.label
              .replace(/^.*?step\s*\d+\s*(of\s*\d+)?\s*[:\-—–]\s*/i, "")
              .trim();
            return { ...step, title: cleaned || titleField.label };
          }
          return step;
        });
        setSteps(refinedSteps);

        // Handle Session Restoration and Conflict - Only on Mount/Slug Change
        const currentProgress = useFormStore
          .getState()
          .getProgress(sessionId as string);
        const otherProgress = useFormStore
          .getState()
          .getAllProgress()
          .find((entry) => entry.sessionId !== sessionId);
        if (currentProgress && !hasAttemptedRestore.current) {
          hasAttemptedRestore.current = true;

          // Same session, auto-resume (deserialize Files from persisted JSON)
          const [hydrated, fileSkipped] = await deserializeFormDataFromPersist(
            currentProgress.formData as unknown as Record<string, unknown>,
          );
          setFormData(hydrated as FormState);
          setCurrentStep(currentProgress.currentStep);
          toast.success("Resumed your previous progress.");
          if (fileSkipped) {
            toast.info(
              "Please re-upload your ID document if required — very large attachments cannot be auto-saved when you leave the page.",
            );
          }
        }
        if (
          !currentProgress &&
          otherProgress &&
          otherProgress.currentStep > 1
        ) {
          setConflictProgress(otherProgress);
          setShowConflictModal(true);
        }

        // Mark restoration check as complete even if no progress existed
        hasAttemptedRestore.current = true;
      } catch (error: unknown) {
        console.error("Failed to fetch form", error);
        toast.error("Failed to load form");
      } finally {
        setIsLoading(false);
      }
    };
    fetchForm();
  }, [slug, sessionId, category, getProgress, getAllProgress, router]);

  // Auto-save progress with debouncing
  useEffect(() => {
    if (
      !isLoading &&
      steps.length > 0 &&
      sessionId &&
      !showConflictModal &&
      hasAttemptedRestore.current
    ) {
      const timer = setTimeout(() => {
        const seq = ++persistSaveSeq.current;
        void (async () => {
          try {
            const serialized = await serializeFormDataForPersist(
              formData as unknown as Record<string, unknown>,
            );
            if (seq !== persistSaveSeq.current) return;
            saveProgress({
              category,
              slug,
              sessionId: sessionId as string,
              currentStep,
              formData: serialized as FormState,
              lastUpdated: Date.now(),
            });
          } catch (e) {
            console.error("Form persist failed", e);
          }
        })();
      }, 1000); // 1 second debounce
      return () => clearTimeout(timer);
    }
  }, [
    formData,
    currentStep,
    sessionId,
    slug,
    category,
    isLoading,
    steps.length,
    saveProgress,
    showConflictModal,
  ]);

  // Profile Auto-fill Logic: Pre-fill form fields from user profile if logged in
  useEffect(() => {
    if (
      !isAuthenticated ||
      !user ||
      steps.length === 0 ||
      isLoading ||
      !hasAttemptedRestore.current
    )
      return;

    // Only run this once per page load to avoid interfering with manual user input
    if (hasAttemptedProfileFill.current) return;
    hasAttemptedProfileFill.current = true;

    // For Occupational Health forms, NEVER pre-fill any field except account_email.
    // All other data must be filled only via the employer/employee "use account details" checkbox.
    const isOH =
      productData?.subcategory_slug === "occupational-health" ||
      productData?.category_slug === "occupational-health";

    const allFields = steps.flatMap((s) => s.fields);
    const updates: Record<string, any> = {};

    allFields.forEach((field) => {
      const label = field.label.toLowerCase();
      const value = formData[field.id];

      // Only fill if the field is currently empty to avoid overwriting user edits or session restores
      if (value === undefined || value === "" || value === null) {
        // Account Email field is always pre-filled (it's the session login email, not part of OH employer/employee forms)
        if (field.id === "account_email") {
          updates[field.id] = user.email || "";
        }

        // For Occupational Health, all other fields are filled only via checkboxes — skip here
        if (isOH) return;

        // First Name
        if (label.includes("first name") || label === "first") {
          updates[field.id] = user.first_name || user.name?.split(" ")[0] || "";
        }
        // Last Name
        else if (label.includes("last name") || label === "last") {
          updates[field.id] =
            user.last_name || user.name?.split(" ").slice(1).join(" ") || "";
        }
        // Full Name
        else if (label.includes("full name") || label === "name") {
          updates[field.id] =
            user.name ||
            `${user.first_name || ""} ${user.last_name || ""}`.trim();
        }
        // General Email fields
        else if (field.type === "email" || label.includes("email")) {
          updates[field.id] = user.email || "";
        }
        // Phone / Contact
        else if (
          field.type === "phone" ||
          label.includes("phone") ||
          label.includes("contact number") ||
          label.includes("mobile")
        ) {
          updates[field.id] = getSafePhoneValue(user.phone);
        }
        // Date of Birth (avoid filling pregnancy due-date fields with DOB)
        else if (
          (label.includes("date of birth") ||
            label === "dob" ||
            (field.type === "date" && label.includes("birth"))) &&
          !label.includes("due date") &&
          !label.includes("estimated child birth")
        ) {
          updates[field.id] = user.date_of_birth || "";
        }
        // Gender
        else if (label.includes("gender")) {
          updates[field.id] = user.gender ? user.gender.toLowerCase() : "";
        }
        // Address/Street
        else if (label.includes("address") || label.includes("street")) {
          const addr =
            typeof user.address === "object"
              ? user.address?.address
              : user.address;
          updates[field.id] = addr || "";
        }
        // City
        else if (
          label === "city" ||
          (label.includes("city") && !label.includes("postcode"))
        ) {
          const city =
            typeof user.address === "object" ? user.address?.city : user.city;
          updates[field.id] = city || "";
        }
        // Postcode
        else if (
          label.includes("postcode") ||
          label.includes("eir-code") ||
          label === "eircode"
        ) {
          const postcode =
            typeof user.address === "object"
              ? user.address?.postcode
              : user.postcode;
          updates[field.id] = postcode || "";
        }
      }
    });

    if (category === "occupational-health") {
      return;
    }

    if (Object.keys(updates).length > 0) {
      setFormData((prev) => ({ ...prev, ...updates }));
      if (!isOH) toast.info("Pre-filled form with your account details.");
    }
  }, [
    isAuthenticated,
    user,
    steps,
    isLoading,
    formData,
    productData,
    category,
  ]);

  // Restoration safety net: Zustand persist can hydrate from localStorage AFTER
  // fetchForm's first run, leaving `progress` as null inside that closure.
  // This effect watches `progress` directly so it always catches delayed hydration.
  useEffect(() => {
    if (
      hasAttemptedRestore.current ||
      steps.length === 0 ||
      isLoading ||
      !sessionId
    )
      return;

    const currentProgress = getProgress(sessionId);
    if (!currentProgress) return;

    hasAttemptedRestore.current = true;

    // Restore sessionStorage access key so subsequent in-session checks pass
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`form_access_${sessionId}`, "true");
    }
    void (async () => {
      const [hydrated, fileSkipped] = await deserializeFormDataFromPersist(
        currentProgress.formData as unknown as Record<string, unknown>,
      );
      setFormData(hydrated as FormState);
      setCurrentStep(currentProgress.currentStep);
      toast.success("Resumed your previous progress.");
      if (fileSkipped) {
        toast.info(
          "Please re-upload your ID document if required — very large attachments cannot be auto-saved when you leave the page.",
        );
      }
    })();
  }, [progress, steps, isLoading, sessionId, getProgress]);

  // Prevention of accidental navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (Object.keys(formData).length > 0) {
        e.preventDefault();
        e.returnValue = ""; // Standard way to trigger the confirmation dialog
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [formData]);

  useEffect(() => {
    if (isAuthenticated && user && productData && sessionId) {
      const actualCategory =
        productData.subcategory_slug || productData.category_slug;
      if (actualCategory === "occupational-health") {
        const ohRole = sessionStorage.getItem(`oh_role_${sessionId}`);

        // If it's an Employer form but the user is NOT an Employer (customer_type 2)
        if (ohRole === "employer" && Number(user.customer_type) !== 2) {
          toast.error("Access Denied", {
            description:
              "Your account is registered as an Employee. Only Employers can access the Employer referral form.",
            duration: 6000,
          });

          setTimeout(() => {
            router.push(`/${category}/${slug}`);
          }, 1500);
        }

        // If it's an Employee form but the user IS an Employer (customer_type 2)
        if (ohRole === "employee" && Number(user.customer_type) === 2) {
          toast.error("Access Denied", {
            description:
              "Your account is registered as an Employer. Please use the Employer referral form for Occupational Health.",
            duration: 6000,
          });

          setTimeout(() => {
            router.push(`/${category}/${slug}`);
          }, 1500);
        }
      }
    }
  }, [isAuthenticated, user, productData, sessionId, category, slug, router]);

  const isSelfEmailField = React.useCallback(
    (label: string) => {
      const l = normalizeFieldLabel(label);

      // Referral/Employer fields are NEVER self auto-filled anymore (now uses checkbox)
      if (l.includes("referrer email") || l.includes("employer email")) {
        return false;
      }

      if (
        l.includes("employer") ||
        l.includes("referee") ||
        l.includes("referrer") ||
        l.includes("gp") ||
        l.includes("doctor")
      ) {
        return false;
      }

      // If it's an employee form, general emails are likely self
      // Note: "employee email" is excluded as we now use a checkbox for "Same as account"
      if (
        ohRole === "employee" &&
        !l.includes("employee email") &&
        (l.includes("employee") ||
          l.includes("patient") ||
          l.includes("your email") ||
          l === "email" ||
          l.includes("contact email"))
      ) {
        return true;
      }

      // If filling as employer, then "your name" and "your email" are likely the employer's details
      if (
        ohRole === "employer" &&
        (l.includes("your name") || l.includes("your email") || l === "name")
      ) {
        return true;
      }

      // For general forms, "your email" or "email" is self
      if (
        !ohRole &&
        (l.includes("your email") ||
          l === "email" ||
          l.includes("patient") ||
          l.includes("contact email"))
      ) {
        return true;
      }
      return false;
    },
    [ohRole],
  );

  useEffect(() => {
    if (category === "occupational-health") {
      return;
    }

    if (isAuthenticated && user && steps.length > 0) {
      // For Occupational Health forms, NEVER pre-fill fields automatically.
      // Data for employer/employee sections is filled only via the "use account details" checkbox.
      const isOH =
        productData?.subcategory_slug === "occupational-health" ||
        productData?.category_slug === "occupational-health";
      if (isOH) return;

      const initialData: FormState = {};
      const nameParts = user.name?.trim().split(/\s+/) ?? [];
      const derivedFirstName = user.first_name || nameParts[0] || "";
      const derivedLastName =
        user.last_name ||
        (nameParts.length > 1 ? nameParts.slice(1).join(" ") : "");

      const primaryEmailId = "account_email";

      steps.forEach((step) => {
        step.fields.forEach((f) => {
          const label = f.label.toLowerCase();
          // Skip auto-filling for fields that are part of a section with a "use account details" checkbox
          const isPartOfReferral =
            label.includes("referrer") || f.id.includes("_referrer_");
          const isPartOfEmployee =
            label.includes("employee") ||
            f.id.includes("_first_name") ||
            f.id.includes("_last_name") ||
            f.id.includes("_dob") ||
            f.id.includes("_gender");

          if (isPartOfReferral || isPartOfEmployee) return;

          const isSelfEmail =
            f.type === "email" &&
            (f.id === primaryEmailId || isSelfEmailField(f.label));

          if (isSelfEmail && user.email) {
            initialData[f.id] = user.email;
          } else if (label.includes("first name") && derivedFirstName) {
            initialData[f.id] = derivedFirstName;
          } else if (label.includes("last name") && derivedLastName) {
            initialData[f.id] = derivedLastName;
          } else if ((label === "name" || label === "your name") && user.name) {
            initialData[f.id] = user.name;
          } else if (label.includes("phone") && user.phone) {
            initialData[f.id] = getSafePhoneValue(user.phone);
          } else if (
            (label.includes("birth") || label.includes("dob")) &&
            !label.includes("due date") &&
            !label.includes("estimated child birth") &&
            user.date_of_birth
          ) {
            initialData[f.id] = user.date_of_birth;
          } else if (label.includes("gender") && user.gender) {
            initialData[f.id] = user.gender.toLowerCase();
          }
        });
      });

      if (Object.keys(initialData).length > 0) {
        setFormData((prev) => {
          const next = { ...prev };
          let hasChanges = false;
          Object.keys(initialData).forEach((key) => {
            // Only fill if empty to allow user edits
            if (next[key] === undefined || next[key] === "") {
              if (next[key] !== initialData[key]) {
                next[key] = initialData[key] as FormState[string];
                hasChanges = true;
              }
            }
          });
          return hasChanges ? next : prev;
        });
      }
    }
  }, [
    isAuthenticated,
    user,
    steps,
    ohRole,
    isSelfEmailField,
    productData,
    category,
  ]);

  const getProcessedFields = React.useCallback((): FormField[] => {
    if (!steps[currentStep - 1]) return [];
    const rawFields = steps[currentStep - 1].fields;
    let currentFields: FormField[] = [...rawFields];

    // 1. Step 1 Specific: Ensure a dedicated Account/Auth Email field exists at index 0
    const primaryEmailFieldId = "account_email";

    if (currentStep === 1) {
      const hasAuthEmail = currentFields.some(
        (f) => f.id === primaryEmailFieldId,
      );
      if (!hasAuthEmail) {
        const label = isAuthenticated
          ? "Logged In Email"
          : "Your Account Email";
        const description = isAuthenticated
          ? "Current account session"
          : "We will use this to manage your consultation";

        const accountField: FormField = {
          id: primaryEmailFieldId,
          type: "email",
          label,
          required: true,
          placeholder: "Enter your email address",
          columnWidth: "100",
          description,
        };
        currentFields = [accountField, ...currentFields];
      }

      // Always update label/description for reactivity and filter type-wise checkboxes
      const tempFields = [...currentFields];
      currentFields = currentFields
        .filter((f) => {
          if (f.id.endsWith("_use_account_details")) {
            if (!isAuthenticated || !user) return false;

            const isReferral =
              f.id.includes("referral") ||
              tempFields.some(
                (field) =>
                  field.id ===
                  f.id.replace("_use_account_details", "_referrer_name"),
              ) ||
              tempFields.some(
                (field) =>
                  field.id ===
                  f.id.replace("_use_account_details", "_manager_name"),
              );
            const isEmployee =
              f.id.includes("employee") ||
              tempFields.some(
                (field) =>
                  field.id ===
                  f.id.replace("_use_account_details", "_first_name"),
              );

            if (Number(user.customer_type) === 1) return isEmployee;
            if (Number(user.customer_type) === 2) return isReferral;
            return false;
          }
          return true;
        })
        .map((f) => {
          if (f.id.endsWith("_use_account_details")) {
            const isReferral =
              f.id.includes("referral") ||
              tempFields.some(
                (field) =>
                  field.id ===
                  f.id.replace("_use_account_details", "_referrer_name"),
              ) ||
              tempFields.some(
                (field) =>
                  field.id ===
                  f.id.replace("_use_account_details", "_manager_name"),
              );
            const isEmployee =
              f.id.includes("employee") ||
              tempFields.some(
                (field) =>
                  field.id ===
                  f.id.replace("_use_account_details", "_first_name"),
              );

            if (isReferral)
              return { ...f, label: "Fill with my account details" };
            if (isEmployee)
              return {
                ...f,
                label: "I am the Employee (Use my account details)",
              };
          }
          if (f.id === primaryEmailFieldId) {
            const label = isAuthenticated
              ? "Logged In Email"
              : "Your Account Email";
            const description = isAuthenticated
              ? "Current account session"
              : "We will use this to manage your consultation";
            return {
              ...f,
              type: "email",
              label,
              description,
              required: true,
              placeholder: "Enter your email address",
            };
          }
          return f;
        });
    }

    // 3. Handle password and auth action injection after the primary email field
    const primaryEmailIdx = currentFields.findIndex(
      (f) => f.id === primaryEmailFieldId,
    );
    if (
      primaryEmailIdx !== -1 &&
      !isAuthenticated &&
      emailExists !== null &&
      currentStep === 1
    ) {
      const insertIdx = primaryEmailIdx + 1;
      if (emailExists) {
        currentFields.splice(
          insertIdx,
          0,
          {
            id: "auth_password",
            type: "password",
            label: "Password",
            required: true,
            columnWidth: "100",
          },
          {
            id: "auth_login_actions",
            type: "auth_login_actions",
            label: "",
            columnWidth: "100",
          },
        );
      } else {
        currentFields.splice(
          insertIdx,
          0,
          {
            id: "auth_register_hint",
            type: "section",
            label: "Create your account",
            description:
              "We could not find an account for this email. Set a password below to register and continue with your consultation.",
            columnWidth: "100",
          },
          {
            id: "auth_password",
            type: "password",
            label: "Password",
            required: true,
            placeholder: "Enter a password (minimum 8 characters)",
            columnWidth: "50",
          },
          {
            id: "auth_confirm_password",
            type: "password",
            label: "Confirm password",
            required: true,
            placeholder: "Re-enter your password",
            columnWidth: "50",
          },
          {
            id: "auth_register_actions",
            type: "auth_register_actions",
            label: "",
            columnWidth: "100",
          },
        );
      }
    }

    const actualCategory =
      productData?.subcategory_slug || productData?.category_slug;

    // Occupational Health Support: Conditional Visibility (keeping email types as-is)
    if (actualCategory === "occupational-health") {
      let referralFieldId = "";
      for (const step of steps) {
        const found = step.fields.find(
          (f) =>
            f.label.toLowerCase().includes("previous referrals") &&
            f.label.toLowerCase().includes("occupational health"),
        );
        if (found) {
          referralFieldId = found.id;
          break;
        }
      }

      if (referralFieldId) {
        const referralVal = String(
          formData[referralFieldId] || "",
        ).toLowerCase();
        if (referralVal !== "yes") {
          currentFields = currentFields.filter(
            (f) =>
              !f.label.toLowerCase().includes("provide date/details") &&
              !f.label.toLowerCase().includes("absence history"),
          );
        }
      }
      // Removed the mapping that turned "contact email address" into "text" type
    }

    currentFields = currentFields.filter((field) => {
      if (
        !field.enableConditionalLogic ||
        !field.conditionalLogic?.rules?.length
      )
        return true;

      const { action = "show", logic = "all", rules } = field.conditionalLogic;
      const comparisons = rules.map((rule) =>
        evaluateConditionalRule(
          rule.operator,
          formData[rule.fieldId],
          rule.value,
        ),
      );
      const conditionsMet =
        logic === "any"
          ? comparisons.some(Boolean)
          : comparisons.every(Boolean);

      return action === "hide" ? !conditionsMet : conditionsMet;
    });

    // Logged-in users only need account_email — hide duplicate patient email fields.
    if (isAuthenticated && user?.email) {
      currentFields = currentFields.filter(
        (field) =>
          field.id === primaryEmailFieldId ||
          !(field.type === "email" && isSelfEmailField(field.label)),
      );
    }

    return currentFields.map((field) =>
      field.type === "consent" ? { ...field, required: true } : field,
    );
  }, [
    steps,
    currentStep,
    isAuthenticated,
    user,
    emailExists,
    formData,
    productData,
    isSelfEmailField,
  ]);

  // Keep all self-email fields aligned with the active logged-in session email.
  useEffect(() => {
    if (!isAuthenticated || !user?.email || steps.length === 0) return;

    const primaryEmailId = "account_email";
    const syncedEmail = user.email;
    const nextUpdates: Partial<FormState> = {};

    steps.forEach((step) => {
      step.fields.forEach((field) => {
        if (field.type !== "email") return;
        const isSessionEmailField =
          field.id === primaryEmailId || isSelfEmailField(field.label);
        if (!isSessionEmailField) return;
        if (formData[field.id] !== syncedEmail) {
          nextUpdates[field.id] = syncedEmail;
        }
      });
    });

    if (Object.keys(nextUpdates).length > 0) {
      setFormData((prev) => ({ ...prev, ...nextUpdates }));
    }
  }, [isAuthenticated, user?.email, steps, formData, isSelfEmailField]);

  const validateField = React.useCallback(
    (field: FormField, val: unknown, currentState: FormState = formData) => {
      const inputTypes = [
        "text",
        "email",
        "phone",
        "date",
        "select",
        "radio",
        "textarea",
        "checkbox",
        "file",
        "appointment",
        "password",
        "pricing",
        "matrix",
        "consent",
      ];
      if (!inputTypes.includes(field.type)) return null;
      const isMatrixValue =
        typeof val === "object" &&
        val !== null &&
        !Array.isArray(val) &&
        !(val instanceof File);
      const matrixRows = normalizeMatrixOptions(field.rows);
      const matrixSelectionCount = isMatrixValue
        ? Object.keys(val as Record<string, string>).length
        : 0;
      const isMatrixIncomplete =
        field.type === "matrix" &&
        field.required &&
        matrixRows.length > 0 &&
        matrixSelectionCount < matrixRows.length;

      if (field.type === "consent" && field.required && val !== true) {
        return "Please provide consent to continue";
      }

      if (
        field.type === "appointment" &&
        field.required &&
        !isAppointmentValueComplete(val)
      ) {
        return "Please select a doctor, date, and time for your appointment";
      }

      if (
        field.type === "pricing" &&
        field.required &&
        !isPricingValueSelected(val, field.pricingOptions)
      ) {
        return "Please select a consultation option";
      }

      if (
        field.required &&
        (val === undefined ||
          val === null ||
          val === "" ||
          (Array.isArray(val) && val.length === 0) ||
          isMatrixIncomplete ||
          (field.type === "appointment" && !isAppointmentValueComplete(val)))
      ) {
        return `This field is required`;
      }
      if (val !== undefined && val !== null && val !== "") {
        if (field.type === "email" && typeof val === "string") {
          // Enforce email format but skip "different email" restrictions for now as requested
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
            return "Please enter a valid email address.";
        }
        if (
          field.type === "phone" &&
          typeof val === "string" &&
          !isValidPhoneNumber(val)
        )
          return "Please enter a valid phone number.";
        if (
          field.type === "password" &&
          typeof val === "string" &&
          val.length < 8
        )
          return "Password must be at least 8 characters.";

        if (field.type === "date" && typeof val === "string") {
          const selectedDate = parseDateOnlyLocal(val);
          const normalizedLabel = field.label.toLowerCase();
          const isChildOrDueDate =
            normalizedLabel.includes("due date") ||
            normalizedLabel.includes("estimated child birth");
          const isDOB =
            !isChildOrDueDate &&
            (normalizedLabel.includes("date of birth") ||
              normalizedLabel === "dob" ||
              normalizedLabel.includes(" dob") ||
              normalizedLabel.includes("birth date"));

          if (!selectedDate) {
            return "Please enter a valid date.";
          }

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (isDOB) {
            if (selectedDate > today) return "Date cannot be in the future.";
            let age = today.getFullYear() - selectedDate.getFullYear();
            const m = today.getMonth() - selectedDate.getMonth();
            if (
              m < 0 ||
              (m === 0 && today.getDate() < selectedDate.getDate())
            ) {
              age--;
            }
            if (age < 18)
              return "You must be at least 18 years old to proceed.";
            if (age > 120) return "Please enter a valid date of birth.";
          } else if (field.label.toLowerCase().includes("start date")) {
            const startError = validateSickCertStartDate(val as string, today);
            if (startError) return startError;
          } else if (field.label.toLowerCase().includes("end date")) {
            const startField = getProcessedFields().find((f) =>
              f.label.toLowerCase().includes("start date"),
            );
            const startVal = startField ? currentState[startField.id] : null;

            if (!startVal) return "Please select a Start Date first.";

            const endError = validateSickCertEndDate(
              val as string,
              startVal as string,
            );
            if (endError) return endError;
          } else if (selectedDate > today) {
            const label = normalizedLabel;
            const isFutureAllowed =
              label.includes("return") ||
              label.includes("departure") ||
              label.includes("depart") ||
              label.includes("fly") ||
              label.includes("travel") ||
              label.includes("appointment") ||
              label.includes("due date") ||
              label.includes("estimated child birth");

            if (!isFutureAllowed) {
              return "Date cannot be in the future.";
            }
          }
        }

        if (field.type === "file" && val instanceof File) {
          const isIDProof = isIdProofField(field);
          if (isIDProof) {
            const allowedTypes = [
              "application/pdf",
              "image/jpeg",
              "image/jpg",
              "image/png",
            ];
            if (!allowedTypes.includes(val.type)) {
              return "Please upload a PDF, JPG, or PNG file.";
            }
            if (!isFileWithinUploadLimit(val.size)) {
              return getIdProofTooLargeMessage();
            }
          } else if (!isFileWithinUploadLimit(val.size)) {
            return getFileTooLargeMessage();
          }
        }
      }
      return null;
    },
    [formData, getProcessedFields],
  );

  const checkEmailExistence = React.useCallback(async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailExists(null);
      return;
    }
    setIsCheckingEmail(true);
    try {
      const response = await api.post(API_ENDPOINTS.CHECKOUT_AUTH.CHECK_EMAIL, {
        email,
      });
      const exists = response.data.data?.exists || response.data.exists;
      setEmailExists(exists);
      setLastCheckedEmail(email);

      // Show professional toast for better UX
      if (exists === false) {
        toast.info("Welcome! Let's get your account set up.");
      } else if (exists === true) {
        toast.success("Welcome back! Please sign in to continue.");
      }
    } catch {
      setEmailExists(null);
    } finally {
      setIsCheckingEmail(false);
    }
  }, []);

  const handleInputChange = React.useCallback(
    (fieldId: string, value: unknown) => {
      const primaryEmailId = "account_email";
      const normalizedFieldId = fieldId.endsWith("_other")
        ? fieldId.replace("_other", "")
        : fieldId;
      const candidateField = getProcessedFields().find(
        (f) => f.id === normalizedFieldId,
      );
      const isLockedSessionEmailField = Boolean(
        isAuthenticated &&
        user?.email &&
        candidateField?.type === "email" &&
        (candidateField.id === primaryEmailId ||
          isSelfEmailField(candidateField.label)),
      );
      const nextValue = isLockedSessionEmailField ? user?.email || "" : value;

      setFormData((prev) => {
        const nextFormData = {
          ...prev,
          [fieldId]: nextValue as FormState[string],
        };

        // Handle "Use account details" checkbox logic
        if (fieldId.endsWith("_use_account_details")) {
          const baseId = fieldId.split("_use_account_details")[0];
          const fields = getProcessedFields();

          const isReferral = fields.some(
            (f) =>
              f.id === `${baseId}_manager_name` ||
              f.id === `${baseId}_manager_email` ||
              f.id === `${baseId}_referrer_name` ||
              f.id === `${baseId}_referrer_email`,
          );
          const isEmployee = fields.some(
            (f) =>
              f.id === `${baseId}_first_name` ||
              f.id === `${baseId}_last_name` ||
              f.id === `${baseId}_employee_email` ||
              f.id === `${baseId}_email`,
          );

          if (value === true && isAuthenticated && user) {
            const nameParts = user.name?.trim().split(/\s+/) ?? [];
            const derivedFirstName = user.first_name || nameParts[0] || "";
            const derivedLastName =
              user.last_name ||
              (nameParts.length > 1 ? nameParts.slice(1).join(" ") : "");

            if (isReferral) {
              if (fields.some((f) => f.id === `${baseId}_manager_name`))
                nextFormData[`${baseId}_manager_name`] = user.name || "";
              if (fields.some((f) => f.id === `${baseId}_referrer_name`))
                nextFormData[`${baseId}_referrer_name`] = user.name || "";

              if (fields.some((f) => f.id === `${baseId}_manager_email`))
                nextFormData[`${baseId}_manager_email`] = user.email || "";
              if (fields.some((f) => f.id === `${baseId}_referrer_email`))
                nextFormData[`${baseId}_referrer_email`] = user.email || "";

              if (fields.some((f) => f.id === `${baseId}_manager_contact`))
                nextFormData[`${baseId}_manager_contact`] = getSafePhoneValue(
                  user.phone,
                );
              if (fields.some((f) => f.id === `${baseId}_referrer_phone`))
                nextFormData[`${baseId}_referrer_phone`] = getSafePhoneValue(
                  user.phone,
                );
            }
            if (isEmployee) {
              if (fields.some((f) => f.id === `${baseId}_first_name`))
                nextFormData[`${baseId}_first_name`] = derivedFirstName;
              if (fields.some((f) => f.id === `${baseId}_last_name`))
                nextFormData[`${baseId}_last_name`] = derivedLastName;

              if (fields.some((f) => f.id === `${baseId}_employee_email`))
                nextFormData[`${baseId}_employee_email`] = user.email || "";
              if (fields.some((f) => f.id === `${baseId}_email`))
                nextFormData[`${baseId}_email`] = user.email || "";

              if (
                fields.some((f) => f.id === `${baseId}_employee_phone_number`)
              )
                nextFormData[`${baseId}_employee_phone_number`] =
                  getSafePhoneValue(user.phone);
              if (fields.some((f) => f.id === `${baseId}_phone`))
                nextFormData[`${baseId}_phone`] = getSafePhoneValue(user.phone);

              if (
                fields.some((f) => f.id === `${baseId}_employee_date_of_birth`)
              )
                nextFormData[`${baseId}_employee_date_of_birth`] =
                  user.date_of_birth || "";
              if (fields.some((f) => f.id === `${baseId}_dob`))
                nextFormData[`${baseId}_dob`] = user.date_of_birth || "";

              if (fields.some((f) => f.id === `${baseId}_employee_gender`))
                nextFormData[`${baseId}_employee_gender`] = user.gender
                  ? user.gender.toLowerCase()
                  : "";
              if (fields.some((f) => f.id === `${baseId}_gender`))
                nextFormData[`${baseId}_gender`] = user.gender
                  ? user.gender.toLowerCase()
                  : "";
            }
          } else if (value === false) {
            if (isReferral) {
              const rFields = [
                `${baseId}_manager_name`,
                `${baseId}_referrer_name`,
                `${baseId}_manager_email`,
                `${baseId}_referrer_email`,
                `${baseId}_manager_contact`,
                `${baseId}_referrer_phone`,
              ];
              rFields.forEach((fid) => {
                if (fields.some((f) => f.id === fid)) nextFormData[fid] = "";
              });
            }
            if (isEmployee) {
              const eFields = [
                `${baseId}_first_name`,
                `${baseId}_last_name`,
                `${baseId}_employee_email`,
                `${baseId}_email`,
                `${baseId}_employee_phone_number`,
                `${baseId}_phone`,
                `${baseId}_employee_date_of_birth`,
                `${baseId}_dob`,
                `${baseId}_employee_gender`,
                `${baseId}_gender`,
              ];
              eFields.forEach((fid) => {
                if (fields.some((f) => f.id === fid)) nextFormData[fid] = "";
              });
            }
          }

          // Clear validation errors for these fields when auto-filling
          setErrors((prevErrors) => {
            const nextErrors = { ...prevErrors };
            fields.forEach((f) => {
              if (f.id.startsWith(baseId) && f.id !== fieldId) {
                delete nextErrors[f.id];
              }
            });
            return nextErrors;
          });
        }

        const isOtherField = fieldId.endsWith("_other");
        const baseFieldId = isOtherField
          ? fieldId.replace("_other", "")
          : fieldId;
        const field = getProcessedFields().find((f) => f.id === baseFieldId);

        if (field?.type === "email") {
          const emailVal = nextValue as string;

          if (field.id === primaryEmailId && emailVal !== lastCheckedEmail) {
            if (emailExists !== null) setEmailExists(null);

            // Clear existing timer if any
            if (emailCheckTimerRef.current) {
              clearTimeout(emailCheckTimerRef.current);
            }

            // Set new debounced timer
            emailCheckTimerRef.current = setTimeout(() => {
              checkEmailExistence(emailVal);
            }, 800);
          }
        }

        if (field) {
          setErrors((prevErrors) => {
            const newErrors = { ...prevErrors };
            if (isOtherField) {
              if (!(nextValue as string)?.trim())
                newErrors[fieldId] = "Please specify the other value";
              else delete newErrors[fieldId];
            } else {
              const error = validateField(field, nextValue, nextFormData);
              if (error) newErrors[fieldId] = error;
              else delete newErrors[fieldId];

              // If Start Date changed, re-validate End Date
              if (field.label.toLowerCase().includes("start date")) {
                const endField = getProcessedFields().find((f) =>
                  f.label.toLowerCase().includes("end date"),
                );
                if (endField && nextFormData[endField.id]) {
                  const endError = validateField(
                    endField,
                    nextFormData[endField.id],
                    nextFormData,
                  );
                  if (endError) newErrors[endField.id] = endError;
                  else delete newErrors[endField.id];
                }
              }
            }
            return newErrors;
          });
        }
        return nextFormData;
      });
    },
    [
      getProcessedFields,
      lastCheckedEmail,
      emailExists,
      checkEmailExistence,
      validateField,
      isAuthenticated,
      user,
      isSelfEmailField,
    ],
  );

  const validateStep = () => {
    const currentStepFields = getProcessedFields();
    const newErrors: Record<string, string> = {};
    currentStepFields.forEach((f) => {
      const val = formData[f.id];
      const error = validateField(f, val);
      if (error) newErrors[f.id] = error;
    });
    setErrors(newErrors);
    setShowErrorBanner(Object.keys(newErrors).length > 0);
    return Object.keys(newErrors).length === 0;
  };

  const validateAppointmentAndProductFields = React.useCallback(() => {
    const actualCategory =
      productData?.subcategory_slug || productData?.category_slug;
    const isGpAppointmentFlow =
      actualCategory === "online-gp-appointment" || category === "online-gp";
    const needsAppointmentValidation =
      isGpAppointmentFlow || actualCategory === "occupational-health";

    if (!needsAppointmentValidation) return true;

    const allFields = steps.flatMap((step) => step.fields);
    const newErrors: Record<string, string> = {};

    allFields
      .filter(
        (field) => field.type === "appointment" || field.type === "pricing",
      )
      .forEach((field) => {
        const error = validateField(field, formData[field.id]);
        if (error) newErrors[field.id] = error;
      });

    if (isGpAppointmentFlow && !productData?.id) {
      toast.error(
        "Product information is missing. Please start again from the product page.",
      );
      return false;
    }

    if (Object.keys(newErrors).length === 0) return true;

    setErrors((prev) => ({ ...prev, ...newErrors }));
    setShowErrorBanner(true);

    for (let i = 0; i < steps.length; i++) {
      if (steps[i].fields.some((field) => newErrors[field.id])) {
        scrollFormStepIntoViewAfterNav.current = true;
        setCurrentStep(i + 1);
        break;
      }
    }

    toast.error(
      "Please complete your appointment and consultation selection before continuing.",
    );
    return false;
  }, [steps, formData, validateField, productData, category]);

  const handleNext = () => {
    if (!validateStep()) return;
    if (
      !isAuthenticated &&
      getProcessedFields().some((f) => f.id.startsWith("auth_"))
    ) {
      toast.error("Please login or register to continue");
      return;
    }
    if (currentStep < steps.length) {
      scrollFormStepIntoViewAfterNav.current = true;
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      scrollFormStepIntoViewAfterNav.current = true;
      setCurrentStep(currentStep - 1);
      setShowErrorBanner(false);
    }
  };

  const handleAuthAction = async (type: "login" | "register") => {
    const processed = getProcessedFields();
    const emailField = processed.find((f) => f.type === "email");
    if (!emailField) return;
    const email = formData[emailField.id] as string;
    const password = formData["auth_password"] as string;
    const confirmPassword = formData["auth_confirm_password"] as string;

    if (!password || password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setAuthLoading(true);
    try {
      const endpoint =
        type === "login"
          ? API_ENDPOINTS.CHECKOUT_AUTH.LOGIN
          : API_ENDPOINTS.CHECKOUT_AUTH.REGISTER;
      const payload =
        type === "login"
          ? { email, password }
          : { email, password, password_confirmation: confirmPassword };

      if (type === "register" && password !== confirmPassword) {
        toast.error("Passwords do not match");
        setAuthLoading(false);
        return;
      }

      const response = await api.post(endpoint, payload);
      const data = response.data;

      // Handle WP expired-password case on login
      if (type === "login" && data.wp_password_needs_to_change) {
        // The server already sent the OTP to the user's email
        setWpBannerMessage(data.message);
        setHasSentOtp(true);
        setShowForgotModal(true);
        toast.info(
          data.message || "Your password has expired. Please reset it.",
        );
        return;
      }

      if (data.token) {
        Cookies.set("auth_token", data.token, { expires: 7 });
        useAuthStore.setState({
          user: data.customer || data.user,
          token: data.token,
          isAuthenticated: true,
        });

        await fetchProfile();
        toast.success(
          type === "login"
            ? "Logged in successfully!"
            : "Account created successfully!",
        );
      }
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(
        axiosError.response?.data?.message ||
          "Authentication failed. Please try again.",
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const uploadIdProofToken = async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("file", file, file.name);
    const response = await api.post(API_ENDPOINTS.ID_PROOF_UPLOAD, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const body = response?.data as
      | {
          file_ref?: string;
          path?: string;
          data?: { file_ref?: string; path?: string };
        }
      | undefined;
    const token =
      body?.file_ref || body?.path || body?.data?.file_ref || body?.data?.path;
    if (!token) {
      throw new Error(
        "ID proof upload succeeded but no file reference was returned.",
      );
    }
    return token;
  };

  const getClientIpAddress = async (): Promise<string> => {
    const sources = [
      "https://api.ipify.org?format=json",
      "https://api64.ipify.org?format=json",
      "https://ipapi.co/json/",
    ];

    for (const url of sources) {
      try {
        const response = await fetch(url, { method: "GET" });
        if (!response.ok) continue;
        const data = (await response.json()) as { ip?: string };
        if (typeof data?.ip === "string" && data.ip.trim()) {
          return data.ip.trim();
        }
      } catch {
        // Try next provider.
      }
    }

    try {
      const response = await api.get("https://api.ipify.org?format=json");
      const ip = response?.data?.ip;
      return typeof ip === "string" ? ip : "";
    } catch {
      return "";
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    if (!validateAppointmentAndProductFields()) return;
    if (showOhPricing && selectedOhPriceIndex === null) {
      setErrors((prev) => ({
        ...prev,
        [OH_PRICING_ERROR_KEY]: "Please select a pricing option",
      }));
      setShowErrorBanner(true);
      toast.error("Please select a pricing option");
      return;
    }
    if (
      !isAuthenticated &&
      getProcessedFields().some((f) => f.id.startsWith("auth_"))
    ) {
      toast.error("Please login or register to continue");
      return;
    }

    setIsLoading(true);
    try {
      const formattedFields = await Promise.all(
        steps.map(async (step) => {
          const groups: {
            key: string;
            title: string;
            fields: { key: string; title: string; value: string | null }[];
          }[] = [];
          let currentGroupFields: {
            key: string;
            title: string;
            value: string | null;
          }[] = [];
          let currentSubtitle = "General";

          for (const field of step.fields) {
            if (field.type === "subtitle") {
              if (currentGroupFields.length > 0) {
                groups.push({
                  key: currentSubtitle
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-+|-+$/g, ""),
                  title: currentSubtitle,
                  fields: currentGroupFields,
                });
              }
              currentSubtitle = field.label;
              currentGroupFields = [];
              continue;
            }

            if (field.type === "title" || field.type === "section") continue;

            let value = formData[field.id];
            if (
              isAuthenticated &&
              user?.email &&
              field.type === "email" &&
              (field.id === "account_email" || isSelfEmailField(field.label))
            ) {
              value = user.email;
            }

            const normalizedLabel = field.label
              .replace(/\(Required\)$/i, "")
              .trim();
            const isTriggerQuestion = QUESTIONS_WITH_FOLLOW_UP.some(
              (q) =>
                q.toLowerCase().includes(normalizedLabel.toLowerCase()) ||
                normalizedLabel.toLowerCase().includes(q.toLowerCase()),
            );
            const isYesSelected =
              typeof value === "string" && value.toLowerCase() === "yes";
            const isOtherSelected =
              value === "other" ||
              (Array.isArray(value) && value.includes("other"));

            if (isOtherSelected || (isTriggerQuestion && isYesSelected)) {
              const otherVal = formData[`${field.id}_other`];
              if (otherVal) {
                if (Array.isArray(value)) {
                  value = [
                    ...value.filter((v) => v !== "other"),
                    `Details: ${otherVal}`,
                  ];
                } else {
                  value = isYesSelected
                    ? `Yes (Details: ${otherVal})`
                    : `Other: ${otherVal}`;
                }
              }
            }

            if (
              field.type === "appointment" &&
              typeof value === "object" &&
              value !== null &&
              !(value instanceof File)
            ) {
              const appt = value as {
                doctorId?: string;
                date?: string;
                time?: string;
              };
              const doctor = doctorList.find(
                (d) => String(d.doctor_id) === String(appt.doctorId),
              );
              value = `Doctor: ${doctor?.name || appt.doctorId || "N/A"}, Date: ${appt.date || "N/A"}, Time: ${appt.time || "N/A"}`;
            }

            if (value instanceof File) {
              try {
                const isIDProofUpload = isIdProofField(field);
                if (!isFileWithinUploadLimit(value.size)) {
                  throw new Error(
                    isIDProofUpload
                      ? getIdProofTooLargeMessage()
                      : getFileTooLargeMessage(),
                  );
                }
                if (isIDProofUpload) {
                  const prepared = await prepareIdProofFileForUpload(value);
                  value = await uploadIdProofToken(prepared);
                } else {
                  const base64 = await fileToBase64(value);
                  value = base64;
                }
              } catch (err) {
                console.error("File handling failed", err);
                throw err instanceof Error
                  ? err
                  : new Error("File upload failed");
              }
            }

            let displayValue: string | null = null;
            if (value !== undefined && value !== null && value !== "") {
              displayValue = String(value);
              if (field.type === "consent") {
                displayValue = value === true ? "Accepted" : null;
              } else if (field.type === "matrix") {
                const matrixRows = normalizeMatrixOptions(field.rows);
                const matrixColumns = normalizeMatrixOptions(field.columns);
                const selected =
                  value && typeof value === "object" && !Array.isArray(value)
                    ? (value as Record<string, string>)
                    : {};
                const parts = matrixRows
                  .map((row) => {
                    const selectedColumnValue = selected[row.value];
                    if (!selectedColumnValue) return null;
                    const selectedColumn = matrixColumns.find(
                      (column) => column.value === selectedColumnValue,
                    );
                    return `${row.label}: ${selectedColumn?.label || selectedColumnValue}`;
                  })
                  .filter(Boolean) as string[];
                displayValue = parts.length ? parts.join(" | ") : null;
              } else if (field.pricingOptions?.length) {
                const selectedPricing = field.pricingOptions.find(
                  (p) => p.key === value,
                );
                if (selectedPricing) {
                  const durationLabel = selectedPricing.duration
                    ? ` - ${selectedPricing.duration} ${selectedPricing.durationUnit || "hour"}`
                    : "";
                  displayValue = `${selectedPricing.title}${durationLabel} - €${getEffectivePricingAmount(selectedPricing).toFixed(2)}`;
                }
              } else if (field.choices) {
                if (Array.isArray(value)) {
                  displayValue = value
                    .map(
                      (v) =>
                        field.choices?.find((c) => c.value === v)?.label || v,
                    )
                    .join(", ");
                } else {
                  displayValue =
                    field.choices.find((c) => c.value === value)?.label ||
                    String(value);
                }
              }
            }

            currentGroupFields.push({
              key: field.id,
              title: field.label,
              value: displayValue ? String(displayValue) : null,
            });
          }

          if (currentGroupFields.length > 0) {
            groups.push({
              key: currentSubtitle
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, ""),
              title: currentSubtitle,
              fields: currentGroupFields,
            });
          }

          return {
            key: step.title
              ? step.title
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-+|-+$/g, "")
              : step.id === 1
                ? formKey || "medical"
                : `step_${step.id}`,
            title: step.title || `Step ${step.id}`,
            fields: groups,
          };
        }),
      );

      // Filter out sections with no fields
      // Filter out sections with no fields and exclude ID fields entirely from source
      const filteredSections = formattedFields
        .map((section) => ({
          ...section,
          fields: section.fields
            .map((group) => ({
              ...group,
              fields: group.fields.filter((f) => !isIdProofField(f)),
            }))
            .filter((g) => g.fields.length > 0),
        }))
        .filter((section) => section.fields.length > 0);

      const allFlatFields = filteredSections.flatMap((s) =>
        s.fields.flatMap((g) => g.fields),
      );
      const startDateValue =
        allFlatFields.find(
          (f) =>
            f.key.toLowerCase().includes("start") &&
            f.key.toLowerCase().includes("date"),
        )?.value ||
        allFlatFields.find((f) => f.title.toLowerCase().includes("start date"))
          ?.value ||
        null;
      const endDateValue =
        allFlatFields.find(
          (f) =>
            f.key.toLowerCase().includes("end") &&
            f.key.toLowerCase().includes("date"),
        )?.value ||
        allFlatFields.find((f) => f.title.toLowerCase().includes("end date"))
          ?.value ||
        null;
      const noOfDays = calculateInclusiveDateDiffInDays(
        startDateValue,
        endDateValue,
      );

      const actualCategory =
        productData?.subcategory_slug || productData?.category_slug;

      const vue_form_patient: {
        key: string;
        title: string;
        fields: SubmittedField[];
      }[] = [];
      let vue_form_employer: {
        key: string;
        title: string;
        fields: SubmittedField[];
      }[] = [];

      if (actualCategory === "occupational-health") {
        const getVal = (
          key: string,
          labels: string[],
          exclusions: string[] = [],
        ) => {
          const byKey = allFlatFields.find((f) => f.key === key);
          if (byKey && byKey.value && byKey.value !== "-") return byKey.value;
          return (
            allFlatFields.find(
              (f) =>
                labels.some((l) => f.title.toLowerCase().includes(l)) &&
                !exclusions.some((e) => f.title.toLowerCase().includes(e)),
            )?.value || "-"
          );
        };

        const firstName = getVal(
          "employee_first_name",
          ["employee first name", "first name", "first"],
          ["referrer", "manager", "employer", "organisation", "company"],
        );
        const lastName = getVal(
          "employee_last_name",
          ["employee last name", "last name", "last"],
          ["referrer", "manager", "employer", "organisation", "company"],
        );
        const fullNameField = getVal(
          "employee_full_name",
          ["employee full name", "full name", "patient name", "employee name"],
          ["referrer", "manager", "employer", "organisation", "company"],
        );

        const finalFullName =
          fullNameField !== "-"
            ? fullNameField
            : firstName !== "-" || lastName !== "-"
              ? `${firstName === "-" ? "" : firstName} ${lastName === "-" ? "" : lastName}`.trim()
              : "-";

        vue_form_employer = [
          {
            key: "referral_employer",
            title: "Employer Information",
            fields: [
              {
                key: "employer_name",
                title: "Employer Name",
                value: getVal("employer_name", [
                  "organisation name",
                  "employer name",
                  "company name",
                ]),
              },
              {
                key: "work_location",
                title: "Work Location",
                value: getVal("work_location", [
                  "work location",
                  "site address",
                  "work address",
                  "location of work",
                  "employer address",
                  "company address",
                ]),
              },
              {
                key: "manager_name",
                title: "Manager Name",
                value: getVal("manager_name", [
                  "manager name",
                  "employer contact name",
                  "referrer name",
                  "your name",
                ]),
              },
              {
                key: "manager_contact",
                title: "Manager Contact",
                value: getVal("manager_contact", [
                  "manager contact",
                  "manager phone",
                  "employer phone",
                  "referrer phone",
                  "contact phone",
                  "your phone",
                  "details/phone",
                ]),
              },
              {
                key: "manager_email",
                title: "Manager Email",
                value:
                  allFlatFields.find((f) => f.key === "manager_email")?.value ||
                  allFlatFields.find(
                    (f) =>
                      f.key !== "account_email" &&
                      [
                        "manager email",
                        "employer email",
                        "referrer email",
                        "your email",
                      ].some((l) => f.title.toLowerCase().includes(l)),
                  )?.value ||
                  "-",
              },
            ],
          },
          {
            key: "employee_details",
            title: "Employee Information",
            fields: [
              {
                key: "employee_full_name",
                title: "Employee Full Name",
                value: finalFullName,
              },
              {
                key: "employee_job_title",
                title: "Employee Job Title",
                value: getVal("employee_job_title", [
                  "job title",
                  "role",
                  "occupation",
                  "position",
                ]),
              },
              {
                key: "employee_email",
                title: "Employee Email",
                value:
                  allFlatFields.find((f) => f.key === "employee_email")
                    ?.value ||
                  allFlatFields.find(
                    (f) =>
                      f.key !== "account_email" &&
                      ["employee email", "email"].some((l) =>
                        f.title.toLowerCase().includes(l),
                      ) &&
                      !["referrer", "manager", "employer", "your"].some((l) =>
                        f.title.toLowerCase().includes(l),
                      ),
                  )?.value ||
                  "-",
              },
              {
                key: "employee_phone_number",
                title: "Employee Phone Number",
                value: getVal(
                  "employee_phone_number",
                  ["phone"],
                  ["referrer", "manager", "employer", "your"],
                ),
              },
              {
                key: "employee_date_of_birth",
                title: "Employee Date of birth",
                value: getVal("employee_date_of_birth", [
                  "birth",
                  "dob",
                  "date of birth",
                ]),
              },
              {
                key: "employee_gender",
                title: "Employee Gender",
                value: getVal("employee_gender", ["gender"]),
              },
            ],
          },
        ];

        // For OH, patientData is employee_details section
        vue_form_patient.push(vue_form_employer[1]);
      } else {
        // For other categories, extract standard patient fields for auto-fill
        const getVal = (labels: string[]) => {
          return (
            allFlatFields.find((f) =>
              labels.some((l) => f.title.toLowerCase().includes(l)),
            )?.value || "-"
          );
        };

        const fields = [
          {
            key: "first",
            title: "First Name",
            value: getVal(["first name", "first"]),
          },
          {
            key: "last",
            title: "Last Name",
            value: getVal(["last name", "last"]),
          },
          {
            key: "email",
            title: "Email",
            value:
              (isAuthenticated && user?.email
                ? user.email
                : null) ||
              allFlatFields.find((f) => f.key === "account_email")?.value ||
              allFlatFields.find((f) => f.title.toLowerCase().includes("email"))
                ?.value ||
              "-",
          },
          {
            key: "phone",
            title: "Phone",
            value: getVal(["phone", "contact number", "mobile"]),
          },
        ];

        if (fields.some((f) => f.value !== "-")) {
          vue_form_patient.push({
            key: "patient_info",
            title: "Patient Information",
            fields: fields,
          });
        }
      }

      // Ensure customer demographics are always included for profile updates via place-order flow.
      const findCustomerDob = () => {
        const byKey = allFlatFields.find((f) =>
          [
            "customer_date_of_birth",
            "employee_date_of_birth",
            "date_of_birth",
            "dob",
          ].includes(f.key),
        );
        if (byKey?.value && byKey.value !== "-") return byKey.value;

        const byTitle = allFlatFields.find((f) => {
          const title = f.title.toLowerCase();
          return (
            (title.includes("date of birth") ||
              title.includes("dob") ||
              title.includes("birth")) &&
            !title.includes("manager") &&
            !title.includes("referrer") &&
            !title.includes("employer")
          );
        });
        return byTitle?.value && byTitle.value !== "-" ? byTitle.value : "-";
      };

      const findCustomerGender = () => {
        const byKey = allFlatFields.find((f) =>
          ["customer_gender", "employee_gender", "gender"].includes(f.key),
        );
        if (byKey?.value && byKey.value !== "-")
          return String(byKey.value).toLowerCase();

        const byTitle = allFlatFields.find((f) => {
          const title = f.title.toLowerCase();
          return (
            title.includes("gender") &&
            !title.includes("manager") &&
            !title.includes("referrer") &&
            !title.includes("employer")
          );
        });
        return byTitle?.value && byTitle.value !== "-"
          ? String(byTitle.value).toLowerCase()
          : "-";
      };

      const customerDob = findCustomerDob();
      const customerGender = findCustomerGender();

      if (customerDob !== "-" || customerGender !== "-") {
        if (!vue_form_patient.length) {
          vue_form_patient.push({
            key: "patient_info",
            title: "Patient Information",
            fields: [],
          });
        }

        const patientSection = vue_form_patient[0];
        if (
          !patientSection.fields.some((f) => f.key === "customer_date_of_birth")
        ) {
          patientSection.fields.push({
            key: "customer_date_of_birth",
            title: "Customer Date of Birth",
            value: customerDob,
          });
        }
        if (!patientSection.fields.some((f) => f.key === "customer_gender")) {
          patientSection.fields.push({
            key: "customer_gender",
            title: "Customer Gender",
            value: customerGender,
          });
        }
      }

      const vue_form_data_groups: Record<
        string,
        { key: string; title: string; fields: SubmittedField[] }
      > = {};
      filteredSections.forEach(
        (section: {
          fields: { fields: SubmittedField[]; key: string; title: string }[];
        }) => {
          section.fields.forEach((group) => {
            // Keep all submitted fields in vue_form_data so backend receives full questionnaire context.
            // Patient/employer-specific payloads are still sent separately via vue_form_patient/vue_form_employer.
            if (group.fields.length > 0) {
              if (vue_form_data_groups[group.key]) {
                vue_form_data_groups[group.key].fields.push(...group.fields);
              } else {
                vue_form_data_groups[group.key] = {
                  ...group,
                  fields: [...group.fields],
                };
              }
            }
          });
        },
      );
      const vue_form_data = Object.values(vue_form_data_groups);
      const clientIpAddress = await getClientIpAddress();
      if (clientIpAddress) {
        const generalGroup = vue_form_data.find((group) => group.key === "general");
        if (generalGroup) {
          const nextFields = generalGroup.fields.filter(
            (field) => field.key !== "ip_address",
          );
          const ipField: SubmittedField = {
            key: "ip_address",
            title: "IP Address",
            value: clientIpAddress,
          };
          const consentIndex = nextFields.findIndex((field) =>
            field.key.toLowerCase().includes("consent"),
          );
          if (consentIndex >= 0) {
            nextFields.splice(consentIndex + 1, 0, ipField);
          } else {
            nextFields.push(ipField);
          }
          generalGroup.fields = nextFields;
        }
      }

      // Extract appointment data for online-gp-appointment
      let appointmentPayload = null;
      if (
        actualCategory === "online-gp-appointment" ||
        actualCategory === "occupational-health" ||
        category === "online-gp"
      ) {
        // Find any field of type 'appointment'
        const appointmentField = steps
          .flatMap((s) => s.fields)
          .find((f) => f.type === "appointment");
        if (appointmentField) {
          const appt = formData[appointmentField.id] as AppointmentFormValue;
          if (appointmentField.required && !isAppointmentValueComplete(appt)) {
            toast.error(
              "Please select a doctor, date, and time for your appointment",
            );
            setIsLoading(false);
            return;
          }
          if (isAppointmentValueComplete(appt)) {
            appointmentPayload = {
              user_id: Number(appt.doctorId),
              scheduled_at: `${appt.date} ${appt.time}`,
              duration: 15,
              clinic_id: appt.clinicId || 1,
            };
          }
        }
        // Also clear cart to restrict to digital-only for this specific service
        clearCart();
      }

      const idProofField = formattedFields
        .flatMap((s) => s.fields.flatMap((g) => g.fields))
        .find((f) => isIdProofField(f));

      const ohSelectedPricePayload =
        showOhPricing &&
        selectedOhPriceIndex !== null &&
        productData?.oh_prices?.[selectedOhPriceIndex]
          ? buildOhSelectedPricePayload(
              productData.oh_prices[selectedOhPriceIndex],
              selectedOhPriceIndex,
              ohPriceCurrency,
            )
          : null;

      if (ohSelectedPricePayload && sessionId) {
        saveOhSelectedPriceToSession(sessionId, ohSelectedPricePayload);
      }

      const fieldsToSubmit = {
        vue_form_data,
        vue_form_patient,
        vue_form_employer,
        vue_form_upload_id_proof: idProofField?.value || "",
        ...(noOfDays !== null ? { no_of_days: String(noOfDays) } : {}),
        ...(ohSelectedPricePayload
          ? { oh_selected_price: ohSelectedPricePayload }
          : {}),
        patient_info: {
          customer_date_of_birth: customerDob !== "-" ? customerDob : "",
          customer_gender: customerGender !== "-" ? customerGender : "",
        },
        // Appointment payload for online-gp-appointment and occupational-health
        ...((actualCategory === "online-gp-appointment" ||
          actualCategory === "occupational-health" ||
          category === "online-gp") &&
        appointmentPayload
          ? { appointment: appointmentPayload }
          : {}),
        // Keep the old structured format for certificates just in case backend still expects it elsewhere
        ...(actualCategory === "online-medical-certificates"
          ? {
              patient_info: {
                company:
                  allFlatFields.find((f) =>
                    ["organisation name", "employer name", "company name"].some(
                      (l) => f.title.toLowerCase().includes(l),
                    ),
                  )?.value || "",
                dob:
                  allFlatFields.find((f) =>
                    ["birth", "dob", "date of birth"].some((l) =>
                      f.title.toLowerCase().includes(l),
                    ),
                  )?.value || "",
                gender:
                  allFlatFields.find((f) =>
                    f.title.toLowerCase().includes("gender"),
                  )?.value || "",
              },
              contact_info: {
                email:
                  (isAuthenticated && user?.email ? user.email : "") ||
                  allFlatFields.find((f) =>
                    ["your email", "email"].some((l) =>
                      f.title.toLowerCase().includes(l),
                    ),
                  )?.value ||
                  "",
                phone:
                  allFlatFields.find((f) =>
                    ["phone"].some((l) => f.title.toLowerCase().includes(l)),
                  )?.value || "",
              },
            }
          : {}),
      };

      setConsultationData(fieldsToSubmit, formTitle, formKey, sessionId || "");
      if (typeof window !== "undefined" && sessionId) {
        sessionStorage.setItem(`checkout_access_${sessionId}`, "true");
      }
      router.push(`/${category}/${slug}/checkout?sessionId=${sessionId}`);
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      const errorMessage = axiosError.response?.data?.message;

      if (
        error instanceof Error &&
        (error.name === "QuotaExceededError" ||
          error.message?.includes("quota"))
      ) {
        toast.error(
          "Form data is too large. Please try smaller attachments or shorter descriptions.",
        );
      } else if (errorMessage) {
        toast.error(errorMessage);
      } else if (error instanceof Error && error.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to submit form. Please check your inputs.");
      }
      console.error("Form Submission Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onForgotClickInternal = async () => {
    if (hasSentOtp || authLoading) return;

    const processed = getProcessedFields();
    const emailField = processed.find((f) => f.type === "email");
    if (!emailField) return;
    const email = formData[emailField.id] as string;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address first");
      return;
    }

    setAuthLoading(true);
    try {
      await api.post(API_ENDPOINTS.CHECKOUT_AUTH.FORGOT_PASSWORD, { email });
      setHasSentOtp(true);
      setShowForgotModal(true);
      toast.success("Verification code sent to your email.");
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      toast.error(
        axiosError.response?.data?.message ||
          "Failed to send verification code.",
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const totalSteps = steps.length;
  const progressPercentage =
    totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;
  const currentStepFields = getProcessedFields();

  const calculatedRows = React.useMemo(() => {
    const rows: FormField[][] = [];
    let currentRowSlot: FormField[] = [];
    let currentRowSlotWidth = 0;

    currentStepFields.forEach((field) => {
      const width = parseInt(field.columnWidth || "100");
      if (field.type === "title" || field.type === "section") {
        if (currentRowSlot.length > 0) {
          rows.push(currentRowSlot);
          currentRowSlot = [];
          currentRowSlotWidth = 0;
        }
        rows.push([field]);
        return;
      }
      if (width === 100) {
        if (currentRowSlot.length > 0) {
          rows.push(currentRowSlot);
          currentRowSlot = [];
          currentRowSlotWidth = 0;
        }
        rows.push([field]);
      } else {
        currentRowSlot.push(field);
        currentRowSlotWidth += width;
        if (currentRowSlotWidth >= 100) {
          rows.push(currentRowSlot);
          currentRowSlot = [];
          currentRowSlotWidth = 0;
        }
      }
    });
    if (currentRowSlot.length > 0) rows.push(currentRowSlot);
    return rows;
  }, [currentStepFields]);

  // Ensure single-select fields always have a default selected option.
  useEffect(() => {
    if (isLoading || steps.length === 0) return;
    const currentFields = getProcessedFields();
    const defaults: Record<string, string> = {};
    const todayIso = toLocalDateIso(new Date());

    currentFields.forEach((field) => {
      const currentValue = formData[field.id];

      if (
        (currentValue !== undefined &&
          currentValue !== null &&
          currentValue !== "") ||
        field.id.startsWith("auth_")
      ) {
        return;
      }

      if (field.type === "pricing" && field.pricingOptions?.length) {
        defaults[field.id] = field.pricingOptions[0].key;
        return;
      }

      if (field.type === "date") {
        const normalizedLabel = field.label.toLowerCase();
        const isDueDate =
          normalizedLabel.includes("estimated child birth due date") ||
          normalizedLabel.includes("child birth due date") ||
          normalizedLabel.includes("due date");
        if (isDueDate) {
          defaults[field.id] = todayIso;
        }
      }
    });

    if (Object.keys(defaults).length > 0) {
      if (forceFreshFormState.current) {
        // Hard reset path: rebuild state from scratch so old typed values cannot leak in.
        setFormData(defaults as FormState);
        forceFreshFormState.current = false;
      } else {
        setFormData((prev) => ({ ...prev, ...defaults }));
      }
    }
  }, [isLoading, steps.length, currentStep, getProcessedFields, formData]);

  if (isLoading && !isRedirectingToStripe) return <FormSkeleton />;
  if (steps.length === 0)
    return (
      <div className="min-h-screen flex items-center justify-center font-medium text-gray-400">
        Loading form...
      </div>
    );

  return (
    <>
      {isRedirectingToStripe && <StripeRedirectLoader />}
      {showForgotModal && (
        <ForgotPasswordModal
          email={
            (formData[
              steps[currentStep - 1].fields.find((f) => f.type === "email")
                ?.id || ""
            ] as string) || ""
          }
          skipOtpRequest={hasSentOtp && !!wpBannerMessage}
          bannerMessage={wpBannerMessage}
          onClose={() => {
            setShowForgotModal(false);
            setHasSentOtp(false);
            setWpBannerMessage(undefined);
          }}
          onSuccess={() => {
            setShowForgotModal(false);
            setHasSentOtp(false);
            setWpBannerMessage(undefined);
          }}
        />
      )}

      <AnimatePresence>
        {showConflictModal && conflictProgress && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 md:p-8 space-y-6">
                <div className="size-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 p-2 mx-auto">
                  <AlertTriangle className="size-10" />
                </div>

                <div className="text-center space-y-3">
                  <h3 className="text-2xl font-bold text-(--maincolor)">
                    Incomplete Session Found
                  </h3>
                  <p className="text-gray-600 text-[15px] leading-relaxed">
                    You were previously filling out a form for{" "}
                    <span className="font-bold text-(--maincolor) capitalize">
                      {conflictProgress.slug.replace(/-/g, " ")}
                    </span>
                    . What would you like to do?
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      router.push(
                        `/${conflictProgress.category}/${conflictProgress.slug}/form?sessionId=${conflictProgress.sessionId}`,
                      );
                      setShowConflictModal(false);
                    }}
                    className="w-full group flex items-center justify-between p-4 bg-(--blockground) border-2 border-(--maincolor)/10 rounded-xl hover:border-(--btncolor)/30 hover:bg-(--greenItem)/50 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-(--maincolor)/10 flex items-center justify-center">
                        <RefreshCw className="size-5 text-(--maincolor)" />
                      </div>
                      <div>
                        <p className="font-bold text-(--maincolor)">
                          Resume Previous
                        </p>
                        <p className="text-xs text-(--maincolor)/70">
                          Continue where you left off
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="size-5 text-(--btncolor)/70 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={() => {
                      clearAllProgress();
                      clearCheckoutData();
                      persistSaveSeq.current += 1;
                      forceFreshFormState.current = true;
                      setFormData({});
                      setCurrentStep(1);
                      setErrors({});
                      setShowErrorBanner(false);
                      hasAttemptedProfileFill.current = false;
                      setConflictProgress(null);
                      setShowConflictModal(false);
                      setFormInstanceKey((prev) => prev + 1);
                      toast.info(
                        "All previous session data cleared. Starting fresh.",
                      );
                    }}
                    className="w-full flex items-center gap-3 p-4 border-2 border-gray-100 rounded-xl hover:border-gray-200 hover:bg-gray-50 transition-all text-left"
                  >
                    <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <X className="size-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-700">
                        Start New Session
                      </p>
                      <p className="text-xs text-gray-400">
                        Previous progress will be lost
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-white pt-24 lg:pt-32 pb-20 relative lg:before:absolute lg:before:top-0 lg:before:left-0 lg:before:w-1/2 lg:before:h-full lg:before:bg-[#E7E9ED] overflow-x-hidden">
        <div className="w-full md:container mx-auto relative z-40">
          <div className="py-8 text-center">
            <h1 className="text-(--maincolor) text-2xl lg:text-3xl md:leading-none font-bold relative mb-1.5">
              {category === "occupational-health" && productTitle
                ? productTitle
                : formTitle}
            </h1>
          </div>
          <div className="flex flex-col lg:flex-row justify-end w-full">
            <div className="w-full lg:w-1/2 lg:bg-[#E7E9ED] md:bg-transparent">
              <div className="p-6 lg:py-8 xl:pr-24">
                <div className="flex flex-row lg:flex-col justify-center lg:justify-start relative">
                  <div className="hidden lg:block absolute left-4 top-4 h-[calc(100%-1rem)] w-px bg-(--maincolor)/70" />
                  {steps.map((step, idx) => (
                    <div
                      key={step.id}
                      className={`flex items-center lg:items-start flex-col lg:flex-row flex-1 lg:flex-auto gap-2 lg:gap-6 text-center lg:text-left ${idx < steps.length - 1 ? "lg:mb-8" : ""} relative ${idx > 0 ? "lg:before:hidden before:absolute before:bg-gray-300 before:h-[2px] before:w-[calc(100%-32px)] before:-left-1/2 before:top-[16px] before:translate-x-[17px]" : ""}`}
                    >
                      <div
                        className={`z-10 w-8 h-8 rounded-full flex items-center justify-center ${currentStep > idx + 1 ? "bg-(--maincolor)" : currentStep === idx + 1 ? "bg-(--maincolor)" : "border border-(--maincolor) bg-[#E7E9ED]"}`}
                      >
                        {currentStep > idx + 1 ? (
                          <svg
                            className="w-4 h-4 text-white"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                              clipRule="evenodd"
                              fillRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <span
                            className={`font-semibold text-sm ${currentStep === idx + 1 ? "text-white" : "text-(--maincolor)"}`}
                          >
                            {idx + 1}
                          </span>
                        )}
                      </div>
                      <div className="pt-1">
                        <p
                          className={`uppercase !text-xs sm:!text-sm font-medium ${currentStep >= idx + 1 ? "text-(--maincolor)" : "text-gray-500"}`}
                        >
                          {step.title}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="w-full lg:w-1/2">
              <div className="p-6 xl:pl-24">
                {showErrorBanner && (
                  <div className="border border-red-200 rounded-md p-4 mb-8 bg-red-50/30">
                    <h2 className="text-[#c02b0a] text-sm flex items-center gap-2 font-bold mb-2">
                      <span className="opacity-50 text-red-500">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                          stroke="currentColor"
                          className="size-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                          />
                        </svg>
                      </span>
                      Please correct the errors before proceeding:
                    </h2>
                    <ul className="list-disc list-inside space-y-1">
                      {Object.entries(errors).map(([fieldId, message]) => {
                        const field =
                          getProcessedFields().find((f) => f.id === fieldId) ||
                          (fieldId.endsWith("_other")
                            ? getProcessedFields().find(
                                (f) => f.id === fieldId.replace("_other", ""),
                              )
                            : null);
                        const label =
                          fieldId === OH_PRICING_ERROR_KEY
                            ? "Pricing"
                            : field?.label || fieldId;
                        return (
                          <li
                            key={fieldId}
                            className="text-[#c02b0a] text-[13px] font-medium leading-tight"
                          >
                            {label}: {message}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                <form
                  key={formInstanceKey}
                  className="w-full my-4"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <div className="space-y-6">
                    <div
                      ref={formStepScrollRef}
                      className="w-full scroll-mt-24 lg:scroll-mt-32"
                    >
                      <h6 className="text-(--maincolor) text-sm font-semibold mb-2">
                        Step {currentStep} of {totalSteps} -{" "}
                        {steps[currentStep - 1].title}
                      </h6>
                      <div className="bg-black/10 rounded-md w-full h-2.5 overflow-hidden relative">
                        <div
                          className="bg-(--btncolor) absolute inset-0 transition-all duration-300"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      {(() => {
                        const isLocked =
                          !isAuthenticated &&
                          currentStepFields.some((f) =>
                            f.id.startsWith("auth_"),
                          );

                        return calculatedRows.map((row, rowIdx) => {
                          const isNameGroup =
                            row.length === 2 &&
                            row.every((f) =>
                              f.label?.toLowerCase().includes("name"),
                            );

                          if (row.length === 2 && isNameGroup) {
                            const rowDisabled =
                              isLocked &&
                              row.every(
                                (f) =>
                                  !f.id.startsWith("auth_") &&
                                  f.type !== "email",
                              );

                            return (
                              <fieldset
                                key={rowIdx}
                                className={`bg-[#E7E9ED] border border-gray-200 rounded-md p-4 transition-all duration-300 ${rowDisabled ? "opacity-40 grayscale-[0.5] pointer-events-none" : ""}`}
                              >
                                <div className="text-(--maincolor) text-sm font-semibold block mb-3">
                                  Name(Required){" "}
                                  <span className="text-red-500">*</span>
                                </div>
                                <div className="flex items-center gap-5">
                                  {row.map((field) => (
                                    <div key={field.id} className="w-1/2">
                                      <label
                                        htmlFor={field.id}
                                        className="sr-only"
                                      >
                                        {field.label}
                                      </label>
                                      <input
                                        id={field.id}
                                        type="text"
                                        value={
                                          (formData[field.id] as string) || ""
                                        }
                                        onChange={(e) =>
                                          handleInputChange(
                                            field.id,
                                            e.target.value,
                                          )
                                        }
                                        placeholder={
                                          field.placeholder || field.label
                                        }
                                        className="appearance-none rounded-md relative block w-full h-12 px-4 py-3 bg-white border border-(--maincolor) placeholder-gray-500 text-(--maincolor) text-sm focus:outline-none focus:ring-(--maincolor) focus:border-(--maincolor)"
                                        required={field.required}
                                        disabled={rowDisabled}
                                      />
                                    </div>
                                  ))}
                                </div>
                                <span className="text-[#585e6a]/70 text-[13px]">
                                  Please enter your Name as per your ID
                                </span>
                                {(errors[row[0].id] ||
                                  (row[1] && errors[row[1].id])) && (
                                  <div className="validation_message text-[#c02b0a]/70 text-sm mt-3">
                                    This field is required. Please complete both
                                    fields.
                                  </div>
                                )}
                              </fieldset>
                            );
                          }
                          return (
                            <div
                              key={rowIdx}
                              className="flex flex-wrap gap-x-5 gap-y-4 items-start sm:items-start"
                            >
                              {row.map((field) => {
                                const primaryEmailId = "account_email";
                                const isPrimaryEmail =
                                  field.id === primaryEmailId;
                                const isSessionEmailField =
                                  field.type === "email" &&
                                  (isPrimaryEmail ||
                                    isSelfEmailField(field.label));
                                const fieldDisabled =
                                  (isLocked &&
                                    !field.id.startsWith("auth_") &&
                                    field.type !== "email") ||
                                  (isAuthenticated && isSessionEmailField);
                                const colWidth = field.columnWidth || "100";
                                const widthClass =
                                  colWidth === "33"
                                    ? "w-full sm:w-[calc(33.33%-1.25rem)]"
                                    : colWidth === "50"
                                      ? "w-full sm:w-[calc(50%-1.25rem)]"
                                      : "w-full";

                                return (
                                  <div
                                    key={field.id}
                                    className={`${widthClass} transition-all duration-300 ${fieldDisabled ? "opacity-40 grayscale-[0.5] pointer-events-none" : ""}`}
                                  >
                                    <FieldRenderer
                                      field={field}
                                      value={formData[field.id]}
                                      otherValue={
                                        formData[`${field.id}_other`] as
                                          | string
                                          | undefined
                                      }
                                      error={
                                        errors[field.id] ||
                                        errors[`${field.id}_other`]
                                      }
                                      onChange={(val) =>
                                        handleInputChange(field.id, val)
                                      }
                                      onOtherChange={(val) =>
                                        handleInputChange(
                                          `${field.id}_other`,
                                          val,
                                        )
                                      }
                                      onAuthAction={handleAuthAction}
                                      onForgotClick={onForgotClickInternal}
                                      authLoading={authLoading}
                                      isCheckingEmail={isCheckingEmail}
                                      doctorList={doctorList}
                                      doctorAvailabilities={
                                        doctorAvailabilities
                                      }
                                      disabled={fieldDisabled}
                                      onIdProofUploadPendingChange={
                                        setIsIdProofUploading
                                      }
                                      allFieldsInStep={currentStepFields}
                                      formData={formData}
                                    />
                                  </div>
                                );
                              })}

                              {(() => {
                                // Row-level duration warning for sick certificates
                                const endDateField = row.find((f) =>
                                  f.label?.toLowerCase().includes("end date"),
                                );
                                if (!endDateField) return null;

                                const startDateField = currentStepFields.find(
                                  (f) =>
                                    f.label
                                      ?.toLowerCase()
                                      .includes("start date"),
                                );
                                const startVal = startDateField
                                  ? formData[startDateField.id]
                                  : null;
                                const endVal = formData[endDateField.id];

                                if (startVal && endVal) {
                                  const d1 = parseDateOnlyLocal(
                                    startVal as string,
                                  );
                                  const d2 = parseDateOnlyLocal(
                                    endVal as string,
                                  );
                                  if (!d1 || !d2) return null;
                                  const diff = Math.ceil(
                                    (d2.getTime() - d1.getTime()) /
                                      (1000 * 3600 * 24),
                                  );
                                  if (diff > 7) return null;
                                }
                                return null;
                              })()}
                            </div>
                          );
                        });
                      })()}
                    </div>
                    {currentStep === totalSteps && showOhPricing && productData?.oh_prices && (
                      <OhPricingSelector
                        prices={productData.oh_prices}
                        selectedIndex={selectedOhPriceIndex}
                        onSelect={handleOhPriceSelect}
                        currency={ohPriceCurrency}
                        error={errors[OH_PRICING_ERROR_KEY]}
                        required
                      />
                    )}
                    <div className="flex items-center justify-between gap-4 mt-7">
                      {currentStep > 1 && (
                        <button
                          type="button"
                          onClick={handlePrevious}
                          className="w-full max-w-50 p-3 text-[#112337] text-base bg-white border border-[#112337] rounded-md hover:bg-[#F5F5F5] cursor-pointer transition-colors"
                        >
                          Previous
                        </button>
                      )}
                      {(() => {
                        const isLocked =
                          !isAuthenticated &&
                          currentStepFields.some((f) =>
                            f.id.startsWith("auth_"),
                          );
                        const isActionDisabled = isLocked || isIdProofUploading;
                        return (
                          <button
                            type="button"
                            onClick={
                              currentStep === totalSteps
                                ? handleSubmit
                                : handleNext
                            }
                            disabled={isActionDisabled}
                            className={`w-full max-w-50 p-3 text-white text-base border rounded-md transition-all duration-300 ${isActionDisabled ? "bg-gray-400 border-gray-400 cursor-not-allowed opacity-50" : "bg-(--btncolor) border-(--btncolor) cursor-pointer hover:bg-(--btncolor)/90"}`}
                          >
                            {isIdProofUploading
                              ? "Uploading document..."
                              : currentStep === totalSteps
                                ? "Submit & Checkout"
                                : "Next"}
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

interface FieldRendererProps {
  field: FormField;
  value: FormState[string];
  otherValue?: string;
  error?: string;
  onChange: (val: FormState[string]) => void;
  onOtherChange: (val: string) => void;
  onAuthAction?: (type: "login" | "register") => void;
  onForgotClick?: () => void;
  authLoading?: boolean;
  isCheckingEmail?: boolean;
  doctorList?: DoctorInfo[];
  doctorAvailabilities?: AvailabilityDateGroup[];
  disabled?: boolean;
  onIdProofUploadPendingChange?: (pending: boolean) => void;
  allFieldsInStep?: FormField[];
  formData?: FormState;
}

interface PharmacySelectFieldProps {
  field: FormField;
  value: FormState[string];
  error?: string;
  disabled?: boolean;
  onChange: (val: FormState[string]) => void;
}

function PharmacySelectField({
  field,
  value,
  error,
  disabled,
  onChange,
}: PharmacySelectFieldProps) {
  const initialSearch = typeof value === "string" ? value : "";
  const [pharmacySearch, setPharmacySearch] = useState(initialSearch);
  const [pharmacyOptions, setPharmacyOptions] = useState<PharmacyChoice[]>([]);
  const [isLoadingPharmacies, setIsLoadingPharmacies] = useState(true);
  const [isPharmacyListOpen, setIsPharmacyListOpen] = useState(false);
  const [pharmacyPanelBox, setPharmacyPanelBox] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const pharmacySelectContainerRef = useRef<HTMLDivElement>(null);
  const pharmacyDropdownPortalRef = useRef<HTMLDivElement>(null);
  const filteredPharmaciesRef = useRef<PharmacyChoice[]>([]);
  const inputClasses = "ghc-input";

  const updatePharmacyPanelPosition = useCallback(() => {
    const root = pharmacySelectContainerRef.current;
    if (!root || typeof window === "undefined") return;
    const r = root.getBoundingClientRect();
    const margin = 8;
    const top = r.bottom + margin;
    const spaceBelow = window.innerHeight - top - margin;
    const maxHeight = Math.max(120, Math.min(224, spaceBelow));
    setPharmacyPanelBox({ top, left: r.left, width: r.width, maxHeight });
  }, []);

  const closePharmacyList = useCallback(() => {
    setIsPharmacyListOpen(false);
    setPharmacyPanelBox(null);
  }, []);

  useEffect(() => {
    let active = true;
    void getPharmacyChoices()
      .then((choices) => {
        if (!active) return;
        setPharmacyOptions(choices);
      })
      .catch((err) => {
        console.error("Failed to load pharmacy list", err);
        if (!active) return;
        setPharmacyOptions([]);
      })
      .finally(() => {
        if (!active) return;
        setIsLoadingPharmacies(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredPharmacies = React.useMemo(() => {
    if (!pharmacySearch.trim()) return pharmacyOptions.slice(0, 100);

    const tokens = pharmacySearch
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    if (tokens.length === 0) return pharmacyOptions.slice(0, 100);
    return pharmacyOptions
      .filter((item) =>
        tokens.every((token) => item.searchText.includes(token)),
      )
      .slice(0, 100);
  }, [pharmacySearch, pharmacyOptions]);

  useEffect(() => {
    filteredPharmaciesRef.current = filteredPharmacies;
  }, [filteredPharmacies]);

  useLayoutEffect(() => {
    if (!isPharmacyListOpen) return;
    updatePharmacyPanelPosition();
    window.addEventListener("scroll", updatePharmacyPanelPosition, true);
    window.addEventListener("resize", updatePharmacyPanelPosition);
    return () => {
      window.removeEventListener("scroll", updatePharmacyPanelPosition, true);
      window.removeEventListener("resize", updatePharmacyPanelPosition);
    };
  }, [isPharmacyListOpen, updatePharmacyPanelPosition, pharmacySearch]);

  useEffect(() => {
    if (!isPharmacyListOpen) return;
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target;
      if (!(target instanceof Node)) return;
      const root = pharmacySelectContainerRef.current;
      const portal = pharmacyDropdownPortalRef.current;
      if (root?.contains(target) || portal?.contains(target)) return;
      closePharmacyList();
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isPharmacyListOpen, closePharmacyList]);

  const manualPharmacyHint =
    !isLoadingPharmacies &&
    Boolean(pharmacySearch.trim()) &&
    filteredPharmacies.length === 0;

  const commitManualPharmacy = () => {
    const q = pharmacySearch.trim();
    if (!q) return;
    onChange(q);
    closePharmacyList();
  };

  const errorDisplay = error ? (
    <p className="validation_message text-[#c02b0a] text-[12px] font-medium leading-tight mt-1.5">
      {error}
    </p>
  ) : null;

  return (
    <div ref={pharmacySelectContainerRef} className="w-full pb-2 relative">
      <label htmlFor={field.id} className="ghc-label">
        {field.label}{" "}
        {field.required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={field.id}
        type="text"
        autoComplete="off"
        value={pharmacySearch}
        onChange={(e) => {
          setPharmacySearch(e.target.value);
          setIsPharmacyListOpen(true);
        }}
        onFocus={() => setIsPharmacyListOpen(true)}
        onBlur={() => {
          window.setTimeout(() => {
            const root = pharmacySelectContainerRef.current;
            const portal = pharmacyDropdownPortalRef.current;
            const active = document.activeElement;
            if (
              active instanceof Node &&
              (root?.contains(active) || portal?.contains(active))
            ) {
              return;
            }
            closePharmacyList();
            const q = pharmacySearch.trim();
            if (q && filteredPharmaciesRef.current.length === 0) {
              onChange(q);
            }
          }, 180);
        }}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          if (
            !pharmacySearch.trim() ||
            filteredPharmaciesRef.current.length > 0
          )
            return;
          e.preventDefault();
          commitManualPharmacy();
        }}
        placeholder="Search pharmacy by name, town, county, eircode..."
        className={`${inputClasses} ${error ? "border-red-400" : ""}`}
        disabled={disabled}
      />
      {isPharmacyListOpen &&
        pharmacyPanelBox &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={pharmacyDropdownPortalRef}
            className="fixed z-[200] border border-gray-200 rounded-md bg-white shadow-lg overflow-y-auto"
            style={{
              top: pharmacyPanelBox.top,
              left: pharmacyPanelBox.left,
              width: pharmacyPanelBox.width,
              maxHeight: pharmacyPanelBox.maxHeight,
            }}
          >
            {isLoadingPharmacies ? (
              <div className="px-3 py-3 text-sm text-gray-500 flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Loading pharmacies...
              </div>
            ) : manualPharmacyHint ? (
              <div className="px-3 py-3 text-sm text-gray-600 space-y-2">
                <p>
                  Pharmacy not found in the list. You can enter your pharmacy
                  details manually — type the full name and address if you like,
                  then press Enter or use the button below.
                </p>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    if (disabled) return;
                    commitManualPharmacy();
                  }}
                  className="w-full text-center px-3 py-2 rounded-md text-sm font-semibold bg-(--maincolor)/10 text-(--maincolor) hover:bg-(--maincolor)/15 transition-colors disabled:opacity-50"
                  disabled={disabled}
                >
                  Use manual entry
                </button>
              </div>
            ) : (
              filteredPharmacies.map((pharmacy) => {
                const isSelected = value === pharmacy.value;
                return (
                  <button
                    key={pharmacy.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onChange(pharmacy.value);
                      setPharmacySearch(pharmacy.label);
                      closePharmacyList();
                    }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      isSelected
                        ? "bg-(--maincolor)/10 text-(--maincolor) font-semibold"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                    disabled={disabled}
                  >
                    {pharmacy.label}
                  </button>
                );
              })
            )}
          </div>,
          document.body,
        )}
      {errorDisplay}
    </div>
  );
}

function FieldRenderer({
  field,
  value,
  otherValue,
  error,
  onChange,
  onOtherChange,
  onAuthAction,
  onForgotClick,
  authLoading,
  isCheckingEmail,
  doctorList = [],
  doctorAvailabilities = [],
  disabled,
  onIdProofUploadPendingChange,
  allFieldsInStep = [],
  formData = {},
}: FieldRendererProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const isPharmacySelect =
    field.type === "select" && field.label.trim().toLowerCase() === "pharmacy";
  const inputClasses = "ghc-input";
  const radioClasses =
    "appearance-none relative inline-block size-5 shrink-0 bg-transparent border border-(--maincolor) rounded-full align-top checked:bg-(--maincolor) cursor-pointer";

  if (field.type === "title") return null;
  // Allow sections for general use now, not just auth hints
  // if (field.type === 'section' && !field.id.startsWith('auth_')) return null;

  const errorDisplay = error ? (
    <p className="validation_message text-[#c02b0a] text-[12px] font-medium leading-tight mt-1.5">
      {error}
    </p>
  ) : null;

  const renderOtherInput = () => {
    const normalizedLabel = field.label.replace(/\(Required\)$/i, "").trim();
    const isTriggerQuestion = QUESTIONS_WITH_FOLLOW_UP.some(
      (q) =>
        q.toLowerCase().includes(normalizedLabel.toLowerCase()) ||
        normalizedLabel.toLowerCase().includes(q.toLowerCase()),
    );

    const isYesSelected =
      typeof value === "string" && value.toLowerCase() === "yes";
    const isOtherSelected =
      value === "other" || (Array.isArray(value) && value.includes("other"));

    const shouldShow = isOtherSelected || (isTriggerQuestion && isYesSelected);

    if (!shouldShow) return null;

    return (
      <div className="mt-4 animate-in slide-in-from-top-2 duration-200">
        <label className="text-(--btncolor) text-xs font-semibold block mb-2 uppercase">
          Please specify:
        </label>
        <input
          type="text"
          value={otherValue || ""}
          onChange={(e) => onOtherChange(e.target.value)}
          placeholder="Please specify details..."
          className={inputClasses}
          disabled={disabled}
        />
      </div>
    );
  };

  switch (field.type) {
    case "subtitle":
    case "section": {
      const isAuthHint = field.id.startsWith("auth_");
      return (
        <div
          className={`pt-6 pb-2 mb-2 ${isAuthHint ? "p-4 bg-(--blockground)/80 border border-(--maincolor)/10 rounded-lg" : "border-b border-gray-100"}`}
        >
          <h3
            className={`text-(--maincolor) font-bold ${isAuthHint ? "text-base" : "text-lg uppercase tracking-wider"}`}
          >
            {field.label}
          </h3>
          {field.description && (
            <p
              className={`mt-1 ${isAuthHint ? "text-(--maincolor)/80 text-sm leading-relaxed" : "text-gray-500 text-sm"}`}
            >
              {field.description}
            </p>
          )}
        </div>
      );
    }
    case "email":
      return (
        <div className="w-full">
          <label htmlFor={field.id} className="ghc-label mb-2 block">
            {field.label}{" "}
            {field.required && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <input
              id={field.id}
              type="email"
              value={(value as string) || ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder || "Enter your email address"}
              className={`${inputClasses} ${isCheckingEmail && field.id === "account_email" ? "bg-[#f0f7ff]/50" : "bg-white"} ${error ? "border-red-400" : ""}`}
              disabled={disabled}
            />
            {isCheckingEmail && field.id === "account_email" && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="size-5 animate-spin text-(--maincolor)" />
              </div>
            )}
          </div>
          {field.description && (
            <p className="text-slate-500 text-[12px] mt-1.5 leading-relaxed">
              {field.description}
            </p>
          )}
          {errorDisplay}
        </div>
      );
    case "password":
      const isLoginPassword = field.id === "auth_password";
      return (
        <div className="w-full relative">
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor={field.id}
              className="text-[13px] font-semibold text-gray-700 block font-mainfont"
            >
              {field.label}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            {isLoginPassword && onForgotClick && (
              <button
                type="button"
                onClick={onForgotClick}
                className="text-(--maincolor) hover:text-(--maincolor) text-[13px] transition-colors cursor-pointer"
              >
                Forgot Password?
              </button>
            )}
          </div>
          <div className="relative">
            <input
              id={field.id}
              type={showPassword ? "text" : "password"}
              value={(value as string) || ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder || ""}
              className={`${inputClasses} ${error ? "border-red-400" : ""} !pr-12`}
              disabled={disabled}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-(--maincolor) focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="size-5" />
              ) : (
                <Eye className="size-5" />
              )}
            </button>
          </div>
          {errorDisplay}
        </div>
      );
    case "auth_login_actions":
      return (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() => onAuthAction?.("login")}
            disabled={authLoading}
            className="w-full sm:w-auto min-w-[140px] h-12 px-10 bg-(--btncolor) text-white rounded-md text-base font-bold flex items-center justify-center gap-2 hover:bg-(--btncolor)/95 transition-all shadow-sm cursor-pointer active:scale-95"
          >
            {authLoading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              "Login"
            )}
          </button>
        </div>
      );
    case "auth_register_actions":
      return (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => onAuthAction?.("register")}
            disabled={authLoading}
            className="w-full h-12 bg-(--btncolor) text-white rounded-md text-base font-bold flex items-center justify-center gap-2"
          >
            {authLoading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              "Register & Continue"
            )}
          </button>
        </div>
      );
    case "text":
      return (
        <div className="w-full">
          <label htmlFor={field.id} className="ghc-label mb-2 block">
            {field.label}{" "}
            {field.required && <span className="text-red-500">*</span>}
          </label>
          <input
            id={field.id}
            type={field.type}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ""}
            className={`${inputClasses} ${error ? "border-red-400" : ""}`}
            disabled={disabled}
          />
          {field.description && (
            <p className="text-slate-500 text-[12px] mt-1.5 leading-relaxed">
              {field.description}
            </p>
          )}
          {errorDisplay}
        </div>
      );
    case "phone":
      return (
        <div className="w-full">
          <label htmlFor={field.id} className="ghc-label mb-2 block">
            {field.label}{" "}
            {field.required && <span className="text-red-500">*</span>}
          </label>
          <div
            className={`phone-input-container ${error ? "phone-input-error" : ""}`}
          >
            <GhcPhoneInput
              placeholder={field.placeholder || "Enter phone number"}
              value={getSafePhoneValue(value)}
              onChange={(val) => onChange(val || "")}
              disabled={disabled}
            />
          </div>
          {field.description && (
            <p className="text-slate-500 text-[12px] mt-1.5 leading-relaxed">
              {field.description}
            </p>
          )}
          {errorDisplay}
        </div>
      );
    case "date":
      const dateLabel = field.label.toLowerCase();
      const isChildOrDueDate =
        dateLabel.includes("due date") ||
        dateLabel.includes("estimated child birth");
      const isDOBField =
        !isChildOrDueDate &&
        (dateLabel.includes("date of birth") ||
          dateLabel === "dob" ||
          dateLabel.includes(" dob") ||
          dateLabel.includes("birth date") ||
          dateLabel.includes("birth"));
      const isStartDateField = dateLabel.includes("start date");
      const isEndDateField = dateLabel.includes("end date");
      const isLastWorkedDateField =
        dateLabel.includes("date you last worked") ||
        dateLabel.includes("last worked date") ||
        dateLabel.includes("last day worked");

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let minDate: string | undefined;
      let maxDate: string | undefined;

      if (isDOBField) {
        maxDate = toLocalDateIso(today);
      } else if (isLastWorkedDateField) {
        maxDate = toLocalDateIso(today);
      } else if (isStartDateField) {
        const { min, max } = getSickCertStartDateBounds(today);
        minDate = toLocalDateIso(min);
        maxDate = toLocalDateIso(max);
      } else if (isEndDateField) {
        const startField = allFieldsInStep.find((f) =>
          f.label.toLowerCase().includes("start date"),
        );
        const startVal = startField ? formData[startField.id] : null;

        if (!startVal) {
          minDate = undefined;
          maxDate = undefined;
        } else {
          const bounds = getSickCertEndDateBounds(startVal as string);
          if (!bounds) {
            minDate = undefined;
            maxDate = undefined;
          } else {
            minDate = toLocalDateIso(bounds.min);
            maxDate = toLocalDateIso(bounds.max);
          }
        }
      }

      // Calculation for the duration warning logic removed from here
      // and moved to parent row level for full width alignment

      return (
        <div className="w-full">
          <label htmlFor={field.id} className="ghc-label mb-2 block">
            {field.label}{" "}
            {field.required && <span className="text-red-500">*</span>}
          </label>
          <CustomDatePicker
            id={field.id}
            value={(value as string) || ""}
            onChange={(val) => onChange(val)}
            placeholder={field.placeholder || "dd/mm/yyyy"}
            disabled={disabled || (isEndDateField && !minDate)}
            error={error}
            minDate={minDate}
            maxDate={maxDate}
          />
          {field.description &&
            !/dd|mm|yyyy|slash/i.test(field.description) && (
              <p className="text-slate-500 text-[12px] mt-1.5 leading-relaxed">
                {field.description}
              </p>
            )}
          {renderOtherInput()}
          {errorDisplay}
        </div>
      );
    case "select":
      if (isPharmacySelect) {
        const pharmacyFieldKey = `${field.id}:${typeof value === "string" ? value : ""}`;
        return (
          <PharmacySelectField
            key={pharmacyFieldKey}
            field={field}
            value={value}
            error={error}
            disabled={disabled}
            onChange={onChange}
          />
        );
      }
      return (
        <div className="w-full pb-2 relative">
          <label htmlFor={field.id} className="ghc-label">
            {field.label}{" "}
            {field.required && <span className="text-red-500">*</span>}
          </label>
          <select
            id={field.id}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            className={`appearance-none rounded-md block w-full h-12 px-4 py-2 border border-(--maincolor) bg-white text-sm text-(--maincolor) ${error ? "border-red-400" : ""}`}
            disabled={disabled}
          >
            <option value="" className="text-gray-400">
              {field.placeholder || "Select..."}
            </option>
            {field.choices?.map((c) => (
              <option
                key={c.value}
                value={c.value}
                className="text-(--maincolor)"
              >
                {c.label}
              </option>
            ))}
          </select>
          {renderOtherInput()}
          {errorDisplay}
        </div>
      );
    case "radio": {
      const isVariation = field.label.toLowerCase().includes("variation");
      const hasImages = field.choices?.some((c) => c.image);

      return (
        <fieldset
          className={`${isVariation || hasImages ? "bg-transparent" : "bg-[#E7E9ED] border border-gray-200 rounded-md p-4"}`}
        >
          <div className="text-(--maincolor) text-sm font-semibold block mb-3">
            {field.label}{" "}
            {field.required && <span className="text-red-500">*</span>}
          </div>
          <div
            className={`${isVariation || hasImages ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "flex flex-wrap gap-4"}`}
          >
            {field.choices?.map((c) => {
              const isSelected = value === c.value;
              if (isVariation || c.image) {
                return (
                  <div
                    key={c.value}
                    onClick={() => !disabled && onChange(c.value)}
                    className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center gap-3 transition-all duration-300 ${isSelected ? "bg-(--maincolor)/5 border-(--maincolor) shadow-sm" : "bg-white border-gray-100 hover:border-gray-200"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {c.image && (
                      <div className="w-full aspect-video rounded-lg overflow-hidden bg-gray-50 mb-1">
                        <Image
                          src={c.image}
                          alt={c.label}
                          width={300}
                          height={168}
                          className="size-full object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <div
                        className={`size-4 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-(--maincolor)" : "border-gray-300"}`}
                      >
                        {isSelected && (
                          <div className="size-2 rounded-full bg-(--maincolor)" />
                        )}
                      </div>
                      <span className="text-sm font-bold text-(--maincolor)">
                        {c.label}
                      </span>
                    </div>
                  </div>
                );
              }
              return (
                <div key={c.value} className="inline-flex items-start">
                  <input
                    id={`${field.id}_${c.value}`}
                    type="radio"
                    name={field.id}
                    value={c.value}
                    checked={isSelected}
                    onChange={() => onChange(c.value)}
                    className={`${radioClasses} mt-0.5`}
                    disabled={disabled}
                  />
                  <label
                    htmlFor={`${field.id}_${c.value}`}
                    className="text-sm ms-2 cursor-pointer text-(--maincolor) font-medium leading-normal"
                  >
                    {c.label}
                  </label>
                </div>
              );
            })}
          </div>
          {renderOtherInput()}
          {errorDisplay}
        </fieldset>
      );
    }
    case "matrix": {
      const matrixRows = normalizeMatrixOptions(field.rows);
      const matrixColumns = normalizeMatrixOptions(field.columns);
      const matrixValue =
        value && typeof value === "object" && !Array.isArray(value)
          ? (value as Record<string, string>)
          : {};

      return (
        <fieldset className="w-full">
          <div className="ghc-label mb-2 block">
            {field.label}{" "}
            {field.required && <span className="text-red-500">*</span>}
          </div>
          {field.description && (
            <p className="text-slate-500 text-[12px] mb-3 leading-relaxed">
              {field.description}
            </p>
          )}
          <div className="bg-[#E7E9ED] border border-gray-200 rounded-md overflow-hidden">
            {/* Desktop/Tablet layout aligned with existing table rhythm */}
            <div className="hidden md:block w-full">
              <table className="w-full border-collapse table-fixed">
                <thead>
                  <tr className="bg-[#eef3ef]">
                    <th className="text-left text-(--maincolor) text-[15px] font-semibold px-6 py-3 border-b border-gray-200 w-[68%]">
                      &nbsp;
                    </th>
                    {matrixColumns.map((column) => (
                      <th
                        key={column.value}
                        className="text-center text-(--maincolor) text-[15px] font-semibold px-3 py-3 border-b border-gray-200"
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrixRows.map((row, rowIndex) => (
                    <tr
                      key={row.value}
                      className={
                        rowIndex % 2 === 0 ? "bg-white" : "bg-[#fbfcfb]"
                      }
                    >
                      <td className="px-6 py-3 text-(--maincolor) text-[16px] font-medium border-b border-gray-200 leading-snug">
                        {row.label}
                      </td>
                      {matrixColumns.map((column) => {
                        const isSelected =
                          matrixValue[row.value] === column.value;
                        return (
                          <td
                            key={`${row.value}_${column.value}`}
                            className="px-3 py-2 text-center border-b border-gray-200"
                          >
                            <input
                              id={`${field.id}_${row.value}_${column.value}`}
                              type="radio"
                              name={`${field.id}_${row.value}`}
                              checked={isSelected}
                              onChange={() => {
                                if (disabled) return;
                                onChange({
                                  ...matrixValue,
                                  [row.value]: column.value,
                                });
                              }}
                              className={`${radioClasses} size-4`}
                              disabled={disabled}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile layout */}
            <div className="md:hidden p-3 space-y-2.5">
              {matrixRows.map((row) => (
                <div
                  key={row.value}
                  className="bg-white border border-gray-200 rounded-md p-3"
                >
                  <p className="text-(--maincolor) text-[14px] font-semibold mb-2.5 leading-snug">
                    {row.label}
                  </p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {matrixColumns.map((column) => {
                      const isSelected =
                        matrixValue[row.value] === column.value;
                      return (
                        <label
                          key={`${row.value}_${column.value}_mobile`}
                          htmlFor={`${field.id}_${row.value}_${column.value}_mobile`}
                          className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[13px] transition-colors ${
                            isSelected
                              ? "bg-[#E7E9ED] border-(--maincolor) text-(--maincolor) font-semibold"
                              : "bg-white border-gray-200 text-(--maincolor)"
                          } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <input
                            id={`${field.id}_${row.value}_${column.value}_mobile`}
                            type="radio"
                            name={`${field.id}_${row.value}_mobile`}
                            checked={isSelected}
                            onChange={() => {
                              if (disabled) return;
                              onChange({
                                ...matrixValue,
                                [row.value]: column.value,
                              });
                            }}
                            className={`${radioClasses} size-4`}
                            disabled={disabled}
                          />
                          <span>{column.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {errorDisplay}
        </fieldset>
      );
    }
    case "pricing": {
      return (
        <fieldset className="bg-transparent">
          <div className="text-(--maincolor) text-sm font-semibold block mb-3">
            {field.label}{" "}
            {field.required && <span className="text-red-500">*</span>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {field.pricingOptions?.map((option) => {
              const isSelected = value === option.key;
              const effectiveAmount = getEffectivePricingAmount(option);
              const originalAmount = parsePricingAmount(option.price);
              const discountBadge = getPricingDiscountBadge(option);
              const showOriginalPrice =
                discountBadge !== null &&
                originalAmount !== null &&
                originalAmount > effectiveAmount;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => !disabled && onChange(option.key)}
                  className={`relative text-left rounded-xl border-2 p-4 transition-all duration-300 ${
                    isSelected
                      ? "bg-(--maincolor)/5 border-(--maincolor) shadow-sm"
                      : "bg-white border-gray-100 hover:border-gray-200"
                  } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  disabled={disabled}
                >
                  {discountBadge && (
                    <PricingDiscountBadge label={discountBadge} />
                  )}
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-(--maincolor) min-w-0">
                      {option.title}
                    </p>
                    <div className="text-right">
                      {showOriginalPrice && (
                        <p className="text-gray-400 text-xs line-through mb-0.5">
                          €{originalAmount.toFixed(2)}
                        </p>
                      )}
                      <p className="text-lg font-bold text-(--maincolor)">
                        €{effectiveAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {field.description && (
            <p className="text-slate-500 text-[12px] mt-2 leading-relaxed">
              {field.description}
            </p>
          )}
          {errorDisplay}
        </fieldset>
      );
    }
    case "textarea":
      const textAreaRows = typeof field.rows === "number" ? field.rows : 4;
      return (
        <div className="w-full">
          <label htmlFor={field.id} className="ghc-label">
            {field.label}{" "}
            {field.required && <span className="text-red-500">*</span>}
          </label>
          <textarea
            id={field.id}
            rows={textAreaRows}
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ""}
            className={`${inputClasses} !h-auto resize-y`}
            disabled={disabled}
          />
          {errorDisplay}
        </div>
      );
    case "checkbox":
      const isSingle = !field.choices || field.choices.length === 0;
      return (
        <div
          className={`${isSingle ? "" : "bg-[#E7E9ED] border border-gray-200 rounded-md p-4"}`}
        >
          {!isSingle && (
            <div className="text-(--maincolor) text-sm font-semibold block mb-3">
              {field.label}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </div>
          )}
          <div className="flex flex-wrap gap-4">
            {isSingle ? (
              <div
                className="flex items-center gap-3 p-4 bg-[#E7E9ED] border border-gray-200 rounded-md w-full hover:bg-[#EDF7F1]/80 transition-all cursor-pointer group"
                onClick={() => !disabled && onChange(!value)}
              >
                <input
                  id={field.id}
                  type="checkbox"
                  checked={!!value}
                  onChange={(e) => onChange(e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="appearance-none size-5 border border-(--maincolor) rounded checked:bg-(--maincolor) cursor-pointer shrink-0 transition-all group-hover:scale-105"
                  disabled={disabled}
                />
                <label
                  htmlFor={field.id}
                  className="text-sm cursor-pointer text-(--maincolor) font-bold leading-normal select-none"
                >
                  {field.label}{" "}
                  {field.required && <span className="text-red-500">*</span>}
                </label>
              </div>
            ) : (
              field.choices?.map((c) => {
                const isChecked =
                  Array.isArray(value) && value.includes(c.value);
                return (
                  <div key={c.value} className="inline-flex items-start">
                    <input
                      id={`${field.id}_${c.value}`}
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        const currentVal = Array.isArray(value) ? value : [];
                        const newVal = isChecked
                          ? currentVal.filter((v) =>
                              field.id === "minor_illness"
                                ? v !== c.label
                                : v !== c.value,
                            )
                          : [
                              ...currentVal,
                              field.id === "minor_illness" ? c.label : c.value,
                            ];
                        onChange(newVal);
                      }}
                      className="appearance-none size-5 border border-(--maincolor) rounded checked:bg-(--maincolor) cursor-pointer shrink-0 mt-0.5"
                      disabled={disabled}
                    />
                    <label
                      htmlFor={`${field.id}_${c.value}`}
                      className="text-sm ms-2 cursor-pointer text-(--maincolor) font-medium leading-normal"
                    >
                      {c.label}
                    </label>
                  </div>
                );
              })
            )}
          </div>
          {renderOtherInput()}
          {errorDisplay}
        </div>
      );
    case "consent": {
      const consentLabel = field.consentText || field.label;
      return (
        <div className="w-full bg-[#E7E9ED] border border-gray-200 rounded-md p-4">
          <label
            htmlFor={field.id}
            className="flex items-start gap-3 cursor-pointer select-none"
          >
            <input
              id={field.id}
              type="checkbox"
              checked={value === true}
              onChange={(e) => onChange(e.target.checked)}
              className="appearance-none mt-0.5 size-5 border border-(--maincolor) rounded checked:bg-(--maincolor) cursor-pointer shrink-0"
              disabled={disabled}
            />
            <span className="text-sm text-(--maincolor) font-medium leading-normal">
              {consentLabel} <span className="text-red-500">*</span>
            </span>
          </label>
          {field.description && (
            <p className="text-slate-500 text-[12px] mt-1.5 leading-relaxed">
              {field.description}
            </p>
          )}
          {errorDisplay}
        </div>
      );
    }
    case "appointment": {
      const apptValue = value as
        | { doctorId?: string; date?: string; time?: string; clinicId?: number }
        | undefined;

      return (
        <div className="w-full space-y-6">
          <label className="text-(--maincolor) text-sm font-semibold block uppercase tracking-wider opacity-70">
            {field.label}{" "}
            {field.required && <span className="text-red-500">*</span>}
          </label>

          <div className="space-y-4">
            {doctorList.length === 0 ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-full h-48 rounded-2xl bg-gray-50 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {doctorList.map((doc, dIdx) => {
                  const docId = String(doc.doctor_id);
                  const isSelected = String(apptValue?.doctorId) === docId;
                  // Mock experience if not provided
                  const mockExp = [8, 12, 15, 10][dIdx % 4];
                  const doctorName = doc.name || doc.doctor_name || "Doctor";
                  const doctorImage = doc.avatar || doc.doctor_picture || null;
                  const doctorDegree = doc.medical_degree || doc.degree || null;
                  const doctorSpeciality =
                    doc.area_of_expertise || doc.speciality || "";
                  const doctorExperience =
                    doc.year_of_experience || doc.exp_years || mockExp;
                  const doctorRegistration =
                    doc.medical_council_registration_number ||
                    doc.registration_number ||
                    null;
                  const doctorLanguages = doc.languages_spoken || null;

                  const bookingDelay = doc.booking_delay ?? 0;
                  const docAvailableDates = doctorAvailabilities.filter(
                    (group) => {
                      const doctorInGroup = group.availabilities.find(
                        (a) => String(a.doctor_id) === docId,
                      );
                      if (!doctorInGroup?.slots.length) return false;
                      return (
                        filterBookableSlots(
                          doctorInGroup.slots,
                          group.date,
                          bookingDelay,
                        ).length > 0
                      );
                    },
                  );

                  return (
                    <div
                      key={docId}
                      className={`bg-white rounded-2xl border transition-all duration-500 
                                                ${
                                                  isSelected
                                                    ? "border-(--btncolor)/40 shadow-md translate-y-[-2px]"
                                                    : "border-gray-100 hover:border-gray-200"
                                                }`}
                    >
                      {/* Doctor Info Header - Clickable */}
                      <div
                        onClick={() => {
                          if (isSelected) {
                            onChange({
                              ...apptValue,
                              doctorId: undefined,
                              date: undefined,
                              time: undefined,
                              clinicId: undefined,
                            });
                          } else {
                            onChange({
                              ...apptValue,
                              doctorId: docId,
                              date: undefined,
                              time: undefined,
                              clinicId: undefined,
                            });
                          }
                        }}
                        className="p-5 flex items-center gap-5 cursor-pointer group"
                      >
                        {/* Avatar */}
                        <div
                          className={`size-20 rounded-2xl overflow-hidden border-2 transition-all duration-300 ${isSelected ? "border-(--btncolor)/20" : "border-gray-50"}`}
                        >
                          {doctorImage ? (
                            <Image
                              src={doctorImage}
                              alt={doctorName}
                              width={80}
                              height={80}
                              className="size-full object-cover group-hover:scale-110 transition-transform duration-500"
                              unoptimized
                            />
                          ) : (
                            <div className="size-full flex items-center justify-center bg-gray-50">
                              <User className="size-8 text-gray-200" />
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-lg font-bold text-gray-900 truncate">
                              {doctorName}
                            </h4>
                            <div
                              className={`size-6 rounded-full flex items-center justify-center border transition-all ${isSelected ? "bg-(--btncolor) border-(--btncolor) text-white" : "border-gray-200 text-gray-300"}`}
                            >
                              {isSelected ? (
                                <X className="size-3.5" />
                              ) : (
                                <ChevronRight className="size-4" />
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                            {doctorDegree && (
                              <span className="text-xs font-bold text-(--btncolor) uppercase tracking-wide">
                                {doctorDegree}
                              </span>
                            )}
                            <span className="text-[11px] font-bold py-0.5 px-2 bg-gray-100 text-gray-500 rounded-full">
                              {doctorExperience}+ Yrs Exp
                            </span>
                            {doctorRegistration && (
                              <span className="text-[11px] font-bold py-0.5 px-2 bg-slate-100 text-slate-600 rounded-full">
                                Reg: {doctorRegistration}
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-gray-500 mt-1.5 font-medium line-clamp-1">
                            {doctorSpeciality}
                          </p>
                          {doctorLanguages && (
                            <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                              Languages: {doctorLanguages}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Expanded Panel - Slots */}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden bg-[#F9FBFA] border-t border-gray-100"
                          >
                            <div className="p-5 space-y-6">
                              {/* Dates */}
                              <div className="space-y-3">
                                <h5 className="text-xs font-semibold text-gray-500">
                                  1. Choose a Date
                                </h5>
                                <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
                                  {docAvailableDates.map((group) => {
                                    const isDateSelected =
                                      apptValue?.date === group.date;
                                    const d = new Date(group.date);
                                    const dateNum = d.getDate();
                                    const monthName = d.toLocaleDateString(
                                      "en-US",
                                      { month: "short" },
                                    );
                                    const dayName = d.toLocaleDateString(
                                      "en-US",
                                      { weekday: "short" },
                                    );

                                    return (
                                      <button
                                        key={group.date}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onChange({
                                            ...apptValue,
                                            date: group.date,
                                            time: undefined,
                                            clinicId: undefined,
                                          });
                                        }}
                                        className={`flex-shrink-0 w-16 h-18 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center
                                                                                    ${
                                                                                      isDateSelected
                                                                                        ? "bg-(--btncolor) border-(--btncolor) text-white shadow-sm scale-105"
                                                                                        : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
                                                                                    }`}
                                      >
                                        <span
                                          className={`text-[10px] font-bold uppercase ${isDateSelected ? "text-white/80" : "text-gray-400"}`}
                                        >
                                          {dayName}
                                        </span>
                                        <span
                                          className={`text-base font-black ${isDateSelected ? "text-white" : "text-gray-800"}`}
                                        >
                                          {dateNum}
                                        </span>
                                        <span
                                          className={`text-[9px] font-bold ${isDateSelected ? "text-white/60" : "text-(--btncolor)"}`}
                                        >
                                          {monthName}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Times */}
                              {apptValue?.date && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="space-y-3"
                                >
                                  <div className="flex items-center justify-between">
                                    <h5 className="text-xs font-semibold text-gray-500">
                                      2. Select Time
                                    </h5>
                                    <div className="text-[10px] font-bold text-(--btncolor) bg-(--blockground) px-2 py-0.5 rounded-full">
                                      {apptValue.date}
                                    </div>
                                  </div>
                                  <AppointmentTimeSlots
                                    availabilities={doctorAvailabilities}
                                    selectedDoctorId={docId}
                                    selectedDate={apptValue.date}
                                    selectedTime={apptValue.time}
                                    selectedClinicId={apptValue.clinicId}
                                    bookingDelay={bookingDelay}
                                    onTimeSelect={(time, clinicId) =>
                                      onChange({ ...apptValue, time, clinicId })
                                    }
                                    disabled={disabled}
                                  />
                                </motion.div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cost summary at the bottom if anything selected */}
          {apptValue?.doctorId && apptValue?.date && apptValue?.time && (
            <div className="mt-8 p-6 bg-(--maincolor) rounded-3xl text-white flex items-center justify-between shadow-xl animate-in fade-in zoom-in duration-300">
              <div>
                <p className="text-white/70 text-xs font-bold uppercase tracking-wider">
                  Estimated Cost
                </p>
                <p className="text-2xl font-bold">€{field.cost?.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-xs font-semibold">
                  Appointment with
                </p>
                <p className="font-bold">
                  {
                    doctorList.find(
                      (d) => String(d.doctor_id) === String(apptValue.doctorId),
                    )?.name
                  }
                </p>
              </div>
            </div>
          )}

          {errorDisplay}
        </div>
      );
    }
    case "file":
      return (
        <div className="w-full relative">
          <label htmlFor={field.id} className="ghc-label">
            {field.label}{" "}
            {field.required && <span className="text-red-500">*</span>}
          </label>
          <div
            onClick={() =>
              !disabled && document.getElementById(`file_${field.id}`)?.click()
            }
            className={`group cursor-pointer w-full px-4 py-3 bg-white border border-(--maincolor) rounded-md outline-none hover:bg-[#E7E9ED] transition-all flex items-center justify-between ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${error ? "border-red-400" : ""}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#E7E9ED] border border-(--maincolor)/20 flex items-center justify-center group-hover:bg-(--maincolor)/5 transition-colors">
                <Upload className="h-4 w-4 text-(--maincolor)" />
              </div>
              <div className="flex flex-col">
                <span
                  className={`text-sm font-medium ${value ? "text-(--maincolor)" : "text-gray-400"}`}
                >
                  {value instanceof File
                    ? value.name
                    : uploadedFileName ||
                      (typeof value === "string" && value
                        ? "Document Selected"
                        : field.placeholder || "Select a document...")}
                </span>
                {field.description && (
                  <span className="text-[11px] text-[#585e6a]/70 font-medium">
                    {field.description}
                  </span>
                )}
              </div>
            </div>
            {value && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setUploadedFileName("");
                  onChange(undefined);
                }}
                className="p-1.5 hover:bg-red-50 rounded-full text-red-500 transition-colors"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <input
            id={`file_${field.id}`}
            type="file"
            className="hidden"
            accept={isIdProofField(field) ? ".pdf,.jpg,.jpeg,.png" : undefined}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                const idProof = isIdProofField(field);
                if (!isFileWithinUploadLimit(file.size)) {
                  toast.error(
                    idProof
                      ? getIdProofTooLargeMessage()
                      : getFileTooLargeMessage(),
                  );
                  return;
                }
                if (idProof) {
                  const allowedTypes = [
                    "application/pdf",
                    "image/jpeg",
                    "image/jpg",
                    "image/png",
                  ];
                  if (!allowedTypes.includes(file.type)) {
                    toast.error(
                      "Invalid file format. Please upload PDF, JPG, or PNG.",
                    );
                    return;
                  }
                  try {
                    onIdProofUploadPendingChange?.(true);
                    const prepared = await prepareIdProofFileForUpload(file);
                    const token = await api.post(
                      API_ENDPOINTS.ID_PROOF_UPLOAD,
                      (() => {
                        const form = new FormData();
                        form.append("file", prepared, prepared.name);
                        return form;
                      })(),
                      { headers: { "Content-Type": "multipart/form-data" } },
                    );
                    const body = token?.data as
                      | {
                          file_ref?: string;
                          path?: string;
                          data?: { file_ref?: string; path?: string };
                        }
                      | undefined;
                    const ref =
                      body?.file_ref ||
                      body?.path ||
                      body?.data?.file_ref ||
                      body?.data?.path;
                    if (!ref) {
                      throw new Error("No file reference returned");
                    }
                    setUploadedFileName(prepared.name || file.name);
                    onChange(ref);
                  } catch (err) {
                    console.error("ID proof pre-upload failed", err);
                    toast.error(
                      "Failed to upload ID document. Please try again.",
                    );
                  } finally {
                    onIdProofUploadPendingChange?.(false);
                  }
                  return;
                }
                onChange(file);
              }
            }}
            disabled={disabled}
          />
          {errorDisplay}
        </div>
      );
    default:
      return null;
  }
}

function AppointmentTimeSlots({
  availabilities,
  selectedDoctorId,
  selectedDate,
  selectedTime,
  selectedClinicId,
  bookingDelay = 0,
  onTimeSelect,
  disabled,
}: {
  availabilities: AvailabilityDateGroup[];
  selectedDoctorId?: string;
  selectedDate?: string;
  selectedTime?: string;
  selectedClinicId?: number;
  bookingDelay?: number;
  onTimeSelect: (time: string, clinicId: number) => void;
  disabled?: boolean;
}) {
  const [period, setPeriod] = useState<"morning" | "afternoon" | "evening">(
    "morning",
  );
  const periods = [
    { id: "morning", label: "Morning" },
    { id: "afternoon", label: "Afternoon" },
    { id: "evening", label: "Evening" },
  ] as const;

  if (!selectedDoctorId || !selectedDate) {
    return (
      <div className="py-8 text-center text-gray-400 font-medium bg-gray-50 rounded-lg border border-dashed border-gray-200">
        Please select a doctor and date first
      </div>
    );
  }

  // Find the date group, then the doctor inside it
  const dateGroup = availabilities.find((g) => g.date === selectedDate);
  const doctorInGroup = dateGroup?.availabilities.find(
    (d) => String(d.doctor_id) === String(selectedDoctorId),
  );
  const allSlots: AvailabilitySlot[] = doctorInGroup?.slots ?? [];
  const bookableSlots = filterBookableSlots(
    allSlots,
    selectedDate,
    bookingDelay,
  );

  const periodSlots = bookableSlots.filter((slot) => {
    const hour = parseInt(slot.time.split(":")[0]);
    if (period === "morning") return hour < 12;
    if (period === "afternoon") return hour >= 12 && hour < 17;
    return hour >= 17; // evening
  });

  return (
    <div className="flex flex-col sm:flex-row gap-6">
      <div className="flex flex-row sm:flex-col gap-2 sm:gap-3 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 sm:w-36 shrink-0">
        {periods.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={disabled}
            onClick={() => setPeriod(p.id)}
            className={`px-4 py-3 rounded-lg text-sm font-bold transition-all border text-center ${period === p.id ? "bg-[#0C203B] text-white border-[#0C203B]" : "bg-white text-[#0C203B] border-gray-200 hover:border-[#0C203B]/30"}`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-3">
        {periodSlots.length > 0 ? (
          periodSlots.map((slot, idx) => {
            const isSelected =
              selectedTime === slot.time && selectedClinicId === slot.clinic_id;
            return (
              <button
                key={`${slot.time}-${slot.clinic_id}-${idx}`}
                type="button"
                disabled={disabled}
                onClick={() => onTimeSelect(slot.time, slot.clinic_id)}
                className={`py-3 px-2 rounded-lg text-sm font-bold transition-all border text-center 
                                ${
                                  isSelected
                                    ? "bg-(--btncolor) text-white border-(--btncolor)"
                                    : "bg-white text-[#0C203B] border-gray-200 hover:border-(--btncolor)"
                                }`}
              >
                {slot.time}
              </button>
            );
          })
        ) : (
          <div className="col-span-full py-8 text-center text-gray-400 font-medium bg-gray-50 rounded-lg border border-dashed border-gray-200">
            No slots available for this period
          </div>
        )}
      </div>
    </div>
  );
}
