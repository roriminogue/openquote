import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";

/** A quote link that doesn't work: mistyped, or its estimate was deleted. Said plainly, with what to do next. */
export default function QuoteNotFound() {
  return (
    <main className="flex min-h-dvh flex-1 items-start justify-center bg-(--color-background-muted) px-4 pt-[max(4rem,calc(env(safe-area-inset-top)+2rem))] sm:items-center sm:pt-0">
      <div className="w-full max-w-sm rounded-(--radius-container) border border-(--color-border) bg-(--color-background-card) px-5 py-6 shadow-sm">
        <Heading level={1}>This quote link isn&apos;t working</Heading>
        <div className="mt-2">
          <Text as="p" display="block" color="secondary">
            It may have been mistyped, or the quote was withdrawn. Ask the business that sent it for a new link.
          </Text>
        </div>
      </div>
    </main>
  );
}
