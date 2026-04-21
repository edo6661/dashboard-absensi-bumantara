export interface User {
  id: string;
  name: string;
  email: string | null;
  nik: string | null;
  role: string;
  perusahaanId: string | null;
  perusahaanNama?: string | null;
  status: "TETAP" | "TIDAK_TETAP";
  kontrak: number;
  fotoKtp: string | null;
  registeredFaceUrl: string | null;
  createdAt: string;
  alamat?: string | null;
  statusPerkawinan?: string | null;
}

export interface UserFilterParams {
  limit?: number;
  cursor?: string;
  search?: string;
  role?: string;
  status?: "TETAP" | "TIDAK_TETAP" | "";
  orderBy?: string;
}

export interface LoginData {
  token: string;
  user: User;
}
