"use client";

import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay, EffectFade } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import TypingAnimation from "./TypingAnimation";
import Link from "next/link";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

interface Slide {
  id: number;
  title: string;
  titleAnimate: string;
  subtitle: string;
  features: string[];
  description: string;
  buttonText: string;
  buttonLink: string;
}

interface BannerProps {
  slides?: Slide[];
  autoplayDelay?: number;
  typingSpeed?: number;
  showNavigation?: boolean;
  showPagination?: boolean;
  loop?: boolean;
  effect?: "slide" | "fade";
  fadeSpeed?: number;
}

const defaultSlides: Slide[] = [
  {
    id: 1,
    title: "",
    titleAnimate: "Test Your Health From Home",
    subtitle: "At-Home Blood Testing Kits, Delivered Across Ireland",
    features: [
      "Simple finger-prick sample collection at home",
      "Analysed in INAB-accredited Irish laboratories",
      "Results reviewed by IMC-registered doctors",
      "Discreet, unbranded packaging with free delivery",
      "Secure online results within days",
    ],
    description: "*BLOOD TESTING KITS FROM €39 — FREE TRACKED DELIVERY",
    buttonText: "Shop testing kits",
    buttonLink: "/testing-kits/categories",
  },
  {
    id: 2,
    title: "Know Your Numbers with ",
    titleAnimate: "Doctor-Reviewed Results.",
    subtitle: "Laboratory-Grade Accuracy Without the Waiting Room",
    features: [
      "Vitamin, thyroid, cholesterol & hormone panels",
      "Same clinical analysers used by hospitals",
      "Every report signed off by a doctor",
      "Flagged results come with clear next steps",
      "Track your biomarkers over time in your account",
    ],
    description: "",
    buttonText: "Browse all kits",
    buttonLink: "/testing-kits",
  },
  {
    id: 3,
    title: "Feeling Tired, Run Down ",
    titleAnimate: "or Just Curious?",
    subtitle: "Find the Right Test for Your Symptoms",
    features: [
      "Fatigue & low energy — Vitamin D, B12 & Iron",
      "Weight & mood changes — Thyroid function",
      "Heart health — Full cholesterol profile",
      "Discreet sexual health screening",
      "Kits from €39 with results in 1-3 days",
    ],
    description: "",
    buttonText: "Find your test",
    buttonLink: "/testing-kits/categories",
  },
];

