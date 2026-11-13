import { TextInput } from "@astryxdesign/core/TextInput";
import { Search } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router";

/**
 * Search as you type: the query goes into the address (?q=) a moment after the last key, so the list filters in place
 * (no page reload) and the search survives a refresh. Other filters in the address (a project status) are kept.
 */
export function SearchBox({ q, placeholder, children }: { q: string; placeholder: string; children?: ReactNode }) {
  const [value, setValue] = useState(q);
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    const wanted = value.trim();
    if ((params.get("q") ?? "") === wanted) return;
    const timer = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (wanted) next.set("q", wanted);
      else next.delete("q");
      setParams(next, { replace: true, preventScrollReset: true });
    }, 200);
    return () => clearTimeout(timer);
  }, [value, params, setParams]);

  return (
    <form role="search" className="w-full" onSubmit={(e) => e.preventDefault()}>
      {children}
      <TextInput
        type="search"
        label={placeholder}
        isLabelHidden
        htmlName="q"
        value={value}
        onChange={setValue}
        placeholder={placeholder}
        startIcon={Search}
        enterKeyHint="search"
        autoComplete="off"
        width="100%"
      />
    </form>
  );
}
