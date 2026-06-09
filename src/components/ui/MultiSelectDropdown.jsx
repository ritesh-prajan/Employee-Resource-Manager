import React, { useState, useEffect, useRef } from "react";
import {Check, X } from "lucide-react";

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
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase())
  );

  const toggleOption = (value) => {
    if (singleSelect) {
      onChange([value]);
      setIsOpen(false);
      setSearch("");
      return;
    }
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const removeOption = (e, value) => {
    e.stopPropagation();
    onChange(selectedValues.filter((v) => v !== value));
  };

  const displayValue = () => {
    if (search) return search;
    if (singleSelect && selectedValues.length === 1) {
      return options.find((o) => o.value === selectedValues[0])?.label || "";
    }
    return "";
  };

  const selectedOptions = options.filter((o) => selectedValues.includes(o.value));

  return (
    <div ref={containerRef} className={`relative ${width}`}>

      {/* Selected Tags — only for multi select */}
      {!singleSelect && selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedOptions.map((option) => (
            <span
              key={option.value}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--primary-foreground)",
              }}
            >
              {option.label}
              <button
                type="button"
                onClick={(e) => removeOption(e, option.value)}
                style={{ display: "inline-flex", alignItems: "center", opacity: 0.8 }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.8)}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

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
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute z-50 mt-2 w-full rounded-[14px] border border-[#D6DCE8] bg-white shadow-lg"
          style={{ overflow: "visible" }}
        >
          <div className="max-h-60 overflow-y-visible py-2">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-400">No results found</div>
            ) : (
              filteredOptions.map((option) => {
                const selected = selectedValues.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleOption(option.value)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-[15px] transition-colors hover:bg-slate-50"
                  >
                    <span>{option.label}</span>
                    {selected && <Check size={16} className="text-[#0010AE]" />}
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