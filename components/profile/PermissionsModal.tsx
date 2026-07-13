"use client";

import React from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Check } from "lucide-react";

interface PermissionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    staffEmail?: string;
    selectedRole: string;
    onRoleChange: (role: string) => void;
    activePermissions: string[];
    onTogglePermission: (id: string) => void;
    isFullAccess: boolean;
    onFullAccessChange: (value: boolean) => void;
    onSave: () => void;
    isSaving: boolean;
    permissionGroups: Array<{
        title: string;
        permissions: Array<{ id: string; label: string; desc: string }>;
    }>;
    demoRoles: string[];
}

export default function PermissionsModal({
    isOpen,
    onClose,
    staffEmail,
    selectedRole,
    onRoleChange,
    activePermissions,
    onTogglePermission,
    isFullAccess,
    onFullAccessChange,
    onSave,
    isSaving,
    permissionGroups,
    demoRoles
}: PermissionsModalProps) {
    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Minimalist Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={() => !isSaving && onClose()}
            />

            {/* Simple Tabular Modal */}
            <div className="relative w-full max-w-5xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-200 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 lg:px-8 py-5 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 bg-white">
                    <div className="flex items-start sm:items-center flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
                        <h3 className="text-(--maincolor) text-xl font-bold">Role Permissions Manager</h3>
                        <div className="hidden sm:inline-block h-4 w-[1px] bg-gray-300" />
                        <span className="text-sm text-gray-500 font-medium truncate max-w-[200px]">{staffEmail}</span>
                    </div>
                    <div className="flex items-center justify-between gap-6 w-full sm:w-auto">
                        <div className="flex items-center gap-3">
                            <span className="text-[11px] font-bold text-gray-400 uppercase font-mainfont">Full Access</span>
                            <div
                                onClick={() => onFullAccessChange(!isFullAccess)}
                                className={`w-10 h-5 rounded-full relative transition-all duration-300 cursor-pointer ${isFullAccess ? 'bg-[var(--maincolor)]' : 'bg-gray-200'}`}
                            >
                                <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all duration-300 ${isFullAccess ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-[var(--maincolor)] transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Role Tabs - Clean & Simple */}
                <div className="px-6 lg:px-8 py-5 bg-gray-50/50 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-10">
                    <span className="text-sm font-bold text-gray-500 sm:uppercase whitespace-nowrap">Assigned Role :</span>
                    <div className="flex gap-6">
                        {demoRoles.map(role => (
                            <button
                                key={role}
                                onClick={() => onRoleChange(role)}
                                className={`text-[11px] font-semibold uppercase transition-all relative py-2 cursor-pointer ${selectedRole === role
                                        ? 'text-(--maincolor) after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-(--maincolor)'
                                        : 'text-gray-400 hover:text-(--maincolor)'
                                    }`}
                            >
                                {role}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tabular Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="min-w-full">
                        {permissionGroups.map((group, groupIdx) => (
                            <div key={groupIdx} className="flex flex-col sm:flex-row border-b border-gray-100 last:border-0 hover:bg-gray-50/30 transition-colors">
                                {/* Left Side: Category */}
                                <div className="w-full sm:w-[280px] p-6 lg:p-8 bg-gray-50/10 sm:border-r border-gray-100">
                                    <h4 className="text-base font-bold text-[var(--maincolor)] font-mainfont mb-1.5">{group.title}</h4>
                                    <p className="!text-sm text-gray-400">
                                        Configure {group.title.toLowerCase()} settings and visibility.
                                    </p>
                                </div>

                                {/* Right Side: Permissions Grid */}
                                <div className="flex-1 pt-0 px-6 pb-6 sm:p-6 lg:p-8">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-5 gap-x-10">
                                        {group.permissions.map(perm => {
                                            const isSelected = activePermissions.includes(perm.id) || isFullAccess;
                                            return (
                                                <label
                                                    key={perm.id}
                                                    className={`flex items-start gap-4 group transition-all ${isFullAccess ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                                                >
                                                    <div className="relative mt-0.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => !isFullAccess && onTogglePermission(perm.id)}
                                                            disabled={isFullAccess}
                                                            className="sr-only"
                                                        />
                                                        <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${isSelected
                                                                ? 'bg-[var(--maincolor)] border-[var(--maincolor)] shadow-sm'
                                                                : 'bg-white border-gray-200 group-hover:border-[var(--maincolor)]/40'
                                                            }`}>
                                                            {isSelected && <Check size={14} className="text-white" strokeWidth={4} />}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className={`text-sm font-bold transition-colors ${isSelected ? 'text-[var(--maincolor)]' : 'text-gray-500 group-hover:text-gray-800'}`}>
                                                            {perm.label}
                                                        </span>
                                                        <span className="text-xs text-gray-400">{perm.desc}</span>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Modern Simple Footer */}
                <div className="px-6 lg:px-8 py-5 border-t border-gray-100 bg-white flex sm:items-center sm:justify-between flex-col sm:flex-row gap-5 sm:gap-0">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6">
                        <div className="flex flex-col">
                            <span className="text-base font-bold text-(--maincolor)">{activePermissions.length} Active Permissions</span>
                            <span className="text-sm text-gray-400 font-medium">Synced with server in real-time</span>
                        </div>
                        {isFullAccess && (
                            <span className="px-3 py-1 bg-(--maincolor)/5 text-(--maincolor) rounded-full text-[10px] font-bold uppercase border border-(--maincolor)/10">
                                Administrator Mode
                            </span>
                        )}
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                        <button
                            onClick={onClose}
                            className="px-8 py-3 text-[11px] font-bold uppercase text-gray-400 hover:text-(--maincolor) transition-all order-last sm:order-first cursor-pointer"
                        >
                            Discard
                        </button>
                        <button
                            onClick={onSave}
                            disabled={isSaving}
                            className="text-white text-[11px] font-bold uppercase bg-(--maincolor) rounded-md px-6 py-3 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 w-full sm:w-auto cursor-pointer"
                        >
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Update Permissions"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
