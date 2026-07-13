"use client";

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';


export default function AboutUs() {

  const imgRef = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.3 }
    )
    if (imgRef.current) observer.observe(imgRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <>

      {/* Banner */}
      <div className="flex items-center bg-[url(/images/about.jpg)] bg-top bg-center bg-no-repeat bg-cover min-h-[400px] md:min-h-[440px] relative">
        <div className='absolute top-0 left-0 w-full h-full bg-transparent
          bg-gradient-to-r from-(--maincolor) via-[#FFFFFF] via-[50%]
          mix-blend-multiply
          opacity-100
          transition-[background,border-radius,opacity]
          duration-300'
        />
        <div className="container">
          <div className="flex flex-col text-white md:mt-16">
            <h1 className="text-[40px] font-bold">About Us</h1>
            <div className='text-base font-normal'>Ireland’s Trusted Online Store for At-Home Blood Testing Kits</div>
          </div>
        </div>
      </div>

      <div className="py-12 lg:py-20">
        <div className="container">
          <div className="flex flex-col lg:flex-row gap-7">
            <div className="w-full lg:w-3/5">
              <div className="pb-10 lg:pb-16">
                <div className='text-(--maincolor) text-base'>A One-Stop Solution</div>
                <h2 className="text-(--maincolor) text-2xl/8 md:text-3xl font-bold mb-5">At-Home Blood Testing, Delivered</h2>
                <div className="text-(--maincolor) text-lg/7 font-normal">
                  Welcome to NexGen Healthcare — Ireland&apos;s trusted online store for at-home blood and urine testing kits. From vitamin and thyroid checks to full wellness panels and discreet sexual health screening, every kit ships in plain packaging with a prepaid return envelope. Samples are analysed in an INAB-accredited Irish laboratory and every result is reviewed by a doctor registered with the Irish Medical Council before it reaches your secure account — laboratory-grade health screening without waiting rooms or appointments.
                </div>
              </div>
              <div className="pb-6 lg:pb-8">
                <h2 className="text-(--maincolor) text-2xl/8 md:text-3xl font-bold mb-5">Our Ethos at a Glance</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-10">

                  <div className='space-y-4'>
                    <h4 className='text-[var(--maincolor)] text-lg font-bold'>Mission</h4>
                    <div className='w-3/5 border-b-1 border-[var(--maincolor)]' />
                    <div className="text-[var(--textcolor)] text-base font-normal">To make laboratory-grade health testing accessible from every home in Ireland.</div>
                  </div>
                  <div className='space-y-4'>
                    <h4 className='text-[var(--maincolor)] text-lg font-bold'>Vision</h4>
                    <div className='w-3/5 border-b-1 border-[var(--maincolor)]' />
                    <div className="text-[var(--textcolor)] text-base font-normal">A future where routine health screening is proactive, private, and part of everyday life.</div>
                  </div>
                  <div className='space-y-4'>
                    <h4 className='text-[var(--maincolor)] text-lg font-bold'>Approach</h4>
                    <div className='w-3/5 border-b-1 border-[var(--maincolor)]'></div>
                    <div className="text-[var(--textcolor)] text-base font-normal">Accredited labs, doctor-reviewed results, and customer-first support at every step.</div>
                  </div>

                </div>
              </div>
            </div>
            <div className="w-full lg:w-2/5">
              <img
                ref={imgRef}
                src="/images/ireland-map2-scaled.webp"
                alt="Ireland map"
                loading="lazy"
                className={`
                  lg:ml-auto md:mx-auto lg:mx-0 max-w-md lg:max-w-[80%] w-full
                  transition-transform transition-opacity
                  duration-700 ease-out
                  will-change-transform
                  ${inView ? 'scale-100 opacity-100' : 'scale-5 opacity-0'}
                `}
              />
            </div>
          </div>

          <div className="mt-12 border-t border-(--maincolor)/10 pt-10 pb-4 sm:mt-14 sm:pt-12 lg:mt-16 lg:pt-14">
            <h2 className="mb-8 text-(--maincolor) text-2xl/8 font-bold md:text-3xl lg:mb-12">
              Why Choose NexGen Healthcare’s Testing Kits
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-7 xl:gap-10">

              <div className='bg-[var(--blockground)] shadow-sm rounded-md p-5 text-center space-y-4'>
                <div className="icon">
                  <img className='mx-auto size-13' src="/images/legitimate-icon.svg" alt="" />
                </div>
                <div className='w-4/5 border-b-1 border-[var(--maincolor)] mx-auto' />
                <h4 className='text-[var(--maincolor)] text-xl font-semibold'>Accredited</h4>
                <div className="text-[var(--textcolor)] text-base font-normal">Every sample is analysed in an INAB-accredited Irish laboratory using CE-marked collection kits, and every report is signed off by a doctor registered with the Irish Medical Council before it reaches you.</div>
              </div>
              <div className='bg-[var(--blockground)] shadow-sm rounded-md p-5 text-center space-y-4'>
                <div className="icon">
                  <svg className="mx-auto size-14 fill-[var(--maincolor)]" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M466.5 83.7l-192-80a48.15 48.15 0 0 0-36.9 0l-192 80C27.7 91.1 16 108.6 16 128c0 198.5 114.5 335.7 221.5 380.3 11.8 4.9 25.1 4.9 36.9 0C360.1 472.6 496 349.3 496 128c0-19.4-11.7-36.9-29.5-44.3zM256.1 446.3l-.1-381 175.9 73.3c-3.3 151.4-82.1 261.1-175.8 307.7z"></path></svg>
                </div>
                <div className='w-4/5 border-b-1 border-[var(--maincolor)] mx-auto' />
                <h4 className='text-[var(--maincolor)] text-xl font-semibold'>Simple</h4>
                <div className="text-[var(--textcolor)] text-base font-normal">Order online, collect your sample at home with the step-by-step guide, and post it back in the prepaid tracked envelope. Your doctor-reviewed results arrive in your secure account within days.</div>
              </div>
              <div className='bg-[var(--blockground)] shadow-sm rounded-md p-5 text-center space-y-4'>
                <div className="icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className='mx-auto size-16 stroke-[var(--maincolor)]'
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                    <path d="M9 12l2 2l4 -4" />
                  </svg>
                </div>
                <div className='w-4/5 border-b-1 border-[var(--maincolor)] mx-auto' />
                <h4 className='text-[var(--maincolor)] text-xl font-semibold'>Cost-Effective</h4>
                <div className="text-[var(--textcolor)] text-base font-normal">Skip clinic fees and waiting lists. Our at-home kits deliver the same laboratory analysis at a fraction of the cost, with free tracked delivery and a prepaid return envelope included with every order.</div>
              </div>
              <div className='bg-[var(--blockground)] shadow-sm rounded-md p-5 text-center space-y-4'>
                <div className="icon">
                  <img className='mx-auto size-12' src="/images/trusted-icon.svg" alt="" />
                </div>
                <div className='w-4/5 border-b-1 border-[var(--maincolor)] mx-auto'></div>
                <h4 className='text-[var(--maincolor)] text-xl font-semibold'>Private</h4>
                <div className="text-[var(--textcolor)] text-base font-normal">Kits arrive in plain, unbranded packaging and results are encrypted and visible only to you and the reviewing clinician — never shared with employers, insurers, or anyone else.</div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <div className="py-12 lg:py-20">
        <div className="container">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="max-w-lg lg:w-1/3">
              <div className="group min-h-[616px] text-left flex flex-wrap content-end items-end relative transition-all duration-500 p-9 w-full rounded-xl overflow-hidden">
                <h4 className='text-white text-xl/7 font-normal z-[1]'>At-Home Blood Testing Kits Delivered Across Ireland, 365 Days A Year!</h4>
                <div className="absolute inset-0 bg-[url('/images/how-its-work.jpg')] bg-cover bg-center transition-all duration-1000  will-change-transform group-hover:scale-[1.3]" />

                <div className="absolute left-0 right-0 bottom-0 top-[70%] h-[189px] bg-transparent bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,#0C203B_100%)]" />
              </div>

            </div>

            <div className="w-full lg:w-2/3">
              <div className="pb-5">
                <div className='text-[var(--maincolor)] text-base'>We Are Inviting IMC-Registered Doctors</div>
                <h2 className="text-(--maincolor) text-2xl/8 md:text-3xl font-bold mb-5">Join the NexGen Clinical Team</h2>
                <div className="text-[var(--maincolor)] text-lg/7 font-normal">Are you an IMC-registered doctor who believes in proactive, preventive healthcare? Join NexGen Healthcare&apos;s clinical review team and help us deliver safe, accurate at-home testing across Ireland. Our doctors review laboratory results, flag values that need attention, and guide customers towards the right follow-up care — all through a well-regulated, systematic clinical workflow.</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-5">
                <div className='bg-[var(--foreground)] shadow-sm rounded-xl hover:bg-[#E7E9ED] flex gap-4 px-5 py-7 transition duration-500'>
                  <div className="icon shrink-0">
                    <img className='mx-auto' src="/images/qr-code_icon.svg" alt="" />
                  </div>
                  <div className="text-[var(--maincolor)] text-base/7 font-normal">Secure digital tools for reviewing laboratory results and signing off customer reports safely.</div>
                </div>
                <div className='bg-[var(--foreground)] shadow-sm rounded-xl hover:bg-[#E7E9ED] flex gap-4 px-5 py-7 transition duration-500'>
                  <div className="icon shrink-0">
                    <img src="/images/qr-code_icon.svg" alt="" />
                  </div>
                  <div className="text-[var(--maincolor)] text-base/7 font-normal">Systematic review protocols ensure every biomarker report is accurate and clinically appropriate.</div>
                </div>
                <div className='bg-[var(--foreground)] shadow-sm rounded-xl hover:bg-[#E7E9ED] flex gap-4 px-5 py-7 transition duration-500'>
                  <div className="icon shrink-0">
                    <img className='mx-auto' src="/images/approve_icon.svg" alt="" />
                  </div>
                  <div className="text-[var(--maincolor)] text-base/7 font-normal">Flexible remote review work that fits around your practice — no clinics, no waiting lists.</div>
                </div>
                <div className='bg-[var(--foreground)] shadow-sm rounded-xl hover:bg-[#E7E9ED] flex gap-4 px-5 py-7 transition duration-500'>
                  <div className="icon shrink-0">
                    <img src="/images/approve_icon.svg" alt="" />
                  </div>
                  <div className="text-[var(--maincolor)] text-base/7 font-normal">Help customers in every corner of Ireland act early on their health through preventive screening.</div>
                </div>
              </div>
              <div className='bg-[var(--maincolor)] shadow-sm rounded-xl flex flex-col sm:flex-row items-center sm:justify-between gap-4 px-5 py-7 transition duration-500'>
                <div className="text-white text-xl/7 font-normal">Apply to Join NexGen Healthcare</div>
                <Link
                  href="/"
                  className='w-full max-w-40 flex items-center justify-center p-3 border border-[var(--btncolor)] text-base font-normal rounded-md text-white bg-[var(--btncolor)] hover:text-[var(--btncolor)] hover:bg-transparent focus:outline-none focus:ring-1 focus:ring-[var(--btncolor)] cursor-pointer transition-all duration-1000'
                >
                  Join our Team
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pb-12 lg:pb-20">
        <div className="container">
          <div className="w-full sm:w-11/12 mx-auto bg-[#E7E9ED] rounded-xl px-6 py-10 text-(--maincolor) text-center">
            <h2 className='text-(--maincolor) text-2xl/8 md:text-3xl font-bold mb-5'>Always Happy to Hear From You!</h2>
            <p>Are you happy with your testing kit experience? Share your feedback and help us improve our at-home blood testing service.</p>
            <Link href="mailto:info@nexgenhealthcare.ie" className='!underline underline-offset-2'>info@nexgenhealthcare.ie</Link>
          </div>
        </div>
      </div>

    </>

  );
}