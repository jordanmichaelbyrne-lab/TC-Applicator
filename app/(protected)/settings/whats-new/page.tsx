const updates = [
  {
    date: "Recently",
    title: "TC Applicator is live",
    description:
      "The app is now deployed and reachable at tcapplicator.com, with a real custom domain instead of just running locally.",
  },
  {
    date: "Recently",
    title: "Email notifications",
    description:
      "New signup requests, approvals awaiting your review, and support requests now send an email instead of requiring you to check the app manually.",
  },
  {
    date: "Recently",
    title: "Self-serve signup with two-stage approval",
    description:
      "New employees can request access themselves. Every request is reviewed by TC Applicator Support, then by that company's own admins, before access is granted.",
  },
  {
    date: "Recently",
    title: "Full company isolation",
    description:
      "Every company's estimates, OEM parts catalog, and coating patterns are completely private — no company can see another's data, even though they all use the same platform.",
  },
  {
    date: "Recently",
    title: "Company logos & branded quotes",
    description:
      "TC Applicator Support can set a logo for each company, which now appears in that company's navbar and on their printed quote/spec sheets.",
  },
];

export default function WhatsNewPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-md border border-slate-300 bg-white p-6">
        <h2 className="mb-4 font-semibold">What&apos;s New</h2>

        <div className="space-y-5">
          {updates.map((update, index) => (
            <div
              key={index}
              className="border-b border-slate-100 pb-5 last:border-0 last:pb-0"
            >
              <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {update.date}
              </div>
              <h3 className="mt-1 font-medium text-slate-900">
                {update.title}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {update.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}