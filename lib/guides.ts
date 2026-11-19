/**
 * The reading room: short guides written for this site, not gathered from
 * anywhere. They exist because a noticeboard that only repeats headlines
 * has nothing of its own to offer — and because the questions below are
 * the ones readers actually write in with.
 */

export type GuideSection = {
  heading: string;
  paragraphs: string[];
  list?: string[];
  note?: string;
};

export type Guide = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  lede: string;
  readingMinutes: number;
  sections: GuideSection[];
};

export const GUIDES: Guide[] = [
  {
    slug: "how-to-read-a-government-job-notice",
    title: "How to read a government job notice",
    eyebrow: "Applying",
    description:
      "An official notification is a document with a fixed shape. Read it in this order and you will not miss the two or three lines that decide your application.",
    lede: "A notification looks dense because it is written for lawyers, auditors and candidates at once. It follows a fixed order, and once you know the order it takes about ten minutes to read one properly.",
    readingMinutes: 4,
    sections: [
      {
        heading: "Start with the advertisement number",
        paragraphs: [
          "Every genuine notice carries an advertisement or notification number, usually on the first page beside the date. Two recruitments from the same board can run at the same time, and candidates regularly apply against the wrong one. Note the number before anything else.",
          "If a summary, a coaching post or a forwarded PDF does not carry that number, treat it as unverified until you have found the original on the department's own site.",
        ],
      },
      {
        heading: "Then find the four numbers",
        paragraphs: [
          "Four figures decide most applications: the number of posts, the last date, the fee, and the age window. Read them directly from the notification's own table rather than from a paragraph, because tables are corrected by corrigendum and prose often is not.",
        ],
        list: [
          "Posts — total, and how many in your category.",
          "Last date — including the closing time, and whether fee payment closes earlier.",
          "Fee — per application, and who is exempt.",
          "Age — and the exact date on which age is calculated.",
        ],
      },
      {
        heading: "Treat eligibility as a checklist",
        paragraphs: [
          "Eligibility is rarely one sentence. It is usually a set of conditions that must all hold: qualification, percentage or equivalent, age, category, sometimes domicile, sometimes a physical standard. Walk through them one at a time and write down the evidence you would attach for each.",
          "Where the notice is silent, do not assume permission. Silence on a point usually means the department's general rules decide it, and those rules are published separately.",
        ],
      },
      {
        heading: "Read the annexures",
        paragraphs: [
          "The last pages hold the application format, the certificate formats and the instructions for sending the form. These annexures are where offline applications fail: a form in the wrong format, a certificate in last year's template, an envelope without the prescribed superscription.",
        ],
      },
      {
        heading: "Keep the document",
        paragraphs: [
          "Download the notification and keep it. When a corrigendum appears, it amends a specific clause, and you cannot tell what changed without the original in front of you.",
        ],
        note: "Match the advertisement number, then read the tables, not the prose. That single habit prevents most wasted applications.",
      },
    ],
  },
  {
    slug: "documents-to-keep-ready",
    title: "Documents to keep ready before you apply",
    eyebrow: "Applying",
    description:
      "The most common reason an application is abandoned halfway is a missing scan or an expired certificate. Keep one folder ready and every form becomes faster.",
    lede: "Most application portals are unforgiving about format: a photograph two kilobytes over the limit, a signature in the wrong aspect ratio, a certificate photographed at an angle. Prepare a single folder once and reuse it.",
    readingMinutes: 4,
    sections: [
      {
        heading: "Identity and photograph",
        paragraphs: [
          "Keep a recent passport photograph against a plain background, and a signature on white paper, both scanned cleanly. Portals state exact dimensions, file size and format — usually a JPEG of a few tens of kilobytes — and reject anything else without explanation.",
          "Keep a photo identity document ready: Aadhaar, passport, driving licence or the voter card, whichever the notice accepts. The name on it must match your certificates exactly.",
        ],
      },
      {
        heading: "Education",
        paragraphs: [
          "Scans of your marksheets and the final certificate or degree, front and back where the back carries details. If your final certificate has not been issued, many notices accept a provisional certificate — but only if the notice says so.",
          "If the post asks for a specific subject or a percentage, keep the marksheet that proves it. A consolidated grade card without the conversion formula is a frequent cause of rejection.",
        ],
      },
      {
        heading: "Category and relaxation",
        paragraphs: [
          "Caste, income, disability and ex-servicemen certificates must be in the format the notice prescribes, issued by the authority it names. Many OBC non-creamy-layer certificates for central posts must be for the current financial year, so last year's copy will not do.",
        ],
      },
      {
        heading: "Experience, if the post asks for it",
        paragraphs: [
          "An experience certificate should name the post held, the period, and the nature of the work, on the employer's letterhead with a signature and seal. Payslips and appointment letters help, but the certificate is what is read.",
        ],
      },
      {
        heading: "After you submit",
        paragraphs: [
          "Save the submitted PDF, the registration number and the payment receipt somewhere you will find them in six months. Admit cards, results and document verification all ask for them again.",
        ],
      },
    ],
  },
  {
    slug: "what-the-last-date-means",
    title: "What the last date actually means",
    eyebrow: "Dates",
    description:
      "The last date is a wall with a clock on it. Here is how to read it, why portals slow down near it, and what happens when a department extends it.",
    lede: "Almost every notice gives a last date, and almost every portal closes a little differently. The difference between applying on the last date and applying a week earlier is usually nothing — until it is everything.",
    readingMinutes: 3,
    sections: [
      {
        heading: "The date is local, the clock is the portal's",
        paragraphs: [
          "For online applications the last date normally means the end of that day in Indian Standard Time, and the portal closes when its own clock says so. Payment windows sometimes close earlier than the form itself, because the bank's confirmation has to arrive before the deadline.",
          "Where this site states a last date, it is taken from the notification and shown as midnight IST on that day. Treat it as the outer limit, not a target.",
        ],
      },
      {
        heading: "For offline applications, arrival matters",
        paragraphs: [
          "A posted form is judged by when it reaches the office named in the notice, not by the postmark. If the notice says by registered post or speed post only, a courier may be refused at the gate. Send with enough margin to survive a holiday or a slow week.",
        ],
      },
      {
        heading: "Deadlines move",
        paragraphs: [
          "Departments extend deadlines more often than candidates expect, usually through a corrigendum published on the same notice board. Extensions are also withdrawn or revised, and a fresh deadline can appear after you have already applied.",
          "The safe reading is this: apply against the date you can see now, then check the notice board again before the window closes.",
        ],
      },
      {
        heading: "Near the close",
        paragraphs: [
          "Portals slow down in the final hours, and payment gateways fail under load. If a payment fails, do not pay twice immediately — the first transaction may still confirm. Wait for the status to settle, then use the portal's own retry or grievance route if it does not.",
        ],
        note: "Apply early enough that a failed payment still leaves you a day to fix it.",
      },
    ],
  },
  {
    slug: "online-vs-offline-applications",
    title: "Online or offline: what actually differs",
    eyebrow: "Applying",
    description:
      "The two routes fail in completely different ways. Know which one the notice uses before you start preparing anything.",
    lede: "The notice will state whether applications are accepted online or by post. Reading that line correctly saves days, because the two routes have nothing in common beyond the form itself.",
    readingMinutes: 3,
    sections: [
      {
        heading: "Online applications",
        paragraphs: [
          "An online application is a sequence: registration, form, uploads, fee, and a final submission. The step candidates miss is the last one. Registering and paying is not applying — the form must be finally submitted, and the portal must show a submitted status with a registration number.",
        ],
        list: [
          "Register with an email and mobile number you actually check.",
          "Complete the form in one sitting where possible; sessions expire.",
          "Submit, then download the confirmation page.",
        ],
      },
      {
        heading: "Offline applications",
        paragraphs: [
          "An offline application is a document you construct: the prescribed format, self-attested copies, a photograph pasted where indicated, a signature across it, and an envelope superscribed exactly as the notice instructs. The mode of sending is part of the requirement — ordinary post, registered post, speed post or by hand.",
          "Keep proof of posting, and keep a complete photocopy of what you sent. If a dispute arises about what was received, that copy is your evidence.",
        ],
      },
      {
        heading: "Where each one goes wrong",
        paragraphs: [
          "Online applications fail silently: an upload that never attached, a fee that never confirmed, a form left at the preview screen. Offline applications fail visibly but late: wrong format, missing attestation, an envelope delivered after the deadline.",
        ],
      },
    ],
  },
  {
    slug: "fees-and-payment-safety",
    title: "Fees, concessions, and paying safely",
    eyebrow: "Applying",
    description:
      "Who pays, who is exempt, and the one rule that protects you: money moves only inside the official portal's payment page.",
    lede: "Application fees are small, which makes them easy to get wrong and easy to exploit. Two things matter: whether you owe the fee at all, and where the money is allowed to go.",
    readingMinutes: 3,
    sections: [
      {
        heading: "Who pays",
        paragraphs: [
          "The fee is set per application by the recruiting body. Many notices exempt women, SC and ST candidates, persons with disabilities, and ex-servicemen from the fee, sometimes only for certain posts. Read the fee table rather than the headline sentence, because the exemptions are usually listed underneath it.",
          "Where a portal charges a convenience fee, it is separate from the application fee and is normally not refunded.",
        ],
      },
      {
        heading: "Where the money may go",
        paragraphs: [
          "Only into the payment page that the official portal opens — net banking, a card, or a UPI collect request raised inside that page. No department asks for a transfer to an individual's account, a wallet number, or a QR code sent over WhatsApp.",
        ],
        note: "If someone offers to “confirm your seat” after a payment, it is fraud. Government recruitment has no seat to confirm.",
      },
      {
        heading: "When a payment fails",
        paragraphs: [
          "A failed payment is usually a pending one. Wait for the portal's status to settle before paying again, keep the transaction reference, and use the portal's grievance or help route if the fee is deducted without the application completing. Most portals publish a window for fee-related complaints.",
        ],
      },
    ],
  },
  {
    slug: "age-relaxation-explained",
    title: "Age relaxation, in plain terms",
    eyebrow: "Eligibility",
    description:
      "Age is calculated on a date, against a category, under a set of rules the notice names. Get one of those three wrong and an otherwise good application fails.",
    lede: "The age window is not a rough guide. It is a formula applied on a stated cut-off date, and the relaxation you are entitled to depends on the rules the department has adopted.",
    readingMinutes: 4,
    sections: [
      {
        heading: "The cut-off date",
        paragraphs: [
          "Notices state the date on which age is reckoned — commonly the first day of the year, sometimes the last date for applications. Your age on that date is what counts, not your age when you read the notice.",
        ],
      },
      {
        heading: "The categories that usually get relaxation",
        paragraphs: [
          "Central government recruitment commonly allows upper-age relaxation for SC and ST candidates, OBC non-creamy-layer candidates, persons with disabilities, ex-servicemen, and certain other groups such as departmental candidates or migrants from specific regions. The amounts differ, and state recruitments follow their own rules.",
          "This is why a number copied from a different recruitment is worthless. Use only the table in the notice you are applying against.",
        ],
      },
      {
        heading: "Certificates have formats and lives",
        paragraphs: [
          "Relaxation is claimed with a certificate, in the prescribed format, from the prescribed authority. For central posts an OBC non-creamy-layer certificate generally has to relate to the current financial year, so an older certificate may not be accepted even if nothing about your status has changed.",
        ],
      },
      {
        heading: "Do not assume, and do not guess upward",
        paragraphs: [
          "If the notice is ambiguous about whether a relaxation applies to you, ask the recruiting body's helpdesk before applying. An application rejected on age is rarely reconsidered, and the fee is not refunded.",
        ],
      },
    ],
  },
  {
    slug: "reservation-and-backlog-vacancies",
    title: "Reservation and backlog vacancies",
    eyebrow: "Eligibility",
    description:
      "What the category columns in a vacancy table mean, what a backlog post is, and why a single-post category behaves so differently.",
    lede: "Vacancy tables are split by category, and those columns are not decoration. They decide which competition you are actually entering, and sometimes whether a post exists for you at all.",
    readingMinutes: 4,
    sections: [
      {
        heading: "Vertical and horizontal",
        paragraphs: [
          "Reservation for SC, ST, OBC and EWS is usually called vertical: posts are divided between categories. Reservation for persons with disabilities and ex-servicemen is horizontal: it cuts across categories, and a post can be filled by a candidate who is also in a reserved category.",
          "Read the table for both dimensions. A post marked for OBC may also be marked for a person with a disability, and the rules for filling it are stated in the notice.",
        ],
      },
      {
        heading: "Current and backlog",
        paragraphs: [
          "A backlog vacancy is one carried forward from an earlier recruitment year that could not be filled. Backlog posts are advertised separately and often have different eligibility or a different selection process.",
          "If a recruitment advertises both, check which list your category appears in — the two lists can have different closing dates.",
        ],
      },
      {
        heading: "Why small categories swing",
        paragraphs: [
          "When a category has one post, the cut-off is decided by whoever applies. That is why the same examination produces a comfortable cut-off one year and a punishing one the next. It is not a signal about difficulty; it is a signal about how many people entered that competition.",
        ],
      },
      {
        heading: "Category changes are usually final",
        paragraphs: [
          "Most portals do not allow a category change after submission, and some do not allow it after fee payment. Choose deliberately, and make sure the certificate you will produce at verification matches the category you claimed.",
        ],
      },
    ],
  },
  {
    slug: "admit-cards-what-to-check",
    title: "Your admit card: what to check first",
    eyebrow: "Selection",
    description:
      "An admit card is a document with four points of failure. Check them the day it is released, not the night before the exam.",
    lede: "Admit cards are released in batches and corrected in batches. The candidates who have trouble on exam day are almost always the ones who downloaded the card and did not read it.",
    readingMinutes: 3,
    sections: [
      {
        heading: "Download from the source",
        paragraphs: [
          "Your admit card exists only on the recruiting body's site. Any other website offering a download is either linking to the same page or collecting your details. Open the official portal, log in with your registration number, and download the PDF.",
        ],
      },
      {
        heading: "Check four things",
        paragraphs: [
          "Read the card as if it belonged to someone else, because that is how the invigilator will read it.",
        ],
        list: [
          "Your name, spelling and date of birth as recorded in the application.",
          "Roll number, and the post or paper you are sitting for.",
          "Centre name, address and reporting time.",
          "Photograph and signature — legible, and yours.",
        ],
      },
      {
        heading: "Fix problems inside the correction window",
        paragraphs: [
          "Most boards open a short window for correcting details on the admit card. If something is wrong, use it immediately; after the window closes, corrections are usually handled only at the exam centre, if at all. Re-download the card after a correction and carry the latest version.",
        ],
      },
      {
        heading: "What to carry",
        paragraphs: [
          "A printed copy of the card, a photo identity document the notice names, and whatever else it lists — photographs, a self-declaration, or category documents. Read the instruction page of the card itself; it is specific to that examination.",
        ],
        note: "Download two copies. One goes in the bag, one stays at home.",
      },
    ],
  },
  {
    slug: "results-cutoffs-merit-lists",
    title: "Results, cut-offs and merit lists",
    eyebrow: "Selection",
    description:
      "How to read a result PDF without guessing, what a provisional list means, and what happens between a result and a joining letter.",
    lede: "A result is usually a PDF of roll numbers and a separate page of cut-offs. Neither is a final answer, and both are worth keeping.",
    readingMinutes: 3,
    sections: [
      {
        heading: "Find your roll number, then the cut-off",
        paragraphs: [
          "Results are published category-wise, sometimes post-wise. Search for your roll number within your category's list rather than the whole document, and note the cut-off marks printed beside it. A qualifying mark and a cut-off are different things: one is a floor, the other is the last person selected.",
        ],
      },
      {
        heading: "Provisional means what it says",
        paragraphs: [
          "A provisional result is subject to document verification and to the department's own checks. Candidates are removed at this stage for reasons that existed all along — an experience certificate that does not match, a category claim without a valid certificate, a qualification the notice did not accept.",
          "Read the result notification for the date, place and document list for verification. Missing it is treated as losing interest in the post.",
        ],
      },
      {
        heading: "Waiting lists move",
        paragraphs: [
          "Reserve and waiting lists are used when selected candidates drop out, fail verification, or decline the post. Movement can take months, and some lists expire. If you are on one, keep your documents current and watch the notice board rather than waiting for a call.",
        ],
      },
    ],
  },
  {
    slug: "why-applications-get-rejected",
    title: "Why applications get rejected",
    eyebrow: "Applying",
    description:
      "Rejections are rarely about merit. They are about form, format and evidence — and almost all of them are preventable before you submit.",
    lede: "Recruiting bodies reject applications for a short list of reasons, and none of them are mysterious. Read this before you fill your next form.",
    readingMinutes: 4,
    sections: [
      {
        heading: "The preventable ones",
        paragraphs: [
          "These account for most rejections, and each is something you can check in five minutes:",
        ],
        list: [
          "The form was filled but never finally submitted.",
          "The fee was not paid, or paid but not confirmed, or paid in the wrong category.",
          "A photograph or signature was missing, inverted, or outside the size limits.",
          "The qualification claimed does not match the one the notice requires — a diploma where a degree is needed, or a degree in a different subject.",
          "The category claimed is not supported by a certificate in the prescribed format.",
          "The offline form was unsigned, unattested, or in a format other than the one prescribed.",
          "The application arrived after the closing date, or by a mode the notice did not allow.",
          "The name or date of birth differs from the documents you attached.",
        ],
      },
      {
        heading: "The quiet ones",
        paragraphs: [
          "Some rejections are not announced. An application is simply not shortlisted, and the reason is a criterion buried in an annexure — a physical standard, a domicile requirement, a specific experience. When a notice is long, the annexures are the part to read twice.",
        ],
      },
      {
        heading: "What to do about it",
        paragraphs: [
          "Before submitting, read your own form back as a stranger would: does every claim have evidence attached, in the format asked for? After submitting, keep the confirmation and the receipt. If a rejection seems wrong, most departments publish a grievance or representation window — use it with the registration number and the specific clause you are relying on.",
        ],
      },
    ],
  },
  {
    slug: "how-to-verify-a-job-notice",
    title: "How to tell a genuine notice from a scam",
    eyebrow: "Verification",
    description:
      "Six checks that take two minutes, and the red flags that mean stop — whatever the message says.",
    lede: "Recruitment fraud works because it imitates the real thing closely. The checks below are the ones that separate an official notification from a document designed to look like one.",
    readingMinutes: 4,
    sections: [
      {
        heading: "Check the address, character by character",
        paragraphs: [
          "A genuine Indian government recruitment page lives on a .gov.in or .nic.in domain belonging to the recruiting body. Read the domain from right to left and slow down at the dots: nic.in.gov.example, indianarmy-gov.in and gov.in.recruitment.example are not government domains, however official they look.",
        ],
        note: "Look at the part immediately before .gov.in or .nic.in. That is the department. Anything else is a lookalike.",
      },
      {
        heading: "Find the notice on the department's own board",
        paragraphs: [
          "Departments publish notifications on their own notice board, usually under a heading like Recruitment, Notices or What's New. If a notification cannot be found there, treat it as unconfirmed even if it is beautifully formatted.",
        ],
      },
      {
        heading: "Match the advertisement number",
        paragraphs: [
          "Official notices carry an advertisement number and a date. Search the department's site for that number. A document without one, or with a number that appears nowhere on the official site, is not a notification.",
        ],
      },
      {
        heading: "Red flags",
        paragraphs: [
          "Any one of these is enough to stop:",
        ],
        list: [
          "A request to pay anyone other than the official portal — an individual's account, a wallet, a QR code.",
          "A promise to “confirm” or “arrange” a selection.",
          "A deadline measured in hours, with a link that is not on a government domain.",
          "Your documents, OTP or bank details requested over WhatsApp or a phone call.",
          "A PDF hosted on a file-sharing service instead of the department's site.",
        ],
      },
      {
        heading: "If you have already paid",
        paragraphs: [
          "Report it to the police cybercrime portal and to your bank immediately, and tell the recruiting body as well. Do not send more money to “release” a refund.",
        ],
      },
    ],
  },
  {
    slug: "corrigendums-and-extensions",
    title: "Corrigendums, extensions and revised vacancies",
    eyebrow: "Dates",
    description:
      "Recruitments change after they are announced. Here is what a corrigendum does, where to find it, and what to re-check once it appears.",
    lede: "A notice is not frozen on the day it is published. Vacancies are revised, dates are extended, eligibility is widened or narrowed, and examinations are rescheduled — usually by a short document called a corrigendum.",
    readingMinutes: 3,
    sections: [
      {
        heading: "What a corrigendum is",
        paragraphs: [
          "A corrigendum amends specific clauses of an earlier notification: a date, a vacancy count, a qualification, an examination pattern. It is published by the same authority on the same notice board, and it carries the same advertisement number with a suffix.",
          "A corrigendum does not repeat the whole notice. That is why keeping the original matters — you need both documents to know the current position.",
        ],
      },
      {
        heading: "What changes most often",
        paragraphs: [
          "Dates move first: the last date, the fee payment window, the exam date. Vacancy counts are revised next, usually upward after a department confirms sanctioned strength. Eligibility changes are rarer and more consequential, because they can open or close a recruitment to whole categories of candidates.",
        ],
      },
      {
        heading: "What to do when one appears",
        paragraphs: [
          "Re-read the clauses it touches, not just the headline. If a date has moved, check whether the fee window moved with it. If vacancies changed, check whether your category's share changed. If you have already applied, confirm that the portal still shows your application as valid.",
          "Re-download admit cards after a corrigendum. Centres and timings are the most common late changes, and an old card can send you to the wrong place.",
        ],
        note: "On this site, briefs are updated when a notice is re-filed — but the corrigendum on the department's own board is the version that counts.",
      },
    ],
  },
];

export function getGuide(slug: string): Guide | null {
  return GUIDES.find((guide) => guide.slug === slug) ?? null;
}

export function relatedGuides(slug: string, count = 3): Guide[] {
  const current = getGuide(slug);
  if (!current) return GUIDES.slice(0, count);
  const sameSubject = GUIDES.filter(
    (guide) => guide.slug !== slug && guide.eyebrow === current.eyebrow
  );
  const rest = GUIDES.filter(
    (guide) => guide.slug !== slug && guide.eyebrow !== current.eyebrow
  );
  return [...sameSubject, ...rest].slice(0, count);
}
