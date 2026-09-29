import { Link, useNavigate } from "react-router-dom";
import Icon from "../../components/icons/Icon";
import Field from "../../components/ui/Field";

export default function Login() {
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
        <div className="flex flex-col gap-5">
          <div className="font-display text-[30px] font-bold leading-snug">Wholesale bundles, tracked door to door.</div>
          <p className="text-[15px] leading-relaxed text-[#C9C3B4]">
            "BulkTrack cut our 'where's my order' calls to almost zero. Our retailers just check the tracking page."
          </p>
          <div className="text-[13.5px] text-[#8A8474]">— Suresh Koirala, Wholesaler Admin</div>
        </div>
        <div className="flex gap-8">
          <div>
            <div className="font-display text-xl font-bold">120+</div>
            <div className="text-xs text-[#8A8474]">Retail partners</div>
          </div>
          <div>
            <div className="font-display text-xl font-bold">98.4%</div>
            <div className="text-xs text-[#8A8474]">On-time delivery</div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-10">
        <form onSubmit={submit} className="flex w-full max-w-[400px] flex-col gap-7">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-[28px] font-bold">Welcome back</h1>
            <p className="text-sm text-ink-soft">Log in to manage orders, track shipments, or update deliveries.</p>
          </div>

          <div className="flex flex-col gap-4">
            <Field label="Email" type="email" defaultValue="anita.sharma@retailer.com" required />
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-[13px] font-semibold">Password</span>
                <a href="#" className="text-[12.5px] font-semibold text-accent hover:underline">
                  Forgot password?
                </a>
              </div>
              <input type="password" defaultValue="password123" required className="field" />
            </div>
            <label className="flex items-center gap-2 text-[13.5px] text-ink-soft">
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-accent" />
              Keep me signed in
            </label>
            <button type="submit" className="btn-primary w-full !py-3.5">
              Log In
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted">
            <div className="h-px flex-1 bg-border" />
            or continue as
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="flex gap-2.5">
            <Link to="/app" className="flex-1 rounded-lg border border-border py-2.5 text-center text-[13px] font-semibold hover:bg-surface-2">
              Retailer
            </Link>
            <Link to="/admin/login" className="flex-1 rounded-lg border border-border py-2.5 text-center text-[13px] font-semibold hover:bg-surface-2">
              Wholesaler
            </Link>
          </div>

          <p className="text-center text-[13.5px] text-ink-soft">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-accent hover:underline">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
