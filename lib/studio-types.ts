// Shared Studio row types (mirror the /api/events|folders|photos contract).

export interface EventRow {
  id: string;
  name: string;
  location: string | null;
  event_date: string | null;
  photographer_whatsapp: string | null;
  price_per_photo: number | null;
  event_price: number | null;
  watermark_text: string | null;
  created_at: string;
}

export interface FolderRow {
  id: string;
  event_id: string;
  name: string;
  created_at: string;
}

export interface PhotoRow {
  id: string;
  event_id: string;
  folder_id: string | null;
  storage_path: string;
  filename: string;
  file_size: number | null;
  width: number | null;
  height: number | null;
  faces_count: number | null;
  starred: boolean;
  created_at: string;
}
