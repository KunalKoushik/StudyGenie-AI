import React from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
}

/**
 * MathRenderer formats LaTeX mathematical notation ($...$ or $$...$$) using KaTeX,
 * and cleanly strips raw markdown characters (###, **) into styled typography.
 */
export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split text by block math ($$...$$) or inline math ($...$)
  const parts = content.split(/(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$)/g);

  return (
    <span className={`inline-wrap ${className}`}>
      {parts.map((part, idx) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const formula = part.slice(2, -2).trim();
          return (
            <div
              key={idx}
              className="my-3 p-3 bg-slate-950/80 border border-indigo-500/30 rounded-xl text-center overflow-x-auto text-indigo-200 text-sm shadow-inner"
              dangerouslySetInnerHTML={{
                __html: renderKaTeX(formula, true)
              }}
            />
          );
        } else if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          const formula = part.slice(1, -1).trim();
          return (
            <span
              key={idx}
              className="px-1.5 py-0.5 mx-0.5 bg-indigo-950/60 border border-indigo-500/20 rounded text-indigo-300 text-xs font-semibold inline-block"
              dangerouslySetInnerHTML={{
                __html: renderKaTeX(formula, false)
              }}
            />
          );
        }

        // Regular text formatting: strip markdown headings ### and bold **
        return (
          <span key={idx}>
            {part.split('\n').map((line, lineIdx, arr) => (
              <React.Fragment key={lineIdx}>
                {renderFormattedTextLine(line)}
                {lineIdx < arr.length - 1 && <br />}
              </React.Fragment>
            ))}
          </span>
        );
      })}
    </span>
  );
};

function renderFormattedTextLine(line: string): React.ReactNode {
  let cleanedLine = line.trim();
  if (!cleanedLine) return null;

  // Check markdown heading like ### or ## or #
  const isHeading = /^#{1,6}\s+/.test(cleanedLine);
  if (isHeading) {
    cleanedLine = cleanedLine.replace(/^#{1,6}\s+/, '');
  }

  // Parse **bold text**
  const boldParts = cleanedLine.split(/(\*\*[^*]+?\*\*)/g);
  const elements = boldParts.map((bPart, i) => {
    if (bPart.startsWith('**') && bPart.endsWith('**') && bPart.length > 4) {
      return (
        <strong key={i} className="font-extrabold text-indigo-100">
          {bPart.slice(2, -2)}
        </strong>
      );
    }
    return bPart;
  });

  if (isHeading) {
    return (
      <span className="block text-base sm:text-lg font-black text-indigo-200 mt-2 mb-1 tracking-tight">
        {elements}
      </span>
    );
  }

  return <>{elements}</>;
}

function renderKaTeX(formula: string, displayMode: boolean): string {
  try {
    return katex.renderToString(formula, {
      displayMode,
      throwOnError: false,
      output: 'htmlAndMathml'
    });
  } catch (err) {
    console.warn('KaTeX render fallback:', err);
    return formula;
  }
}
