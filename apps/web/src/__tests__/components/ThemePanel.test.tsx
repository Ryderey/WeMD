import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemePanel } from "../../components/Theme/ThemePanel";
import { useThemeStore } from "../../store/themeStore";
import { useEditorStore } from "../../store/editorStore";
import { useHistoryStore } from "../../store/historyStore";
import { useUITheme } from "../../hooks/useUITheme";
import type { CustomTheme } from "../../store/themes/builtInThemes";

// Mock stores and hooks
vi.mock("../../store/themeStore");
vi.mock("../../store/editorStore");
vi.mock("../../store/historyStore");
vi.mock("../../hooks/useUITheme");
vi.mock("../../lib/platformAdapter", () => ({
  platformActions: {
    shouldPersistHistory: () => true,
  },
}));

// Mock ThemeDesigner to avoid complex dependencies
vi.mock("../../components/Theme/ThemeDesigner", () => ({
  ThemeDesigner: () => <div data-testid="theme-designer">Theme Designer</div>,
  defaultVariables: {},
  generateCSS: () => "",
}));

describe("ThemePanel", () => {
  const mockSelectTheme = vi.fn();
  const mockCreateTheme = vi.fn();
  const mockUpdateTheme = vi.fn();
  const mockDeleteTheme = vi.fn();
  const mockDuplicateTheme = vi.fn();
  const mockPersistActiveSnapshot = vi.fn();

  const mockThemes: CustomTheme[] = [
    {
      id: "default",
      name: "默认主题",
      css: "",
      isBuiltIn: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "custom1",
      name: "自定义主题",
      css: "body{}",
      isBuiltIn: false,
      editorMode: "css" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "jade-notes",
      name: "青岚",
      css: "#wemd{}",
      isBuiltIn: true,
      editorMode: "visual" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useThemeStore).mockImplementation((selector) => {
      const state = {
        themeId: "default",
        themeName: "默认主题",
        customCSS: "",
        customThemes: mockThemes.filter((theme) => !theme.isBuiltIn),
        selectTheme: mockSelectTheme,
        setCustomCSS: vi.fn(),
        getThemeCSS: vi.fn().mockReturnValue(""),
        getAllThemes: () => mockThemes,
        createTheme: mockCreateTheme,
        updateTheme: mockUpdateTheme,
        deleteTheme: mockDeleteTheme,
        duplicateTheme: mockDuplicateTheme,
        exportTheme: vi.fn(),
        exportThemeCSS: vi.fn(),
        importTheme: vi.fn().mockResolvedValue(true),
      };
      return selector(state);
    });

    // 面板按 id 取主题时会读 store 的实时状态（避免陈旧列表），这里同步给出
    (useThemeStore as unknown as { getState: () => unknown }).getState =
      () => ({
        getAllThemes: () => mockThemes,
      });

    // Setup editor store mock
    vi.mocked(useEditorStore).mockImplementation(((
      selector?: (state: { markdown: string }) => unknown,
    ) => {
      const state = { markdown: "# Test" };
      return typeof selector === "function" ? selector(state) : state;
    }) as unknown as typeof useEditorStore);
    // Also mock getState for direct calls
    (useEditorStore as unknown as { getState: () => unknown }).getState =
      () => ({
        markdown: "# Test",
      });

    vi.mocked(useHistoryStore).mockImplementation((selector) => {
      const state = {
        history: [],
        loading: false,
        filter: "",
        activeId: null,
        loadHistory: vi.fn(),
        setFilter: vi.fn(),
        setActiveId: vi.fn(),
        saveSnapshot: vi.fn(),
        persistActiveSnapshot: mockPersistActiveSnapshot,
        deleteEntry: vi.fn(),
        clearHistory: vi.fn(),
        updateTitle: vi.fn(),
      };
      return selector(state);
    });

    vi.mocked(useUITheme).mockImplementation((selector) => {
      const state = { theme: "default" as const, setTheme: vi.fn() };
      return selector(state);
    });
  });

  it("renders when open", () => {
    render(<ThemePanel open={true} onClose={() => {}} />);

    expect(screen.getByText("主题管理")).toBeInTheDocument();
    expect(screen.getByText("新建自定义主题")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<ThemePanel open={false} onClose={() => {}} />);

    expect(screen.queryByText("主题管理")).not.toBeInTheDocument();
  });

  it("displays built-in and custom themes", () => {
    render(<ThemePanel open={true} onClose={() => {}} />);

    expect(screen.getByText("默认主题")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "自定义主题" }),
    ).toBeInTheDocument();
    expect(screen.getByText("内置主题")).toBeInTheDocument();
  });

  it("calls onClose when close button clicked", () => {
    const mockOnClose = vi.fn();
    render(<ThemePanel open={true} onClose={mockOnClose} />);

    fireEvent.click(screen.getByLabelText("关闭"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("selects a theme when clicked", () => {
    render(<ThemePanel open={true} onClose={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: "自定义主题" }));

    const nameInput = screen.getByPlaceholderText("输入主题名称...");
    expect(nameInput).toHaveValue("自定义主题");
  });

  it("enters creation mode when new theme button clicked", () => {
    render(<ThemePanel open={true} onClose={() => {}} />);

    fireEvent.click(screen.getByText("新建自定义主题"));

    expect(screen.getByText("选择创建方式")).toBeInTheDocument();
    expect(screen.getByText("可视化设计")).toBeInTheDocument();
    expect(screen.getByText("手写 CSS")).toBeInTheDocument();
  });

  it("模板单独成组：带文字标识，且不再出现在内置主题里", () => {
    render(<ThemePanel open={true} onClose={() => {}} />);

    expect(screen.getByText("模板 · 复制后编辑")).toBeInTheDocument();
    expect(screen.getByText("[模板]")).toBeInTheDocument();
    expect(
      screen.getByText("模板不可修改，复制后可进行可视化微调"),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /青岚/ })).toHaveLength(1);
  });

  it("选中模板只提供复制与应用，没有保存、删除、导出", () => {
    render(<ThemePanel open={true} onClose={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: /青岚/ }));

    expect(screen.getByPlaceholderText("输入主题名称...")).toHaveValue("青岚");
    expect(screen.getByText(/适合随笔/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /复制并微调/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "应用主题" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /保存修改/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /删除/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /导出/ }),
    ).not.toBeInTheDocument();
  });

  it("复制模板时直接以返回的副本初始化面板", () => {
    const backup = [...mockThemes];
    // 真实实现里 createTheme 会把副本并入自定义列表，这里保持一致
    mockDuplicateTheme.mockImplementation((id: string, newName: string) => {
      const source = mockThemes.find((item) => item.id === id)!;
      const copy = {
        ...source,
        id: "custom-copy",
        name: newName,
        isBuiltIn: false,
      };
      mockThemes.push(copy);
      return copy;
    });

    try {
      render(<ThemePanel open={true} onClose={() => {}} />);

      fireEvent.click(screen.getByRole("button", { name: /青岚/ }));
      fireEvent.click(screen.getByRole("button", { name: /复制并微调/ }));

      expect(screen.getByPlaceholderText("输入主题名称...")).toHaveValue(
        "青岚 (副本)",
      );
      expect(
        screen.getByRole("button", { name: /保存修改/ }),
      ).toBeInTheDocument();
      expect(mockDuplicateTheme).toHaveBeenCalledWith(
        "jade-notes",
        "青岚 (副本)",
      );
    } finally {
      mockThemes.splice(0, mockThemes.length, ...backup);
    }
  });

  it("我的主题为空时给出一行空态", () => {
    const backup = [...mockThemes];
    mockThemes.splice(
      0,
      mockThemes.length,
      ...mockThemes.filter((item) => item.isBuiltIn),
    );
    try {
      render(<ThemePanel open={true} onClose={() => {}} />);
      expect(
        screen.getByText("还没有自己的主题，从模板复制一份开始"),
      ).toBeInTheDocument();
    } finally {
      mockThemes.splice(0, mockThemes.length, ...backup);
    }
  });
});
