import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../../components/icons/Icon";
import Field from "../../components/ui/Field";
import Modal from "../../components/ui/Modal";

export default function Account() {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="flex flex-col gap-6">
        <div className="card flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-2 text-xl font-bold text-ink-soft">SK</div>
            <div>
              <div className="font-display text-lg font-bold">Suresh Koirala</div>
              <div className="mt-0.5 text-[13px] text-muted">Wholesaler Admin · BulkTrack HQ</div>
            </div>
          </div>
          <div className="flex gap-3.5">
            <Field label="Full Name" defaultValue="Suresh Koirala" className="flex-1" />
            <Field label="Role" defaultValue="Wholesaler Admin" disabled className="flex-1" />
          </div>
          <div className="flex gap-3.5">
            <Field label="Email" defaultValue="suresh.koirala@bulktrack.example" className="flex-1" />
            <Field label="Phone" defaultValue="980-1234567" className="flex-1" />
          </div>
          <button className="btn-primary self-start">Save Changes</button>
        </div>

        <div className="card flex flex-col gap-4">
          <span className="text-[15px] font-semibold">Change Password</span>
          <div className="flex gap-3.5">
            <Field label="Current Password" type="password" className="flex-1" />
            <Field label="New Password" type="password" className="flex-1" />
          </div>
          <button className="btn-ghost self-start">Update Password</button>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <div className="card flex flex-col gap-4">
          <span className="text-[14.5px] font-semibold">Session</span>
          <div className="flex items-start gap-3">
            <Icon name="clock" className="mt-0.5 h-[17px] w-[17px] text-muted" strokeWidth={1.7} />
            <div>
              <div className="text-[13px] font-semibold">Last login</div>
              <div className="mt-0.5 text-[12.5px] text-muted">Today, 9:14 AM · Kathmandu, Nepal</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Icon name="shield" className="mt-0.5 h-[17px] w-[17px] text-muted" strokeWidth={1.7} />
            <div>
              <div className="text-[13px] font-semibold">Two-factor authentication</div>
              <div className="mt-0.5 text-[12.5px] text-muted">Not enabled</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl2 border-[1.5px] border-danger bg-danger-soft p-5 flex flex-col gap-3.5">
          <span className="text-[14.5px] font-bold text-danger-dark">Log Out</span>
          <p className="text-[13px] text-danger-dark/90">
            End your current session on this device. You'll need to sign in again to access the dashboard.
          </p>
          <button onClick={() => setConfirmOpen(true)} className="rounded-lg border-[1.5px] border-danger bg-white py-3 text-[13.5px] font-semibold text-danger hover:bg-danger-soft">
            Log Out of BulkTrack
          </button>
        </div>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Log out?" width="max-w-[400px]">
        <p className="mb-5 text-sm text-ink-soft">You'll be signed out of the BulkTrack wholesaler dashboard on this device.</p>
        <div className="flex gap-2.5">
          <button onClick={() => setConfirmOpen(false)} className="btn-ghost flex-1">Cancel</button>
          <Link to="/login" className="flex-1 rounded-lg bg-danger py-3 text-center text-[13.5px] font-semibold text-white">
            Log Out
          </Link>
        </div>
      </Modal>
    </div>
  );
}
