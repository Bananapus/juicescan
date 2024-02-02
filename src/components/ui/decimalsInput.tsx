import * as React from "react";
import { Input, InputProps } from "./input";

interface DecimalsInputProps extends Omit<InputProps, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
  decimals?: number; // Decimal limit, defaults to 18
}

const DecimalsInput: React.FC<DecimalsInputProps> = ({ value, onChange, decimals = 18, ...props }) => {
  const decimalsRegex = new RegExp(`^\\d*\\.?\\d{0,${decimals}}$`);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    if (newValue === "" || decimalsRegex.test(newValue)) {
      onChange(newValue);
    } else {
      console.error("Rejected invalid input: ", newValue);
    }
  };

  return (
    <Input
      {...props}
      value={value}
      onChange={handleChange}
      type="text"
    />
  );
};

export default DecimalsInput;
