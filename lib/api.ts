export const BUSY_MESSAGE = "Lots of people are testing right now. Try again in a minute.";

export async function postJSON<T>(url: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(BUSY_MESSAGE);
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new Error(BUSY_MESSAGE);
  }

  if (!res.ok) {
    const obj = data && typeof data === "object" ? (data as { error?: unknown; code?: unknown }) : {};
    const err = typeof obj.error === "string" && obj.error ? obj.error : undefined;
    if (obj.code === "config" && err) throw new Error(err);
    if (res.status === 429 || res.status >= 500) throw new Error(BUSY_MESSAGE);
    throw new Error(err ?? "Something went wrong. Please try again.");
  }
  return data as T;
}
