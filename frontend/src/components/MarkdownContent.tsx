import { Check, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);
  const lines = code.replace(/\n$/, "").split("\n");
  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };
  return (
    <figure className="code-block">
      <figcaption>
        <span>{language || "code"}</span>
        <button onClick={copy}>{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}</button>
      </figcaption>
      <pre>
        <code>
          {lines.map((line, index) => (
            <span className="code-line" key={`${index}-${line}`}>
              <span className="line-number" aria-hidden="true">{index + 1}</span>
              <span>{line || " "}</span>
            </span>
          ))}
        </code>
      </pre>
    </figure>
  );
}

const components: Components = {
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children, ...props }) => {
    const language = /language-([^\s]+)/.exec(className ?? "")?.[1];
    if (language) return <CodeBlock code={String(children)} language={language} />;
    return <code className={className} {...props}>{children}</code>;
  },
  a: ({ href, children, ...props }) => {
    const external = href?.startsWith("http");
    return (
      <a href={href} {...props} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>
        {children}{external && <ExternalLink size={13} aria-hidden="true" />}
      </a>
    );
  },
};

export function MarkdownContent({ markdown, className = "" }: { markdown: string; className?: string }) {
  return (
    <div className={`markdown ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{markdown}</ReactMarkdown>
    </div>
  );
}
