"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    FlaskConical,
    Stethoscope,
    ArrowRight,
    CheckCircle2,
    Clock,
    Lock,
    Package,
    Activity,
    Apple,
    Zap,
    Heart,
    HeartPulse,
    ShieldCheck,
    Microscope,
    User,
    Droplets,
    Brain,
    Droplet,
    Target,
    Bug,
    LucideIcon
} from 'lucide-react';
import { motion } from 'framer-motion';

import { useMenuStore } from '@/store/useMenuStore';
import { useEffect } from 'react';
import { TESTING_KITS_SLUG } from '@/lib/constants';
import BloodTestCategoriesSkeleton from './BloodTestCategoriesSkeleton';


const categoryMetadata: Record<string, { description: string; color: string; icon: LucideIcon }> = {
    "general-health": {
        description: "Comprehensive baseline screenings for overall wellness.",
        color: "bg-blue-50 text-blue-600",
        icon: Activity,
    },
    "vitamins-nutrition": {
        description: "Check for deficiencies in Vitamin D, B12, Iron, and more.",
        color: "bg-orange-50 text-orange-600",
        icon: Apple,
    },
    "hormones": {
        description: "Monitor thyroid, testosterone, and other vital hormones.",
        color: "bg-purple-50 text-purple-600",
        icon: Zap,
    },
    "sexual-health": {
        description: "Discreet and professional STI and fertility testing.",
        color: "bg-pink-50 text-pink-600",
        icon: Heart,
    },
    "heart-health": {
        description: "Lipid profiles and markers for cardiovascular risk.",
        color: "bg-red-50 text-red-600",
        icon: HeartPulse,
    },
    "liver-kidney": {
        description: "Essential tests for metabolic and organ function.",
        color: "bg-emerald-50 text-emerald-600",
        icon: Activity,
    },
    "immunology": {
        description: "Allergy testing and immune system response markers.",
        color: "bg-indigo-50 text-indigo-600",
        icon: ShieldCheck,
    },
    "virology": {
        description: "Viral screenings and antibody detection tests.",
        color: "bg-amber-50 text-amber-600",
        icon: Microscope,
    },
    "mens-health": {
        description: "Tailored health screenings specifically for men.",
        color: "bg-cyan-50 text-cyan-600",
        icon: User,
    },
    "womens-health": {
        description: "Comprehensive panels designed for women's wellness.",
        color: "bg-rose-50 text-rose-600",
        icon: User,
    },
    "diabetes": {
        description: "HbA1c and glucose monitoring for diabetes risk.",
        color: "bg-violet-50 text-violet-600",
        icon: Droplets,
    },
    "brain-health": {
        description: "Monitor cortisol and markers related to stress.",
        color: "bg-slate-50 text-slate-600",
        icon: Brain,
    },
    "haematology": {
        description: "Complete blood count and blood cell analysis.",
        color: "bg-red-50 text-red-600",
        icon: Droplet,
    },
    "biochemistry": {
        description: "Chemical analysis of blood components.",
        color: "bg-(--blockground) text-(--btncolor)",
        icon: FlaskConical,
    },
    "tumour-markers": {
        description: "Screening for cancer-related biomarkers.",
        color: "bg-purple-50 text-purple-600",
        icon: Target,
    },
    "infection-sciences": {
        description: "Testing for bacterial and viral infections.",
        color: "bg-yellow-50 text-yellow-600",
        icon: Bug,
    },
    "gastrointestinal": {
        description: "Digestive system health markers.",
        color: "bg-green-50 text-green-600",
        icon: Activity,
    }
};

const defaultMetadata = {
    description: "Professional at-home testing kit with laboratory analysis.",
    color: "bg-gray-50 text-gray-600",
    icon: FlaskConical
};

