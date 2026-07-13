/**
 * Session keys used across product → form → checkout. Clear after a successful order
 * so the next consultation starts clean.
 */
import { getOhPriceSessionKey } from "@/lib/oh-prices";

export function clearConsultationSessionStorage(sessionId: string | null | undefined): void {
    if (typeof window === "undefined" || !sessionId) return;
    sessionStorage.removeItem(`physical_form_access_${sessionId}`);
    sessionStorage.removeItem(`form_access_${sessionId}`);
    sessionStorage.removeItem(`form_id_${sessionId}`);
    sessionStorage.removeItem(`oh_role_${sessionId}`);
    sessionStorage.removeItem(getOhPriceSessionKey(sessionId));
    sessionStorage.removeItem(`checkout_access_${sessionId}`);
    sessionStorage.removeItem(`billing_info_${sessionId}`);
    sessionStorage.removeItem(`delivery_notes_${sessionId}`);
}
