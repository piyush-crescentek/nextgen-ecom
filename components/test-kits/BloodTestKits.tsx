"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

import { ChevronDown, Droplet, LucideIcon } from "lucide-react";
import Image from "next/image";
import { TESTING_KITS_SLUG } from "@/lib/constants";


// Helper function to get category image path
const getCategoryImagePath = (categorySlug: string) => {
  const formattedName = categorySlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  return `/testkits/${formattedName}.png`;
};

// Category Icon Component with Fallback Logic
const CategoryIcon = ({
  slug,
  name,
  fallbackIcon: FallbackIcon,
  className
}: {
  slug: string;
  name: string;
  fallbackIcon: LucideIcon;
  className?: string;
}) => {
  const [imageError, setImageError] = useState(false);
  const imagePath = getCategoryImagePath(slug);

  if (imageError || !imagePath) {
    return <FallbackIcon className={className || "size-7 text-(--maincolor)"} />;
  }

  return (
    <div className="relative w-full h-full p-2">
      <Image
        src={imagePath}
        alt={name}
        fill
        className="object-contain"
        onError={() => setImageError(true)}
      />
    </div>
  );
};


export default function BloodTestKits() {
  // Motion Animation

  const [activeTab, setActiveTab] = useState('0');
  const tabs = [
    {
      id: '0',
      label: "Who can apply for a sick certificate?"
    },
    {
      id: '1',
      label: "How quickly will I receive my certificate?"
    },
    {
      id: '2',
      label: "How quickly will I receive my certificate?"
    },
    {
      id: '3',
      label: "Can I get a retrospective certificate?"
    },
    {
      id: '4',
      label: "Will my employer accept the certificate?"
    },
    {
      id: '5',
      label: "I selected 10 days of sickness, but the doctor gave a shorter period. Why?"
    },
    {
      id: '6',
      label: "I got the dates wrong in my certificate. Can this be changed?"
    },
    {
      id: '7',
      label: "Do you provide social welfare certificates?"
    }
  ];
  // FAQs Tab component

  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const accordionData = [
    {
      title: "What is the standard delivery time?",
      content: "Certificates are typically delivered within 24 hours for standard service."
    },
    {
      title: "How does express delivery work?",
      content: "For express service, certificates are issued within 4 hours if the application is submitted during working hours. Note that processing times depend on when the application is received, as doctors’ working hours affect issuance timelines."
    },
    {
      title: "What if my certificate is delayed?",
      content: "Delays may occur due to incomplete or incorrect information in your application. Ensure all details are accurate to avoid processing issues."
    }
  ];

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };
  // FAQs Accordion

  return (
    <>

      {/* Banner */}
      <div className="flex md:items-center md:flex-row flex-col bg-[#E7E9ED] md:h-[750px] relative">
        <div className="flex flex-col md:flex-row justify-end w-full h-full">
          <div className="md:w-1/2 h-full relative">
            <Image
              src="/images/kits-1.jpg"
              alt="Blood Test Kits"
              fill
              className="object-cover object-[0%_100%]"
            />

            <div className="absolute -bottom-6 right-4 lg:right-8 bg-white rounded-xl shadow-lg px-5 py-4 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#E8F4F2] rounded-full flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-stethoscope w-6 h-6 text-(--maincolor)"><path d="M11 2v2" /><path d="M5 2v2" /><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" /><path d="M8 15a6 6 0 0 0 12 0v-3" /><circle cx="20" cy="10" r="2" /></svg>
                </div>
                <div><p className="text-xs text-slate-500">Trusted by</p><p className="font-semibold text-(--maincolor)">10,000+ Patients</p></div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative md:absolute top-0 left-0 w-full h-full">
          <div className="container h-full">
            <div className="md:w-1/2 h-full">
              <div className="flex flex-col items-start justify-center h-full py-8 md:pr-9 overflow-hidden">
                <div className="space-y-2 md:space-y-3 text-center sm:text-left animated fadeInRight">
                  <h1 className="text-(--maincolor) text-[30px] md:text-[32px] md:leading-none lg:text-5xl font-bold">At-Home Blood Testing Kits & Urine Testing Kits</h1>
                  <div className='text-(--maincolor) text-base/6 md:text-lg lg:text-xl/8 font-bold'>Ireland</div>
                  <div className='text-(--maincolor) text-base/6 md:text-lg lg:text-lg font-normal'>Order a home sample collection kit online and get clear results you can act on — without long waiting times.</div>

                  <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="flex items-center text-left gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center flex-shrink-0">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-stethoscope w-5 h-5 text-[#0F4C5C]"><path d="M11 2v2"></path><path d="M5 2v2"></path><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"></path><path d="M8 15a6 6 0 0 0 12 0v-3"></path><circle cx="20" cy="10" r="2"></circle></svg>
                      </div>
                      <span className="text-sm text-slate-700">Doctor-guided service</span>
                    </div>
                    <div className="flex items-center text-left gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center flex-shrink-0">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-package w-5 h-5 text-[#0F4C5C]"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"></path><path d="M12 22V12"></path><polyline points="3.29 7 12 12 20.71 7"></polyline><path d="m7.5 4.27 9 5.15"></path></svg>
                      </div>
                      <span className="text-sm text-slate-700">Discreet packaging</span>
                    </div>
                    <div className="flex items-center text-left gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center flex-shrink-0">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock w-5 h-5 text-[#0F4C5C]"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      </div>
                      <span className="text-sm text-slate-700">Fast turnaround times</span>
                    </div>
                    <div className="flex items-center text-left gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center flex-shrink-0">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text w-5 h-5 text-[#0F4C5C]"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg>
                      </div>
                      <span className="text-sm text-slate-700">Clear instructions included</span>
                    </div>
                  </div>

                  <div className="mt-10 flex flex-col lg:flex-row gap-4">
                    <Link
                      href={`/${TESTING_KITS_SLUG}`}
                      data-hover="Blood Testing Kits"
                      className="btn btn-primary
                        h-14 px-6 lg:px-8
                        bg-(--btncolor)
                        text-lg
                        before:bg-(--btncolor)/90
                        before:border-(--btncolor)"
                    >
                      Blood Testing Kits
                    </Link>
                    <Link
                      href="/"
                      data-hover="How It Works"
                      className="btn
                        h-14 px-6 lg:px-8
                        bg-(--background)
                        !text-(--maincolor)
                        text-lg
                        before:bg-(--background)/90
                        before:border-(--background)"
                    >
                      How It Works
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-12 lg:py-20 bg-[#FAFBFC]">
        <div className="container">
          <div className="max-w-4xl mx-auto lg:px-8">
            <div className="bg-white rounded-2xl p-8 lg:p-12 shadow-sm border border-slate-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex -space-x-2">
                  <div className="size-12 bg-[#E8F4F2] rounded-xl flex items-center justify-center border-2 border-white">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6 text-(--maincolor)"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"></path><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"></path></svg>
                  </div>
                  <div className="w-12 h-12 bg-[#FEF3F0] rounded-xl flex items-center justify-center border-2 border-white">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6 text-(--btncolor)"><path d="M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5c-1.4 0-2.5-1.1-2.5-2.5V2"></path><path d="M8.5 2h7"></path><path d="M14.5 16h-5"></path></svg>
                  </div>
                </div>
                <h2 className="text-(--maincolor) text-2xl/8 lg:text-3xl font-bold">Understanding Home Testing Kits</h2>
              </div>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 leading-relaxed">At-home blood and urine testing kits allow you to collect a small sample in the comfort of your own home, then send it to an accredited laboratory for professional analysis. These tests are ideal for individuals seeking proactive health insights, monitoring specific markers, or those who prefer the convenience of home collection over clinic visits.</p>
                <p className="text-slate-600 leading-relaxed mt-4"><strong className="text-(--maincolor)">Blood tests</strong> typically measure biomarkers in your bloodstream — from vitamin levels and hormones to cholesterol and liver function. <strong className="text-(--maincolor)">Urine tests</strong> are often used for infection screening, kidney health, and certain metabolic markers.</p>
                <p className="text-slate-500 !text-sm mt-4 p-4 bg-(--blockground) rounded-xl"><strong>Important:</strong> These kits are designed for screening and health insights, not for emergency diagnosis. If you have urgent symptoms, please contact your GP or visit an emergency department.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-12 lg:py-20 bg-white">
        <div className="container">
          <div className="text-center mb-8 lg:mb-12">
            <span className="inline-block px-4 py-1.5 bg-(--blockground) text-(--maincolor) text-base font-medium rounded-full mb-2 lg:mb-4">Test
              Categories</span>
            <h2 className="text-(--maincolor) text-2xl/8 lg:text-3xl font-bold">Browse Test Kits by Category</h2>
            <p className="text-(--maincolor) !text-lg/6 font-normal lg:mt-3 max-w-2xl mx-auto">Select a category below to explore our range of at-home testing options.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-6">
            <Link href="/product-details"
              className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-[#0F4C5C]/20 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 bg-(--blockground) rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                  stroke-linejoin="round" className="size-7 text-(--maincolor)">
                  <path
                    d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z">
                  </path>
                  <path d="M10 2c1 .5 2 2 2 5"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-(--maincolor) mb-2 group-hover:text-(--btncolor) transition-colors">
                Vitamins, Nutrition & Lifestyle</h3>
              <p className="text-slate-600 leading-relaxed mb-5">Vitamin levels, iron/ferritin, fatigue markers,
                and wellbeing insights for optimal nutrition.</p>
              <div className="flex items-center text-(--btncolor) font-medium text-sm">Explore tests
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                  className="size-4 ml-2 group-hover:translate-x-1 transition-transform">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </div>
            </Link>
            <Link href="/product-details"
              className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-[#0F4C5C]/20 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 bg-(--blockground) rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  strokeLinejoin="round" className="size-7 text-(--maincolor)">
                  <path
                    d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z">
                  </path>
                  <path d="M10 2c1 .5 2 2 2 5"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-(--maincolor) mb-2 group-hover:text-(--btncolor) transition-colors">
                Virology</h3>
              <p className="text-slate-600 leading-relaxed mb-5">Viral screening panels, immunity markers, and
                past exposure checks for non-emergency use.</p>
              <div className="flex items-center text-(--btncolor) font-medium text-sm">Explore tests
                <svg
                  xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                  className="lucide lucide-arrow-right w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </div>
            </Link>
            <Link href="/product-details"
              className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-[#0F4C5C]/20 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 bg-(--blockground) rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg width="24" height="24"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                  stroke-linejoin="round" className="size-7 text-(--maincolor)">
                  <path
                    d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2">
                  </path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-(--maincolor) mb-2 group-hover:text-(--btncolor) transition-colors">
                Tumour Markers / Sites</h3>
              <p className="text-slate-600 leading-relaxed mb-5">Specialist markers used alongside clinical advice
                — not standalone diagnostic tools.</p>
              <div className="flex items-center text-(--btncolor) font-medium text-sm">Explore tests
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="size-4 ml-2 group-hover:translate-x-1 transition-transform">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </div>
            </Link>
            <Link href="/product-details"
              className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-[#0F4C5C]/20 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 bg-(--blockground) rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg width="24" height="24"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  strokeLinejoin="round" className="size-7 text-(--maincolor)">
                  <path
                    d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z">
                  </path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-(--maincolor) mb-2 group-hover:text-(--btncolor) transition-colors">
                Virology</h3>
              <p className="text-slate-600 leading-relaxed mb-5">Viral screening panels, immunity markers, and
                past exposure checks for non-emergency use.</p>
              <div className="flex items-center text-(--btncolor) font-medium text-sm">Explore tests
                <svg
                  xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="lucide lucide-arrow-right w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </div>
            </Link>
            <Link href="#"
              className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-[#0F4C5C]/20 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 bg-(--blockground) rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg width="24" height="24"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  strokeLinejoin="round" className="size-7 text-(--maincolor)">
                  <path
                    d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2">
                  </path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-(--maincolor) mb-2 group-hover:text-(--btncolor) transition-colors">
                Tumour Markers / Sites</h3>
              <p className="text-slate-600 leading-relaxed mb-5">Specialist markers used alongside clinical advice
                — not standalone diagnostic tools.</p>
              <div className="flex items-center text-(--btncolor) font-medium text-sm">Explore tests
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="size-4 ml-2 group-hover:translate-x-1 transition-transform">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </div>
            </Link>
            <Link href="#"
              className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-[#0F4C5C]/20 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 bg-(--blockground) rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg width="24" height="24"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  strokeLinejoin="round" className="size-7 text-(--maincolor)">
                  <path
                    d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z">
                  </path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-(--maincolor) mb-2 group-hover:text-(--btncolor) transition-colors">
                Sexual Health</h3>
              <p className="text-slate-600 leading-relaxed mb-5">Discreet testing options, common STI screening
                kits, and guidance on next steps.</p>
              <div className="flex items-center text-(--btncolor) font-medium text-sm">Explore tests
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="size-4 ml-2 group-hover:translate-x-1 transition-transform">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </div>
            </Link>
            <Link href="/product-details"
              className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-[#0F4C5C]/20 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 bg-(--blockground) rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg width="24" height="24"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  strokeLinejoin="round" className="size-7 text-(--maincolor)">
                  <path d="m8 2 1.88 1.88"></path>
                  <path d="M14.12 3.88 16 2"></path>
                  <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"></path>
                  <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"></path>
                  <path d="M12 20v-9"></path>
                  <path d="M6.53 9C4.6 8.8 3 7.1 3 5"></path>
                  <path d="M6 13H2"></path>
                  <path d="M3 21c0-2.1 1.7-3.9 3.8-4"></path>
                  <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"></path>
                  <path d="M22 13h-4"></path>
                  <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-(--maincolor) mb-2 group-hover:text-(--btncolor) transition-colors">
                Infection Sciences</h3>
              <p className="text-slate-600 leading-relaxed mb-5">Infection-related blood markers and comprehensive
                screening panels.</p>
              <div className="flex items-center text-[#E07A5F] font-medium text-sm">Explore tests
                <svg
                  width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="size-4 ml-2 group-hover:translate-x-1 transition-transform">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </div>
            </Link>
            <Link href="/product-details"
              className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-[#0F4C5C]/20 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 bg-(--blockground) rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300"
              >
                <svg width="24" height="24"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  strokeLinejoin="round" className="size-7 text-(--maincolor)">
                  <path
                    d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z">
                  </path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-(--maincolor) mb-2 group-hover:text-(--btncolor) transition-colors">
                Immunology</h3>
              <p className="text-slate-600 leading-relaxed mb-5">Immune response insights, inflammation screening,
                and autoimmune support tests.</p>
              <div className="flex items-center text-(--btncolor) font-medium text-sm">Explore tests
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="size-4 ml-2 group-hover:translate-x-1 transition-transform">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </div>
            </Link>
            <Link href="/product-details"
              className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-[#0F4C5C]/20 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 bg-(--blockground) rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <CategoryIcon slug="haematology" name="Haematology" fallbackIcon={Droplet} />
              </div>
              <h3 className="text-lg font-semibold text-(--maincolor) mb-2 group-hover:text-(--btncolor) transition-colors">
                Haematology</h3>
              <p className="text-slate-600 leading-relaxed mb-5">Blood health markers, anaemia screening, and
                clotting-related panels.</p>
              <div className="flex items-center text-(--btncolor) font-medium text-sm">Explore tests
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="size-4 ml-2 group-hover:translate-x-1 transition-transform">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </div>
            </Link>
            <Link href="/product-details"
              className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-[#0F4C5C]/20 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 bg-(--blockground) rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg width="24" height="24"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  strokeLinejoin="round" className="size-7 text-(--maincolor)">
                  <path d="m12 14 4-4"></path>
                  <path d="M3.34 19a10 10 0 1 1 17.32 0"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-(--maoncolor) mb-2 group-hover:text-(--btncolor) transition-colors">
                Endocrinology</h3>
              <p className="text-slate-600 leading-relaxed mb-5">Thyroid tests, hormone markers, and metabolic
                function checks.</p>
              <div className="flex items-center text-(--btncolor) font-medium text-sm">Explore tests
                <svg
                  xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="size-4 ml-2 group-hover:translate-x-1 transition-transform">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </div>
            </Link>
            <Link href="/product-details"
              className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-[#0F4C5C]/20 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 bg-(--blockground) rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg width="24" height="24"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  strokeLinejoin="round" className="size-7 text-(maincolor)">
                  <path
                    d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2">
                  </path>
                  <path d="M6.453 15h11.094"></path>
                  <path d="M8.5 2h7"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-(--maincolor) mb-2 group-hover:text-(--btncolor) transition-colors">
                Biochemistry</h3>
              <p className="text-slate-600 leading-relaxed mb-5">Liver function, kidney function,
                cholesterol/lipids, and glucose markers.</p>
              <div className="flex items-center text-(--btncolor) font-medium text-sm">Explore tests
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="size-4 ml-2 group-hover:translate-x-1 transition-transform">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </div>
            </Link>
            <Link href="/product-details"
              className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-[#0F4C5C]/20 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 bg-(--blockground) rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg width="24" height="24"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  strokeLinejoin="round" className="size-7 text-(--maincolor)">
                  <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path>
                  <path d="M7 2v20"></path>
                  <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-(--maincolor) mb-2 group-hover:text-(--btncolor) transition-colors">
                Gastrointestinal</h3>
              <p className="text-slate-600 leading-relaxed mb-5">Digestive health markers, gut screening tests,
                and intolerance-related markers.</p>
              <div className="flex items-center text-(--btncolor) font-medium text-sm">Explore tests
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="lucide lucide-arrow-right size-4 ml-2 group-hover:translate-x-1 transition-transform">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </div>
            </Link>
            <Link href="/product-details"
              className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-[#0F4C5C]/20 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 bg-(--blockground) rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg width="24" height="24"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  strokeLinejoin="round" className="size-7 text-(--maincolor)">
                  <path d="M6 18h8"></path>
                  <path d="M3 22h18"></path>
                  <path d="M14 22a7 7 0 1 0 0-14h-1"></path>
                  <path d="M9 14h2"></path>
                  <path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"></path>
                  <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-(--maincolor) mb-2 group-hover:text-(--btncolor) transition-colors">
                Culture / Viral Screening</h3>
              <p className="text-slate-600 leading-relaxed mb-5">Urine culture screening, viral screening bundles,
                and follow-up recommendations.</p>
              <div className="flex items-center text-(--btncolor) font-medium text-sm">Explore tests
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="size-4 ml-2 group-hover:translate-x-1 transition-transform">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="py-12 lg:py-20 bg-(--maincolor)">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className="size-6 text-white">
                    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <path d="M12 17h.01"></path>
                  </svg>
                </div>
                <span className="text-(--btncolor) font-medium">Test Guidance</span>
              </div>
              <h2 className="text-white text-2xl/8 lg:text-3xl font-bold mb-4">Not Sure Which Test Kit to Choose?</h2>
              <p className="text-white/80 !text-lg leading-relaxed mb-8">Let us help you find the right test based on your
                symptoms or health concerns. Here are some common starting points:</p>
              <Link
                href="#"
                data-hover="Get Help Choosing a Test"
                className="btn btn-primary
                !inline-flex items-center justify-center gap-2
                [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0
                h-14
                px-6 lg:px-8
                bg-(--btncolor)
                text-lg
                before:bg-(--btncolor)
                before:border-(--btncolor)"
              >
                Get Help Choosing a Test
                <svg width="24" height="24"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  strokeLinejoin="round" className="size-5 ml-2">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </Link>
            </div>
            <div className="space-y-4">
              <Link href="/product-details"
                className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all group">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"
                    className="size-6 text-white">
                    <rect width="16" height="10" x="2" y="7" rx="2" ry="2"></rect>
                    <line x1="22" x2="22" y1="11" y2="13"></line>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">Tiredness or fatigue</p>
                  <p className="text-(--btncolor) !text-sm">→ Vitamins & Iron Tests</p>
                </div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="size-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </Link>
              <Link href="/product-details"
                className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all group">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg width="24" height="24"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"
                    className="size-6 text-white">
                    <path
                      d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z">
                    </path>
                    <path d="M12 8v4"></path>
                    <path d="M12 16h.01"></path>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">Frequent infections</p>
                  <p className="text-(--btncolor) !text-sm">→ Immunology / Infection Screening</p>
                </div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="size-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </Link>
              <Link href="/product-details"
                className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all group">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg width="24" height="24"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"
                    className="size-6 text-white">
                    <path d="m12 14 4-4"></path>
                    <path d="M3.34 19a10 10 0 1 1 17.32 0"></path>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">Thyroid symptoms</p>
                  <p className="text-(--btncolor) !text-sm">→ Endocrinology Tests</p>
                </div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="size-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </Link>
              <Link href="/product-details"
                className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all group">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg width="24" height="24"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"
                    className="size-6 text-white">
                    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path>
                    <path d="M7 2v20"></path>
                    <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">Digestive issues</p>
                  <p className="text-(--btncolor) !text-sm">→ Gastrointestinal Tests</p>
                </div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="size-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </Link>
              <Link href="/product-details"
                className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all group">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"
                    className="size-6 text-white">
                    <path
                      d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z">
                    </path>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">Sexual health concerns</p>
                  <p className="text-(--btncolor) !text-sm">→ Sexual Health Kits</p>
                </div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="size-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="py-12 lg:py-20">
        <div className="container">
          <div className="flex flex-col mb-8 lg:mb-12">
            <span className="text-(--maincolor) text-lg capitalize lg:mb-2">Most Frequently</span>
            <h2 className="text-(--maincolor) text-2xl/8 lg:text-3xl font-bold">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="flex flex-col lg:flex-row lg:gap-10">
            {/* Tab Buttons */}
            <div className="contents lg:flex flex-col justify-start lg:w-2/5 lg:gap-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  data-order={tab.id}
                  style={{ order: tab.id }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex text-left px-5 py-4 mt-5 lg:mt-0 rounded-md
                    text-lg lg:text-xl font-bold
                    border border-(--maincolor) lg:border-white
                    transition-all duration-500 cursor-pointer
                    ${activeTab === tab.id
                      ? 'bg-(--maincolor) text-white lg:bg-(--blockground) lg:text-(--maincolor)'
                      : 'bg-(--blockground) lg:bg-transparent text-(--maincolor) lg:hover:text-(--maincolor) hover:bg-(--maincolor) hover:text-white lg:hover:bg-(--blockground)'
                    }
                  `}
                  data-rel={`tab-${tab.id}`}
                >
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="contents lg:flex flex-col justify-start lg:w-3/5">

              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  data-order={tab.id}
                  className={`w-full bg-(--blockground) lg:bg-transparent ${activeTab === tab.id ? 'block' : 'hidden'}`}
                  style={{ order: tab.id }}
                >
                  <div className="p-5 lg:p-0">
                    <div className="space-y-3">
                      {accordionData.map((item, index) => (
                        <div
                          key={index}
                          className="border-b border-gray-300 lg:border-gray-200"
                        >
                          {/* Accordion Header */}
                          <button
                            onClick={() => toggleAccordion(index)}
                            className={`w-full pb-4 flex items-center justify-between text-left cursor-pointer transition-colors ${openIndex === index
                              ? 'text-(--maincolor)'
                              : 'hover:text-(--maincolor)/60'
                              }`}
                          >
                            <h3 className={`text-base lg:text-lg font-semibold ${openIndex === index ? 'text-(--maincolor)' : 'text-(--maincolor)'
                              }`}>
                              {item.title}
                            </h3>
                            <motion.div
                              className=""
                              animate={{ rotate: openIndex === index ? 180 : 0 }}
                              transition={{ duration: 0.5 }}
                            >
                              <ChevronDown className={`size-7 lg:size-8 lg:bg-(--blockground) lg:border-0 border border-(--maincolor) rounded-full p-1 lg:p-1.5 ${openIndex === index ? 'text-(--maincolor)' : 'text-(--maincolor)'
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
                                <div className="bg-white p-4 rounded-md lg:rounded-none lg:pt-0 lg:px-0 lg:pb-4">
                                  <div className="text-(--paracolor) text-base leading-relaxed">
                                    {item.content}
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
              ))}
            </div>
          </div>

        </div>
      </div>

      <div className="py-12 lg:py-20 bg-[#FAFBFC]">
        <div className="container">
          <div className="text-center mb-8 lg:mb-12">
            <span className="inline-block px-4 py-1.5 bg-(--blockground) text-(--maincolor) text-base font-medium rounded-full mb-2 lg:mb-4">More
              Services</span>
            <h2 className="text-(--maincolor) text-2xl/8 lg:text-3xl font-bold">Related Services</h2>
            <p className="text-(--maincolor) !text-lg/6 font-normal lg:mt-3 max-w-2xl mx-auto">Explore other healthcare services available through Get Healthcare.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6">
            <Link href="/online-medical-certificates"
              className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-[#0F4C5C]/20 transition-all duration-300 hover:-translate-y-1">
              <div
                className="w-14 h-14 bg-(--blockground) rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"
                  className="size-7 text-(--maincolor)">
                  <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"></path>
                  <rect x="2" y="6" width="14" height="12" rx="2"></rect>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-(maincolor) mb-2 group-hover:text-(--btncolor) transition-colors">Online GP Consultation</h3>
              <p className="text-slate-600 !text-sm leading-relaxed mb-4">Speak with an IMC-registered GP from the comfort of your home.</p>
              <div className="flex items-center justify-between">
                <span className="text-(--maoncolor) font-semibold">From €35</span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"
                  className="size-4 text-(--btncolor) group-hover:translate-x-1 transition-transform">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </div>
            </Link>
            <Link href="/online-gp-appointment"
              className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-[#0F4C5C]/20 transition-all duration-300 hover:-translate-y-1">
              <div
                className="w-14 h-14 bg-(--blockground) rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"
                  className="size-7 text-(--maincolor)">
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                  <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                  <path d="M10 9H8"></path>
                  <path d="M16 13H8"></path>
                  <path d="M16 17H8"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-(--maincolor) mb-2 group-hover:text-(--btncolor) transition-colors">Medical Certificates</h3>
              <p className="text-slate-600 !text-sm leading-relaxed mb-4">Sick certs, fit to work, travel, and employment medical certificates.</p>
              <div className="flex items-center justify-between">
                <span className="text-(--maincolor) font-semibold">From €29</span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"
                  className="size-4 text-(--btncolor) group-hover:translate-x-1 transition-transform">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </div>
            </Link>
            <Link href="/occupational-health"
              className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-[#0F4C5C]/20 transition-all duration-300 hover:-translate-y-1">
              <div
                className="w-14 h-14 bg-(--blockground) rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"
                  className="size-7 text-(--maincolor)">
                  <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  <rect width="20" height="14" x="2" y="6" rx="2"></rect>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-(--maincolor) mb-2 group-hover:text-(--btncolor) transition-colors">Occupational Health Reviews</h3>
              <p className="text-slate-600 !text-sm leading-relaxed mb-4">Workplace health assessments and pre-employment screening.</p>
              <div className="flex items-center justify-between">
                <span className="text-(--maincolor) font-semibold">From €45</span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"
                  className="size-4 text-(--btncolor) group-hover:translate-x-1 transition-transform">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </div>
            </Link>
            <Link href="/treatments"
              className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-[#0F4C5C]/20 transition-all duration-300 hover:-translate-y-1">
              <div
                className="w-14 h-14 bg-(--blockground) rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"
                  className="size-7 text-(--maincolor)">
                  <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"></path>
                  <path d="m8.5 8.5 7 7"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-(--maincolor) mb-2 group-hover:text-(--btncolor) transition-colors">Treatment Prescriptions</h3>
              <p className="text-slate-600 !text-sm leading-relaxed mb-4">Get prescriptions for common conditions delivered to your pharmacy.</p>
              <div className="flex items-center justify-between">
                <span className="text-(--maincolor) font-semibold">From €29</span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"
                  className="size-4 text-(--btncolor) group-hover:translate-x-1 transition-transform">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="py-12 lg:py-20 bg-(--blockground)">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-(--maincolor) text-2xl/8 lg:text-3xl font-bold mb-3">Browse At-Home Blood & Urine Test Kits</h2>
            <div className="text-(--maincolor) text-base/6 md:text-lg lg:text-lg font-normal mb-10 max-w-2xl mx-auto">Order online anytime. Discreet delivery across Ireland.</div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/all-test-kits"
                data-hover="Browse All Test Kits"
                className="btn btn-primary
                !inline-flex items-center justify-center gap-2
                [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0
                h-14
                px-6 lg:px-8
                bg-(--btncolor)
                text-lg
                before:bg-(--btncolor)
                before:border-(--btncolor)"
              >
                Browse All Test Kits
                <svg width="24" height="24" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="size-5 ml-2">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </Link>
              <Link
                href="/contact-us"
                data-hover="Contact Support"
                className="btn
                !inline-flex items-center justify-center gap-2
                [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0
                !text-(--maincolor)
                text-lg
                font-semibold
                whitespace-nowrap
                h-14
                px-6 lg:px-8
                bg-white
                border-1
                border-(--maincolor)
                before:bg-white
                before:border-none"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="size-5 mr-2">
                  <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>
                </svg>
                Contact Support
              </Link>
            </div>
            <p className="mt-10 !text-sm text-slate-500 max-w-lg mx-auto">Results are for informational screening and do not
              replace emergency care. Contact your GP or emergency services for urgent symptoms.</p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden transition-transform duration-300 translate-y-0">
        <div className="bg-white border-t border-slate-200 px-4 py-3 shadow-lg">
          <Link
            href="/all-test-kits"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 px-4 w-full bg-[#E07A5F] hover:bg-[#D06A4F] text-white py-6 text-base font-semibold rounded-xl shadow-lg">Browse Kits
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="lucide lucide-arrow-right w-5 h-5 ml-2">
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </Link>
        </div>
      </div>

    </>

  );
}
