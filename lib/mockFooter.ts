export type FooterLink = {
  href: string;
  label: string;
};

export type FooterSocialLink = {
  href: string;
  label: string;
};

export const FOOTER_CONTENT = {
  brandName: "NexGen Healthcare",
  description:
    "NexGen Healthcare aims to supply the best quality online healthcare and at-home blood testing to Irish residents. Our 24/7 availability and remote access to personalised healthcare can improve your daily routine while still being affordable, providing patient satisfaction.",
  quickLinksTitle: "What We Can Do",
  quickLinks: [
    { href: "/about-us", label: "About Us" },
    { href: "/testing-kits/categories", label: "Blood Testing Kits" },
    { href: "/contact-us", label: "Contact" },
  ] as FooterLink[],
  securityTitle: "Security",
  securityLinks: [
    { href: "/privacy-policy", label: "Privacy Policy" },
    { href: "/terms-conditions", label: "Terms & Conditions" },
    { href: "/blog", label: "Blog" },
    { href: "/online-partner", label: "Become an Online Partner!" },
    { href: "/refund-policy", label: "Refund Policy" },
  ] as FooterLink[],
  contactTitle: "Get in touch!",
  phone: "021 245 5185",
  phoneHref: "tel:0212455185",
  addressLines: [
    "Ludgate Hub, Old Bakery,",
    "Townshend Street,",
    "Skibbereen, Co. Cork, P81T324,",
    "Ireland",
  ],
  addressHref: "https://share.google/V5MmOvQV60FV3vEAQ",
  socialLinks: [
    {
      href: "https://twitter.com/_gethealthcare_",
      label: "Twitter",
    },
    {
      href: "https://www.facebook.com/gethealthcare.ie/",
      label: "Facebook",
    },
    {
      href: "https://www.instagram.com/gethealthcare.ie/",
      label: "Instagram",
    },
    {
      href: "https://www.tiktok.com/@gethealthcare.ie",
      label: "TikTok",
    },
    {
      href: "https://www.linkedin.com/company/gethealthcare/",
      label: "LinkedIn",
    },
    {
      href: "https://www.youtube.com/@gethealthcareireland",
      label: "YouTube",
    },
  ] as FooterSocialLink[],
};
