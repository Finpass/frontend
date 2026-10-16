import { http } from "@/lib/http";
import type { CreateNoteInput, Note } from "@/features/note/types";

export const noteApi = {
  create: (input: CreateNoteInput) => http.post<Note>("/notes", input),
  get: (id: string) => http.get<Note>(`/notes/${id}`),
};
