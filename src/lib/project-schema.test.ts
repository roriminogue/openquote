import { describe, expect, it } from "vitest";
import { ClientInput, formatProjectNo, ProjectInput } from "./project-schema";

const client = { kind: "individual", name: " Jordan ", contactName: "x", email: "", phone: "", abn: "", address: "" };
const project = {
  name: "Deck",
  clientId: "8f3c88f1-802c-46c6-a6f4-dccd12040c99",
  siteAddress: "",
  status: "quoting",
  startDate: "",
  endDate: "",
  notes: "",
};

describe("ClientInput", () => {
  it("trims, blanks empty fields and drops the contact for individuals", () => {
    expect(ClientInput.parse(client)).toEqual({
      kind: "individual",
      name: "Jordan",
      contactName: null,
      email: null,
      phone: null,
      abn: null,
      address: null,
    });
  });

  it("keeps the contact for companies", () => {
    expect(ClientInput.parse({ ...client, kind: "company", contactName: "Sam" }).contactName).toBe("Sam");
  });

  it("explains a bad email or missing name", () => {
    expect(ClientInput.safeParse({ ...client, email: "nope" }).error?.issues[0].message).toBe(
      "That email doesn't look right.",
    );
    expect(ClientInput.safeParse({ ...client, name: " " }).error?.issues[0].message).toBe("Add a name.");
  });
});

describe("ProjectInput", () => {
  it("accepts a minimal project", () => {
    expect(ProjectInput.parse(project)).toMatchObject({ name: "Deck", startDate: null, notes: null });
  });

  it("requires a client and rejects an end date before the start", () => {
    expect(ProjectInput.safeParse({ ...project, clientId: "" }).error?.issues[0].message).toBe("Choose a client.");
    const bad = ProjectInput.safeParse({ ...project, startDate: "2026-11-02", endDate: "2026-11-01" });
    expect(bad.error?.issues[0]).toMatchObject({ message: "The end date is before the start date.", path: ["endDate"] });
  });
});

describe("formatProjectNo", () => {
  it("pads to four digits", () => {
    expect(formatProjectNo(7)).toBe("PRJ-0007");
  });
});
