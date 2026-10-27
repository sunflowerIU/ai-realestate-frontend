"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { getRecord, listRecords, type RecordRow } from "@/lib/api/client";

type Reference = "clients" | "properties" | "requirements";

function nameFor(row: RecordRow, resource: Reference) {
  return String(
    row[resource === "clients" ? "name" : "title"] ||
      `Record ${row.id.slice(0, 8)}`,
  );
}

export function ReferenceInput({
  id,
  resource,
  value,
  onChange,
  onSelect,
  onBlur,
  disabled,
  invalid,
  clientId,
}: {
  id: string;
  resource: Reference;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (row: RecordRow) => void;
  onBlur: () => void;
  disabled?: boolean;
  invalid?: boolean;
  clientId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 200);
    return () => window.clearTimeout(timer);
  }, [search]);
  const options = useQuery({
    queryKey: ["reference", resource, debouncedSearch, clientId],
    queryFn: () =>
      listRecords<RecordRow>(resource, {
        pageSize: 50,
        search: debouncedSearch || undefined,
        ...(resource === "requirements" && clientId ? { clientId } : {}),
      }),
    enabled: open && !disabled && debouncedSearch === search.trim(),
  });
  const list = options.data?.items ?? [];
  const selectedInList = list.find((row) => row.id === value);
  const current = useQuery({
    queryKey: ["reference", resource, "selected", value],
    queryFn: () => getRecord<RecordRow>(resource, value),
    enabled: Boolean(value) && !selectedInList,
  });
  const selected = selectedInList ?? current.data;
  const choices = value ? [{ id: "", name: "Clear selection" }, ...list] : list;

  function choose(row: RecordRow | null) {
    onChange(row?.id ?? "");
    if (row) onSelect?.(row);
    setSearch("");
    setActiveIndex(-1);
    setOpen(false);
  }
  return (
    <div className="reference-input" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        setOpen(false);
        setSearch("");
        setActiveIndex(-1);
        onBlur();
      }
    }}>
      <Input
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={`${id}-options`}
        aria-activedescendant={open && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
        aria-invalid={invalid}
        placeholder={`Search ${resource}…`}
        value={open ? search : value ? selected ? nameFor(selected, resource) : `Record ${value.slice(0, 8)}` : ""}
        onFocus={(event) => {
          if (disabled) return;
          setSearch(value ? selected ? nameFor(selected, resource) : `Record ${value.slice(0, 8)}` : "");
          setOpen(true);
          if (value) event.currentTarget.select();
        }}
        onChange={(event) => {
          if (value) onChange("");
          setSearch(event.target.value);
          setActiveIndex(-1);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            setSearch("");
            setActiveIndex(-1);
          } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
            if (options.isSuccess && debouncedSearch === search.trim() && choices.length)
              setActiveIndex((index) => event.key === "ArrowDown"
                ? (index + 1) % choices.length
                : (index - 1 + choices.length) % choices.length);
          } else if (event.key === "Enter" && open && options.isSuccess && debouncedSearch === search.trim() && activeIndex >= 0 && choices[activeIndex]) {
            event.preventDefault();
            choose(choices[activeIndex].id ? choices[activeIndex] as RecordRow : null);
          }
        }}
        disabled={disabled}
      />
      {open && !disabled && (
        <div id={`${id}-options`} className="reference-options" role="listbox">
          {options.isPending || debouncedSearch !== search.trim() ? (
            <div className="reference-option-status">Searching…</div>
          ) : options.isError ? (
            <div className="reference-option-status" role="alert">Could not search records.</div>
          ) : choices.length ? choices.map((row, index) => (
            <div
              key={row.id || "clear"}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={row.id === value}
              className={`reference-option${index === activeIndex ? " is-active" : ""}`}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => choose(row.id ? row as RecordRow : null)}
            >
              {row.id ? nameFor(row as RecordRow, resource) : "Clear selection"}
            </div>
          )) : (
            <div className="reference-option-status">No matches found.</div>
          )}
          {options.data && options.data.pagination.total > 50 && (
            <div className="reference-option-status">Showing the first 50 matches. Refine your search.</div>
          )}
        </div>
      )}
    </div>
  );
}
