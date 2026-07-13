export type FaqItem = {
  question: string;
  answer: string;
};

export type FaqCategory = {
  categoryTitle: string;
  items: FaqItem[];
};

/**
 * FAQ content for the home page.
 * Kept as a single category so the flat accordion UI and the FAQ
 * structured-data schema share the same source.
 */
export const FAQ_SECTION_CONTENT = {
  subtitle: "Most Frequently",
  title: "Frequently Asked Questions",
  faqCategories: [
    {
      categoryTitle: "General",
      items: [
        {
          question: "How do at-home blood testing kits work?",
          answer:
            "Order your kit online and it arrives in plain packaging within 1-2 working days. Register the kit's activation code, collect your sample using the included finger-prick instructions, and post it back in the prepaid envelope. Your sample is analysed in an INAB-accredited Irish laboratory and doctor-reviewed results arrive in your secure account within days.",
        },
        {
          question: "Are the results as accurate as a clinic blood test?",
          answer:
            "Yes — your sample is processed in the same accredited laboratories, on the same clinical analysers, that hospitals and GP practices use. The only difference is that you collect the sample yourself at home, which is why following the collection instructions carefully matters.",
        },
        {
          question: "How quickly will I receive my results?",
          answer:
            "Most panels are processed within 1-3 working days of the laboratory receiving your sample. You'll get an email notification the moment your doctor-reviewed report is ready in your secure online account.",
        },
        {
          question: "Do I need to fast before taking a test?",
          answer:
            "Most tests don't require fasting. If your panel includes cholesterol or glucose markers, we recommend a 10-12 hour overnight fast for the most accurate reading — your kit instructions will tell you exactly what's needed.",
        },
        {
          question: "Is my order and result data private?",
          answer:
            "Completely. Kits ship in plain, unbranded packaging, and your results are encrypted and visible only to you and the reviewing clinician. They are never shared with employers, insurers, or anyone else.",
        },
        {
          question: "What happens if my results are abnormal?",
          answer:
            "Every report is reviewed by an IMC-registered doctor before release. Values outside the normal range are flagged with clear guidance, and if anything needs urgent attention our clinical team will contact you directly and recommend follow-up with your GP.",
        },
        {
          question: "What if my sample can't be analysed?",
          answer:
            "If the laboratory can't process your sample — for example an insufficient volume or damage in transit — we'll send you one free replacement kit so you can try again at no extra cost.",
        },
        {
          question: "Can I return a testing kit?",
          answer:
            "Unopened kits with the hygiene seal intact can be returned within 14 days of delivery for a full refund. For health and safety reasons, opened or registered kits can't be returned — see our Refund Policy for full details.",
        },
      ],
    },
  ] as FaqCategory[],
};
