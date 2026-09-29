import { useState } from "react";
import Field from "../../components/ui/Field";

const initialPrefs = { orderUpdates: true, sms: true, promotions: false };

export default function Profile() {
  const [prefs, setPrefs] = useState(initialPrefs);
  const [saved, setSaved] = useState(false);

  function toggle(key) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  }

  function save(e) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="flex flex-col gap-6">
        <form onSubmit={save} className="card flex flex-col gap-4">
          <span className="text-[15px] font-semibold">Account Information</span>
          <div className="flex gap-3.5">
            <Field label="Business Name" defaultValue="Him Traders" className="flex-1" />
            <Field label="Contact Person" defaultValue="Anita Sharma" className="flex-1" />
          </div>
          <div className="flex gap-3.5">
            <Field label="Email" defaultValue="anita.sharma@retailer.com" className="flex-1" />
            <Field label="Phone" defaultValue="981-2345678" className="flex-1" />
          </div>
          <Field label="Default Delivery Address" defaultValue="Bagar Road, near Bus Park, Pokhara" />
          <button type="submit" className="btn-primary self-start">
            {saved ? "Saved!" : "Save Changes"}
          </button>
        </form>

        <form className="card flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
          <span className="text-[15px] font-semibold">Change Password</span>
          <div className="flex gap-3.5">
            <Field label="Current Password" type="password" className="flex-1" />
            <Field label="New Password" type="password" className="flex-1" />
          </div>
          <button type="submit" className="btn-ghost self-start">
            Update Password
          </button>
        </form>
      </div>

      <div className="card flex flex-col gap-5">
        <span className="text-[15px] font-semibold">Notification Preferences</span>
        {[
          ["orderUpdates", "Order status updates", "Email when status changes"],
          ["sms", "SMS alerts", "Delivery day reminders"],
          ["promotions", "Promotions", "New bundles & offers"],
        ].map(([key, title, desc]) => (
          <div key={key} className="flex items-center justify-between">
            <div>
              <div className="text-[13.5px] font-semibold">{title}</div>
              <div className="mt-0.5 text-xs text-muted">{desc}</div>
            </div>
            <button
              onClick={() => toggle(key)}
              className={`relative h-[22px] w-10 rounded-full transition-colors ${prefs[key] ? "bg-accent" : "bg-surface-2"}`}
            >
              <span
                className={`absolute top-[3px] h-4 w-4 rounded-full bg-white shadow transition-all ${prefs[key] ? "left-[19px]" : "left-[3px]"}`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
