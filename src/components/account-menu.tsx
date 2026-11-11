"use client";

import { Avatar } from "@astryxdesign/core/Avatar";
import { DropdownMenu } from "@astryxdesign/core/DropdownMenu";
import { LogOut, UserRound } from "lucide-react";
import { useRef } from "react";

/**
 * The signed-in person: their initial in the top bar, with account settings and sign out behind it. On a phone the
 * choices come up as a sheet from the bottom; with a mouse they drop down from the avatar.
 */
export function AccountMenu({ email }: { email: string }) {
  const signOut = useRef<HTMLFormElement>(null);

  return (
    <>
      <DropdownMenu
        aria-label="Account"
        presentation="adaptive"
        placement="below"
        alignment="end"
        menuWidth={232}
        hasChevron={false}
        renderTrigger={(trigger) => (
          <button
            {...trigger}
            type="button"
            aria-label={`Account: ${email}`}
            className="grid size-11 cursor-pointer place-items-center rounded-full outline-offset-[-4px] transition-opacity hover:opacity-80 aria-expanded:opacity-80"
          >
            <Avatar name={email} size={32} tooltip={false} />
          </button>
        )}
        items={[
          {
            type: "section",
            title: email,
            items: [
              { label: "Account settings", icon: UserRound, href: "/settings/account" },
              { label: "Sign out", icon: LogOut, onClick: () => signOut.current?.requestSubmit() },
            ],
          },
        ]}
      />
      {/* Signing out is a POST, so a link someone pastes or a page that prefetches can never sign you out. */}
      <form ref={signOut} action="/auth/signout" method="post" hidden />
    </>
  );
}
