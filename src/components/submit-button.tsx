"use client";

import { Button, type ButtonProps } from "@astryxdesign/core/Button";
import { useFormStatus } from "react-dom";

/** A form's submit button. While the form sends it locks, spins and says what is happening, so nothing sends twice. */
export function SubmitButton({
  label,
  pendingLabel,
  variant = "primary",
  size,
  width,
}: {
  label: string;
  pendingLabel: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  width?: ButtonProps["width"];
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      label={pending ? pendingLabel : label}
      variant={variant}
      size={size}
      width={width}
      isLoading={pending}
    />
  );
}
