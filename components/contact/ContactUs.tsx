"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import {
  buildContactInquiryPayload,
  type ContactInquiryFormData,
  validateContactInquiry,
} from "@/lib/validation";

const INITIAL_FORM: ContactInquiryFormData = {
  full_name: "",
  phone: "",
  email: "",
  user_type: "provide",
  message: "",
};

export default function ContactUs() {
  const [formData, setFormData] = useState<ContactInquiryFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ContactInquiryFormData, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/[^0-9+]/g, "");
    if (value.indexOf("+") > 0) {
      value = "+" + value.replace(/\+/g, "");
    }
    setFormData((prev) => ({ ...prev, phone: value }));
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: undefined }));
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof ContactInquiryFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationErrors = validateContactInquiry(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Please correct the highlighted fields");
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const payload = buildContactInquiryPayload(formData);
      const response = await api.post(API_ENDPOINTS.SEND_INQUIRY, payload);
      const message =
        response.data?.message ||
        "Your inquiry has been sent successfully. We will get back to you shortly.";

      toast.success(message);
      setFormData(INITIAL_FORM);
    } catch (error: unknown) {
      const axiosError = error as {
        response?: {
          status?: number;
          data?: {
            message?: string;
            errors?: Record<string, string[]>;
          };
        };
      };

      const apiErrors = axiosError.response?.data?.errors;
      if (apiErrors) {
        const fieldErrors: Partial<
          Record<keyof ContactInquiryFormData, string>
        > = {};
        for (const [key, messages] of Object.entries(apiErrors)) {
          if (messages?.[0]) {
            fieldErrors[key as keyof ContactInquiryFormData] = messages[0];
          }
        }
        setErrors(fieldErrors);
      }

      toast.error(
        axiosError.response?.data?.message ||
          "Failed to send your inquiry. Please try again later.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (field: keyof ContactInquiryFormData) =>
    `appearance-none rounded-md relative block w-full h-[50px] px-4 py-3 border placeholder-gray-500 text-(--maincolor) focus:outline-none focus:ring-(--maincolor) focus:border-(--maincolor) focus:z-10 text-base ${
      errors[field] ? "border-red-400" : "border-(--maincolor)"
    }`;

  return (
    <>
      {/* Banner */}
      <div className="flex items-center bg-[url(/images/contact1.jpg)] bg-top bg-center bg-no-repeat bg-cover min-h-[400px] md:min-h-[440px] relative">
        <div
          className="absolute top-0 left-0 w-full h-full bg-transparent
          bg-[linear-gradient(180deg,_#4BF4C9_0%,_#5D89D3_100%)]
          mix-blend-multiply
          opacity-100
          transition-[background,border-radius,opacity]
          duration-300"
        ></div>
        <div className="container">
          <div className="flex flex-col text-white md:mt-16">
            <h1 className="text-[40px] font-bold mb-2">Contact Us</h1>
            <div className="text-base font-normal">We will get back to you</div>
          </div>
        </div>
      </div>

      <div className="py-12 lg:py-20">
        <div className="container">
          <div className="xl:w-3/4 pb-4 mx-auto">
            <h2 className="text-(--maincolor) text-2xl/8 lg:text-[40px] font-bold uppercase text-center mb-10 lg:mb-12">
              We Are Always Ready to Help You!
            </h2>
            <div className="lg:w-9/12 mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-7 xl:gap-10">
                <div className="bg-(--blockground) shadow-sm rounded-md p-6 sm:py-10 text-center space-y-6">
                  <div className="icon">
                    <svg
                      className="size-8 fill-(--maincolor) mx-auto"
                      viewBox="0 0 512 512"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M502.3 190.8c3.9-3.1 9.7-.2 9.7 4.7V400c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V195.6c0-5 5.7-7.8 9.7-4.7 22.4 17.4 52.1 39.5 154.1 113.6 21.1 15.4 56.7 47.8 92.2 47.6 35.7.3 72-32.8 92.3-47.6 102-74.1 131.6-96.3 154-113.7zM256 320c23.2.4 56.6-29.2 73.4-41.4 132.7-96.3 142.8-104.7 173.4-128.7 5.8-4.5 9.2-11.5 9.2-18.9v-19c0-26.5-21.5-48-48-48H48C21.5 64 0 85.5 0 112v19c0 7.4 3.4 14.3 9.2 18.9 30.6 23.9 40.7 32.4 173.4 128.7 16.8 12.2 50.2 41.8 73.4 41.4z"></path>
                    </svg>
                  </div>
                  <div className="w-4/5 border-b-1 border-(--maincolor) mx-auto"></div>
                  <h4 className="text-(--maincolor) text-2xl font-bold">
                    <Link href="mailto:support@gethealthcare.ie">Send Email</Link>
                  </h4>
                </div>
                <div className="bg-(--blockground) shadow-sm rounded-md p-6 sm:py-10 text-center space-y-6">
                  <div className="icon">
                    <svg
                      className="size-8 fill-(--maincolor) mx-auto"
                      viewBox="0 0 512 512"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M497.39 361.8l-112-48a24 24 0 0 0-28 6.9l-49.6 60.6A370.66 370.66 0 0 1 130.6 204.11l60.6-49.6a23.94 23.94 0 0 0 6.9-28l-48-112A24.16 24.16 0 0 0 122.6.61l-104 24A24 24 0 0 0 0 48c0 256.5 207.9 464 464 464a24 24 0 0 0 23.4-18.6l24-104a24.29 24.29 0 0 0-14.01-27.6z"></path>
                    </svg>
                  </div>
                  <div className="w-4/5 border-b-1 border-(--maincolor) mx-auto"></div>
                  <h4 className="text-(--maincolor) text-2xl font-bold">
                    <Link href="tel:0212455185">Call</Link>
                  </h4>
                </div>
              </div>
            </div>

            {/* Submit Your Query */}
            <div className="rounded-xl shadow-[0px_0px_30px_0px_rgba(0,0,0,0.06)] p-8 lg:py-16 my-8 lg:my-16">
              <div className="lg:w-10/12 mx-auto">
                <h3 className="text-(--maincolor) text-2xl font-bold mb-5 lg:mb-8">
                  Submit Your Query
                </h3>
                <form className="my-4" onSubmit={handleSubmit} noValidate>
                  <div className="space-y-5">
                    <div>
                      <label htmlFor="full_name" className="sr-only">
                        Full Name
                      </label>
                      <input
                        id="full_name"
                        name="full_name"
                        type="text"
                        autoComplete="name"
                        value={formData.full_name}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        placeholder="Full Name"
                        className={inputClass("full_name")}
                      />
                      {errors.full_name && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.full_name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="phone" className="sr-only">
                        Phone
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        inputMode="tel"
                        disabled={isSubmitting}
                        placeholder="Phone (e.g. +353851234567)"
                        className={inputClass("phone")}
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.phone}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="email" className="sr-only">
                        Email
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        placeholder="Email"
                        className={inputClass("email")}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.email}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="user_type" className="sr-only">
                        Select Provide Option
                      </label>
                      <select
                        id="user_type"
                        name="user_type"
                        value={formData.user_type}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        className={`select-field appearance-none rounded-md w-full h-[50px] px-4 py-3 border text-sm
                          ${errors.user_type ? "border-red-400" : "border-(--maincolor)"}
                          ${formData.user_type === "provide" ? "text-gray-500" : "text-(--maincolor)"}
                        `}
                      >
                        <option value="provide">Select Provide Option</option>
                        <option value="employers">Employers/Institution</option>
                        <option value="patients">Patients</option>
                      </select>
                      {errors.user_type && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.user_type}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="message" className="sr-only">
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={4}
                        value={formData.message}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        placeholder="Write Us"
                        className={`appearance-none rounded-md relative block w-full px-4 py-3 border
                            placeholder-gray-500 text-(--maincolor) focus:outline-none focus:ring-(--maincolor) focus:border-(--maincolor) focus:z-10 text-base resize-y ${
                              errors.message
                                ? "border-red-400"
                                : "border-(--maincolor)"
                            }`}
                      ></textarea>
                      {errors.message && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-10">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      data-hover="Send"
                      className="btn btn-primary
                      w-full max-w-34
                      p-3 
                      text-base
                      before:bg-(--btncolor)
                      before:border-(--btncolor)
                      disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      <span className="flex items-center justify-center">
                        {isSubmitting ? (
                          <>
                            <Loader2 className="size-4 animate-spin mr-2" />
                            Sending...
                          </>
                        ) : (
                          <>
                            Send
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="size-4 stroke-white ml-4"
                              width="20"
                              height="12"
                              viewBox="0 0 20 12"
                              fill="none"
                            >
                              <path
                                d="M19.5303 6.53033C19.8232 6.23744 19.8232 5.76256 19.5303 5.46967L14.7574 0.696699C14.4645 0.403806 13.9896 0.403806 13.6967 0.696699C13.4038 0.989593 13.4038 1.46447 13.6967 1.75736L17.9393 6L13.6967 10.2426C13.4038 10.5355 13.4038 11.0104 13.6967 11.3033C13.9896 11.5962 14.4645 11.5962 14.7574 11.3033L19.5303 6.53033ZM0 6.75H19V5.25H0V6.75Z"
                                fill="none"
                              ></path>
                            </svg>
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
