"use client"

import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import Link from 'next/link';
import Image from "next/image";
import { usePathname } from 'next/navigation';

import { FOOTER_CONTENT } from "@/lib/mockFooter";

export default function Footer() {
    const [showButton, setShowButton] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowButton(true);
            } else {
                setShowButton(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };
    {/* Scroll to Top Button */ }

    const pathname = usePathname();
    const footer = FOOTER_CONTENT;
    const currentYear = new Date().getFullYear();

    return (
        <>

            <footer className="global_footer bg-(--maincolor) text-gray-300 pt-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:flex gap-8 pb-16">
                        {/* Company Info */}
                        <div className="xl:w-[30%] flex flex-col space-y-5">
                            <div className='xl:max-w-[300px]'>
                                <div className="mb-4">
                                    <Link href="/" className="logo_brand inline-flex justify-center">
                                        <Image
                                            src="/images/logo.svg"
                                            alt="NexGen Healthcare"
                                            width={160}
                                            height={48}
                                            className="h-auto w-[140px] brightness-0 invert"
                                            priority
                                        />
                                    </Link>
                                </div>
                                <p className="!text-white !text-sm mb-4">
                                    {footer.description}
                                </p>
                            </div>
                            <div>
                                {/* Social Media Icons */}
                                <div className="flex space-x-5">
                                    <span className="flex">
                                        <a className="text-white block" href="https://twitter.com/_gethealthcare_" target="_blank">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="size-6 fill-white" viewBox="0 0 512 512">
                                                <path
                                                    d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
                                            </svg>
                                        </a>
                                    </span>
                                    <span className="flex">
                                        <a className="text-white block" href="https://www.facebook.com/gethealthcare.ie/" target="_blank" rel="noopener noreferrer">
                                            <svg className="size-6 fill-white" viewBox="0 0 320 512"
                                                xmlns="http://www.w3.org/2000/svg">
                                                <path
                                                    d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z" />
                                            </svg>
                                        </a>
                                    </span>
                                    <span className="flex">
                                        <a className="text-white block" href="https://www.instagram.com/gethealthcare.ie/" target="_blank" rel="noopener noreferrer">
                                            <svg className="size-6 fill-white" viewBox="0 0 448 512"
                                                xmlns="http://www.w3.org/2000/svg">
                                                <path
                                                    d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
                                            </svg>
                                        </a>
                                    </span>
                                    <span className="flex">
                                        <a className="text-white block" href="https://www.tiktok.com/@gethealthcare.ie" target="_blank" rel="noopener noreferrer">
                                            <svg className="size-6 fill-white" xmlns="http://www.w3.org/2000/svg" id="Layer_2" data-name="Layer 2"
                                                viewBox="0 0 392 448">
                                                <g id="Layer_1-2" data-name="Layer 1-2"><path className="cls-1" d="M391.7,183.8c-38.5.1-76-11.9-107.3-34.3v156.2c0,78.5-63.6,142-142.1,142C63.9,447.6.3,384,.3,305.5c0-78.4,63.6-142,142.1-142,6.5,0,13.1.4,19.5,1.4v78.5c-34.3-10.8-70.9,8.3-81.8,42.6s8.3,70.9,42.6,81.8c34.4,10.8,70.9-8.3,81.8-42.6,2-6.3,3-12.9,3-19.6V.4h76.9c0,6.5.5,13,1.6,19.4h0c5.4,28.8,22.4,54.2,47.1,70.1,17.4,11.5,37.7,17.6,58.5,17.6v76.3Z" /></g>
                                            </svg>
                                        </a>
                                    </span>
                                    <span className="flex">
                                        <a className="text-white block" href="https://www.linkedin.com/company/gethealthcare/" target="_blank">
                                            <svg className="size-6 fill-white" viewBox="0 0 448 512"
                                                xmlns="http://www.w3.org/2000/svg">
                                                <path
                                                    d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z" />
                                            </svg>
                                        </a>
                                    </span>
                                    <span className="flex">
                                        <a className="text-white block" href="https://www.youtube.com/@gethealthcareireland" target="_blank">
                                            <svg className="size-6 fill-white" viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg"><path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z" /></svg>
                                        </a>
                                    </span>
                                </div>
                                {/* <div className="flex space-x-4">
                                    <a href="https://twitter.com/_gethealthcare_" className="hover:text-white transition-colors" aria-label="Facebook">
                                        <Facebook className="h-5 w-5" />
                                    </a>
                                    <a href="#" className="hover:text-white transition-colors" aria-label="Twitter">
                                        <Twitter className="h-5 w-5" />
                                    </a>
                                    <a href="#" className="hover:text-white transition-colors" aria-label="Instagram">
                                        <Instagram className="h-5 w-5" />
                                    </a>
                                    <a href="#" className="hover:text-white transition-colors" aria-label="LinkedIn">
                                        <Linkedin className="h-5 w-5" />
                                    </a>
                                </div> */}
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className='xl:w-1/4'>
                            <h3 className="!text-white text-xl font-bold mb-4">{footer.quickLinksTitle}</h3>
                            <ul className="space-y-2">
                                {footer.quickLinks.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className={`text-white text-lg font-normal transition-all flex items-center relative 
                                                before:content-[''] before:absolute before:left-0 before:w-4 before:h-4 
                                                before:bg-[url(/images/Arrow-2-1.svg)] before:bg-contain before:bg-no-repeat 
                                                before:transition-opacity before:duration-300 hover:ps-6
                                            ${pathname === link.href
                                                    ? 'ps-0 before:opacity-100'
                                                    : 'before:opacity-0 hover:before:opacity-100'
                                                }`}
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Security */}
                        <div className='xl:w-1/4'>
                            <h3 className="!text-white text-xl font-bold mb-4">{footer.securityTitle}</h3>
                            <ul className="space-y-2">
                                {footer.securityLinks.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className={`text-white text-lg transition-all flex items-center relative 
                                                before:content-[''] before:absolute before:left-0 before:w-4 before:h-4 
                                                before:bg-[url(/images/Arrow-2-1.svg)] before:bg-contain before:bg-no-repeat 
                                                before:transition-opacity before:duration-300 hover:ps-6
                                            ${pathname === link.href
                                                    ? 'ps-0 before:opacity-100'
                                                    : 'before:opacity-0 hover:before:opacity-100'
                                                }`}
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Contact Info */}
                        <div className='xl:w-[20%]'>
                            <h3 className="!text-white text-xl font-bold mb-4">{footer.contactTitle}</h3>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5 fill-white">
                                        <path fillRule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z" clipRule="evenodd" />
                                    </svg>

                                    <a
                                        href={footer.phoneHref}
                                        className="text-white text-lg font-normal hover:underline"
                                    >
                                        {footer.phone}
                                    </a>
                                </li>
                                <li className="flex gap-4">
                                    <svg aria-hidden="true" className="size-5 fill-white" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg"><path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z" /></svg>
                                    <a
                                        href={footer.addressHref}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-white text-lg font-normal hover:underline"
                                    >
                                        {footer.addressLines.map((line) => (
                                            <span key={line} className="block">{line}</span>
                                        ))}
                                    </a>
                                </li>
                                {/* <li className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    <span>info@ghc.com</span>
                                </li> */}
                            </ul>
                        </div>
                    </div>

                    {/* Copyright */}
                    <div className="border-t border-white py-5 text-left">
                        <p className="!text-sm text-white">
                            &copy; {currentYear} All Rights Reserved.
                        </p>
                    </div>
                </div>

                {/* Scroll to Top Button */}
                {showButton && (
                    <button
                        onClick={scrollToTop}
                        data-hover="Top!"
                        className="
                        fixed bottom-8 left-8 bg-(--btncolor) text-white p-2.5 rounded-md shadow-lg hover:shadow-xl transform hover:scale-110   transition-all duration-300 z-50
                        cursor-pointer
                        overflow-hidden
                        transition-background duration-300
                        before:content-[attr(data-hover)]
                        before:absolute before:inset-0
                        before:grid before:place-items-center
                        before:text-xs
                        before:bg-(--btncolor)
                        before:translate-y-full
                        before:transition-transform before:duration-700
                        before:ease-[cubic-bezier(0.77,0,0.175,1)]
                        hover:before:translate-y-0"
                        style={{
                            opacity: showButton ? 1 : 0,
                            transform: showButton ? 'translate-y-0' : '-translate-y-[1000%]',
                            transition: 'all 1s ease-in-out',
                            pointerEvents: showButton ? 'auto' : 'none'
                        }}
                        aria-label="Scroll to top"
                    >
                        <ChevronUp
                            size={22}
                            strokeWidth={2}
                            className="transition-transform duration-500 group-hover:translate-y-[-2px]"
                        />
                    </button>
                )}

            </footer>
        </>
    );
}
