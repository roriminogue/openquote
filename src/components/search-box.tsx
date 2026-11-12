import { TextInput } from "@astryxdesign/core/TextInput";
import { Search } from "lucide-react";
import { useState, type ReactNode } from "react";

/** GET search form: the query lives in the URL so results can be shared and survive a refresh. */
export function SearchBox({ q, placeholder, children }: { q: string; placeholder: string; children?: ReactNode }) {
  const [value, setValue] = useState(q);
  return (
    <form role="search" className="w-full">
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
