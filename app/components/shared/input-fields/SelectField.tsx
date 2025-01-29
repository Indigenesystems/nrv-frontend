import React from "react";
import Select from "react-select";

interface Option {
  value: any;
  label: string;
}

interface Props {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  isSearchable?: boolean;
  noOptionsMessage?: () => string;
  options?: Option[];
  onChange?: (selectedOption: any) => void;
  value: any;
  disabled?: boolean;
  onBlur?: any;
}

const customStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
    borderColor: state.isFocused ? "#9da3af" : "#9da3af", // Grey border on focus and default
    borderWidth: "1px",
   boxShadow: state.isFocused ? "#9da3af" : "#9da3af", // Light grey shadow on focus
    backgroundColor: "transparent", // Ensure the background is transparent
    borderRadius: "5px",
    fontSize: "15px",
   // fontWeight: "400",
    color: "#9da3af", // Text color
    padding: "5px"
  }),

  option: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isFocused ? "#f5f5f5" : "white", // Light grey when focused
    color: state.isFocused ? "#000000" : "#000000",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
  }),

  placeholder: (provided: any) => ({
    ...provided,
    color: "#999999", // Grey color for placeholder
  }),

  singleValue: (provided: any) => ({
    ...provided,
    color: "#333333", // Set the text color to a darker grey
  }),

  input: (provided: any) => ({
    ...provided,
    color: "#333333", // Darker grey for input text
  }),
};

const SelectField: React.FC<Props> = ({
  label,
  name,
  required,
  placeholder,
  isSearchable,
  noOptionsMessage,
  options,
  onChange,
  onBlur,
  value,
  disabled,
}) => {
  const handleSelectChange = (selectedOption: any) => {
    if (onChange) {
      onChange(selectedOption);
    }
  };

  return (
    <div>
      <label className="text-black font-medium">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </label>
  <div className="pt-1.5">
  <Select
        name={name}
        isDisabled={disabled}
        styles={customStyles}
        isSearchable={isSearchable}
        isClearable={true}
        options={options}
        placeholder={placeholder}
        value={value}
        noOptionsMessage={noOptionsMessage}
        onChange={handleSelectChange}
        onBlur={onBlur}
      />
  </div>
    </div>
  );
};

export default SelectField;
