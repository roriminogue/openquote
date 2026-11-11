"use client";

import { TextInput, type TextInputProps } from "@astryxdesign/core/TextInput";
import { useState } from "react";

/**
 * A text field for a form the server renders: it remembers what was typed and sends it under `name` when the
 * form is submitted. Full width, because on a phone a field is as wide as the screen.
 */
export function TextField({
  name,
  defaultValue = "",
  ...props
}: Omit<TextInputProps, "value" | "onChange" | "htmlName"> & { name: string; defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue);
  return <TextInput width="100%" {...props} htmlName={name} value={value} onChange={(next) => setValue(next)} />;
}
