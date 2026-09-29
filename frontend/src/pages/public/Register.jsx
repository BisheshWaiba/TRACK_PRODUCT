import { Link, useNavigate } from "react-router-dom";
import Icon from "../../components/icons/Icon";
import Field from "../../components/ui/Field";

const perks = [
  "Order wholesale bundles at bulk pricing",
  "Track every shipment in real time",
  "Keep a full order & payment history",
];

export default function Register() {
  const navigate = useNavigate();

  function submit(e) {
    e.preventDefault();
    navigate("/app");
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <div className="hidden w-[480px] flex-shrink-0 flex-col justify-between bg-ink p-14 text-[#F5F2EA] lg:flex">
        <Link to="/" className="flex items-center gap-2.5">
          <Icon name="bundle" className="h-[26px] w-[26px] text-accent" strokeWidth={1.6} />
          <span className="font-display text-[22px] font-bold text-white">BulkTrack</span>
        </Link>
        <div className="flex flex-col gap-6">
          <div className="font-display text-[30px] font-bold leading-snug">Open a retailer account in minutes.</div>
          <div className="flex flex-col gap-3.5">
            {perks.map((p) => (
              <div key={p} className="flex items-start gap-3">
                <Icon name="check" className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 text-accent" strokeWidth={2} />
                <span className="text-[14.5px] text-[#C9C3B4]">{p}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs text-[#8A8474]">
          Wholesaler and delivery-partner accounts are created by the BulkTrack team —{" "}
          <Link to="/contact" className="font-semibold text-accent">
            contact us
          </Link>{" "}
          to get set up.
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-10">
        <form onSubmit={submit} className="flex w-full max-w-[440px] flex-col gap-5">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-[28px] font-bold">Create your account</h1>
            <p className="text-sm text-ink-soft">For retailers and customers ordering wholesale bundles.</p>
          </div>

          <div className="flex gap-3.5">
            <Field label="Business Name" placeholder="Him Traders" className="flex-1" required />
            <Field label="Contact Person" placeholder="Anita Sharma" className="flex-1" required />
          </div>
          <Field label="Email" type="email" placeholder="you@business.com" required />
          <div className="flex gap-3.5">
            <Field label="Phone" placeholder="98XXXXXXXX" className="flex-1" required />
            <Field label="City" placeholder="Pokhara" className="flex-1" required />
          </div>
          <div className="flex gap-3.5">
            <Field label="Password" type="password" placeholder="••••••••" className="flex-1" required />
            <Field label="Confirm Password" type="password" placeholder="••••••••" className="flex-1" required />
          </div>
          <label className="flex items-start gap-2 text-xs text-ink-soft">
            <input type="checkbox" required className="mt-0.5 h-4 w-4 accent-accent" />
            I agree to the Terms of Service and Privacy Policy
          </label>
          <button type="submit" className="btn-primary w-full !py-3.5">
            Create Account
          </button>
          <p className="text-center text-[13.5px] text-ink-soft">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-accent hover:underline">
              Log In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
