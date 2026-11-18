import type { NoticeApplyMode, NoticeKind } from "@/lib/schemas";

/**
 * The checklist under every notice. It is deliberately generic — it never
 * claims a detail the notice did not state — but it is the part a reader
 * actually uses: what to have ready, and what to keep afterwards.
 */
export function applicationChecklist({
  kind,
  applyMode,
  hasFee,
}: {
  kind: NoticeKind;
  applyMode: NoticeApplyMode;
  hasFee: boolean;
}): string[] {
  if (kind === "admit-card") {
    return [
      "Download it from the official portal only — no other site issues your card.",
      "Check your name, roll number, centre and reporting time as printed.",
      "Print a copy and carry a photo ID that matches the card.",
      "If the photograph or signature is illegible, re-download before exam day.",
    ];
  }

  if (kind === "result") {
    return [
      "Search your roll number in the official PDF or result page.",
      "Note the cut-off and your position before the next stage.",
      "Download and keep the result and scorecard with your records.",
    ];
  }

  if (kind === "answer-key") {
    return [
      "Compare your responses against the official key, question by question.",
      "Note the objection window and any fee the notice states for a challenge.",
      "Submit any objection only through the process the notice describes.",
    ];
  }

  if (kind === "admission") {
    return [
      "Read the eligibility rules and programme detail before you start.",
      "Keep certificates and category documents in the format the notice asks for.",
      "Check the fee deadline separately from the form deadline.",
    ];
  }

  const base = [
    "Read the official notification in full before filling anything in.",
    "Keep a photograph, signature, photo ID and qualification certificates ready in the size it specifies.",
    "Apply before the last date rather than on it — portals slow down near the close.",
    "Save the registration number and a copy of the submitted form.",
  ];

  if (applyMode === "offline") {
    base[2] =
      "Post early: a form that reaches the office after the last date is rejected, whatever the postmark.";
    base[3] = "Keep the acknowledgement slip or proof of posting with your copies.";
  }

  if (hasFee) {
    base.splice(
      2,
      0,
      "Pay only through the method the official portal provides — never to an individual."
    );
  }

  return base;
}
