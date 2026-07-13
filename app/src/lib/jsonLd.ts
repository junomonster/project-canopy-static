const TOKEN_RE = /\[([^\]]+)\]\(([^)]+)\)|==([^=]+)==|\*\*([^*]+)\*\*/g;

/** Strip the FAQ emphasis/link markers down to plain text for structured data. */
export function stripAnswerMarkers(text: string): string {
  return text.replace(TOKEN_RE, (_match, linkText, _href, mark, strong) => {
    return linkText ?? mark ?? strong ?? '';
  });
}

/** Insert (or replace) a JSON-LD script tag identified by `id`. Returns a cleanup fn. */
export function injectJsonLd(id: string, data: object): () => void {
  document.getElementById(id)?.remove();
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = id;
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
  return () => {
    document.getElementById(id)?.remove();
  };
}
