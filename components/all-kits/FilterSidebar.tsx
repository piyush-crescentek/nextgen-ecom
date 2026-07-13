"use client";

import { useState } from "react";
import { Search, ChevronDown, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface FilterOption {
    id: string;
    label: string;
}

export interface FilterGroup {
    title: string;
    options: FilterOption[];
    showSearch?: boolean;
}

interface FilterSidebarProps {
    groups: FilterGroup[];
    /** Selected option ids keyed by group title. */
    selected?: Record<string, string[]>;
    onToggle?: (groupTitle: string, optionId: string) => void;
    onClear?: () => void;
}

const FilterSidebar = ({ groups, selected = {}, onToggle, onClear }: FilterSidebarProps) => {
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
    const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
    const [isMobileExpanded, setIsMobileExpanded] = useState(false);

    const isGroupOpen = (title: string) => {
        if (openGroups[title] !== undefined) return openGroups[title];
        return title === "Category";
    };

    const toggleGroup = (title: string) => {
        setOpenGroups(prev => ({
            ...prev,
            [title]: !isGroupOpen(title)
        }));
    };

    const handleSearchChange = (title: string, value: string) => {
        setSearchTerms(prev => ({ ...prev, [title]: value }));
    };

    return (
        <aside className="lg:mx-auto w-full xl:w-1/4 shrink-0 xl:sticky xl:top-32 h-fit">
            {/* Header Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)]">
                <div
                    onClick={() => setIsMobileExpanded(!isMobileExpanded)}
                    className="flex lg:cursor-default items-center justify-between border-b border-gray-200 p-4 cursor-pointer"
                >
                    <h3 className="text-lg sm:text-xl font-semibold text-(--maincolor) flex items-center gap-2">
                        Filters
                        <span className="lg:hidden text-xs font-normal text-slate-400">
                            {isMobileExpanded ? '(Tap to collapse)' : '(Tap to expand)'}
                        </span>
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onClear?.();
                            }}
                            className="text-(--btncolor) hover:text-(--btncolor)/80 transition-colors p-2 rounded-xl hover:bg-(--btncolor)/5 group cursor-pointer"
                            title="Clear all filters"
                        >
                            <RotateCcw className="size-4 sm:size-5 group-hover:-rotate-45 transition-transform duration-300" />
                        </button>
                        <ChevronDown className={`size-5 transition-transform duration-300 lg:hidden ${isMobileExpanded ? 'rotate-180' : ''}`} />
                    </div>
                </div>

                <div className={`px-4 lg:block ${isMobileExpanded ? 'block' : 'hidden'}`}>
                    <div className="py-2 lg:py-5">
                        {groups.map((group, groupIndex) => {
                            const isOpen = isGroupOpen(group.title);
                            const searchTerm = searchTerms[group.title] || "";
                            const filteredOptions = group.options.filter(opt =>
                                opt.label.toLowerCase().includes(searchTerm.toLowerCase())
                            );

                            return (
                                <div key={groupIndex} className="mb-0 last:mb-0 last:[&_button]:border-0">
                                    <button
                                        onClick={() => toggleGroup(group.title)}
                                        className={`w-full flex items-center justify-between p-4 rounded-sm border-b border-gray-200 transition-all duration-300 cursor-pointer ${isOpen ? 'bg-(--blockground)' : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="text-(--maincolor) text-[15px] font-semibold">{group.title}</span>
                                        <motion.div
                                            animate={{ rotate: isOpen ? 180 : 0 }}
                                            transition={{ duration: 0.3, ease: "circOut" }}
                                        >
                                            <ChevronDown className="size-5 text-(--maincolor)" />
                                        </motion.div>
                                    </button>

                                    <AnimatePresence initial={false}>
                                        {isOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                                className="overflow-hidden border-b border-gray-200"
                                            >
                                                <div className="px-3 py-4">
                                                    {group.showSearch && (
                                                        <div className="relative mb-4">
                                                            <input
                                                                type="text"
                                                                value={searchTerm}
                                                                onChange={(e) => handleSearchChange(group.title, e.target.value)}
                                                                placeholder={`Search ${group.title.toLowerCase()}...`}
                                                                className="appearance-none relative block w-full h-11 w-full rounded-full border border-gray-400 px-4 py-3 pr-10 placeholder-gray-500 text-(--fieldcolor) text-base focus:outline-none focus:ring-(--maincolor) focus:border-(--maincolor)"
                                                            />
                                                            <div className="absolute inset-y-2 right-0 flex items-center px-3 pointer-events-none">
                                                                <Search className="h-[18px] w-[18px] lg:h-4 lg:w-4 text-(--maincolor)" />
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex flex-col gap-1 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                                        {filteredOptions.length > 0 ? (
                                                            filteredOptions.map((option) => (
                                                                <label
                                                                    key={option.id}
                                                                    className="group flex items-center gap-3 py-2 cursor-pointer w-full"
                                                                >
                                                                    <div className="relative flex items-center justify-center size-5 shrink-0">
                                                                        <input
                                                                            type="checkbox"
                                                                            id={option.id}
                                                                            checked={(selected[group.title] || []).includes(option.id)}
                                                                            onChange={() => onToggle?.(group.title, option.id)}
                                                                            className="peer appearance-none size-5 rounded-md border border-slate-300 bg-white checked:bg-(--maincolor) checked:border-(--maincolor) transition-all duration-200 cursor-pointer shadow-sm hover:border-(--maincolor)/50"
                                                                        />
                                                                        <svg
                                                                            className="absolute size-3 text-white opacity-0 peer-checked:opacity-100 transition-all duration-200 pointer-events-none"
                                                                            xmlns="http://www.w3.org/2000/svg"
                                                                            viewBox="0 0 24 24"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            strokeWidth="4"
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                        >
                                                                            <polyline points="20 6 9 17 4 12" />
                                                                        </svg>
                                                                    </div>
                                                                    <span className="text-sm font-medium text-slate-700 leading-tight group-hover:text-(--maincolor) transition-colors select-none">
                                                                        {option.label}
                                                                    </span>
                                                                </label>
                                                            ))
                                                        ) : (
                                                            <div className="py-8 text-center">
                                                                <p className="text-xs text-gray-400 font-medium italic">No results found</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </aside>
    );
};

export default FilterSidebar;
