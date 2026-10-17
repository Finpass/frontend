import { describe, expect, it } from "vitest";
import type { ChatMessage } from "@/features/dashboard/types";
import { mergeMessages, mergeTurns, parseBlocks, parseCitations, relativeTime, sessionTitle } from "./advisory";

const msg = (id: number, content = "x"): ChatMessage => ({ id, role: "assistant", content, citations: null, createdAt: "2026-10-17T00:00:00Z" });

describe("parseCitations", () => {
  it("splits text and markers", () => {
    expect(parseCitations("a [1] b", [1])).toEqual([{ type: "text", text: "a " }, { type: "cite", n: 1 }, { type: "text", text: " b" }]);
  });
  it("handles adjacent markers", () => {
    expect(parseCitations("x[1][2]", [1, 2])).toEqual([{ type: "text", text: "x" }, { type: "cite", n: 1 }, { type: "cite", n: 2 }]);
  });
  it("ignores markers without a source and non-numeric brackets", () => {
    expect(parseCitations("a [3] [x] [] b", [1])).toEqual([{ type: "text", text: "a [3] [x] [] b" }]);
  });
  it("returns nothing for empty text", () => expect(parseCitations("", [1])).toEqual([]));
});

describe("mergeMessages", () => {
  it("appends new and replaces same id", () => {
    const r = mergeMessages([msg(1, "old"), msg(2)], [msg(2, "new"), msg(3)]);
    expect(r.map((m) => [m.id, m.content])).toEqual([[1, "old"], [2, "new"], [3, "x"]]);
  });
});

describe("sessionTitle", () => {
  it("prefers the title", () => expect(sessionTitle(" Hi ", "msg", "fb")).toBe("Hi"));
  it("falls back to the message, cut at 60", () => expect(sessionTitle("", "a".repeat(80), "fb")).toBe("a".repeat(60)));
  it("falls back to the label", () => expect(sessionTitle(null, undefined, "fb")).toBe("fb"));
});

describe("relativeTime", () => {
  const now = new Date("2026-10-17T12:00:00Z");
  it("formats minutes", () => expect(relativeTime("2026-10-17T11:55:00Z", now, "en")).toBe("5 minutes ago"));
  it("formats in Indonesian", () => expect(relativeTime("2026-10-17T09:00:00Z", now, "id")).toContain("jam"));
  it("falls back to a date after a week", () => expect(relativeTime("2026-09-01T00:00:00Z", now, "en")).toContain("2026"));
  it("tolerates a bad date", () => expect(relativeTime("nope", now, "en")).toBe(""));
});

describe("mergeTurns", () => {
  const t = (sequence: number, title = "s"): import("@/features/dashboard/types").TurnEvent => ({ sequence, title, type: "processing", status: "in_progress", timestamp: "" });
  it("orders by sequence and never duplicates a polled step", () => {
    const r = mergeTurns([t(1), t(2, "old")], [t(2, "new"), t(3)]);
    expect(r.map((x) => [x.sequence, x.title])).toEqual([[1, "s"], [2, "new"], [3, "s"]]);
  });
  it("starts from nothing", () => {
    expect(mergeTurns([], [t(2), t(1)]).map((x) => x.sequence)).toEqual([1, 2]);
  });
});

describe("parseBlocks", () => {
  it("separates paragraphs and joins soft line breaks", () => {
    expect(parseBlocks("a\nb\n\nc")).toEqual([{ type: "p", text: "a b" }, { type: "p", text: "c" }]);
  });
  it("groups bullets and numbered items into lists", () => {
    expect(parseBlocks("Intro:\n- satu [1]\n* dua\n1. x\n2) y")).toEqual([
      { type: "p", text: "Intro:" },
      { type: "ul", items: ["satu [1]", "dua"] },
      { type: "ol", items: ["x", "y"] },
    ]);
  });
  it("drops bold markers and ignores empty text", () => {
    expect(parseBlocks("**Penting** sekali")).toEqual([{ type: "p", text: "Penting sekali" }]);
    expect(parseBlocks("  \n ")).toEqual([]);
  });
});
