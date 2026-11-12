import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { Monitor, Moon, Sun } from "lucide-react";
import { applyThemeChoice, useThemeChoice, type ThemeChoice } from "./theme";

// Settings → Account only. Kept out of theme.tsx, which every page loads through Providers.

const OPTIONS = [
  ["system", "System", Monitor],
  ["light", "Light", Sun],
  ["dark", "Dark", Moon],
] as const;

/** Light, Dark or System, saved on this device. */
export function ThemeSwitch() {
  const choice = useThemeChoice();
  return (
    <SegmentedControl label="Theme" value={choice} onChange={(value) => applyThemeChoice(value as ThemeChoice)} layout="fill">
      {OPTIONS.map(([value, label, Icon]) => (
        <SegmentedControlItem key={value} value={value} label={label} icon={<Icon size={16} aria-hidden />} />
      ))}
    </SegmentedControl>
  );
}
