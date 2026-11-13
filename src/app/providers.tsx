import { InternationalizationProvider } from "@astryxdesign/core/i18n";
import { LinkProvider } from "@astryxdesign/core/Link";
import { Theme } from "@astryxdesign/core/theme";
import Link from "@/lib/link";
import { useThemeChoice } from "@/components/theme";
// The theme's CSS is imported once, in globals.css, where the cascade layer order is declared. Importing it from
// JavaScript as well would load it ahead of that declaration and let Tailwind's reset override every component.
import { openquoteTheme } from "@/themes/openquote/openquote.js";

/**
 * App-wide providers: the OpenQuote theme in the mode saved on this device (Settings → Account), Next's
 * <Link> behind every Astryx link and link-button so in-app navigation stays client-side, and Australian
 * dates in every date field and calendar.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const mode = useThemeChoice();
  return (
    <Theme theme={openquoteTheme} mode={mode}>
      <InternationalizationProvider locale="en-AU">
        <LinkProvider component={Link}>{children}</LinkProvider>
      </InternationalizationProvider>
    </Theme>
  );
}
