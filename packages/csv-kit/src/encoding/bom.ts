export function withUtf8Bom(content: string, enableBom = false) {
  if (!enableBom) {
    return content;
  }

  return `\uFEFF${content}`;
}
