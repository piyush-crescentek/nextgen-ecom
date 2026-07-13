"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, ChevronDown, User, X } from "lucide-react";

import { getMockRelatedProducts } from "@/lib/mock-data";
import ProductGrid, { Product as GridProduct } from "./ProductGrid";
import { Product } from "@/lib/types";
import { isOccupationalHealthCategory } from "@/lib/oh-prices";
import {
  getProductPricingOptions,
  hasProductPricingOptions,
} from "@/lib/pricing-options";
import ProductDetailPricingList from "./ProductDetailPricingList";
import PhysicalProducts from "../physical-products/PhysicalProducts";
import { isVisible, getRestrictionMessage } from "@/lib/visibility";
import BusinessGroupBadge from "./BusinessGroupBadge";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";

export default function ProductDetail({
  product,
  initialRelatedProducts = [],
}: {
  product: Product;
  initialRelatedProducts?: GridProduct[];
}) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("0");
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<GridProduct[]>(initialRelatedProducts);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const [selectedOhRole, setSelectedOhRole] = useState<
    "employer" | "employee" | null
  >(null);
  const { user } = useAuthStore();
  const lastFetchedIdsRef = useRef<string>("");

  useEffect(() => {
    if (
      product.category_slug === "occupational-health" &&
      product.oh_form_recipient &&
      product.oh_form_recipient !== "both"
    ) {
      setSelectedOhRole(product.oh_form_recipient as "employer" | "employee");
    }
  }, [product.oh_form_recipient, product.category_slug]);

  useEffect(() => {
    const idsString = JSON.stringify(product.related_product_ids);
    // Server provided initial related products for this product — skip client refetch
    // until the slug changes (lastFetchedIdsRef stays empty after server-side hydration).
    if (initialRelatedProducts.length > 0 && lastFetchedIdsRef.current === "") {
      lastFetchedIdsRef.current = idsString;
      return;
    }

    // Static mock data — no API call is made.
    if (
      !product.related_product_ids ||
      product.related_product_ids.length === 0 ||
      idsString === lastFetchedIdsRef.current
    )
      return;

    lastFetchedIdsRef.current = idsString;
    setIsLoadingRelated(true);
    setRelatedProducts(getMockRelatedProducts(product.related_product_ids) as GridProduct[]);
    setIsLoadingRelated(false);
  }, [product.related_product_ids, initialRelatedProducts]);

  const product_display = product?.product_display;
  if (!product_display) return null;

  const showOhPrices =
    isOccupationalHealthCategory(product.category_slug) &&
    (product.oh_prices?.length ?? 0) > 0;
  const formPricingOptions = !showOhPrices
    ? getProductPricingOptions(product)
    : [];
  const showFormPricing = !showOhPrices && hasProductPricingOptions(product);
  const showTieredPricing = showOhPrices || showFormPricing;
  const priceCurrency = product_display.price_range.currency || "€";

  const images = product_display.slider_images || [];
  const badges = product_display.badges || [];
  const badgeColumns =
    badges.length >= 4
      ? 4
      : badges.length === 3
        ? 3
        : badges.length === 2
          ? 2
          : 1;
  const badgeGridCols =
    badgeColumns === 4
      ? "lg:grid-cols-2 2xl:grid-cols-4"
      : badgeColumns === 3
        ? "lg:grid-cols-3"
        : badgeColumns === 2
          ? "lg:grid-cols-2"
          : "lg:grid-cols-1";
  const highlights = product_display.highlights || [];
  const sections = product_display.sections || [];
  const processCards = product_display.process_cards;
  const faq = product_display.faq;

  const handleThumbnailClick = (index: number) => {
    setActiveIndex(index);
  };

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleConsultationClick = (
    e: React.MouseEvent,
    role?: "employer" | "employee",
  ) => {
    e.preventDefault();

    if (!isVisible(product, user?.business_group)) {
      toast.error(getRestrictionMessage());
      return;
    }

    // Role-based access control for Occupational Health
    if (user && product.category_slug === "occupational-health" && role) {
      if (role === "employer" && Number(user.customer_type) !== 2) {
        toast.error("Access Denied", {
          description:
            "Your account is registered as an Employee. Only Employers can access the Employer referral form.",
          duration: 6000,
        });
        return;
      }
      if (role === "employee" && Number(user.customer_type) === 2) {
        toast.error("Access Denied", {
          description:
            "Your account is registered as an Employer. Please use the Employer referral form for Occupational Health.",
          duration: 6000,
        });
        return;
      }
    }

    if (typeof window !== "undefined" && product.slug) {
      const sessionId = crypto.randomUUID();
      sessionStorage.setItem(`form_access_${sessionId}`, "true");

      let formIdToUse = product.form_id;

      if (
        product.category_slug === "occupational-health" &&
        role &&
        product.oh_forms
      ) {
        const specificForm = product.oh_forms.find((f) => f.type === role);
        if (specificForm) {
          formIdToUse = specificForm.id;
        }
      }

      sessionStorage.setItem(`form_id_${sessionId}`, String(formIdToUse));
      if (role) {
        sessionStorage.setItem(`oh_role_${sessionId}`, role);
      }
      let categoryPath = product.subcategory_slug || product.category_slug;
      if (
        categoryPath === "online-gp-appointment" &&
        product.slug === "online-gp-appointment"
      ) {
        categoryPath = "online-gp";
      }
      router.push(
        `/${categoryPath}/${product.slug}/form?sessionId=${sessionId}`,
      );
    }
  };

  if (
    product.type === "physical" ||
    product.category_name.toLowerCase().includes("kit")
  ) {
    return <PhysicalProducts product={product} />;
  }

  return (
    <>
      {/* Banner */}
      <div className="flex md:items-center md:flex-row flex-col bg-[#E7E9ED] md:pt-[115px] relative md:before:absolute md:before:top-0 md:before:left-0 md:before:w-1/2 md:before:h-full md:before:bg-(--foreground)">
        <div className="md:container mx-auto h-full">
          <div className="flex flex-col md:flex-row justify-end w-full h-full">
            <div className="w-full md:w-1/2 h-full bg-(--foreground) md:bg-transparent">
              <div className="p-6 lg:py-8 xl:pr-[140px]">
                <nav aria-label="Breadcrumb" className="flex mb-12 relative">
                  <ol
                    role="list"
                    className="flex items-center flex-wrap gap-x-2 text-sm md:text-base font-medium"
                  >
                    {/* Breadcrumbs */}
                    <li>
                      <Link
                        href="/"
                        className="text-(--maincolor) hover:underline transition-all"
                      >
                        Home
                      </Link>
                    </li>
                    <li className="flex items-center gap-x-2">
                      <span className="text-gray-400 font-normal">/</span>
                      <Link
                        href={`/${product.category_slug || "#"}`}
                        className="text-(--maincolor) hover:underline transition-all"
                      >
                        {product.category_name}
                      </Link>
                    </li>
                    {product.subcategory_name && (
                      <li className="flex items-center gap-x-2">
                        <span className="text-gray-400 font-normal">/</span>
                        <Link
                          href={`/${product.category_slug}/${product.subcategory_slug || "#"}`}
                          className="text-(--maincolor) hover:underline transition-all"
                        >
                          {product.subcategory_name}
                        </Link>
                      </li>
                    )}
                    <li
                      className="flex items-center gap-x-2"
                      aria-current="page"
                    >
                      <span className="text-gray-400 font-normal">/</span>
                      <span className="text-gray-500 font-normal line-clamp-1">
                        {product.name}
                      </span>
                    </li>
                  </ol>
                </nav>

                {/* Main Slider */}
                <div
                  className="relative rounded-xl overflow-hidden shadow-2xl cursor-pointer group/image"
                  onClick={() => setIsFullScreen(true)}
                >
                  <div className="aspect-3/2 relative">
                    {images.length > 0 && (
                      <Image
                        src={images[activeIndex].imgUrl}
                        alt={images[activeIndex].altText || product.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover/image:scale-105"
                        priority
                      />
                    )}
                  </div>
                  {/* Hover overlay hint */}
                  <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 bg-white/90 rounded-full p-3 shadow-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                        className="size-6 text-gray-800"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Thumbnail Slider */}
                <div className="w-full mt-5 relative">
                  <div className="flex gap-3 overflow-x-auto pb-5 scrollbar-hide">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => handleThumbnailClick(index)}
                        className={`flex-shrink-0 relative group transition-all duration-300 ${
                          activeIndex === index ? "ring-0 scale-105" : "ring-0"
                        } rounded-lg overflow-hidden`}
                      >
                        <div className="size-20 lg:w-32 lg:h-32 relative">
                          <Image
                            src={image.imgUrl}
                            alt={image.altText || `Thumbnail ${index + 1}`}
                            fill
                            className={`object-cover transition-all duration-300 ${
                              activeIndex === index
                                ? "brightness-100"
                                : "brightness-50 group-hover:brightness-75"
                            }`}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full md:w-1/2 h-full">
              <div className="flex flex-col items-start justify-center h-full p-6 lg:pt-8 lg:pb-20 xl:pl-[140px] overflow-hidden">
                <div className="space-y-3 md:space-y-5 text-center sm:text-left">
                  <div className="mb-1.5 w-full">
                    <h1 className="text-(--maincolor) text-2xl lg:text-3xl font-bold leading-tight whitespace-normal inline-block align-middle">
                      {product.name}
                    </h1>
                  </div>
                  <div className="text-(--maincolor) text-base/6 font-normal">
                    {product_display.short_description}
                  </div>

                  {/* Price */}
                  <div className="flex flex-col items-center sm:items-start gap-4 w-full">
                    {showTieredPricing ? (
                      <ProductDetailPricingList
                        ohPrices={showOhPrices ? product.oh_prices : undefined}
                        pricingOptions={
                          showFormPricing ? formPricingOptions : undefined
                        }
                        currency={priceCurrency}
                      />
                    ) : (
                      <h6 className="text-(--maincolor) text-xl md:text-2xl font-bold flex items-center gap-3 flex-shrink-0">
                        <span className="amount">
                          <bdi>
                            <span className="currencySymbol">{priceCurrency}</span>
                            {product_display.price_range.min}
                          </bdi>
                        </span>

                        {product_display.price_range.min !==
                          product_display.price_range.max && (
                          <>
                            <span>–</span>
                            <span className="amount">
                              <bdi>
                                <span className="currencySymbol">
                                  {priceCurrency}
                                </span>
                                {product_display.price_range.max}
                              </bdi>
                            </span>
                          </>
                        )}
                      </h6>
                    )}
                    <BusinessGroupBadge
                      product={product}
                      className="align-top inline-flex"
                    />
                  </div>
                  <div className="w-full border-y border-[#BFC8C6] py-5 mb-5">
                    <div
                      className={`w-full max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 ${badgeGridCols} gap-y-6 gap-x-2 lg:gap-y-4 lg:gap-x-0`}
                    >
                      {badges.map((badge, idx) => {
                        const isLastInLgRow =
                          badgeColumns === 4
                            ? idx % 2 === 1
                            : idx % badgeColumns === badgeColumns - 1;
                        const isLastIn2xlRow =
                          badgeColumns === 4 ? idx % 4 === 3 : isLastInLgRow;
                        return (
                          <div
                            key={idx}
                            className={`min-w-0 w-full h-full flex flex-col items-center justify-start gap-2 text-center px-2 sm:px-3 lg:px-4 py-2 ${
                              badgeColumns > 1 && !isLastInLgRow
                                ? "lg:border-r lg:border-[#BFC8C6]"
                                : ""
                            } ${
                              badgeColumns === 4
                                ? isLastIn2xlRow
                                  ? "2xl:border-r-0"
                                  : "2xl:border-r 2xl:border-[#BFC8C6]"
                                : ""
                            }`}
                          >
                            <div className="size-10 relative flex items-center justify-center mx-auto">
                              <Image
                                src={badge.imgUrl}
                                alt={badge.title}
                                width={40}
                                height={40}
                                className="object-contain"
                              />
                            </div>
                            <p className="w-full text-(--maincolor) text-xs sm:text-sm lg:text-base font-medium leading-snug break-words text-center">
                              {badge.title}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Highlights as Bullets */}
                  <ul className="text-(--maincolor) text-lg/8 text-left space-y-2 pb-8 w-full">
                    {highlights.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        <span className="size-2 rounded-full bg-(--maincolor) shrink-0" />
                        <span className="text-base lg:text-lg font-medium">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {product.category_slug === "occupational-health" &&
                  product.oh_form_recipient ? (
                    <div className="w-full">
                      <div className="text-center mb-5">
                        <h3 className="text-(--maincolor) text-xl font-bold mb-1">
                          Who are you?
                        </h3>
                        <p className="text-(--textcolor) text-sm">
                          Select your role to proceed with the appropriate
                          referral form
                        </p>
                      </div>
                      <div
                        className={`grid gap-4 ${
                          product.oh_form_recipient === "both"
                            ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-1 2xl:grid-cols-2"
                            : "grid-cols-1"
                        }`}
                      >
                        {(product.oh_form_recipient === "both" ||
                          product.oh_form_recipient === "employer") && (
                          <button
                            type="button"
                            id="oh-role-employer"
                            onClick={() => {
                              setSelectedOhRole("employer");
                            }}
                            disabled={!isVisible(product, user?.business_group)}
                            className={`group flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer text-left w-full ${
                              selectedOhRole === "employer"
                                ? "border-(--maincolor) bg-(--maincolor)/5 shadow-md"
                                : "border-gray-200 hover:border-(--maincolor)/60 hover:shadow-sm bg-white"
                            } ${!isVisible(product, user?.business_group) ? "opacity-50 grayscale cursor-not-allowed" : ""}`}
                          >
                            <div
                              className={`shrink-0 size-11 rounded-lg flex items-center justify-center transition-colors ${
                                selectedOhRole === "employer"
                                  ? "bg-(--maincolor) text-white"
                                  : "bg-gray-100 text-(--maincolor) group-hover:bg-(--maincolor)/10"
                              }`}
                            >
                              <Briefcase className="size-5" />
                            </div>
                            <div>
                              <p className="text-(--maincolor) font-bold text-base leading-tight">
                                I&apos;m an Employer
                              </p>
                              <p className="text-(--textcolor) text-xs mt-0.5 leading-snug">
                                Submit a referral for your employee&apos;s OH
                                assessment
                              </p>
                            </div>
                          </button>
                        )}
                        {(product.oh_form_recipient === "both" ||
                          product.oh_form_recipient === "employee") && (
                          <button
                            type="button"
                            id="oh-role-employee"
                            onClick={() => {
                              setSelectedOhRole("employee");
                            }}
                            disabled={!isVisible(product, user?.business_group)}
                            className={`group flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer text-left w-full ${
                              selectedOhRole === "employee"
                                ? "border-(--maincolor) bg-(--maincolor)/5 shadow-md"
                                : "border-gray-200 hover:border-(--maincolor)/60 hover:shadow-sm bg-white"
                            } ${!isVisible(product, user?.business_group) ? "opacity-50 grayscale cursor-not-allowed" : ""}`}
                          >
                            <div
                              className={`shrink-0 size-11 rounded-lg flex items-center justify-center transition-colors ${
                                selectedOhRole === "employee"
                                  ? "bg-(--maincolor) text-white"
                                  : "bg-gray-100 text-(--maincolor) group-hover:bg-(--maincolor)/10"
                              }`}
                            >
                              <User className="size-5" />
                            </div>
                            <div>
                              <p className="text-(--maincolor) font-bold text-base leading-tight">
                                I&apos;m an Employee
                              </p>
                              <p className="text-(--textcolor) text-xs mt-0.5 leading-snug">
                                Self-refer for your own occupational health
                                assessment
                              </p>
                            </div>
                          </button>
                        )}
                      </div>
                      {selectedOhRole && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-4"
                        >
                          <button
                            type="button"
                            id="oh-proceed-btn"
                            onClick={(e) =>
                              handleConsultationClick(e, selectedOhRole)
                            }
                            disabled={!isVisible(product, user?.business_group)}
                            data-hover={`Proceed as ${selectedOhRole === "employer" ? "Employer" : "Employee"}`}
                            className={`btn btn-primary w-full h-14 px-6 bg-(--btncolor) text-lg font-semibold before:bg-(--btncolor) before:border-(--btncolor) cursor-pointer ${!isVisible(product, user?.business_group) ? "opacity-50 grayscale" : ""}`}
                          >
                            {!isVisible(product, user?.business_group)
                              ? "Service Unavailable"
                              : `Proceed as ${selectedOhRole === "employer" ? "Employer" : "Employee"}`}
                          </button>
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConsultationClick}
                      disabled={!isVisible(product, user?.business_group)}
                      data-hover={
                        product_display.cta_text ||
                        "Consult Our Doctor For An Online Treatment"
                      }
                      className={`btn btn-primary w-full h-14 px-6 lg:px-5 bg-(--btncolor) text-lg font-semibold before:bg-(--btncolor) before:border-(--btncolor) cursor-pointer ${!isVisible(product, user?.business_group) ? "opacity-50 grayscale" : ""}`}
                    >
                      {!isVisible(product, user?.business_group)
                        ? "Service Unavailable"
                        : product_display.cta_text ||
                          "Consult Our Doctor For An Online Treatment"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Sections */}
      {sections.map((section, idx) => {
        const isMedicalCert = product.category_name
          .toLowerCase()
          .includes("medical certificate");
        return (
          <div key={idx} className="pt-12 lg:pt-20 relative">
            <div className="container">
              <div className="space-y-2 mb-7">
                <h2 className="text-(--maincolor) text-2xl/8 lg:text-3xl font-bold">
                  {section.title}
                </h2>
                <p className="!text-(--textcolor) !text-lg/7">
                  {section.description}
                </p>
              </div>
              {(section.sub_title ||
                section.imageUrl ||
                (section.highlights && section.highlights.length > 0)) && (
                <div
                  className={`flex flex-col lg:flex-row lg:gap-9 gap-7 ${section.imagePosition === "right" ? "lg:flex-row-reverse" : ""}`}
                >
                  <div className="w-full md:max-w-lg lg:max-w-full lg:w-1/2">
                    <div className="block aspect-[16/9] rounded-xl overflow-hidden shadow-lg">
                      {section.imageUrl && (
                        <Image
                          src={section.imageUrl}
                          alt={section.title}
                          width={800}
                          height={450}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </div>
                  <div className="w-full lg:w-1/2">
                    <div className="flex flex-col gap-5">
                      {section.sub_title && (
                        <h3 className="text-(--maincolor) text-2xl/8 lg:text-3xl font-bold">
                          {section.sub_title}
                        </h3>
                      )}

                      {/* Sub-description above highlights if NOT medical certificate */}
                      {section.sub_description && !isMedicalCert && (
                        <p className="!text-(--textcolor) !text-lg/7">
                          {section.sub_description}
                        </p>
                      )}

                      {section.highlights && section.highlights.length > 0 && (
                        <div className="flex flex-col gap-4">
                          {section.highlights_title && (
                            <h4 className="text-(--maincolor) text-xl font-bold">
                              {section.highlights_title}
                            </h4>
                          )}
                          <ul className="text-(--textcolor) text-lg font-normal space-y-4">
                            {section.highlights.map((h, i) => {
                              const parts = h.text.split(":");
                              return (
                                <li key={i} className="flex gap-4 items-start">
                                  <div className="shrink-0 mt-1">
                                    <svg
                                      width="24"
                                      height="24"
                                      viewBox="0 0 28 28"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <rect
                                        width="28"
                                        height="28"
                                        rx="4"
                                        fill="#0C203B"
                                      />
                                      <path
                                        d="M8 14.5L12 18.5L20 9.5"
                                        stroke="white"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </div>
                                  <div className="text-lg/7 !text-[#494949]">
                                    {parts.length > 1 ? (
                                      <>
                                        <span className="font-bold text-[#494949]">
                                          {parts[0]}:
                                        </span>
                                        <span>{parts.slice(1).join(":")}</span>
                                      </>
                                    ) : (
                                      <span>{h.text}</span>
                                    )}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

                      {/* Steps for Medical Certificates */}
                      {section.steps && section.steps.length > 0 && (
                        <div className="flex flex-col gap-6 mt-4">
                          {section.steps.map((step, sIdx) => (
                            <div key={sIdx} className="flex gap-5 items-start">
                              <div className="flex items-center justify-center size-10 rounded-full bg-(--maincolor) text-white font-bold shrink-0">
                                {sIdx + 1}
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-(--maincolor) text-xl font-bold">
                                  {step.title}
                                </h4>
                                <div
                                  className="text-(--textcolor) text-lg/7"
                                  dangerouslySetInnerHTML={{
                                    __html: step.description || "",
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Sub-description below highlights if medical certificate */}
                      {section.sub_description && isMedicalCert && (
                        <p className="!text-(--textcolor) !text-lg/7">
                          {section.sub_description}
                        </p>
                      )}

                      {section.note && (
                        <div
                          className={`p-4 rounded-lg ${isMedicalCert ? "bg-[#F0F7F7] border-l-4 border-(--maincolor)" : "italic"} mt-4`}
                        >
                          <p className="!text-(--textcolor) !text-lg/7">
                            {section.note}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Info Cards (Process Cards) */}
      {processCards && (
        <div className="py-12 lg:py-20 relative">
          <div className="container">
            {processCards.title && (
              <h2 className="text-(--maincolor) text-2xl/8 lg:text-3xl font-bold text-center mb-12">
                {processCards.title}
              </h2>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-7 xl:gap-10">
              {processCards.cards.map((card, idx) => (
                <div
                  key={idx}
                  className="bg-(--blockground) shadow-sm rounded-md px-8 sm:px-13 lg:px-9 xl:px-13 py-10 text-center space-y-4 h-full"
                >
                  <div className="icon relative size-16 mx-auto mb-4">
                    <Image
                      src={card.iconUrl}
                      alt={card.title}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="w-full border-b border-(--maincolor)/20 mx-auto" />
                  <div className="space-y-4">
                    <h4 className="text-(--maincolor) text-xl font-semibold">
                      {card.title}
                    </h4>
                    <div
                      className="!text-(--maincolor) text-base/7 text-center prose prose-sm max-w-none 
                      [&_ul]:!list-disc [&_ul]:!list-outside [&_ul]:text-left [&_ul]:pl-6 [&_ul]:mt-4 
                      [&_li]:!list-disc [&_li]:marker:text-(--maincolor) [&_li]:mb-2 [&_p]:inline"
                      dangerouslySetInnerHTML={{ __html: card.description }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FAQs */}
      {faq && (
        <div className="pt-12 lg:pt-20">
          <div className="container">
            {(faq.title || faq.subtitle) && (
              <div className="flex flex-col mb-7 lg:mb-12">
                {faq.subtitle && (
                  <span className="text-(--maincolor) text-lg capitalize mb-2">
                    {faq.subtitle}
                  </span>
                )}
                {faq.title && (
                  <h2 className="text-(--maincolor) text-2xl/8 lg:text-3xl font-bold">
                    {faq.title}
                  </h2>
                )}
              </div>
            )}
            <div className="flex flex-col lg:flex-row lg:gap-10">
              {/* Tab Buttons */}
              <div className="contents lg:flex flex-col justify-start lg:w-2/5 lg:gap-4">
                {faq.items.map((tab, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveTab(String(idx))}
                    className={`
                      flex text-left px-5 py-4 mt-5 lg:mt-0 rounded-md
                      text-lg lg:text-xl font-bold
                      border border-(--maincolor) lg:border-white
                      transition-all duration-500 cursor-pointer
                      ${
                        activeTab === String(idx)
                          ? "bg-(--maincolor) text-white lg:bg-(--blockground) lg:text-(--maincolor)"
                          : "bg-(--blockground) lg:bg-transparent text-(--maincolor) lg:hover:text-(--maincolor) hover:bg-(--maincolor) hover:text-white lg:hover:bg-(--blockground)"
                      }
                    `}
                  >
                    <span>{tab.question}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content (Accordions) */}
              <div className="contents lg:flex flex-col justify-start lg:w-3/5">
                {faq.items.map((tab, tabIdx) => (
                  <div
                    key={tabIdx}
                    className={`w-full bg-(--blockground) lg:bg-transparent ${activeTab === String(tabIdx) ? "block" : "hidden"}`}
                  >
                    <div className="p-5 lg:p-0">
                      <div className="space-y-3">
                        {tab.sub_items.map((sub, subIdx) => {
                          const globalIdx = tabIdx * 100 + subIdx;
                          return (
                            <div
                              key={subIdx}
                              className="border-b border-gray-300 lg:border-gray-200"
                            >
                              <button
                                onClick={() => toggleAccordion(globalIdx)}
                                className={`w-full pb-4 flex items-center justify-between text-left cursor-pointer transition-colors ${
                                  openIndex === globalIdx
                                    ? "text-(--maincolor)"
                                    : "hover:text-(--maincolor)/60"
                                }`}
                              >
                                <h3 className="text-base lg:text-lg font-semibold text-(--maincolor)">
                                  {sub.question}
                                </h3>
                                <motion.div
                                  animate={{
                                    rotate: openIndex === globalIdx ? 180 : 0,
                                  }}
                                  transition={{ duration: 0.5 }}
                                >
                                  <ChevronDown className="size-7 lg:size-8 lg:bg-(--blockground) lg:border-0 border border-(--maincolor) rounded-full p-1 lg:p-1.5 text-(--maincolor)" />
                                </motion.div>
                              </button>

                              <AnimatePresence initial={false}>
                                {openIndex === globalIdx && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{
                                      duration: 0.5,
                                      ease: "easeInOut",
                                    }}
                                    className="overflow-hidden"
                                  >
                                    <div className="bg-white p-4 rounded-md lg:rounded-none lg:pt-0 lg:px-0 lg:pb-4">
                                      <div
                                        className="text-(--paracolor) text-base leading-relaxed prose max-w-none"
                                        dangerouslySetInnerHTML={{
                                          __html: sub.answer,
                                        }}
                                      />
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
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Related Services */}
      <div className="py-12 lg:py-20">
        <div className="container">
          <h2 className="text-(--maincolor) text-2xl/8 lg:text-3xl font-bold mb-8">
            Related services
          </h2>
          <div className="block w-full">
            {isLoadingRelated ? (
              <div className="py-10 text-center">
                Loading related services...
              </div>
            ) : relatedProducts.length > 0 ? (
              <ProductGrid
                products={relatedProducts}
                categorySlug={product.category_slug}
                categoryId={product.category_id}
              />
            ) : null}
          </div>
        </div>
      </div>

      {/* Newsletter */}
      <div className="bg-(--blockground) py-12 lg:py-20">
        <div className="container">
          <div className="xl:w-3/4 mx-auto text-center pb-8">
            <h2 className="text-(--maincolor) text-2xl/8 md:text-3xl font-bold lg:w-4/5 mx-auto text-center pb-10">
              Get Expert Health Tips from IMC-Registered Doctors. Subscribe to
              Our Newsletter Today!
            </h2>
            <div className="block w-full space-y-8">
              <p className="!text-(--maincolor) text-center">
                Tap into the prevention strategies and tailored health tips to
                fight your prevailing health conditions by signing up for our
                newsletter.
              </p>
              <div className="flex flex-col sm:grid grid-cols-1 sm:grid-cols-2 gap-7">
                <div>
                  <input
                    type="text"
                    placeholder="Name"
                    className="appearance-none rounded-md relative block w-full h-[50px] px-4 py-3 border border-(--maincolor) placeholder-gray-500 text-(--maincolor) focus:outline-none focus:ring-(--maincolor) focus:border-(--maincolor) focus:z-10 text-base"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Email"
                    className="appearance-none rounded-md relative block w-full h-[50px] px-4 py-3 border border-(--maincolor) placeholder-gray-500 text-(--maincolor) focus:outline-none focus:ring-(--maincolor) focus:border-(--maincolor) focus:z-10 text-base"
                  />
                </div>
                <div className="col-span-2 flex items-center justify-center">
                  <button
                    type="submit"
                    data-hover="Register Now"
                    className="btn btn-primary max-w-50 w-full h-14 p-3 bg-(--btncolor) text-base before:bg-(--maincolor) before:border-(--maincolor)"
                  >
                    Register Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Screen Image Modal */}
      <AnimatePresence>
        {isFullScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setIsFullScreen(false)}
          >
            {/* Close button */}
            <button
              onClick={() => setIsFullScreen(false)}
              className="absolute top-4 right-4 z-10 size-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110"
              aria-label="Close full screen"
            >
              <X className="size-6" />
            </button>

            {/* Image counter */}
            <div className="absolute top-4 left-4 z-10 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white font-medium">
              {activeIndex + 1} / {images.length}
            </div>

            {/* Navigation arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIndex((prev) =>
                      prev === 0 ? images.length - 1 : prev - 1,
                    );
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 size-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110"
                  aria-label="Previous image"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2.5"
                    stroke="currentColor"
                    className="size-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 19.5L8.25 12l7.5-7.5"
                    />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIndex((prev) =>
                      prev === images.length - 1 ? 0 : prev + 1,
                    );
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 size-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110"
                  aria-label="Next image"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2.5"
                    stroke="currentColor"
                    className="size-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </button>
              </>
            )}

            {/* Full screen image */}
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="relative max-w-7xl max-h-[90vh] w-full h-full"
              onClick={(e) => e.stopPropagation()}
            >
              {images.length > 0 && (
                <Image
                  src={images[activeIndex].imgUrl}
                  alt={images[activeIndex].altText || product.name}
                  fill
                  className="object-contain"
                  priority
                />
              )}
            </motion.div>

            {/* Thumbnail strip at bottom */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 max-w-4xl w-full px-4">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide justify-center">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveIndex(index);
                      }}
                      className={`flex-shrink-0 relative transition-all duration-300 rounded-lg overflow-hidden ${
                        activeIndex === index
                          ? "ring-2 ring-white scale-110"
                          : "ring-1 ring-white/30 hover:ring-white/60"
                      }`}
                    >
                      <div className="size-16 lg:size-20 relative">
                        <Image
                          src={image.imgUrl}
                          alt={image.altText || `Thumbnail ${index + 1}`}
                          fill
                          className={`object-cover transition-all duration-300 ${
                            activeIndex === index
                              ? "brightness-100"
                              : "brightness-50 hover:brightness-75"
                          }`}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
