import { Outlet } from "react-router-dom";
import PublicNav from "./PublicNav";
import PublicFooter from "./PublicFooter";

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <PublicNav />
      <div className="flex-1">
        <Outlet />
      </div>
      <PublicFooter />
    </div>
  );
}
