import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ChatMarkdown } from "./ChatMarkdown";

describe("ChatMarkdown", () => {
  it("renders GFM and highlighted code without executing raw HTML", () => {
    const html = renderToStaticMarkup(
      <ChatMarkdown text={'## Result\n\n- **safe**\n\n| File | State |\n| --- | --- |\n| `App.tsx` | changed |\n\n```ts\nconst ready = true;\n```\n\n<script>alert("no")</script>'} />,
    );

    expect(html).toContain("<h2>Result</h2>");
    expect(html).toContain("<strong>safe</strong>");
    expect(html).toContain("<table>");
    expect(html).toContain("Copy code");
    expect(html).toContain("token keyword");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("alert(&quot;no&quot;)");
  });

  it("drops unsafe link protocols and does not load remote images", () => {
    const html = renderToStaticMarkup(
      <ChatMarkdown text={'[unsafe](javascript:alert(1)) ![tracking](https://example.com/pixel.png)'} />,
    );

    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("<img");
    expect(html).toContain("Image: tracking");
  });
});
