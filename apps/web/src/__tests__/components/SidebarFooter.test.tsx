import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import { SidebarFooter } from "../../components/Sidebar/SidebarFooter";
import { useUITheme } from "../../hooks/useUITheme";

vi.mock("../../hooks/useUITheme");
vi.mock("../../utils/assetPath", () => ({
  resolveAppAssetPath: vi.fn(() => "/favicon-dark.svg"),
}));

describe("SidebarFooter", () => {
  const openExternal = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("__APP_VERSION__", "test");
    vi.mocked(useUITheme).mockImplementation((selector) =>
      selector({ theme: "default", setTheme: vi.fn() }),
    );
    vi.stubGlobal("electron", { shell: { openExternal } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens footer links with the system browser bridge in Electron", () => {
    render(<SidebarFooter />);

    fireEvent.click(screen.getByLabelText("GitHub 仓库"));
    fireEvent.click(screen.getByLabelText("官方网站"));
    fireEvent.click(screen.getByLabelText("帮助文档"));

    expect(openExternal).toHaveBeenNthCalledWith(
      1,
      "https://github.com/Ryderey/WeMD",
    );
    expect(openExternal).toHaveBeenNthCalledWith(2, "https://wemd.app");
    expect(openExternal).toHaveBeenNthCalledWith(3, "https://wemd.app/docs");
  });

  it("keeps browser link navigation unchanged outside Electron", () => {
    vi.stubGlobal("electron", undefined);
    render(<SidebarFooter />);

    const link = screen.getByLabelText("GitHub 仓库");
    const click = createEvent.click(link);
    fireEvent(link, click);

    expect(click.defaultPrevented).toBe(false);
    expect(openExternal).not.toHaveBeenCalled();
    expect(link).toHaveAttribute("href", "https://github.com/Ryderey/WeMD");
  });
});
