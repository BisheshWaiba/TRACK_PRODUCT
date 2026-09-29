import { useState } from "react";
import Icon from "../../components/icons/Icon";
import Field from "../../components/ui/Field";

const info = [
  { icon: "pin", title: "Warehouse HQ", text: "Balaju Industrial Area, Kathmandu, Nepal" },
  { icon: "phone", title: "Phone", text: "+977 1-455-0192" },
  { icon: "mail", title: "Email", text: "hello@bulktrack.example" },
  { icon: "clock", title: "Warehouse Hours", text: "Sun – Fri, 8:00 AM – 7:00 PM" },
];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  function submit(e) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="grid grid-cols-1 gap-16 px-6 py-16 md:grid-cols-2 md:px-20">
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-3xl font-bold md:text-[34px]">Get in touch</h1>
        <p className="text-[15px] text-ink-soft">
          Questions about bulk pricing, bundles, or becoming a delivery partner — send us a note.
        </p>

        {sent ? (
          <div className="flex items-center gap-3 rounded-xl border border-teal/40 bg-teal-soft p-5 text-teal">
            <Icon name="check" className="h-5 w-5" strokeWidth={2} />
            <span className="text-sm font-semibold">Thanks — we'll get back to you within one business day.</span>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex gap-3.5">
              <Field
                label="Full Name"
                placeholder="Anita Sharma"
                className="flex-1"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Field
                label="Email"
                placeholder="you@business.com"
                className="flex-1"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <Field
              label="Subject"
              placeholder="Bulk pricing for Grocery Bundle A"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
            <label className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold">Message</span>
              <textarea
                rows={5}
                placeholder="Tell us what you need…"
                className="field resize-none"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
              />
            </label>
            <button type="submit" className="btn-primary self-start">
              Send Message
            </button>
          </form>
        )}
      </div>

      <div className="flex flex-col gap-5">
        <div className="relative h-[220px] overflow-hidden rounded-2xl bg-ink">
          <div className="absolute bottom-3.5 left-3.5 rounded-full bg-ink/85 px-3 py-1.5 text-xs text-[#EDE8DC]">
            Kathmandu Warehouse HQ
          </div>
        </div>
        <div className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-6">
          {info.map((i) => (
            <div key={i.title} className="flex items-start gap-3.5">
              <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-text">
                <Icon name={i.icon} className="h-[18px] w-[18px]" strokeWidth={1.7} />
              </div>
              <div>
                <div className="text-sm font-semibold">{i.title}</div>
                <div className="mt-0.5 text-[13.5px] text-ink-soft">{i.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
