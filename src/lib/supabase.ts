const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://nuwqftpabpycrplltvgj.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_mZgMvoO99xMwkZadtnrbdA_KSPeXcrM";
export const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_KEY);

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

const SESSION_KEY = "rofybell-admin-session";
export const ADMIN_SESSION_EVENT = "rofybell-admin-session-change";
type SupabaseSession = { access_token: string; refresh_token: string; user: { id: string; email?: string; user_metadata?: { name?: string; role?: string } } };

export function getAdminSession(): SupabaseSession | null {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null") as SupabaseSession | null; } catch { return null; }
}

export async function signInAdmin(email: string, password: string) {
  if (!hasSupabaseConfig && email.trim().toLowerCase() === "admin@rofybell.dz" && password === "Rofybell2026") {
    const session: SupabaseSession = {
      access_token: "local-admin",
      refresh_token: "local-admin",
      user: {
        id: "rofybell-local-admin",
        email: "admin@rofybell.dz",
        user_metadata: { name: "Admin Rofybell", role: "admin" },
      },
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    window.dispatchEvent(new Event(ADMIN_SESSION_EVENT));
    return session;
  }
  if (!hasSupabaseConfig) throw new Error("Email ou mot de passe incorrect");
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error("Email ou mot de passe incorrect");
  const session = await response.json() as SupabaseSession;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(ADMIN_SESSION_EVENT));
  return session;
}

export function signOutAdmin() {
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(ADMIN_SESSION_EVENT));
}

export async function supabaseRequest<T>(path: string, init: RequestInit = {}) {
  if (!hasSupabaseConfig) throw new Error("Supabase non configure");
  const session = getAdminSession();
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { ...headers, Authorization: `Bearer ${session?.access_token || SUPABASE_KEY}`, Prefer: "return=representation", ...init.headers },
  });

  if (!response.ok) throw new Error(`Supabase ${response.status}`);
  if (response.status === 204) return [] as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : []) as T;
}

export async function supabaseAnonRequest<T>(path: string, init: RequestInit = {}) {
  if (!hasSupabaseConfig) throw new Error("Supabase non configure");
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { ...headers, Prefer: "return=representation", ...init.headers },
  });

  if (!response.ok) throw new Error(`Supabase ${response.status}`);
  if (response.status === 204) return [] as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : []) as T;
}

export async function createSupabaseAdminUser(input: { name: string; email: string; password: string; role: string }) {
  if (!hasSupabaseConfig) return { id: crypto.randomUUID() };
  const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      data: { name: input.name, role: input.role },
    }),
  });
  const payload = await response.json() as { user?: { id?: string }; id?: string; msg?: string; error_description?: string; message?: string };
  if (!response.ok) throw new Error(payload.error_description || payload.msg || payload.message || `Supabase signup ${response.status}`);
  const id = payload.user?.id || payload.id;
  if (!id) throw new Error("Utilisateur Supabase créé sans identifiant");
  return { id };
}

export async function uploadProductImage(file: File) {
  const session = getAdminSession();
  if (!session) throw new Error("Connexion administrateur requise");
  if (!hasSupabaseConfig) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Le televersement de la photo a echoue"));
      reader.readAsDataURL(file);
    });
  }
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${crypto.randomUUID()}.${extension}`;
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/product-images/${path}`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${session.access_token}`, "Content-Type": file.type || "image/jpeg", "x-upsert": "true" },
    body: file,
  });
  if (!response.ok) throw new Error("Le téléversement de la photo a échoué");
  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;
}