export default function HeroBanner({
  slides = defaultSlides,
  autoplayDelay = 6000,
  typingSpeed = 80,
  showNavigation = false,
  showPagination = false,
  loop = true,
  effect = "fade",
  fadeSpeed = 2000,
}: BannerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);

  const handleSlideChange = (swiper: SwiperType) => {
    setActiveIndex(swiper.realIndex);
  };

  return (
    <>
      <section className="relative flex w-full flex-col bg-[#E7E9ED] md:grid md:grid-cols-2 md:min-h-screen">
        {/* Mobile image */}
        <div className="relative order-1 aspect-[4/3] w-full shrink-0 overflow-hidden sm:aspect-[5/4] md:hidden">
          <img
            className="absolute inset-0 h-full w-full object-cover object-center"
            src="/images/hero-image1.webp"
            alt="Healthcare professional using mobile health app"
          />
        </div>

        {/* Left content — centered block, equal inset, left-aligned text */}
        <div className="relative z-10 order-2 flex w-full min-w-0 items-center justify-center md:order-1 md:min-h-screen">
          <div className="box-border w-full max-w-3xl px-5 py-10 sm:px-6 sm:py-12 md:px-8 md:py-14 md:pt-28 lg:px-10 lg:py-16 lg:pt-32 xl:max-w-[44rem] xl:px-12">
            <div className="w-full overflow-hidden">
            <Swiper
              modules={[Navigation, Pagination, Autoplay, EffectFade]}
              spaceBetween={0}
              slidesPerView={1}
              effect={effect}
              fadeEffect={{
                crossFade: true,
              }}
              autoHeight
              watchOverflow
              navigation={
                showNavigation
                  ? {
                      nextEl: ".banner-button-next",
                      prevEl: ".banner-button-prev",
                    }
                  : false
              }
              pagination={
                showPagination
                  ? {
                      el: ".banner-pagination",
                      clickable: true,
                      renderBullet: (index, className) => {
                        return `<span class="${className} banner-pagination-bullet"></span>`;
                      },
                    }
                  : false
              }
              autoplay={{
                delay: autoplayDelay,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              loop={loop}
              speed={fadeSpeed}
              onSwiper={setSwiperInstance}
              onSlideChange={handleSlideChange}
              className="hero-banner-swiper w-full"
            >
              {slides.map((slide, index) => (
                <SwiperSlide key={slide.id}>
                  <div className="flex w-full flex-col items-start space-y-3 text-left sm:space-y-4 md:space-y-5 lg:space-y-6">
                    <h1 className="w-full text-[1.75rem] font-bold leading-snug text-(--maincolor) sm:text-4xl md:text-4xl lg:text-[2.75rem] lg:leading-tight xl:text-5xl">
                      {slide.title && <span>{slide.title}</span>}
                      {activeIndex === index ? (
                        <TypingAnimation
                          text={slide.titleAnimate}
                          speed={typingSpeed}
                        />
                      ) : (
                        <span>{slide.titleAnimate}</span>
                      )}
                    </h1>

                    <h6 className="text-lg font-normal text-slate-700 sm:text-xl md:text-2xl lg:text-2xl">
                      {slide.subtitle}
                    </h6>

                    <ul className="w-full space-y-1.5 sm:space-y-2.5 md:space-y-3">
                      {slide.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 text-(--maincolor) sm:gap-3"
                        >
                          <span className="mt-0.5 shrink-0 text-(--btncolor) sm:mt-1">
                            <img src="/images/arrow_bnr_cont.svg" alt="" className="h-4 w-4 sm:h-5 sm:w-5" />
                          </span>
                          <span className="text-base sm:text-lg lg:text-xl">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {slide.description && (
                      <p className="mt-4 text-base text-gray-600 sm:mt-5 sm:text-lg">
                        {slide.description}
                      </p>
                    )}

                    <div className="mt-5 sm:mt-6">
                      <Link
                        href={slide.buttonLink}
                        data-hover={slide.buttonText}
                        className="
                          relative inline-grid place-items-center
                          px-5 py-2.5 sm:px-7 sm:py-3
                          shadow-lg rounded-lg
                          bg-(--btncolor) text-white text-base font-normal sm:text-lg
                          overflow-hidden transition-background duration-300
                          before:content-[attr(data-hover)]
                          before:absolute before:inset-0
                          before:grid before:place-items-center
                          before:bg-(--maincolor)
                          before:border before:border-1 before:border-(--maincolor)
                          before:translate-y-full
                          before:transition-transform before:duration-700
                          before:ease-[cubic-bezier(0.77,0,0.175,1)]"
                      >
                        {slide.buttonText}
                      </Link>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
            </div>
          </div>
        </div>

        {/* Desktop image */}
        <div className="relative order-3 hidden overflow-hidden md:order-2 md:block md:min-h-screen">
          <img
            className="absolute inset-0 h-full w-full object-cover object-[62%_center]"
            src="/images/hero-image1.webp"
            alt="Healthcare professional using mobile health app"
          />
        </div>

        <div className="hidden md:block absolute left-0 right-0 bottom-8 w-20 mx-auto text-center z-20 pointer-events-none">
          <Link
            href="#service_part"
            className="flex items-center justify-center pointer-events-auto"
          >
            <img
              src="/images/slider-scroll-down.gif"
              className="max-w-full"
              alt="scroll to stories"
            />
          </Link>
        </div>
      </section>
    </>
  );
}
