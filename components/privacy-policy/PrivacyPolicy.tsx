"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import privacyPolicyData from "./privacy-policy-data.json";

export default function PrivacyPolicy() {

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>

      {/* Banner */}
      <div className="flex items-center bg-[url(/images/about_privacy.jpg)] bg-top bg-center bg-no-repeat bg-cover min-h-[400px] md:min-h-[440px] relative">
        <div className='
          absolute top-0 left-0 w-full h-full
          bg-transparent
          bg-[linear-gradient(180deg,#4BF4C9_0%,#5D89D3_100%)]
          opacity-100
          mix-blend-multiply
          transition-[background_0.3s,border-radius_0.3s,opacity_0.3s]'
        />
        <div className="container">
          <div className="flex flex-col text-white md:mt-16">
            <h1 className="text-[40px] font-bold mb-2">Privacy Policy</h1>
            <div className='text-base font-normal'>We’re Ireland’s medical <span className='block w-full'>assessment and Online Medical Certificate App.</span></div>
          </div>
        </div>
      </div>

      <div className="bg-[#E7E9ED] py-12 lg:py-20">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            <div className="text-center pb-8 md:pb-16">
              <h2 className="text-(--maincolor) text-3xl lg:text-5xl font-bold mb-5 md:mb-8">Privacy Policy – NexGen Healthcare</h2>
              <p className="!text-(--maincolor) !text-lg/7 font-normal">
                Please carefully review our privacy policy to understand how we collect, use, and protect your personal information.
              </p>
              <p className="text-(--paracolor) text-sm font-medium mt-4">
                Last updated: {privacyPolicyData.lastUpdated}
              </p>
            </div>

            <div className="space-y-4">
              {privacyPolicyData.items.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-md shadow-md overflow-hidden"
                >
                  {/* Accordion Header */}
                  <button
                    onClick={() => toggleAccordion(index)}
                    className={`w-full px-6 py-4 flex items-center justify-between text-left cursor-pointer transition-colors ${openIndex === index
                      ? 'bg-[var(--maincolor)] text-white'
                      : 'hover:bg-gray-50'
                      }`}
                  >
                    <h3 className={`text-lg font-semibold ${openIndex === index ? 'text-white' : 'text-(--maincolor)'
                      }`}>
                      {item.question}
                    </h3>
                    <motion.div
                      animate={{ rotate: openIndex === index ? 180 : 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <ChevronDown className={`size-5.5 ${openIndex === index ? 'text-white' : 'text-(--maincolor)'
                        }`} />
                    </motion.div>
                  </button>

                  {/* Accordion Content */}
                  <AnimatePresence initial={false}>
                    {openIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 py-7 bg-gray-50 border-t border-gray-200">
                          <div className="text-(--paracolor) text-base leading-relaxed">
                            {item.answer}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

    </>

  );
}
