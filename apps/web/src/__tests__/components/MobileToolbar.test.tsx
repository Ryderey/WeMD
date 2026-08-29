import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MobileToolbar } from "../../components/common/MobileToolbar";

describe("MobileToolbar", () => {
  it("opens more menu and triggers copyAsHtml", () => {
    const onViewChange = vi.fn();
    const onCopyToWechat = vi.fn();
    const onCopyAsHtml = vi.fn();
    const onOpenTheme = vi.fn();
    const onOpenExport = vi.fn();
    const onOpenRichPost = vi.fn();

    render(
      <MobileToolbar
        activeView="editor"
        onViewChange={onViewChange}
        onCopyToWechat={onCopyToWechat}
        onCopyAsHtml={onCopyAsHtml}
        onOpenTheme={onOpenTheme}
        onOpenExport={onOpenExport}
        onOpenRichPost={onOpenRichPost}
      />,
    );

    fireEvent.click(screen.getAllByRole("button")[3]);
    fireEvent.click(screen.getByText("复制 HTML"));

    expect(onCopyAsHtml).toHaveBeenCalledTimes(1);
  });

  it("triggers theme action from more menu", () => {
    const onViewChange = vi.fn();
    const onCopyToWechat = vi.fn();
    const onCopyAsHtml = vi.fn();
    const onOpenTheme = vi.fn();
    const onOpenExport = vi.fn();
    const onOpenRichPost = vi.fn();

    render(
      <MobileToolbar
        activeView="editor"
        onViewChange={onViewChange}
        onCopyToWechat={onCopyToWechat}
        onCopyAsHtml={onCopyAsHtml}
        onOpenTheme={onOpenTheme}
        onOpenExport={onOpenExport}
        onOpenRichPost={onOpenRichPost}
      />,
    );

    fireEvent.click(screen.getAllByRole("button")[3]);
    fireEvent.click(screen.getByText("主题管理"));

    expect(onOpenTheme).toHaveBeenCalledTimes(1);
  });

  it("triggers export action from more menu", () => {
    const onViewChange = vi.fn();
    const onCopyToWechat = vi.fn();
    const onCopyAsHtml = vi.fn();
    const onOpenTheme = vi.fn();
    const onOpenExport = vi.fn();
    const onOpenRichPost = vi.fn();

    render(
      <MobileToolbar
        activeView="editor"
        onViewChange={onViewChange}
        onCopyToWechat={onCopyToWechat}
        onCopyAsHtml={onCopyAsHtml}
        onOpenTheme={onOpenTheme}
        onOpenExport={onOpenExport}
        onOpenRichPost={onOpenRichPost}
      />,
    );

    fireEvent.click(screen.getAllByRole("button")[3]);
    fireEvent.click(screen.getByText("导出图片"));

    expect(onOpenExport).toHaveBeenCalledTimes(1);
  });

  it("triggers rich-post export from more menu", () => {
    const onOpenRichPost = vi.fn();
    render(
      <MobileToolbar
        activeView="editor"
        onViewChange={vi.fn()}
        onCopyToWechat={vi.fn()}
        onCopyAsHtml={vi.fn()}
        onOpenTheme={vi.fn()}
        onOpenExport={vi.fn()}
        onOpenRichPost={onOpenRichPost}
      />,
    );

    fireEvent.click(screen.getAllByRole("button")[3]);
    fireEvent.click(screen.getByText("导出图文"));

    expect(onOpenRichPost).toHaveBeenCalledTimes(1);
  });
});
