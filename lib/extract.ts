// Browser-only text extraction. pdfjs-dist is imported dynamically (breaks SSR otherwise).

function normalize(s: string): string {
  return s
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t ]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".txt") || name.endsWith(".md")) {
    return normalize(await file.text());
  }

  if (name.endsWith(".pdf")) {
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      const data = new Uint8Array(await file.arrayBuffer());
      const task = pdfjs.getDocument({ data });
      const doc = await task.promise;
      try {
        const pages: string[] = [];
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const content = await page.getTextContent();
          let text = "";
          for (const item of content.items) {
            if ("str" in item) {
              text += item.str;
              if (item.hasEOL) text += "\n";
            }
          }
          pages.push(text);
        }
        return normalize(pages.join("\n\n"));
      } finally {
        await task.destroy();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.name + " " + e.message : "";
      if (/password/i.test(msg)) {
        throw new Error(`${file.name} is password-protected. Remove the password and try again.`);
      }
      throw new Error(`Couldn't read ${file.name}. The PDF may be corrupt; try another copy or paste its text instead.`);
    }
  }

  throw new Error(`${file.name} isn't a supported file type. Use .pdf, .txt or .md.`);
}
