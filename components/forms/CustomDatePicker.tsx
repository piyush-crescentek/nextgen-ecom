"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronDown } from "lucide-react";

interface CustomDatePickerProps {
    id: string;
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
    maxDate?: string;
    minDate?: string;
    className?: string; // Add className prop
}

export default function CustomDatePicker({ id, value, onChange, placeholder, disabled, error, maxDate, minDate, className }: CustomDatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [openDirection, setOpenDirection] = useState<"down" | "up">("down");
    const [panelMaxHeight, setPanelMaxHeight] = useState(420);
    const [viewDate, setViewDate] = useState(() => {
        if (value) {
            const date = new Date(value);
            return isNaN(date.getTime()) ? new Date() : date;
        }
        return new Date();
    });
    const containerRef = useRef<HTMLDivElement>(null);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!isOpen || !containerRef.current) return;

        const updatePopoverLayout = () => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const spaceBelow = viewportHeight - rect.bottom - 12;
            const spaceAbove = rect.top - 12;
            const shouldOpenUp = spaceBelow < 340 && spaceAbove > spaceBelow;
            const availableSpace = shouldOpenUp ? spaceAbove : spaceBelow;

            setOpenDirection(shouldOpenUp ? "up" : "down");
            setPanelMaxHeight(Math.max(260, Math.min(420, Math.floor(availableSpace))));
        };

        updatePopoverLayout();
        window.addEventListener("resize", updatePopoverLayout);
        window.addEventListener("scroll", updatePopoverLayout, true);

        return () => {
            window.removeEventListener("resize", updatePopoverLayout);
            window.removeEventListener("scroll", updatePopoverLayout, true);
        };
    }, [isOpen]);

    const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
    const firstDayOfMonth = (y: number, m: number) => {
        const d = new Date(y, m, 1).getDay();
        return d === 0 ? 6 : d - 1;
    };

    const handleDateSelect = (day: number) => {
        const y = viewDate.getFullYear(), m = viewDate.getMonth();
        const dStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        if (maxDate && dStr > maxDate) return;
        if (minDate && dStr < minDate) return;

        onChange(dStr);
        setIsOpen(false);
    };

    const formatDateForInput = (str: string) => {
        if (!str) return "";
        const parts = str.split('-');
        return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : str;
    };

    const renderCalendar = () => {
        const y = viewDate.getFullYear(), m = viewDate.getMonth();
        const start = firstDayOfMonth(y, m), total = daysInMonth(y, m), prevTotal = daysInMonth(y, m - 1);
        const cells = [];
        for (let i = start - 1; i >= 0; i--) {
            cells.push(<div key={`p-${i}`} className="p-2 text-center text-gray-300 text-xs sm:text-sm">{prevTotal - i}</div>);
        }
        const today = new Date();
        for (let i = 1; i <= total; i++) {
            const dStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const selected = value === dStr, isToday = y === today.getFullYear() && m === today.getMonth() && i === today.getDate();

            const isOutOfRange = !!((maxDate && dStr > maxDate) || (minDate && dStr < minDate));

            cells.push(
                <button
                    key={i}
                    type="button"
                    disabled={isOutOfRange}
                    onClick={() => handleDateSelect(i)}
                    className={`p-2 text-center text-xs sm:text-sm font-medium rounded-md transition-all 
                        ${selected ? 'bg-[#0C203B] text-white' :
                            isOutOfRange ? 'text-gray-200 cursor-not-allowed' : 'text-[#0C203B] hover:bg-gray-100'} 
                        ${isToday && !selected && !isOutOfRange ? 'text-red-500 font-bold' : ''}`}
                >
                    {i}
                </button>
            );
        }
        for (let i = 1; cells.length < 42; i++) {
            cells.push(<div key={`n-${i}`} className="p-2 text-center text-gray-300 text-xs sm:text-sm">{i}</div>);
        }
        return cells;
    };

    const currentYear = new Date().getFullYear();
    const maxYear = maxDate ? new Date(maxDate).getFullYear() : currentYear + 10;
    const years = Array.from({ length: 121 }, (_, i) => (maxYear - 120) + i).reverse().filter(y => y <= maxYear);

    return (
        <div ref={containerRef} id={id} className="relative w-full">
            <div
                className={className || `flex items-center justify-between rounded-md h-12 px-4 py-3 border border-(--maincolor) bg-white cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${error ? 'border-red-400' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span className={`text-sm ${value ? 'text-(--maincolor)' : 'text-gray-400'}`}>
                    {value ? formatDateForInput(value) : placeholder}
                </span>
                <Calendar className="size-5 text-(--maincolor) shrink-0" />
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className={`absolute z-50 w-full min-w-[280px] max-w-full sm:max-w-[340px] bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden ${openDirection === "up" ? "bottom-full mb-2" : "top-full mt-2"}`}
                        style={{ maxHeight: `${panelMaxHeight}px` }}
                    >
                        <div className="p-3 sm:p-4 space-y-4 overflow-y-auto" style={{ maxHeight: `${panelMaxHeight}px` }}>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <select
                                        value={viewDate.getMonth()}
                                        onChange={(e) => setViewDate(new Date(viewDate.getFullYear(), parseInt(e.target.value), 1))}
                                        className="w-full h-10 pl-2 pr-6 text-xs sm:text-sm font-bold text-[#0C203B] border border-gray-200 rounded-lg appearance-none bg-white font-medium"
                                    >
                                        {monthNames.map((n, i) => {
                                            const maxD = maxDate ? new Date(maxDate) : null;
                                            const minD = minDate ? new Date(minDate) : null;
                                            const isFuture = maxD && viewDate.getFullYear() === maxD.getFullYear() && i > maxD.getMonth();
                                            const isPast = minD && viewDate.getFullYear() === minD.getFullYear() && i < minD.getMonth();
                                            if (isFuture || isPast) return null;
                                            return <option key={n} value={i} className="text-(--maincolor)">{n}</option>;
                                        })}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                                </div>
                                <div className="relative flex-1">
                                    <select
                                        value={viewDate.getFullYear()}
                                        onChange={(e) => {
                                            const newYear = parseInt(e.target.value);
                                            let newMonth = viewDate.getMonth();
                                            const maxD = maxDate ? new Date(maxDate) : null;
                                            const minD = minDate ? new Date(minDate) : null;
                                            
                                            if (maxD && newYear === maxD.getFullYear() && newMonth > maxD.getMonth()) {
                                                newMonth = maxD.getMonth();
                                            }
                                            if (minD && newYear === minD.getFullYear() && newMonth < minD.getMonth()) {
                                                newMonth = minD.getMonth();
                                            }
                                            setViewDate(new Date(newYear, newMonth, 1));
                                        }}
                                        className="w-full h-10 pl-2 pr-6 text-xs sm:text-sm font-bold text-[#0C203B] border border-gray-200 rounded-lg appearance-none bg-white font-medium"
                                    >
                                        {years.map(y => <option key={y} value={y} className="text-(--maincolor)">{y}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                            <div className="rounded-lg overflow-hidden border border-gray-100">
                                <div className="grid grid-cols-7 bg-[#EBF0E9] py-2">
                                    {days.map(d => <div key={d} className="text-center text-[10px] sm:text-[11px] font-bold text-[#0C203B]">{d}</div>)}
                                </div>
                                <div className="grid grid-cols-7 gap-px bg-gray-50 p-1">
                                    {renderCalendar()}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
