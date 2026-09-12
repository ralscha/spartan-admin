export function downloadTextFile(
  name: string,
  content: string,
  type = 'text/csv;charset=utf-8',
): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.hidden = true;
  document.body.append(link);
  link.click();
  setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 1_000);
}

export function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function textDataUrl(content: string, type = 'text/csv;charset=utf-8'): string {
  return `data:${type},${encodeURIComponent(content)}`;
}
