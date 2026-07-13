import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Cookies from 'js-cookie';

export interface BusinessGroup {
  id: number;
  increment_id: string;
  name: string;
  status: string;
  rules?: any[];
  organizations_count?: number | null;
  staff_count?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string | null;
  roles?: string[];
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  company?: string | null;
  account_status?: string;
  customer_type?: number;
  employer_type?: number;
  is_employer?: boolean;
  is_organization_owner?: boolean;
  wallet_balance?: string;
  created_at?: string;
  permissions?: string[];
  date_of_birth?: string | null;
  gender?: string | null;
  address?: {
    address: string | null;
    address_line2?: string | null;
    city: string | null;
    postcode: string | null;
    state: string | null;
    county: string | null;
    country: string | null;
  } | string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postcode?: string | null;
  country?: string | null;
  county?: string | null;
  increment_id?: string | null;
  orders_count?: number;
  parent_id?: number | null;
  organization?: {
    id: number;
    name: string;
    company: string;
    email: string;
  } | null;
  business_group?: BusinessGroup | null;
  stripe_payment_method_id?: string | null;
  volume_discount?: {
    organization_customer_id?: number;
    total_purchased_quantity?: number;
    billing_cycle?: string;
    cycle_start?: string;
    current_discount?: {
      category?: string;
      percentage?: number;
    };
    current_tier?: {
      min_quantity?: string | number;
      max_quantity?: string | number;
      discount_type?: string;
      discount_value?: string | number;
    };
  } | null;
}

interface LoginSuccessResponse {
  customer: Customer;
  token: string;
  message: string;
  wp_password_needs_to_change?: never;
}

interface AuthState {
  user: Customer | null;
  token: string | null;
  isAuthenticated: boolean;

  wpPasswordChangeRequired: boolean;
  wpEmail: string | null;
  wpMessage: string | null;

  userRoles: string[];
  userPermissions: string[];

  login: (credentials: { email: string; password?: string }) => Promise<LoginSuccessResponse>;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<Customer>) => Promise<{ customer: Customer; message: string }>;
  register: (data: { email: string; [key: string]: unknown }) => Promise<LoginSuccessResponse>;
  registerWP: (data: { email: string; [key: string]: unknown }) => Promise<LoginSuccessResponse>;
  verifyEmail: (token: string) => Promise<{ message: string }>;
  resendVerification: () => Promise<{ message: string }>;
  forgotPassword: (email: string) => Promise<{ message: string }>;
  resetPassword: (payload: { email?: string; [key: string]: unknown }) => Promise<LoginSuccessResponse>;
  logout: () => void;
  setWpPasswordChangeRequired: (required: boolean, email: string | null) => void;
}

const MOCK_TOKEN = 'mock-auth-token';

/**
 * Build a mock individual customer from an email address.
 * All auth is local for now — no backend calls are made.
 */
function buildMockCustomer(email: string): Customer {
  const namePart = email.split('@')[0] || 'Customer';
  const name = namePart.charAt(0).toUpperCase() + namePart.slice(1);
  return {
    id: 1,
    name,
    email,
    first_name: name,
    last_name: '',
    phone: null,
    account_status: 'active',
    // Individual customer only — business accounts are not supported.
    customer_type: 1,
    wallet_balance: '0.00',
    increment_id: 'CUST-0001',
    created_at: new Date().toISOString(),
    email_verified_at: new Date().toISOString(),
    roles: ['customer'],
    permissions: [],
    business_group: null,
    volume_discount: null,
  };
}

function mockLoginResponse(email: string): LoginSuccessResponse {
  return {
    customer: buildMockCustomer(email),
    token: MOCK_TOKEN,
    message: 'Logged in successfully',
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      wpPasswordChangeRequired: false,
      wpEmail: null,
      wpMessage: null,
      userRoles: ['customer'],
      userPermissions: [],

      // Local mock auth — accepts any credentials and signs in immediately.
      login: async ({ email }) => {
        const data = mockLoginResponse(email);
        Cookies.set('auth_token', data.token, { expires: 7 });
        set({
          user: data.customer,
          token: data.token,
          isAuthenticated: true,
          wpPasswordChangeRequired: false,
          wpEmail: null,
          wpMessage: null,
          userRoles: ['customer'],
          userPermissions: [],
        });
        return data;
      },

      register: async ({ email }) => {
        const data = mockLoginResponse(email);
        Cookies.set('auth_token', data.token, { expires: 7 });
        set({
          user: data.customer,
          token: data.token,
          isAuthenticated: true,
          wpPasswordChangeRequired: false,
          wpEmail: null,
          wpMessage: null,
          userRoles: ['customer'],
          userPermissions: [],
        });
        return { ...data, message: 'Account created successfully' };
      },

      registerWP: async (payload) => get().register(payload),

      fetchProfile: async () => {
        // Profile data lives in the persisted mock user — nothing to fetch.
      },

      updateProfile: async (payload) => {
        const current = get().user;
        const updated = { ...current, ...payload } as Customer;
        set({ user: updated });
        return { customer: updated, message: 'Profile updated successfully' };
      },

      verifyEmail: async () => ({ message: 'Email verified successfully' }),

      resendVerification: async () => ({ message: 'Verification email sent' }),

      forgotPassword: async () => ({
        message: 'If an account exists for this email, a reset link has been sent.',
      }),

      resetPassword: async (payload) => {
        const email = String(payload.email || get().user?.email || 'customer@example.com');
        const data = mockLoginResponse(email);
        Cookies.set('auth_token', data.token, { expires: 7 });
        set({
          user: data.customer,
          token: data.token,
          isAuthenticated: true,
          wpPasswordChangeRequired: false,
          wpEmail: null,
          wpMessage: null,
          userRoles: ['customer'],
          userPermissions: [],
        });
        return { ...data, message: 'Password set successfully' };
      },

      logout: () => {
        Cookies.remove('auth_token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          wpPasswordChangeRequired: false,
          wpEmail: null,
          wpMessage: null,
          userRoles: [],
          userPermissions: [],
        });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage');
          // Always land on the login page after logging out.
          window.location.href = '/my-account';
        }
      },

      setWpPasswordChangeRequired: (required, email) => {
        set({ wpPasswordChangeRequired: required, wpEmail: email });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        userRoles: state.userRoles,
        userPermissions: state.userPermissions,
      }),
    }
  )
);
