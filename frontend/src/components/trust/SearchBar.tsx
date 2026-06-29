"use client";
import { useState, KeyboardEvent } from "react";
import { useLocale } from "@/lib/locale-context";

interface Props {
  onSearch: (domain: string) => void;
  loading: boolean;
  initialValue?: string;
}

export function SearchBar({ onSearch, loading, initialValue = "" }: Props) {
  const { t } = useLocale();
  const [value, setValue] = useState(initialValue);

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onSearch(value);
  };

  return (
    <div className="flex border border-ink bg-white">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKey}
        placeholder={t("search.placeholder")}
        className="flex-1 px-4 py-3 text-sm font-sans bg-transparent outline-none placeholder:text-muted"
      />
      <button
        onClick={() => onSearch(value)}
        disabled={loading}
        className="bg-ink text-off-white px-5 text-[11px] font-medium tracking-widest uppercase
                   hover:bg-[#333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "…" : t("search.button")}
      </button>
    </div>
  );
}
