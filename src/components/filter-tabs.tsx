import { Tab, TabList } from "@astryxdesign/core/TabList";
import { Text } from "@astryxdesign/core/Text";

/**
 * Filters or sections as tabs on a hairline. Each tab is a link, so the choice lives in the URL; a count can sit
 * beside each label. On a phone the strip scrolls sideways rather than wrapping.
 */
export function FilterTabs({
  items,
  label,
}: {
  items: { href: string; label: string; count?: number; on: boolean }[];
  label: string;
}) {
  const current = items.find((t) => t.on)?.href ?? "";
  return (
    <nav aria-label={label}>
      <TabList value={current} onChange={() => {}} hasDivider>
        {items.map((t) => (
          <Tab
            key={t.href}
            value={t.href}
            href={t.href}
            label={t.label}
            endContent={
              t.count === undefined ? undefined : (
                <Text type="supporting" hasTabularNumbers>
                  {t.count}
                </Text>
              )
            }
          />
        ))}
      </TabList>
    </nav>
  );
}
