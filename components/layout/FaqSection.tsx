"use client";

import { useState } from "react";
import { FAQ_SECTION_CONTENT } from "@/lib/mockFaqSection";
import FAQAccordionItem from "@/components/all-kits/FAQAccordionItem";

export default function FaqSection() {
  const data = FAQ_SECTION_CONTENT;
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // Flatten all categories into one simple list.
  const items = data.faqCategories.flatMap((category) => category.items);

  // Two independent columns so an expanding card only pushes down the cards
  // in its own column (a shared grid row would leave a gap under its
  // neighbour instead).
  const midpoint = Math.ceil(items.length / 2);
  const columns = [items.slice(0, midpoint), items.slice(midpoint)];

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full bg-[#E7E9ED] py-12 lg:py-20">
      <div className="container">
        <div className="mb-8 text-center lg:mb-12">
          <span className="mb-2 block text-base capitalize text-(--maincolor)/70">
            {data.subtitle}
          </span>
          <h2 className="text-2xl/8 font-bold text-(--maincolor) md:text-3xl">
            {data.title}
          </h2>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 items-start gap-4 md:grid-cols-2">
          {columns.map((column, colIndex) => (
            <div key={colIndex} className="space-y-4">
              {column.map((item, itemIndex) => {
                const index = colIndex * midpoint + itemIndex;
                return (
                  <FAQAccordionItem
                    key={item.question}
                    item={{ title: item.question, content: item.answer }}
                    isOpen={openIndex === index}
                    onToggle={() => toggleAccordion(index)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
