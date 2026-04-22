'use client';

import { Check, ChevronDown, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectFilterProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  label?: string;
  placeholder?: string;
}

export default function MultiSelectFilter({
  options,
  selected,
  onChange,
  label,
  placeholder = 'Select...',
}: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const getDisplayText = () => {
    if (selected.length === 0) return placeholder;
    if (selected.length === 1) {
      return options.find((o) => o.value === selected[0])?.label || placeholder;
    }
    return `${selected.length} selected`;
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
          {label}
        </label>
      )}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-xl px-4 py-3 text-sm text-left focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all flex items-center justify-between gap-2"
      >
        <span className={selected.length === 0 ? 'text-gray-500' : 'text-white'}>
          {getDisplayText()}
        </span>
        <div className="flex items-center gap-1">
          {selected.length > 0 && (
            <button
              onClick={clearAll}
              className="rounded-full p-1 hover:bg-white/10 transition-all"
            >
              <X className="h-3.5 w-3.5 text-gray-400" />
            </button>
          )}
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full rounded-2xl border border-white/10 bg-gray-900/95 backdrop-blur-2xl shadow-2xl overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {options.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">
                No options available
              </div>
            ) : (
              options.map((option) => {
                const isSelected = selected.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleOption(option.value)}
                    className="w-full px-4 py-3 text-sm text-left hover:bg-white/5 transition-all flex items-center justify-between gap-3 group"
                  >
                    <span className={isSelected ? 'text-white font-medium' : 'text-gray-300'}>
                      {option.label}
                    </span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-blue-400" />
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
