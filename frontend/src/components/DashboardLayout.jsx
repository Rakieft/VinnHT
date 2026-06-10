import React from "react";

export default function DashboardLayout({ sidebar, header, children }) {
  return (
    <div className="dash-shell">
      {sidebar}
      <div className="dash-main">
        {header}
        <main>{children}</main>
      </div>
    </div>
  );
}
