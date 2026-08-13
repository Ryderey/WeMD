import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Toolbar } from "../../components/Editor/Toolbar";
import { uploadEditorImage } from "../../services/image/imageUploadFlow";

const toastMock = vi.hoisted(() => ({
  loading: vi.fn(() => "loading-toast"),
  dismiss: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({ default: toastMock }));
vi.mock("../../services/image/imageUploadFlow", () => ({
  uploadEditorImage: vi.fn(),
}));

const uploadResult = {
  url: "https://example.com/uploaded_(long).png?x=1&y=2",
  sourceFile: new File([], "long]image.png", { type: "image/png" }),
  uploadedFile: new File([], "long]image.png", { type: "image/png" }),
  compressed: false,
  originalSize: 100,
  finalSize: 100,
};

const selectScrollImage = () => {
  const file = new File(["image"], "long]image.png", { type: "image/png" });
  fireEvent.change(screen.getByLabelText("选择滚动长图文件"), {
    target: { files: [file] },
  });
  return file;
};

describe("Toolbar scroll image", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:scroll-image-preview"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("提供独立入口，并在上传前显示真实固定高度预览", () => {
    render(<Toolbar onInsert={vi.fn()} onInsertText={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: "上传图片" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "滚动长图" }),
    ).toBeInTheDocument();

    selectScrollImage();

    expect(
      screen.getByRole("dialog", { name: "滚动长图设置" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("滚动长图预览，可上下滚动")).toHaveStyle({
      height: "320px",
    });
    expect(screen.getByRole("button", { name: "320px" })).toHaveClass("active");

    fireEvent.click(screen.getByRole("button", { name: "420px" }));
    expect(screen.getByLabelText("滚动长图预览，可上下滚动")).toHaveStyle({
      height: "420px",
    });

    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "512" },
    });
    expect(screen.getByLabelText("滚动长图预览，可上下滚动")).toHaveStyle({
      height: "512px",
    });
  });

  it("取消时不上传，并释放本地预览地址", () => {
    render(<Toolbar onInsert={vi.fn()} onInsertText={vi.fn()} />);
    selectScrollImage();

    fireEvent.click(screen.getByRole("button", { name: "取消" }));

    expect(uploadEditorImage).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(
      "blob:scroll-image-preview",
    );
  });

  it("成功上传后插入完整块语法并释放预览地址", async () => {
    vi.mocked(uploadEditorImage).mockResolvedValue(uploadResult);
    const onInsertText = vi.fn();
    render(<Toolbar onInsert={vi.fn()} onInsertText={onInsertText} />);
    selectScrollImage();

    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "512" },
    });
    fireEvent.click(screen.getByRole("button", { name: "上传并插入" }));

    await waitFor(() =>
      expect(onInsertText).toHaveBeenCalledWith(
        "\n::: scroll-image 512\n![long\\]image](<https://example.com/uploaded_(long).png?x=1&y=2>)\n:::\n",
      ),
    );
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(
      "blob:scroll-image-preview",
    );
  });

  it("上传失败保留文件和设置，允许原地重试", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(uploadEditorImage)
      .mockRejectedValueOnce(new Error("网络暂时不可用"))
      .mockResolvedValueOnce(uploadResult);
    const onInsertText = vi.fn();
    render(<Toolbar onInsert={vi.fn()} onInsertText={onInsertText} />);
    selectScrollImage();

    fireEvent.click(screen.getByRole("button", { name: "上传并插入" }));
    await waitFor(() => expect(uploadEditorImage).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "上传并插入" })).toBeEnabled(),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "上传并插入" }));
    await waitFor(() => expect(uploadEditorImage).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(onInsertText).toHaveBeenCalledTimes(1));
  });

  it("普通图片上传仍使用原入口和插入回调", async () => {
    vi.mocked(uploadEditorImage).mockResolvedValue(uploadResult);
    const onInsert = vi.fn();
    render(<Toolbar onInsert={onInsert} onInsertText={vi.fn()} />);

    const normalInput = document.querySelector<HTMLInputElement>(
      'input[type="file"]:not([aria-label])',
    );
    expect(normalInput).not.toBeNull();
    fireEvent.change(normalInput as HTMLInputElement, {
      target: { files: [uploadResult.sourceFile] },
    });

    await waitFor(() =>
      expect(onInsert).toHaveBeenCalledWith(
        "![",
        "](https://example.com/uploaded_(long).png?x=1&y=2)",
        "long]image",
      ),
    );
  });

  it("语法帮助列出滚动长图公开语法", () => {
    const { container } = render(
      <Toolbar onInsert={vi.fn()} onInsertText={vi.fn()} />,
    );
    const helpButton = container.querySelector<HTMLButtonElement>(
      'button[data-tooltip="语法帮助"]',
    );
    expect(helpButton).not.toBeNull();

    fireEvent.click(helpButton as HTMLButtonElement);
    expect(screen.getByText("::: scroll-image 320")).toBeInTheDocument();
    expect(
      screen.getByText("滚动长图", { selector: "span" }),
    ).toBeInTheDocument();
  });
});
