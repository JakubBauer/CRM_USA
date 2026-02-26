"use client";
import { useState } from "react";

type Tab = "crm" | "calc";

export default function Page() {
  const [activeTab, setActiveTab] = useState<Tab>("crm");

  return (
    <div style={{ padding: 40 }}>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => setActiveTab("crm")}
          style={{ fontWeight: activeTab === "crm" ? 800 : 400 }}
        >
          CRM
        </button>

        <button
          onClick={() => setActiveTab("calc")}
          style={{ fontWeight: activeTab === "calc" ? 800 : 400 }}
        >
          Kalkulator
        </button>
      </div>

      <h1>{activeTab === "crm" ? "CRM" : "Kalkulator"}</h1>
    </div>
  );
}
