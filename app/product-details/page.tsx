import PhysicalProducts from "@/components/physical-products/PhysicalProducts";


import { Product } from "@/lib/types";
import { TESTING_KITS_SLUG } from "@/lib/constants";

const mockProduct: Product = {
  id: 1,
  type: "physical",
  type_label: "Physical Product",
  sku: "VIT-D-001",
  name: "Vitamin D Test Kit",
  slug: "vitamin-d-test-kit",
  category_id: 1,
  category_slug: TESTING_KITS_SLUG,
  category_name: "Blood Testing Kits",
  subcategory_id: null,
  subcategory_name: null,
  subcategory_slug: null,
  description: "Measure your vitamin D levels from home.",
  price: 49.00,
  session_duration: null,
  result_template_ids: [],
  wp_form_url: null,
  product_display: {
    slug: "vitamin-d-test-kit",
    short_description: "At-home finger-prick blood test",
    cta_text: "Order Now",
    status: "active",
    price_range: {
      min: "49.00",
      max: "49.00",
      price: "49.00",
      discounted_price: "49.00",
      discount_percentage: "0",
      currency: "€"
    },
    slider_images: [
      { imgUrl: "/images/photo-kits1.jpg", altText: "Vitamin D Kit" }
    ],
    badges: [],
    highlights: [],
    sections: [],
    process_cards: {
      key: "process",
      title: "Process",
      cards: []
    },
    physical_details: {
      title: "About This Kit",
      description: "Detailed description here",
      image_url: "/images/photo-kits1.jpg",
      features: []
    },
    physical_how_it_works: {
      title: "How It Works",
      subtitle: "4 simple steps",
      steps: []
    },
    physical_kit_usage: {
      title: "Using the Kit",
      subtitle: "Watch the tutorial",
      list_title: "Included items",
      list_items: [],
      note_content: "Follow instructions carefully",
      video_title: "Tutorial",
      video_subtitle: "Step by step",
      video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      video_thumbnail_url: "/images/photo-kits1.jpg"
    },
    physical_what_to_expect: {
      title: "What to Expect",
      subtitle: "Your journey",
      stages: []
    },
    faq: {
      title: "FAQs",
      subtitle: "Questions",
      items: []
    }
  },
  related_product_ids: [],
  form_id: 1,
};

export default function physicalProductsDetailsPage() {
  return <PhysicalProducts product={mockProduct} />;
}
