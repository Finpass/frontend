export interface Note {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

export interface CreateNoteInput {
  title: string;
  body: string;
}
