import type { Metadata } from "next";
import Link from "next/link";
import { fetchGlobalSeoSettings, fetchSeoSettings } from "@/lib/server-api";
import { buildDynamicPageMetadata } from "@/lib/seo-settings";

export async function generateMetadata(): Promise<Metadata> {
  const [staticSeo, globalSeo] = await Promise.all([
    fetchSeoSettings("Static Pages", "online-partner"),
    fetchGlobalSeoSettings(),
  ]);

  return buildDynamicPageMetadata(staticSeo, globalSeo, {
    title: "Online Partner | NexGen Healthcare",
    description: "Become an online partner with NexGen Healthcare's at-home blood testing kit store.",
    path: "/online-partner",
  });
}

export default function OnlinePartnerPage() {
  const benefits = [
    {
      title: "Trusted Irish Testing Brand",
      description:
        "Offer at-home blood testing kits backed by INAB-accredited laboratories and IMC-registered reviewing doctors.",
    },
    {
      title: "Fast Go-Live Support",
      description:
        "Our team helps you launch quickly with onboarding support, product imagery, campaign assets, and QA checks.",
    },
    {
      title: "Clear Revenue Sharing",
      description:
        "Simple partnership model with transparent reporting on referred kit orders and completed sales.",
    },
  ];

  const partnershipModels = [
    {
      name: "Affiliate Referral Partner",
      idealFor: "Health & fitness creators, publishers, and comparison platforms",
      details: "Earn commissions by referring customers to our range of at-home blood testing kits — from vitamin checks to full wellness panels.",
    },
    {
      name: "Employer Wellness Partner",
      idealFor: "SMEs, HR teams, and corporate wellbeing programmes",
      details: "Offer discounted health screening kits to your workforce as part of your employee wellness benefits.",
    },
    {
      name: "Pharmacy & Retail Partner",
      idealFor: "Pharmacies, gyms, and health retailers",
      details: "Stock or cross-sell NexGen testing kits in-store and online, with fulfilment and lab analysis handled by us.",
    },
  ];

  const onboardingSteps = [
    "Intro call to understand your audience and goals",
    "Partnership model selection and compliance review",
    "Tracking setup, landing page mapping, and QA",
    "Launch with reporting cadence and optimisation",
  ];

  return (
    <main className="bg-[#F8FBF8] pt-28 sm:pt-32">
      <section className="container pb-14 sm:pb-20">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full bg-[#E7F4EC] px-4 py-1 text-sm font-semibold text-[#1E5C3A]">
            NexGen Healthcare Partnerships
          </span>
          <h1 className="mt-4 text-3xl font-bold text-[var(--maincolor)] sm:text-4xl">
            Become an Online Partner
          </h1>
          <p className="mt-4 text-lg text-[var(--textcolor)]">
            Partner with NexGen Healthcare to bring trusted at-home blood testing kits to customers across
            Ireland. Whether you run a health blog, a workplace wellness programme, or a pharmacy, our
            partnership models make it easy to offer laboratory-grade screening to your audience.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/contact-us"
              className="inline-flex h-12 items-center justify-center rounded-md bg-[var(--btncolor)] px-6 text-base font-semibold text-white transition-opacity hover:opacity-90"
            >
              Apply as Partner
            </Link>
            <Link
              href="/contact-us"
              className="inline-flex h-12 items-center justify-center rounded-md border border-[var(--maincolor)] px-6 text-base font-semibold text-[var(--maincolor)] transition-colors hover:bg-[#E7F4EC]"
            >
              Talk to Partnerships Team
            </Link>
          </div>
        </div>
      </section>

      <section className="container pb-12">
        <div className="grid gap-5 md:grid-cols-3">
          {benefits.map((benefit) => (
            <article key={benefit.title} className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-[var(--maincolor)]">{benefit.title}</h2>
              <p className="mt-3 text-[var(--textcolor)]">{benefit.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container pb-12">
        <div className="rounded-2xl bg-white p-7 shadow-sm sm:p-10">
          <h2 className="text-2xl font-bold text-[var(--maincolor)]">Partnership Models</h2>
          <div className="mt-6 grid gap-4">
            {partnershipModels.map((model) => (
              <article key={model.name} className="rounded-xl border border-gray-100 p-5">
                <h3 className="text-lg font-semibold text-[var(--maincolor)]">{model.name}</h3>
                <p className="mt-2 text-sm text-gray-500">Ideal for: {model.idealFor}</p>
                <p className="mt-3 text-[var(--textcolor)]">{model.details}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container pb-16">
        <div className="grid gap-6 rounded-2xl bg-[#103A2A] p-7 text-white sm:grid-cols-[1.1fr_0.9fr] sm:p-10">
          <div>
            <h2 className="text-2xl font-bold">How onboarding works</h2>
            <ul className="mt-4 space-y-3 text-sm sm:text-base">
              {onboardingSteps.map((step) => (
                <li key={step} className="flex gap-3">
                  <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-[#7EE2B8]" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-white/10 p-5">
            <h3 className="text-lg font-semibold">Need custom integration?</h3>
            <p className="mt-3 text-sm text-[#D6F5E8]">
              We can support tailored referral flows, tracking links, and bespoke landing experiences for high-volume
              partners.
            </p>
            <Link
              href="/contact-us"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-white px-5 text-sm font-semibold text-[#103A2A] transition-opacity hover:opacity-90"
            >
              Request Integration Call
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
