"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, ShoppingBag, User, LogIn } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import Cookies from "js-cookie";
import { useCartStore } from "@/store/useCartStore";
import { HIDDEN_MENU_TITLES } from "@/lib/menu-visibility";
import {
  DesktopBloodTestingNav,
  MobileBloodTestingNav,
} from "./BloodTestingHeaderNav";


export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const cartItemCount = useCartStore((state) =>
    state.items.reduce((acc, item) => acc + item.quantity, 0)
  );

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 10);

      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setShowHeader(true);
      } else {
        setShowHeader(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const toggleSubmenu = (menu: string) => {
    setOpenSubmenu(openSubmenu === menu ? null : menu);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setOpenSubmenu(null);
  };


  useEffect(() => {
    // Sync auth state with cookie on mount and when isAuthenticated changes
    const token = Cookies.get('auth_token');
    if (isAuthenticated && !token) {
      useAuthStore.getState().logout();
    }
  }, [isAuthenticated]);

  return (
    <>

      <header
        className={`overflow-visible py-3 xl:py-0 transition-all duration-300 sticky md:fixed top-0 left-0 right-0 w-full z-50 ${isScrolled
          ? `bg-white backdrop-blur-sm shadow-sm ${showHeader ? "translate-y-0 header-slide-in" : "-translate-y-full"
          }`
          : "bg-white translate-y-0"
          }`}
      >
        <div className="container">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="w-[50%] xl:w-[15%]">
              <div className="flex-shrink-0">
                <Link href="/" className="inline-flex justify-center">
                  <Image
                    src="/images/logo.svg"
                    alt="NexGen Healthcare"
                    width={120}
                    height={36}
                    className="w-[88px] sm:w-[104px] h-auto"
                    priority
                  />
                </Link>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="relative w-[0%] xl:flex-1 xl:min-w-0">
              <nav className="hidden xl:flex relative items-center gap-x-6 overflow-visible lg:gap-x-8">

                <DesktopBloodTestingNav />



                {!HIDDEN_MENU_TITLES.includes("Contact Us") && (
                  <div className="py-8">
                    <Link
                      href="/contact-us"
                      className="flex items-center cursor-pointer relative z-10 text-(--maincolor) text-base font-normal px-4 py-2 hover:text-(--btncolor) transition hover:-translate-y-0.5 whitespace-nowrap lg:text-[17px] lg:px-5"
                    >
                      Contact Us
                    </Link>
                  </div>
                )}

              </nav>
            </div>

            {/* Account actions — cart then login/profile */}
            <div className="flex w-[50%] items-center justify-end gap-2 text-right sm:gap-3 xl:w-auto xl:shrink-0">
              <button
                onClick={() => useCartStore.getState().openCart()}
                className="relative cursor-pointer rounded-lg border border-gray-100 bg-white p-2 text-(--maincolor) shadow-sm transition-all duration-300 hover:border-(--maincolor) hover:bg-(--maincolor) hover:text-white sm:p-3"
                aria-label="Open cart"
                title="Cart"
              >
                <ShoppingBag size={18} className="sm:size-5" strokeWidth={2} />
                {mounted && cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 animate-in items-center justify-center rounded-full border-2 border-white bg-red-500 text-[9px] font-bold text-white zoom-in-50 duration-300 sm:h-5 sm:w-5 sm:text-[10px]">
                    {cartItemCount}
                  </span>
                )}
              </button>

              {mounted && isAuthenticated ? (
                <Link
                  href="/profile"
                  className="p-2 sm:p-3 rounded-lg bg-white border border-gray-100 shadow-sm text-(--maincolor) hover:bg-(--maincolor) hover:border-(--maincolor) hover:text-white transition-all duration-300 relative group cursor-pointer"
                  title="Profile"
                >
                  <User size={18} className="sm:size-5" strokeWidth={2} />
                </Link>
              ) : (
                <Link
                  href="/my-account"
                  className="p-2 sm:p-3 rounded-lg bg-white border border-gray-100 shadow-sm text-(--maincolor) hover:bg-(--maincolor) hover:border-(--maincolor) hover:text-white transition-all duration-300 relative group cursor-pointer"
                  title="Login"
                >
                  <LogIn size={18} className="sm:size-5" strokeWidth={2} />
                </Link>
              )}

              {/* Mobile menu button */}
              <button
                type="button"
                className="xl:hidden text-[var(--maincolor)] hover:text-[var(--maincolor)]/80 cursor-pointer focus:outline-none transition-colors p-2"
                aria-label="Toggle menu"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {/* <Menu className="h-6 w-6" /> */}
                <svg aria-hidden="true" className="size-6" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg"><path d="M16 224h416a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16H16a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16zm416 192H16a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16zm3.17-384H172.83A12.82 12.82 0 0 0 160 44.83v38.34A12.82 12.82 0 0 0 172.83 96h262.34A12.82 12.82 0 0 0 448 83.17V44.83A12.82 12.82 0 0 0 435.17 32zm0 256H172.83A12.82 12.82 0 0 0 160 300.83v38.34A12.82 12.82 0 0 0 172.83 352h262.34A12.82 12.82 0 0 0 448 339.17v-38.34A12.82 12.82 0 0 0 435.17 288z" /></svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] xl:hidden overlay-enter"
          onClick={closeMobileMenu}
        />
      )}

      {/* Offcanvas Mobile Menu */}
      <div
        className={`fixed top-0 left-0 h-full w-[85%] max-w-md bg-white z-[70] xl:hidden transform transition-transform duration-300 ease-out overflow-y-auto shadow-2xl ${isMobileMenuOpen ? 'translate-x-0 offcanvas-enter' : '-translate-x-full'
          }`}
      >
        {/* Menu Header */}
        <div className="flex justify-between items-center px-4 py-6 border-b border-[var(--maincolor)]/10">
          <Image
            src="/images/logo.svg"
            alt="NexGen Healthcare"
            width={100}
            height={30}
            className="w-[88px] h-auto"
          />
          <button
            onClick={closeMobileMenu}
            className="text-[var(--maincolor)] hover:text-[var(--maincolor)]/80 transition-colors p-2 cursor-pointer"
            aria-label="Close menu"
          >
            <X className="h-7 w-7 border border-[var(--maincolor)]/80 rounded-full p-1" />
          </button>
        </div>

        {/* Menu Content */}
        <nav className="p-0">
          <div className="flex flex-col space-y-1 divide-y divide-[var(--maincolor)]/10">

            {/* Blood testing kits — top categories + all categories mega menu */}
            <MobileBloodTestingNav
              openSubmenu={openSubmenu}
              toggleSubmenu={toggleSubmenu}
              onNavigate={closeMobileMenu}
            />


            {/* Contact Us */}
            {!HIDDEN_MENU_TITLES.includes("Contact Us") && (
              <div>
                <Link
                  href="/contact-us"
                  className="text-[var(--maincolor)] text-base font-normal hover:text-[var(--btncolor)] p-4 w-full flex items-center justify-between transition-colors"
                  onClick={closeMobileMenu}
                >
                  Contact Us
                </Link>
              </div>
            )}


            {/* My Account / Login */}
            <div>
              {isAuthenticated ? (
                <Link
                  href="/profile"
                  className="text-[var(--maincolor)] text-base font-normal hover:text-[var(--btncolor)] p-4 w-full flex items-center justify-between transition-colors"
                  onClick={closeMobileMenu}
                >
                  My account
                </Link>
              ) : (
                <Link
                  href="/my-account"
                  className="text-[var(--maincolor)] text-base font-normal hover:text-[var(--btncolor)] p-4 w-full flex items-center justify-between transition-colors"
                  onClick={closeMobileMenu}
                >
                  Login / Register
                </Link>
              )}
            </div>
          </div>

          {/* Login Button - Only show when not authenticated */}
          {!isAuthenticated && (
            <div className="w-full pt-6 px-4 border-t border-[var(--maincolor)]/10">
              <Link
                href="/my-account"
                className="flex items-center justify-center text-[var(--maincolor)] text-lg font-medium bg-[#0C203B33] border border-[var(--maincolor)] rounded-lg p-2 hover:bg-[var(--maincolor)] hover:text-white transition-all duration-300 cursor-pointer"
                onClick={closeMobileMenu}
              >
                Login
              </Link>
            </div>
          )}
        </nav>
      </div>
    </>
  );
}