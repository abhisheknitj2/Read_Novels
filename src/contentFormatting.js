export function normalizeArticleContent(content = '') {
  const normalizedNewlines = content.replace(/\r\n?/g, '\n');

  return normalizedNewlines
    .split(/\n{2,}/)
    .map(paragraph => paragraph.replace(/\n/g, ' ').replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n');
}