// Helper function to get category image path
const getCategoryImagePath = (categorySlug: string) => {
    // Convert slug to match image file naming (CamelCase)
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
    className,
    background = false
}: {
    slug: string;
    name: string;
    fallbackIcon: React.ElementType;
    className?: string;
    background?: boolean;
}) => {
    const [imageError, setImageError] = React.useState(false);
    const imagePath = getCategoryImagePath(slug);

    if (imageError || !imagePath) {
        if (background) return null;
        return <FallbackIcon className={className || "size-7"} />;
    }

    return (
        <Image
            src={imagePath}
            alt={name}
            fill
            className="object-contain"
            onError={() => setImageError(true)}
        />
    );
};

const features = [
    {
        icon: Package,
        title: "Discreet Delivery",
        desc: "Plain packaging delivered to your door within 24-48 hours."
    },
    {
        icon: FlaskConical,
        title: "Accredited Labs",
        desc: "All samples are processed in ISO-certified clinical laboratories."
    },
    {
        icon: Clock,
        title: "Fast Results",
        desc: "Online results typically available within 2-5 working days."
    },
    {
        icon: Lock,
        title: "Secure & Private",
        desc: "Your data is encrypted and results are strictly confidential."
    }
];

export default function BloodTestCategories() {
    const { menuData, fetchMenu } = useMenuStore();

    useEffect(() => {
        if (menuData.length === 0) {
            fetchMenu();
        }
    }, [fetchMenu, menuData.length]);

    // Find the testing-kits category or use all subcategories from any physical category
    const physicalCategory = menuData.find(c => c.slug === TESTING_KITS_SLUG || c.type === 'physical');
    const categories = physicalCategory?.subcategories || [];

    const { isLoading } = useMenuStore();

    if (isLoading && menuData.length === 0) {
        return <BloodTestCategoriesSkeleton />;
    }

    return (
        <div className="bg-white">
            {/* Hero Section */}
            <section className="relative min-h-[600px] lg:min-h-[750px] flex items-center overflow-hidden py-12 md:pt-[115px] md:pb-16">
                <div className="absolute inset-0 z-0 text-white">
                    <Image
                        src="/images/blood_testing_landing_hero.png"
                        alt="Modern Laboratory"
                        fill
                        className="object-cover object-right md:object-center"
                        priority
                    />
                    {/* Modern Overlays for better depth and readability */}
                    <div className="absolute inset-0 bg-white/80 md:bg-white/40 md:bg-gradient-to-r from-[#ECEBE9] via-white/95 to-transparent z-10" />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/40 md:hidden z-10" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(12,32,59,0.05),transparent_50%)] z-10" />
                </div>

                <div className="container relative z-30">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            className="space-y-2 md:space-y-3 text-center sm:text-left"
                        >
                            <h1 className="text-(--maincolor) text-[30px] md:text-[32px] lg:text-5xl font-bold leading-[1.2] mb-6">
                                Precision Health,
                                <span className="text-(--btncolor) block">Delivered With Care</span>
                            </h1>

                            <div className="text-(--maincolor) text-base/6 md:text-lg lg:text-lg font-normal lg:max-w-xl mb-8">
                                Take control of your wellbeing with our comprehensive range of at-home testing kits. Professional analysis, fast results, and complete privacy.
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 mb-5 lg:mb-10">
                                <Link
                                    href={`/${TESTING_KITS_SLUG}/categories#categories`}
                                    data-hover="Browse All Kits"
                                    className="btn btn-primary
                                        h-14 px-6 lg:px-8
                                        bg-(--btncolor)
                                        text-lg
                                        before:bg-(--btncolor)/90
                                        before:border-(--btncolor)"
                                >
                                    Browse All Kits
                                </Link>
                                <Link
                                    href="#categories"
                                    data-hover="View Categories"
                                    className="btn
                                        h-14 px-6 lg:px-8
                                        bg-(--background)
                                        !text-(--maincolor)
                                        text-lg
                                        shadow-sm
                                        before:bg-(--background)/90
                                        before:border-(--background)"
                                >
                                    View Categories
                                </Link>
                            </div>

                            <div className="hidden md:flex justify-center md:justify-start items-center gap-4">
                                <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/50 border border-white/60 shadow-sm backdrop-blur-sm">
                                    <Lock size={15} className="text-(--btncolor)" />
                                    <span className="text-sm text-slate-700">Private & secure</span>
                                </div>
                                <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/50 border border-white/60 shadow-sm backdrop-blur-sm">
                                    <Clock size={15} className="text-(--btncolor)" />
                                    <span className="text-sm text-slate-700">Results in 2-5 days</span>
                                </div>
                                <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/50 border border-white/60 shadow-sm backdrop-blur-sm">
                                    <CheckCircle2 size={15} className="text-(--btncolor)" />
                                    <span className="text-sm text-slate-700">ISO-certified labs</span>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="relative"
                        >
                            <div className="bg-white/90 backdrop-blur-2xl rounded-3xl sm:rounded-4xl border border-white shadow-[0_32px_64px_-16px_rgba(12,32,59,0.15)] p-6 sm:p-10 max-w-[540px] lg:max-w-none">
                                <div className="flex items-start justify-between mb-10">
                                    <div>
                                        <h6 className="text-(--maincolor) text-3xl sm:text-4xl font-bold">10,000+</h6>
                                        <p className="!text-sm font-normal text-gray-500 mt-1">Tests processed monthly</p>
                                    </div>
                                    <div className="size-16 rounded-2xl bg-(--maincolor) text-white flex items-center justify-center shadow-2xl rotate-4">
                                        <Stethoscope size={32} />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {[
                                        { title: "Order online", desc: "Choose your kit, discreetly delivered." },
                                        { title: "Collect at home", desc: "Simple finger-prick sample technique." },
                                        { title: "Expert insights", desc: "Lab-certified results and analysis." }
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-5">
                                            <div className="size-12 rounded-md bg-(--blockground) text-(--maincolor) flex items-center justify-center shrink-0">
                                                <CheckCircle2 className='size-6' size={20} />
                                            </div>
                                            <div>
                                                <p className="!text-lg font-semibold text-(--maincolor)">{item.title}</p>
                                                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>


                            </div>

                            {/* Decorative element */}
                            <div className="absolute -z-10 -bottom-10 -right-10 w-64 h-64 bg-(--btncolor)/10 blur-[100px] rounded-full" />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Trust Stats/Features */}
            <section className="py-12 md:py-16 bg-(--blockground) border-y border-gray-100">
                <div className="container">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, idx) => (
                            <div key={idx} className="flex flex-col items-center text-center space-y-3 md:space-y-5">
                                <div className="text-(--maincolor) flex items-center justify-center size-19 p-3 bg-white rounded-full shadow-sm">
                                    <feature.icon size={30} />
                                </div>
                                <h3 className="text-lg font-semibold text-(--maincolor) mb-2 group-hover:text-(--btncolor) transition-colors">{feature.title}</h3>
                                <p className="!text-[15px] text-slate-600">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Categories Grid */}
            <section id="categories" className="py-12 lg:py-20 bg-white">
                <div className="container">
                    <div className="text-center mb-8 lg:mb-12">
                        <h2 className="text-(--maincolor) text-2xl/8 lg:text-3xl font-bold">Explore Our Test Categories</h2>
                        <p className="text-(--maincolor) !text-lg/6 font-normal lg:mt-3 max-w-2xl mx-auto">
                            Choose from our wide range of specialized testing panels designed to give you deep insights into your health.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-6">
                        {categories.map((cat, idx) => {
                            const meta = categoryMetadata[cat.slug] || defaultMetadata;

                            return (
                                <motion.div
                                    key={cat.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <Link
                                        href={`/${TESTING_KITS_SLUG}/${cat.slug}`}
                                        className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-[#0F4C5C]/20 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden h-full flex flex-col"
                                    >
                                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 ${meta.color} p-2`}>
                                            <div className="relative w-full h-full">
                                                <CategoryIcon
                                                    slug={cat.slug}
                                                    name={cat.name}
                                                    fallbackIcon={meta.icon}
                                                />
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-semibold text-(--maincolor) mb-2 group-hover:text-(--btncolor) transition-colors">
                                            {cat.name}
                                        </h3>
                                        <p className="text-slate-600 leading-relaxed mb-5 flex-grow">
                                            {meta.description}
                                        </p>
                                        <div className="flex items-center text-(--btncolor) font-medium text-sm">
                                            Explore Kits <ArrowRight className='size-4 ml-2 group-hover:translate-x-1 transition-transform' />
                                        </div>

                                        {/* Subtle Background Pattern */}
                                        <div className="absolute -right-8 -bottom-8 w-32 h-32 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                                            <CategoryIcon
                                                slug={cat.slug}
                                                name={cat.name}
                                                fallbackIcon={meta.icon}
                                                background
                                            />
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* How it Works */}
            <section className="py-12 lg:py-20 bg-(--maincolor)">
                <div className="container">
                    <div className="max-w-5xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="text-center mb-20"
                        >
                            <h2 className="text-white text-2xl/8 lg:text-3xl font-bold">How It Works</h2>
                            <p className="text-white/80 !text-lg leading-relaxed">Four simple steps to health insights.</p>
                        </motion.div>

                        <div className="grid md:grid-cols-4 gap-12 relative">
                            {[
                                { step: "01", title: "Order Online", desc: "Select your kit and order securely." },
                                { step: "02", title: "Collect Sample", desc: "Simple finger-prick at home." },
                                { step: "03", title: "Post to Lab", desc: "Free return trackable delivery." },
                                { step: "04", title: "View Results", desc: "Secure online results in days." }
                            ].map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: idx * 0.15 }}
                                    className="relative flex flex-col items-center text-center group"
                                >
                                    <div className="text-5xl font-black text-white/10 absolute -top-8 left-1/2 -translate-x-1/2 transition-all duration-300 group-hover:text-white/20 group-hover:-translate-y-2">
                                        {item.step}
                                    </div>
                                    <div className="size-18 rounded-full bg-(--btncolor) flex items-center justify-center mb-6 shadow-lg z-10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                                        <CheckCircle2 className='size-7 text-(--maincolor)' size={32} />
                                    </div>
                                    <h3 className="text-white text-lg font-bold mb-3 group-hover:text-(--btncolor) transition-colors">{item.title}</h3>
                                    <p className="text-gray-400">{item.desc}</p>
                                </motion.div>
                            ))}

                            {/* Connector lines (desktop only) */}
                            <motion.div
                                initial={{ scaleX: 0 }}
                                whileInView={{ scaleX: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1, delay: 0.5, ease: "easeInOut" }}
                                className="hidden md:block absolute top-8 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent origin-left"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-12 lg:py-20 overflow-hidden">
                <div className="container">
                    <div className="bg-(--btncolor) rounded-3xl p-6 md:p-16 relative overflow-hidden">
                        <div className="text-white text-center max-w-4xl mx-auto relative z-10">
                            <h2 className="text-3xl md:text-5xl font-bold mb-4">Ready to take the first step towards better health?</h2>
                            <p className="text-white/90 !text-lg mb-10">
                                Join thousands of people who use GHC to monitor their health from the comfort of their home.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href={`/${TESTING_KITS_SLUG}/categories#categories`}
                                    data-hover="Start Your Journey"
                                    className="btn
                                        !inline-flex items-center justify-center gap-3
                                        [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0
                                        h-14
                                        px-6 lg:px-8
                                        bg-(--maincolor)
                                        text-lg
                                        before:bg-(--maincolor)
                                        before:border-(--maincolor)"
                                >
                                    <span>Start Your Journey</span> <ArrowRight size={20} />
                                </Link>
                                <Link
                                    href="/contact-us"
                                    data-hover="Contact a Specialist"
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
                                        border-white
                                        before:bg-white
                                        before:border-none"
                                >
                                    Contact a Specialist
                                </Link>
                            </div>
                        </div>

                        {/* Abstract Shapes */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-32 -mb-32 blur-3xl" />
                    </div>
                </div>
            </section>
        </div>
    );
}
