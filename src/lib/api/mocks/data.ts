import type { User } from "@/types/api";

// Demo data for endpoints that are still `planned` in docs/API_CONTRATO.md (only GET /me).
export const mockUser: User = {
  id: "usr_teacher_01",
  fullName: "Laura Gómez",
  email: "laura.gomez@colegio.edu.co",
  role: "TEACHER",
  institutionId: "inst_01",
};
