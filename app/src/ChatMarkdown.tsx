import { useState } from "react";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Highlight, themes } from "prism-react-renderer";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { AppIcon } from "./icons";

type ChatMarkdownProps = {
  text: string;
};

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="chat-code-block">
      <div className="chat-code-block__header">
        <span>{language || "text"}</span>
        <button type="button" aria-label={copied ? "Code copied" : "Copy code"} onClick={() => void copy()}>
          <AppIcon name={copied ? "check" : "copy"} />
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <Highlight code={code} language={language || "text"} theme={themes.vsDark}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre className={`${className} chat-code-block__pre`} style={{ ...style, background: "transparent" }}>
            <code>
              {tokens.map((line, lineIndex) => (
                <span {...getLineProps({ line })} key={lineIndex}>
                  {line.map((token, tokenIndex) => (
                    <span {...getTokenProps({ token })} key={tokenIndex} />
                  ))}
                  {lineIndex < tokens.length - 1 ? "\n" : null}
                </span>
              ))}
            </code>
          </pre>
        )}
      </Highlight>
    </div>
  );
}

const components: Components = {
  a: ({ href, children, ...props }) => {
    const external = Boolean(href && /^(https?:|mailto:)/i.test(href));
    return (
      <a
        {...props}
        href={href}
        rel={external ? "noreferrer noopener" : undefined}
        target={external ? "_blank" : undefined}
        onClick={external ? (event) => {
          event.preventDefault();
          if (href) void openUrl(href).catch(() => {});
        } : undefined}
      >
        {children}
      </a>
    );
  },
  code: ({ className, children, ...props }) => {
    const language = /language-([^\s]+)/.exec(className ?? "")?.[1] ?? "";
    const code = String(children).replace(/\n$/, "");
    const block = Boolean(language || code.includes("\n"));
    return block ? <CodeBlock code={code} language={language} /> : <code {...props}>{children}</code>;
  },
  img: ({ alt }) => <span className="chat-markdown__image-placeholder">Image: {alt || "attachment"}</span>,
  pre: ({ children }) => <>{children}</>,
};

export function ChatMarkdown({ text }: ChatMarkdownProps) {
  return (
    <div className="chat-markdown">
      <ReactMarkdown components={components} remarkPlugins={[remarkGfm]} skipHtml>
        {text}
      </ReactMarkdown>
    </div>
  );
}
