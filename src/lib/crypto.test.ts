import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret, lastFour } from "./crypto";

const key = randomBytes(32).toString("base64");

describe("encryptSecret / decryptSecret", () => {
  it("round-trips", () => {
    const sealed = encryptSecret("sk-ant-test-1234", key);
    expect(sealed).not.toContain("sk-ant");
    expect(decryptSecret(sealed, key)).toBe("sk-ant-test-1234");
  });

  it("uses a fresh IV each time", () => {
    expect(encryptSecret("same", key)).not.toBe(encryptSecret("same", key));
  });

  it("rejects tampered ciphertext", () => {
    const buf = Buffer.from(encryptSecret("secret", key), "base64");
    buf[buf.length - 1] ^= 1;
    expect(() => decryptSecret(buf.toString("base64"), key)).toThrow();
  });

  it("rejects a different key", () => {
    const sealed = encryptSecret("secret", key);
    expect(() => decryptSecret(sealed, randomBytes(32).toString("base64"))).toThrow();
  });

  it("requires a 32-byte key", () => {
    expect(() => encryptSecret("x", "")).toThrow(/ENCRYPTION_KEY is not set/);
    expect(() => encryptSecret("x", Buffer.from("short").toString("base64"))).toThrow(/32 bytes/);
  });
});

describe("lastFour", () => {
  it("returns the last four characters", () => {
    expect(lastFour(" sk-ant-abcd1234 ")).toBe("1234");
  });
});
