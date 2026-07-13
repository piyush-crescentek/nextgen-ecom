"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

export interface FAQItem {
    title: string;
    content: string;
}

interface AccordionItemProps {
    item: FAQItem;
    isOpen: boolean;
    onToggle: () => void;
}

/** Simple card-style FAQ row: bordered card, question left, chevron right. */
const FAQAccordionItem = ({ item, isOpen, onToggle }: AccordionItemProps) => {
    return (
        <div
            className={`rounded-lg border transition-colors duration-300 ${
                isOpen
                    ? "border-(--maincolor)/20 bg-white shadow-sm"
                    : "border-slate-200 bg-[#F7F9FA] hover:bg-white hover:shadow-sm"
            }`}
        >
            {/* Accordion Header */}
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer"
            >
                <h3 className="text-base lg:text-lg font-medium text-(--maincolor)">
                    {item.title}
                </h3>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="shrink-0"
                >
                    <ChevronDown className="size-5 text-(--maincolor)" />
                </motion.div>
            </button>

            {/* Accordion Content */}
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div
                            className="px-5 pb-5 text-(--paracolor) text-base leading-relaxed prose max-w-none"
                            dangerouslySetInnerHTML={{ __html: item.content }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FAQAccordionItem;
