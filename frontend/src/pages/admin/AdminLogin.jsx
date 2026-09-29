import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Icon from "../../components/icons/Icon";
import Field from "../../components/ui/Field";
import Modal from "../../components/ui/Modal";
import { useAuth } from "../../context/AuthContext";

const perks = [
  "Products, stock, sales and payments — all in sync",
  "Know exactly what's owed and by whom",
  "A complete audit trail of every transaction",
];

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [forgotOpen, setForgotOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      setError(err.message === "Invalid login credentials" ? "Incorrect email or password." : err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <div className="hidden w-[480px] flex-shrink-0 flex-col justify-between bg-ink p-14 text-[#F5F2EA] lg:flex">
        <Link to="/" className="flex items-center gap-2.5">
          <Icon name="bundle" className="h-[26px] w-[26px] text-accent" strokeWidth={1.6} />
          <span className="font-display text-[22px] font-bold text-white">BulkTrack</span>
        </Link>
        <div className="flex flex-col gap-5">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#2B2925] px-3.5 py-1.5 text-xs font-semibold tracking-wide text-[#E2A583]">
            WHOLESALER ADMIN
          </div>
          <div className="font-display text-[30px] font-bold leading-snug">Run your whole business from one dashboard.</div>
          <div className="flex flex-col gap-3.5">
            {perks.map((p) => (
              <div key={p} className="flex items-start gap-3">
                <Icon name="check" className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 text-accent" strokeWidth={2} />
                <span className="text-[14.5px] text-[#C9C3B4]">{p}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-[12.5px] text-[#8A8474]">
          <Icon name="lock" className="h-3.5 w-3.5" strokeWidth={1.8} />
          Staff &amp; wholesaler access only
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-10">
        <form onSubmit={submit} className="flex w-full max-w-[400px] flex-col gap-7">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-[28px] font-bold">Admin sign in</h1>
            <p className="text-sm text-ink-soft">Log in with your BulkTrack wholesaler account.</p>
          </div>
          <div className="flex flex-col gap-4">
            {error && (
              <div className="rounded-lg border-[1.5px] border-danger bg-danger-soft px-3.5 py-2.5 text-[13px] font-semibold text-danger-dark">
                {error}
              </div>
            )}
            <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-[13px] font-semibold">Password</span>
                <button type="button" onClick={() => setForgotOpen(true)} className="text-[12.5px] font-semibold text-accent hover:underline">Forgot password?</button>
              </div>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="field" />
            </div>
            <label className="flex items-center gap-2 text-[13.5px] text-ink-soft">
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-accent" />
              Keep me signed in on this device
            </label>
            <button type="submit" disabled={submitting} className="btn-primary w-full !py-3.5 disabled:opacity-60">
              {submitting ? "Logging in…" : "Log In"}
            </button>
          </div>
          <p className="text-center text-[13px] text-muted">
            Need a wholesaler account? Ask your BulkTrack administrator to invite you.
          </p>
        </form>
      </div>

      <Modal open={forgotOpen} onClose={() => setForgotOpen(false)} title="Forgot password?" width="max-w-[380px]">
        <p className="text-sm text-ink-soft">
          Password resets for wholesaler accounts are handled by your BulkTrack administrator. Contact them directly to get a new temporary password.
        </p>
        <button onClick={() => setForgotOpen(false)} className="btn-primary mt-5 w-full">Got it</button>
      </Modal>
    </div>
  );
}
