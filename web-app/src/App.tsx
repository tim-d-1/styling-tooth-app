import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [status, setStatus] = useState<"checking" | "connected" | "error">(
    "checking",
  );

  useEffect(() => {
    supabase
      .from("service_categories")
      .select("count", { count: "exact", head: true })
      .then(({ error }) => setStatus(error ? "error" : "connected"));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Supabase Status: {status}</h1>
    </div>
  );
}
