import Link from "next/link";
import Image from "next/image";
import { MOCK_DOCTORS } from "@/lib/mock-data";

/** Initials for the avatar circle, e.g. "Dr. Aoife Murphy" → "AM". */
function getInitials(name: string): string {
    return name
        .replace(/^Dr\.?\s+/i, "")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");
}

/**
 * Trust section — the doctors who review every test result.
 * Left: heading + intro; right: 2x2 grid of clinician cards.
 */
export default function CliniciansSection() {
    return (
        <section className="py-12 lg:py-20 bg-[#FAFBFC]">
            <div className="container">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                    {/* Intro */}
                    <div className="max-w-xl">
                        <h2 className="text-(--maincolor) text-2xl/8 md:text-3xl font-bold mb-5">
                            Our Clinicians
                        </h2>
                        <p className="text-slate-600 text-base/7 mb-6">
                            Every result from our at-home blood testing kits is reviewed by
                            doctors registered with the Irish Medical Council. With years of
                            experience across hospitals, GP practice, and laboratory
                            medicine, our clinical team checks your report, flags anything
                            that needs attention, and guides you towards the right
                            follow-up care.
                        </p>
                        <Link
                            href="/about-us"
                            className="inline-flex items-center gap-2 text-(--btncolor) font-semibold underline underline-offset-4 hover:opacity-80 transition-opacity"
                        >
                            Meet the whole team
                        </Link>
                    </div>

                    {/* Clinician cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
                        {MOCK_DOCTORS.map((doctor) => (
                            <div key={doctor.doctor_name} className="flex items-center gap-4">
                                <div className="relative size-20 lg:size-24 shrink-0 rounded-full overflow-hidden bg-(--maincolor)/10 flex items-center justify-center">
                                    {doctor.doctor_picture ? (
                                        <Image
                                            src={doctor.doctor_picture}
                                            alt={doctor.doctor_name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <span className="text-(--maincolor) text-xl lg:text-2xl font-bold">
                                            {getInitials(doctor.doctor_name)}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-(--maincolor) text-lg font-bold">
                                        {doctor.doctor_name}
                                    </h3>
                                    <p className="text-slate-600 text-sm">
                                        IMC: {doctor.registration_number}
                                    </p>
                                    {doctor.speciality && (
                                        <p className="text-slate-500 text-sm">
                                            {doctor.speciality}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
