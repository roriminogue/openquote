import type { ReactNode } from "react";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Wordmark } from "./app-shell";

/**
 * Sign-in and onboarding. On a phone everything starts at the top, so the fields stay in view above the keyboard,
 * and a line of what the app does sits at the foot. On a wide screen the same column is centred.
 */
export function AuthFrame({ title, intro, children }: { title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-(--color-background-surface)">
      <main className="mx-auto flex w-full max-w-[24rem] flex-1 flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(3.5rem,calc(env(safe-area-inset-top)+2rem))] sm:justify-center sm:py-16">
        <Wordmark />
        <div className="mt-10 flex flex-col gap-1.5">
          <Heading level={1}>{title}</Heading>
          {intro && (
            <Text as="p" color="secondary">
              {intro}
            </Text>
          )}
        </div>
        <div className="mt-7">{children}</div>
        <div className="mt-auto pt-12 sm:mt-0">
          <Text as="p" type="supporting">
            Describe a job, get a priced estimate with your own rates. Open source.
          </Text>
        </div>
      </main>
    </div>
  );
}
