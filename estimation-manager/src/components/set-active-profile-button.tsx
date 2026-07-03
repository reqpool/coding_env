"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setActiveProfile } from "@/app/actions/profiles";
import { Button } from "@/components/ui/button";

export function SetActiveButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    try {
      await setActiveProfile(id);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={handle} disabled={loading}>
      {loading ? "…" : "Aktivieren"}
    </Button>
  );
}
