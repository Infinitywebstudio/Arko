"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import {
  COUNTRIES,
  type Country,
  digitsOnly,
  flagEmoji,
  getCountry,
  parseE164,
  toE164,
} from "@/lib/countries";

/**
 * International phone input with a searchable country dropdown.
 *
 * Contract:
 *   - `value`     : the current E.164 string ("+33612345678") or "" / null
 *   - `onChange`  : called with the next E.164 string, or "" when the local
 *                   part is empty (so a parent can persist null instead of a
 *                   half-typed number)
 *
 * Behaviour:
 *   - On mount, parses `value` back into { country, local } so editing an
 *     existing profile pre-fills both fields. Longest-prefix-match wins.
 *   - Dropdown opens on click or ArrowDown / Enter / Space when focused,
 *     closes on Escape, outside-click, or selection.
 *   - Type-ahead search is accent-insensitive and matches name OR dial code.
 *   - Arrow keys navigate the visible (post-filter) list; Enter selects.
 *
 * The component is intentionally controlled (parent owns the value) and
 * does not call any server action itself — keeps it reusable across the
 * three forms that need a phone field.
 */

type Props = {
  /** E.164 string, or "" / null when empty. */
  value: string | null;
  /** Receives the next E.164 string, or "" when the local part is empty. */
  onChange: (next: string) => void;
  /** Field name on the surrounding form. Drives the hidden input that the
   *  server action reads via `formData.get(name)`. Default: "phone". */
  name?: string;
  id?: string;
  disabled?: boolean;
  hasError?: boolean;
  placeholder?: string;
  /** Set true to require a non-empty value at HTML-form level. */
  required?: boolean;
};

const HEIGHT = 44;

