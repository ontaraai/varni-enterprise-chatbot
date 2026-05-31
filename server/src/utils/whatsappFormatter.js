/**
 * Converts standard Markdown formatting to WhatsApp-compatible formatting.
 *
 * WhatsApp supports:
 *   *bold*        (single asterisk)
 *   _italic_      (single underscore)
 *   ~strikethrough~
 *   ```monospace```
 *
 * WhatsApp does NOT support:
 *   **double-asterisk bold**
 *   __double-underscore__
 *   # headings
 *   [links](url)
 *   ![images](url)
 *   > blockquotes (renders as plain text)
 *   --- horizontal rules
 */
function markdownToWhatsApp(text) {
  if (!text) return text;

  let result = text;

  // 1. Convert **bold** or __bold__ → *bold*
  result = result.replace(/\*\*(.+?)\*\*/g, '*$1*');
  result = result.replace(/__(.+?)__/g, '*$1*');

  // 2. Convert _italic_ that isn't inside a word
  //    (WhatsApp already uses _italic_, so single underscores are fine)

  // 3. Convert ~~strikethrough~~ → ~strikethrough~
  result = result.replace(/~~(.+?)~~/g, '~$1~');

  // 4. Convert markdown links [text](url) → text (url)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');

  // 5. Remove image syntax ![alt](url) → alt
  result = result.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');

  // 6. Remove heading markers (# ## ### etc.)
  result = result.replace(/^#{1,6}\s+/gm, '*');

  // 7. Convert markdown horizontal rules (--- or ***) to a simple line
  result = result.replace(/^(\*{3,}|-{3,}|_{3,})$/gm, '───────────');

  // 8. Markdown unordered lists: convert - item or * item to • item
  //    (Be careful not to replace * used for bold)
  result = result.replace(/^[\t ]*[-] /gm, '• ');

  // 9. Clean up blockquote markers
  result = result.replace(/^>\s?/gm, '');

  // 10. Collapse excessive blank lines (max 2)
  result = result.replace(/\n{3,}/g, '\n\n');

  return result.trim();
}

module.exports = { markdownToWhatsApp };
