import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import type { ReactNode } from "react";
import { SectionTitle } from "@/components/section-title";

/** A Settings section: a small grey heading, then its fields or facts in a card. */
export function SettingsSection({
  id,
  title,
  action,
  children,
}: {
  id: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="mt-10 first:mt-8">
      <SectionTitle id={id} action={action}>
        {title}
      </SectionTitle>
      <Card>{children}</Card>
    </section>
  );
}

/** The fields of a form in a card, one under the other, with room between them. */
export function Fields({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-5">{children}</div>;
}

/** The line under a page's tabs that says what the page is for. */
export function Intro({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 max-w-[68ch]">
      <Text as="p" display="block" color="secondary">
        {children}
      </Text>
    </div>
  );
}