function normalise(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function matchesQuery(country: Country, normQuery: string): boolean {
  if (!normQuery) return true;
  if (normalise(country.name).includes(normQuery)) return true;
  // Allow searching by "33" or "+33".
  const q = normQuery.replace(/^\+/, "");
  if (q.length > 0 && country.dialCode.slice(1).startsWith(q)) return true;
  return false;
}

export default function PhoneInput({
  value,
  onChange,
  name = "phone",
  id,
  disabled = false,
  hasError = false,
  placeholder = "6 12 34 56 78",
  required = false,
}: Props) {
  const initial = useMemo(() => parseE164(value), [value]);
  const [country, setCountry] = useState<Country>(initial.country);
  const [local, setLocal] = useState<string>(initial.local);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);

  // Sync from `value` when the parent rewrites it externally (e.g. a server
  // action revalidates and hands a new prop down). React's "update state
  // during render" pattern: storing the last seen prop and comparing here
  // avoids the cascading-renders penalty an effect would trigger.
  const [lastValueProp, setLastValueProp] = useState(value);
  if (value !== lastValueProp) {
    setLastValueProp(value);
    setCountry(initial.country);
    setLocal(initial.local);
  }

  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const reactId = useId();
  const inputId = id ?? `phone-${reactId}`;
  const listboxId = `phone-listbox-${reactId}`;

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Focus the search input when opening.
  useEffect(() => {
    if (open) {
      // Defer a tick — the input is mounted by the same render that flips `open`.
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  const normQuery = useMemo(() => normalise(query.trim()), [query]);
  const filtered = useMemo(
    () => COUNTRIES.filter((c) => matchesQuery(c, normQuery)),
    [normQuery],
  );

  // Reset the active index when the filter changes so keyboard navigation
  // never points past the visible list. Same render-time sync pattern as
  // above — an effect here would cause a cascade.
  const [lastNormQuery, setLastNormQuery] = useState(normQuery);
  if (normQuery !== lastNormQuery) {
    setLastNormQuery(normQuery);
    setActiveIdx(0);
  }

  // Scroll the active option into view when it changes via keyboard.
  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    if (!list) return;
    const node = list.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`);
    if (node) {
      node.scrollIntoView({ block: "nearest" });
    }
  }, [activeIdx, open]);

  const emit = useCallback(
    (nextCountry: Country, nextLocal: string) => {
      const e164 = toE164(nextCountry, nextLocal);
      onChange(e164 ?? "");
    },
    [onChange],
  );

  const handleSelectCountry = (c: Country) => {
    setCountry(c);
    setOpen(false);
    setQuery("");
    emit(c, local);
    // Return focus to the trigger so screen readers track context.
    buttonRef.current?.focus();
  };

  const handleLocalChange = (raw: string) => {
    const cleaned = digitsOnly(raw);
    setLocal(cleaned);
    emit(country, cleaned);
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(filtered.length - 1, i + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const picked = filtered[activeIdx];
      if (picked) handleSelectCountry(picked);
    }
  };

  return (
    <div
      ref={rootRef}
      style={{ position: "relative", display: "flex", gap: 8 }}
    >
      {/* Country selector trigger */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={handleTriggerKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={`Indicatif : ${country.name} ${country.dialCode}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          height: HEIGHT,
          padding: "0 12px",
          background: "white",
          border: `1px solid ${hasError ? "var(--danger-500)" : "var(--ink-300)"}`,
          borderRadius: 12,
          fontFamily: "var(--font-mono)",
          fontSize: 14,
          color: "var(--ink-900)",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
          flexShrink: 0,
          minWidth: 110,
        }}
      >
        <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }}>
          {flagEmoji(country.code)}
        </span>
        <span style={{ fontWeight: 600 }}>{country.dialCode}</span>
        <span aria-hidden="true" style={{ color: "var(--ink-500)", fontSize: 11 }}>
          ▾
        </span>
      </button>

      {/* Local-number input. The hidden field below is what the server reads. */}
      <input
        id={inputId}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={local}
        onChange={(e) => handleLocalChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        style={{
          flex: 1,
          minWidth: 0,
          height: HEIGHT,
          padding: "0 14px",
          background: "white",
          border: `1px solid ${hasError ? "var(--danger-500)" : "var(--ink-300)"}`,
          borderRadius: 12,
          fontFamily: "var(--font-mono)",
          fontSize: 14,
          color: "var(--ink-900)",
          outline: "none",
        }}
      />

      {/* Hidden field carries the assembled E.164 to the form submission. */}
      <input
        type="hidden"
        name={name}
        value={local.length > 0 ? toE164(country, local) ?? "" : ""}
        required={required && local.length === 0}
      />

      {/* Dropdown panel */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: HEIGHT + 6,
            left: 0,
            zIndex: 50,
            width: 320,
            maxWidth: "100%",
            background: "white",
            border: "1px solid var(--ink-300)",
            borderRadius: 12,
            boxShadow: "var(--shadow-lg)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: 8,
              borderBottom: "1px solid var(--ink-200)",
              background: "var(--ink-50)",
            }}
          >
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Rechercher un pays ou indicatif…"
              aria-label="Rechercher un pays"
              autoComplete="off"
              style={{
                width: "100%",
                height: 36,
                padding: "0 12px",
                border: "1px solid var(--ink-300)",
                borderRadius: 8,
                background: "white",
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                color: "var(--ink-900)",
                outline: "none",
              }}
            />
          </div>
          <div
            ref={listRef}
            role="listbox"
            id={listboxId}
            aria-label="Pays"
            style={{
              maxHeight: 260,
              overflowY: "auto",
            }}
          >
            {filtered.length === 0 ? (
              <div
                style={{
                  padding: "16px 14px",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "var(--ink-500)",
                  textAlign: "center",
                }}
              >
                Aucun pays trouvé.
              </div>
            ) : (
              filtered.map((c, idx) => {
                const selected = c.code === country.code;
                const active = idx === activeIdx;
                return (
                  <button
                    key={c.code}
                    type="button"
                    data-idx={idx}
                    role="option"
                    aria-selected={selected}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onClick={() => handleSelectCountry(c)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      background: active ? "var(--peach-100)" : "white",
                      border: "none",
                      borderBottom: "1px solid var(--ink-100)",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "var(--font-mono)",
                      fontSize: 13,
                      color: "var(--ink-900)",
                    }}
                  >
                    <span aria-hidden="true" style={{ fontSize: 16 }}>
                      {flagEmoji(c.code)}
                    </span>
                    <span style={{ flex: 1 }}>{c.name}</span>
                    <span
                      style={{
                        color: "var(--ink-500)",
                        fontWeight: 600,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {c.dialCode}
                    </span>
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

/** Re-export for callers that need to seed a default. */
export { getCountry };
