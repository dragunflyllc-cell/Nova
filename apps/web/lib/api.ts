const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function joinWaitlist(email: string): Promise<void> {
  const res = await fetch(`${API_URL}/waitlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.issues?.[0]?.message ?? body?.error ?? "Something went wrong. Please try again.");
  }
}

export async function getWaitlistCount(): Promise<number> {
  try {
    const res = await fetch(`${API_URL}/waitlist/count`, { cache: "no-store" });
    if (!res.ok) return 0;
    const data = (await res.json()) as { count: number };
    return data.count;
  } catch {
    return 0;
  }
}
