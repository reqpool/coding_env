"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/app/actions/projects";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

export function NewProjectDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await createProject({ name, client: client || undefined, description: description || undefined });
      if (result.success) {
        setOpen(false);
        setName(""); setClient(""); setDescription("");
        router.push(`/projects/${result.data.id}`);
        router.refresh();
      } else {
        setError(result.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants())}>
        <Plus className="h-4 w-4 mr-2" />
        Neues Projekt
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neues Projekt erstellen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="proj-name">Projektname *</Label>
            <Input id="proj-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proj-client">Kunde</Label>
            <Input id="proj-client" value={client} onChange={(e) => setClient(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proj-desc">Beschreibung</Label>
            <Input id="proj-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Abbrechen</Button>
            <Button type="submit" disabled={loading}>{loading ? "Wird erstellt…" : "Erstellen"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
