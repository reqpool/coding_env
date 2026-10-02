"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { duplicateEstimation } from "@/app/actions/estimations";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

export function DuplicateEstimationButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDuplicate() {
    setLoading(true);
    try {
      const result = await duplicateEstimation(id);
      if (result.success) {
        router.push(`/estimations/${result.data.id}`);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" variant="ghost" onClick={handleDuplicate} disabled={loading}>
      <Copy className="h-3.5 w-3.5 mr-1" />
      {loading ? "…" : "Kopieren"}
    </Button>
  );
}
