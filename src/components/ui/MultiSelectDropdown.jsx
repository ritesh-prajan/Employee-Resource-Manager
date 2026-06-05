import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";

export default function MultiSearchSelect({
  options = [],
  selectedValues = [],
  onChange,
  placeholder = "Search and select...",
  width = "w-full",
  height = "h-[52px]",
  singleSelect = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () =>
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
  }, []);

  const filteredOptions = options.filter((option) =>
    option.label
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const toggleOption = (value) => {
    if (singleSelect) {
      onChange([value]);
      setIsOpen(false);
      setSearch("");
      return;
    }

    if (selectedValues.includes(value)) {
      onChange(
        selectedValues.filter((v) => v !== value)
      );
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const displayValue = () => {
    if (search) return search;

    if (selectedValues.length === 0)
      return "";

    if (singleSelect) {
      return (
        options.find(
          (o) => o.value === selectedValues[0]
        )?.label || ""
      );
    }

    if (selectedValues.length === 1) {
      return (
        options.find(
          (o) => o.value === selectedValues[0]
        )?.label || ""
      );
    }

    return `${selectedValues.length} selected`;
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${width}`}
    >
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue()}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          className={`
            ${height}
            w-full
            rounded-[14px]
            border
            border-[#D6DCE8]
            bg-white
            px-5
            pr-10
            text-[15px]
            text-slate-700
            outline-none
            transition-all
            placeholder:text-slate-400
            focus:border-[#0010AE]
          `}
        />

        <ChevronDown
          size={18}
          className={`
            absolute
            right-4
            top-1/2
            -translate-y-1/2
            text-slate-400
            transition-transform
            ${isOpen ? "rotate-180" : ""}
          `}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="
            absolute
            z-50
            mt-2
            w-full
            overflow-hidden
            rounded-[14px]
            border
            border-[#D6DCE8]
            bg-white
            shadow-lg
          "
        >
          <div className="max-h-60 overflow-y-auto py-2">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-400">
                No results found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const selected =
                  selectedValues.includes(
                    option.value
                  );

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      toggleOption(option.value)
                    }
                    className={`
                      flex
                      w-full
                      items-center
                      justify-between
                      px-4
                      py-3
                      text-left
                      text-[15px]
                      transition-colors
                      hover:bg-slate-50
                    `}
                  >
                    <span>
                      {option.label}
                    </span>

                    {selected && (
                      <Check
                        size={16}
                        className="text-[#0010AE]"
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}