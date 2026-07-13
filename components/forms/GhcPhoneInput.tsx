"use client";

import "react-phone-number-input/style.css";
import PhoneInput, { type Props } from "react-phone-number-input";

type GhcPhoneInputProps = Omit<
  Props<React.InputHTMLAttributes<HTMLInputElement>>,
  | "international"
  | "withCountryCallingCode"
  | "addInternationalOption"
  | "countryCallingCodeEditable"
> & {
  defaultCountry?: Props<React.InputHTMLAttributes<HTMLInputElement>>["defaultCountry"];
};

export default function GhcPhoneInput({
  defaultCountry = "IE",
  className = "w-full",
  ...props
}: GhcPhoneInputProps) {
  return (
    <PhoneInput
      defaultCountry={defaultCountry}
      international
      withCountryCallingCode
      addInternationalOption={false}
      countryCallingCodeEditable={false}
      className={className}
      {...props}
    />
  );
}

export { isValidPhoneNumber } from "react-phone-number-input";
