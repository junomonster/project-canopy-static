import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

const SAFE_HREF = /^(\/|https?:\/\/|mailto:)/;
const TOKEN_RE = /\[([^\]]+)\]\(([^)]+)\)|==([^=]+)==|\*\*([^*]+)\*\*/g;

export function renderAnswer(text: string): ReactNode {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  TOKEN_RE.lastIndex = 0;
  while ((match = TOKEN_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <Fragment key={key++}>{text.slice(lastIndex, match.index)}</Fragment>,
      );
    }
    if (match[1] !== undefined) {
      const href = match[2];
      if (SAFE_HREF.test(href)) {
        if (href.startsWith('/')) {
          nodes.push(
            <Link key={key++} to={href}>
              {match[1]}
            </Link>,
          );
        } else {
          nodes.push(
            <a key={key++} href={href}>
              {match[1]}
            </a>,
          );
        }
      } else {
        nodes.push(<Fragment key={key++}>{match[0]}</Fragment>);
      }
    } else if (match[3] !== undefined) {
      nodes.push(<mark key={key++}>{match[3]}</mark>);
    } else if (match[4] !== undefined) {
      nodes.push(<strong key={key++}>{match[4]}</strong>);
    }
    lastIndex = TOKEN_RE.lastIndex;
  }
  if (lastIndex < text.length) {
    nodes.push(<Fragment key={key++}>{text.slice(lastIndex)}</Fragment>);
  }
  return nodes;
}
