"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { noteApi } from "@/features/note/api/note-api";
import { notifyError } from "@/lib/notify-error";

export function NoteForm() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setPending(true);
    setFieldErrors({});
    try {
      const note = await noteApi.create({
        title: String(data.get("title") ?? ""),
        body: String(data.get("body") ?? ""),
      });
      toast.success(`Catatan "${note.title}" dibuat`);
      form.reset();
    } catch (err) {
      setFieldErrors(notifyError(err).fieldErrors());
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Judul
        <input name="title" className="rounded border px-3 py-2" aria-invalid={!!fieldErrors.title} />
        {fieldErrors.title && <span className="text-red-600">{fieldErrors.title}</span>}
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Isi
        <textarea name="body" rows={4} className="rounded border px-3 py-2" />
        {fieldErrors.body && <span className="text-red-600">{fieldErrors.body}</span>}
      </label>
      <button disabled={pending} className="rounded bg-black px-4 py-2 text-white disabled:opacity-50">
        {pending ? "Menyimpan..." : "Simpan"}
      </button>
    </form>
  );
}
