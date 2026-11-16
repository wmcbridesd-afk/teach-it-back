export async function postJSON<T>(url: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Couldn't reach the server. Check your connection and try again.");
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new Error("The server returned an unexpected response. Please try again.");
  }

  if (!res.ok) {
    const err =
      data && typeof data === "object" && "error" in data
        ? (data as { error?: unknown }).error
        : undefined;
    throw new Error(typeof err === "string" && err ? err : "Something went wrong. Please try again.");
  }
  return data as T;
}
