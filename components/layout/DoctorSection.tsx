import Image from "next/image";
import {
  DOCTOR_SECTION_CONTENT,
  PLACEHOLDER_IMAGE,
} from "@/lib/mockDoctorSection";

export default function DoctorSection() {
  const data = DOCTOR_SECTION_CONTENT;

  return (
    <section className="w-full bg-white py-12 lg:py-20">
      <div className="container">
        <div className="mb-10 space-y-2">
          <h2 className="text-2xl/8 font-bold text-(--maincolor) lg:text-3xl">
            {data.headerTitle}
          </h2>
          <p className="!text-lg/7 !text-(--textcolor)">
            {data.headerDescription}
          </p>
        </div>

        <div className="flex flex-col items-center gap-8 lg:flex-row">
          <div className="max-w-lg lg:w-1/3">
            <div className="group relative flex min-h-[616px] w-full flex-wrap content-end items-end overflow-hidden rounded-xl px-9 py-12 text-left transition-all duration-500">
              <h3 className="z-[1] text-3xl font-bold text-white">
                {data.middleCard.title}
              </h3>
              <Image
                src={PLACEHOLDER_IMAGE}
                alt=""
                fill
                className="object-cover transition-all duration-1000 will-change-transform group-hover:scale-[1.05]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,#0C203B_100%)]" />
            </div>
          </div>

          <div className="w-full lg:w-2/3">
            <div className="flex flex-col gap-5 pb-6">
              <h4 className="text-2xl/8 font-bold text-(--maincolor) lg:text-3xl">
                {data.stepsTitle}
              </h4>
              <ul className="space-y-1.5 text-lg font-normal text-(--textcolor)">
                {data.steps.map((step, index) => (
                  <li key={index} className="flex gap-3">
                    <span
                      className="mt-1.5 h-6 w-6 shrink-0 bg-contain bg-center bg-no-repeat"
                      style={{ backgroundImage: "var(--my-list-image)" }}
                    />
                    <span>
                      <strong>{step.title}:</strong> {step.description}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-5">
              <h4 className="text-2xl/8 font-bold text-(--maincolor) lg:text-3xl">
                {data.comfortTitle}
              </h4>

              <div className="grid-flow-col grid-rows-2 gap-5 sm:grid">
                <div className="row-span-3 flex flex-col items-start justify-start gap-4 rounded-xl bg-(--maincolor) px-5 py-7 shadow-sm">
                  <div className="relative flex h-36 w-full items-center justify-center overflow-hidden rounded-lg bg-white/10">
                    <Image
                      src={PLACEHOLDER_IMAGE}
                      alt=""
                      width={200}
                      height={120}
                      className="h-full w-full object-cover opacity-60"
                    />
                  </div>
                  <p className="text-lg/7 font-normal text-white">
                    {data.sideCards[0].description}
                  </p>
                </div>

                {data.sideCards.slice(1).map((card, index) => (
                  <div
                    key={index}
                    className="col-span-2 row-span-1 flex gap-4 rounded-xl bg-(--foreground) px-5 py-7 shadow-sm transition duration-500 hover:bg-[#E7E9ED]"
                  >
                    <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#E7E9ED]">
                      <Image
                        src={PLACEHOLDER_IMAGE}
                        alt=""
                        width={40}
                        height={40}
                        className="h-full w-full object-cover opacity-50"
                      />
                    </div>
                    <p className="!text-lg/7 font-normal !text-(--maincolor)">
                      {card.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
