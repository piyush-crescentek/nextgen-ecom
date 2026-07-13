export const PERMISSIONS = {
  // Staff Management
  LIST_STAFF: 'list.organization-staff',
  VIEW_STAFF: 'view.organization-staff',
  CREATE_STAFF: 'create.organization-staff',
  EDIT_STAFF: 'edit.organization-staff',
  DELETE_STAFF: 'delete.organization-staff',

  // Organization Wallet
  VIEW_ORG_WALLET: 'view.organization-wallet',
  USE_ORG_WALLET: 'use.organization-wallet',

  // Staff Wallet
  VIEW_STAFF_WALLET: 'view.staff-wallet',
  TOPUP_STAFF_WALLET: 'topup.staff-wallet',
  USE_STAFF_WALLET: 'use.staff-wallet',

  // Other
  VERIFY_CERTIFICATES: 'verify.certificates',

  // Orders Management
  MANAGE_ORG_ORDERS: 'view.organization-orders',
} as const;

export const PERMISSION_GROUPS = [
  {
    title: "Organization Staff Management",
    permissions: [
      { id: PERMISSIONS.LIST_STAFF, label: "List Staff", desc: "List all organization staff members" },
      { id: PERMISSIONS.VIEW_STAFF, label: "View Staff", desc: "View individual staff member details" },
      { id: PERMISSIONS.CREATE_STAFF, label: "Invite Staff", desc: "Create/invite new staff members" },
      { id: PERMISSIONS.EDIT_STAFF, label: "Edit Staff & Access", desc: "Edit staff member details and access" },
      { id: PERMISSIONS.DELETE_STAFF, label: "Remove Staff", desc: "Remove staff members from organization" },
    ]
  },
  {
    title: "Organization Wallet",
    permissions: [
      { id: PERMISSIONS.VIEW_ORG_WALLET, label: "View Org Wallet", desc: "View organization wallet balance and transactions" },
      { id: PERMISSIONS.USE_ORG_WALLET, label: "Add Org Funds", desc: "Add funds to organization wallet (Stripe/Bank Transfer)" },
    ]
  },
  {
    title: "Staff Wallet",
    permissions: [
      { id: PERMISSIONS.TOPUP_STAFF_WALLET, label: "Top-up enable", desc: "Top up staff member's individual wallet credit" },
    ]
  },
  {
    title: "Orders Management",
    permissions: [
      { id: PERMISSIONS.MANAGE_ORG_ORDERS, label: "Manage Org Orders", desc: "View and manage organization-wide orders and staff appointments" },
    ]
  }
];

export const SHORT_PERMISSION_LABELS: Record<string, string> = {
  [PERMISSIONS.LIST_STAFF]: 'Staff List',
  [PERMISSIONS.VIEW_STAFF]: 'View Details',
  [PERMISSIONS.CREATE_STAFF]: 'Invite',
  [PERMISSIONS.EDIT_STAFF]: 'Edit',
  [PERMISSIONS.DELETE_STAFF]: 'Remove',
  [PERMISSIONS.VIEW_ORG_WALLET]: 'Wallet View',
  [PERMISSIONS.USE_ORG_WALLET]: 'Add Funds',
  [PERMISSIONS.VIEW_STAFF_WALLET]: 'Staff Bal',
  [PERMISSIONS.TOPUP_STAFF_WALLET]: 'Top-up enable',
  [PERMISSIONS.USE_STAFF_WALLET]: 'Spend Credit',
  [PERMISSIONS.VERIFY_CERTIFICATES]: 'Certificates',
  [PERMISSIONS.MANAGE_ORG_ORDERS]: 'Manage Org Orders',
};

export type PermissionType = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  'Organization Owner': [
    PERMISSIONS.LIST_STAFF,
    PERMISSIONS.VIEW_STAFF,
    PERMISSIONS.CREATE_STAFF,
    PERMISSIONS.EDIT_STAFF,
    PERMISSIONS.DELETE_STAFF,
    PERMISSIONS.VIEW_ORG_WALLET,
    PERMISSIONS.USE_ORG_WALLET,
    PERMISSIONS.TOPUP_STAFF_WALLET,
    PERMISSIONS.MANAGE_ORG_ORDERS,
  ],
  'Organization Staff': [],
  'Customer': [],
};

import { Customer } from "@/store/useAuthStore";
import {
  LayoutDashboard,
  ShoppingBag,
  User,
  Wallet,
  CheckCircle,
  Users,
  History,
  Briefcase
} from "lucide-react";

import { isPaymentMethodAllowed } from "./visibility";

export interface MenuItem {
  label: string;
  href: string;
  icon: React.ElementType;
  requiredPermission?: string;
}

export const PROFILE_MENU_ITEMS: MenuItem[] = [
  {
    label: "Dashboard",
    href: "/profile/dashboard",
    icon: LayoutDashboard
  },
  {
    label: "Orders & Appointments",
    href: "/profile/orders",
    icon: ShoppingBag
  },
  {
    label: "Account Details",
    href: "/profile/details",
    icon: User
  },
  {
    label: "Wallet Management",
    href: "/profile/wallet",
    icon: Wallet,
    requiredPermission: PERMISSIONS.VIEW_ORG_WALLET
  },
  {
    label: "Transactions",
    href: "/profile/transactions",
    icon: History
  }
];

export const getFilteredMenuItems = (permissions: string[] | undefined, customerType?: number, employerType?: number, businessGroup?: Customer['business_group']) => {
  let items = PROFILE_MENU_ITEMS;

    // Filter based on permissions
  items = items.filter(item => {
    // Transactions are always visible — independent of wallet payment permissions
    if (item.label === "Transactions") return true;

    // Wallet Management visibility: only if wallet balance payment is allowed
    if (item.label === "Wallet Management") {
      const isWalletAllowed = isPaymentMethodAllowed('Wallet Balance', businessGroup);
      if (!isWalletAllowed) return false;

      if (customerType === 1) return true; // Regular customers always see wallet
      // Type 2 customers with employer_type 3 (Organization for Occasional use) see wallet like normal customers
      if (customerType === 2 && employerType === 3) return true;
      return permissions?.includes(PERMISSIONS.VIEW_ORG_WALLET) ||
        permissions?.includes(PERMISSIONS.TOPUP_STAFF_WALLET) || false;
    }

    // Business Group visibility: only if business group exists AND customer type is 2
    if (item.label === "Business Group") {
      return customerType === 2 && !!businessGroup;
    }

    if (!item.requiredPermission) return true;
    
    // Explicitly allow Verify Certificates for employer types 1 & 2 (Organization for cert / general org)
    if (item.label === "Verify Certificates" && (employerType === 1 || employerType === 2)) return true;

    return permissions?.includes(item.requiredPermission) || false;
  });


  // Ensure unique items by href
  const seenHrefs = new Set();
  return items.filter(item => {
    if (seenHrefs.has(item.href)) return false;
    seenHrefs.add(item.href);
    return true;
  });
};
