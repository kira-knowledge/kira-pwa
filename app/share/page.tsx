"use client";
import { useEffect, useState } from "react";

export default function SharePage() {
  const [status, setStatus] = useState("Reading shared link…");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const raw = `${p.get("url") ?? ""} ${p.get("text") ?? ""} ${p.get("title") ?? ""}`;
    const match = raw.match(/https?:\/\/[^\s"']*instagram\.com\/[^\s"']+/i);
    if (!match) {
      setStatus("No Instagram link found in the share.");
      return;
    }
    setStatus("Saving to KIRA…");
    fetch("/api/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: match[0] }),
    })
      .then((r) => r.json())
      .then((d) =>
        setStatus(d.ok ? "Saved! KIRA is processing it." : `Error: ${d.error ?? "unknown"}`)
      )
      .catch((e) => setStatus(`Error: ${e.message}`));
  }, []);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>KIRA</h1>
      <p>{status}</p>
      <p style={{ marginTop: 24 }}>
        <a href="/" style={{ color: "#8ab4ff" }}>
          ← View your library
        </a>
      </p>
    </main>
  );
}
