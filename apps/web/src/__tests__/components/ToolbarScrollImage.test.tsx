import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
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
vi.mock("../../services/image/imageUploadFlow", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("../../services/image/imageUploadFlow")
  >()),
  uploadEditorImage: vi.fn(),
}));

const createUploadResult = (name = "long]image.png") => ({
  url: "https://example.com/uploaded_(long).png?x=1&y=2",
  sourceFile: new File([], name, { type: "image/png" }),
  uploadedFile: new File([], name, { type: "image/png" }),
  compressed: false,
  originalSize: 100,
  finalSize: 100,
});

const createFile = (
  name: string,
  size = 100,
  type = "image/png",
  lastModified = 1,
) => new File([new ArrayBuffer(size)], name, { type, lastModified });

const selectScrollImage = (...files: File[]) => {
  fireEvent.change(screen.getByLabelText("选择滚动长图文件"), {
    target: { files },
  });
};

const listedNames = () =>
  Array.from(
    document.querySelectorAll<HTMLElement>(".scroll-image-file-name"),
  ).map((node) => node.textContent);

const useWechatHost = () => {
  localStorage.setItem("imageHostConfig", JSON.stringify({ type: "wechat" }));
};

describe("Toolbar scroll image", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    let objectUrlCount = 0;
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => `blob:scroll-image-${++objectUrlCount}`),
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

    selectScrollImage(createFile("long]image.png"));

    expect(
      screen.getByRole("dialog", { name: "滚动长图设置" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("滚动长图预览，可上下滚动")).toHaveStyle({
      height: "320px",
    });
    expect(screen.getByRole("button", { name: "320px" })).toHaveClass("active");
    expect(listedNames()).toEqual(["long]image.png"]);

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

  it("支持一次多选与继续添加，并按选择顺序去重排列", () => {
    render(<Toolbar onInsert={vi.fn()} onInsertText={vi.fn()} />);

    selectScrollImage(
      createFile("a.png", 1024, "image/png", 1),
      createFile("b.png", 2048, "image/png", 2),
    );
    expect(screen.getByText("已选图片（2/20）")).toBeInTheDocument();
    expect(listedNames()).toEqual(["a.png", "b.png"]);

    fireEvent.click(screen.getByRole("button", { name: "继续添加" }));
    selectScrollImage(createFile("c.png", 512, "image/png", 3));
    expect(screen.getByText("已选图片（3/20）")).toBeInTheDocument();
    expect(listedNames()).toEqual(["a.png", "b.png", "c.png"]);
    expect(screen.getByText("合计 0.00 MiB（3,584 字节）")).toBeInTheDocument();

    selectScrollImage(createFile("a.png", 1024, "image/png", 1));
    expect(listedNames()).toEqual(["a.png", "b.png", "c.png"]);
    expect(toastMock.error).toHaveBeenCalledWith(
      expect.stringContaining("重复"),
    );
  });

  it("过滤非图片与当前图床不支持的格式", () => {
    useWechatHost();
    render(<Toolbar onInsert={vi.fn()} onInsertText={vi.fn()} />);

    selectScrollImage(
      createFile("a.png", 1024),
      createFile("notes.txt", 10, "text/plain"),
      createFile("anim.webp", 1024, "image/webp"),
    );

    expect(listedNames()).toEqual(["a.png"]);
    expect(toastMock.error).toHaveBeenCalledWith(
      expect.stringContaining("已过滤 2 个不支持的文件"),
    );
  });

  it("上限 20 张：超出部分被忽略并禁用继续添加", () => {
    render(<Toolbar onInsert={vi.fn()} onInsertText={vi.fn()} />);

    selectScrollImage(
      ...Array.from({ length: 21 }, (_, index) =>
        createFile(`p${index}.png`, 100, "image/png", index + 1),
      ),
    );

    expect(screen.getByText("已选图片（20/20）")).toBeInTheDocument();
    expect(listedNames()).toHaveLength(20);
    expect(toastMock.error).toHaveBeenCalledWith(
      expect.stringContaining("20 张上限"),
    );
    expect(
      screen.getByRole("button", { name: "已达 20 张上限" }),
    ).toBeDisabled();
  });

  it("支持移除与上下移动，并在移除时释放预览地址", () => {
    render(<Toolbar onInsert={vi.fn()} onInsertText={vi.fn()} />);
    selectScrollImage(
      createFile("a.png", 1024, "image/png", 1),
      createFile("b.png", 2048, "image/png", 2),
      createFile("c.png", 512, "image/png", 3),
    );

    fireEvent.click(screen.getByRole("button", { name: "上移第 2 张" }));
    expect(listedNames()).toEqual(["b.png", "a.png", "c.png"]);

    fireEvent.click(screen.getByRole("button", { name: "下移第 1 张" }));
    expect(listedNames()).toEqual(["a.png", "b.png", "c.png"]);

    fireEvent.click(screen.getByRole("button", { name: "移除第 2 张" }));
    expect(listedNames()).toEqual(["a.png", "c.png"]);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:scroll-image-2");
  });

  it("取消时不上传，并释放全部本地预览地址", () => {
    render(<Toolbar onInsert={vi.fn()} onInsertText={vi.fn()} />);
    selectScrollImage(
      createFile("a.png", 1024, "image/png", 1),
      createFile("b.png", 2048, "image/png", 2),
    );

    fireEvent.click(screen.getByRole("button", { name: "取消" }));

    expect(uploadEditorImage).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:scroll-image-1");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:scroll-image-2");
  });

  it("多图成功后按列表顺序生成语法，且全程跳过压缩", async () => {
    vi.mocked(uploadEditorImage).mockResolvedValue(createUploadResult());
    const onInsertText = vi.fn();
    render(<Toolbar onInsert={vi.fn()} onInsertText={onInsertText} />);

    selectScrollImage(
      createFile("a.png", 1024, "image/png", 1),
      createFile("b.png", 2048, "image/png", 2),
    );
    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "512" },
    });
    fireEvent.click(screen.getByRole("button", { name: "上传并插入" }));

    await waitFor(() =>
      expect(onInsertText).toHaveBeenCalledWith(
        [
          "\n::: scroll-image 512",
          "![a](<https://example.com/uploaded_(long).png?x=1&y=2>)",
          "",
          "![b](<https://example.com/uploaded_(long).png?x=1&y=2>)",
          ":::\n",
        ].join("\n"),
      ),
    );

    const calls = vi.mocked(uploadEditorImage).mock.calls;
    expect(calls.map((call) => call[0].name)).toEqual(["a.png", "b.png"]);
    for (const call of calls) {
      expect(call[1]).toMatchObject({ skipCompression: true });
      expect(call[1]?.compressionOptions).toBeUndefined();
    }
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });

  it("横向模式多图在轨道内并排，并保留高度设置", async () => {
    vi.mocked(uploadEditorImage).mockResolvedValue(createUploadResult());
    const onInsertText = vi.fn();
    render(<Toolbar onInsert={vi.fn()} onInsertText={onInsertText} />);

    selectScrollImage(
      createFile("a.png", 1024, "image/png", 1),
      createFile("b.png", 2048, "image/png", 2),
    );
    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "512" },
    });
    fireEvent.click(screen.getByRole("radio", { name: "横向（左右滑动）" }));

    expect(
      screen.getByRole("radio", { name: "横向（左右滑动）" }),
    ).toBeChecked();
    expect(screen.getByLabelText("滚动长图预览，可左右滚动")).toHaveStyle({
      height: "512px",
    });
    expect(screen.getByText("↔ 左右滑动查看完整图片")).toBeInTheDocument();
    expect(document.querySelector(".scroll-image-dialog-track")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "上传并插入" }));

    await waitFor(() =>
      expect(onInsertText).toHaveBeenCalledWith(
        expect.stringContaining("::: scroll-image 512 horizontal\n"),
      ),
    );
  });

  it("切换方向保留高度并把预览滚动位置重置到起点", () => {
    render(<Toolbar onInsert={vi.fn()} onInsertText={vi.fn()} />);
    selectScrollImage(createFile("long]image.png"));
    const preview = screen.getByLabelText("滚动长图预览，可上下滚动");
    Object.defineProperty(preview, "scrollTop", {
      value: 120,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(preview, "scrollLeft", {
      value: 80,
      writable: true,
      configurable: true,
    });

    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "420" },
    });
    fireEvent.click(screen.getByRole("radio", { name: "横向（左右滑动）" }));

    expect(preview.scrollTop).toBe(0);
    expect(preview.scrollLeft).toBe(0);
    expect(screen.getByLabelText("滚动长图预览，可左右滚动")).toHaveStyle({
      height: "420px",
    });
  });

  it("上传过程中方向、高度、列表与取消均不可操作", async () => {
    let resolveUpload!: (value: ReturnType<typeof createUploadResult>) => void;
    vi.mocked(uploadEditorImage).mockReturnValue(
      new Promise((resolve) => {
        resolveUpload = resolve;
      }),
    );
    render(<Toolbar onInsert={vi.fn()} onInsertText={vi.fn()} />);
    selectScrollImage(createFile("long]image.png"));

    fireEvent.click(screen.getByRole("button", { name: "上传并插入" }));
    await waitFor(() => expect(uploadEditorImage).toHaveBeenCalledTimes(1));

    expect(
      screen.getByRole("radio", { name: "纵向（上下滑动）" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("radio", { name: "横向（左右滑动）" }),
    ).toBeDisabled();
    expect(screen.getByRole("spinbutton")).toBeDisabled();
    expect(screen.getByRole("button", { name: "取消" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "继续添加" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "移除第 1 张" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("已上传 0/1");

    await act(async () => {
      resolveUpload(createUploadResult());
    });
  });

  it("部分失败时不插入、保留已成功项并只重试失败项", async () => {
    vi.mocked(uploadEditorImage).mockImplementation(async (file) => {
      if (file.name === "b.png") throw new Error("网络暂时不可用");
      return createUploadResult();
    });
    const onInsertText = vi.fn();
    render(<Toolbar onInsert={vi.fn()} onInsertText={onInsertText} />);

    selectScrollImage(
      createFile("a.png", 1024, "image/png", 1),
      createFile("b.png", 2048, "image/png", 2),
      createFile("c.png", 512, "image/png", 3),
    );
    fireEvent.click(screen.getByRole("button", { name: "上传并插入" }));

    await waitFor(() => expect(uploadEditorImage).toHaveBeenCalledTimes(3));
    expect(onInsertText).not.toHaveBeenCalled();
    expect(toastMock.error).toHaveBeenCalledWith(
      expect.stringContaining("第 2 张（b.png）上传失败"),
    );
    expect(screen.getByText(/b\.png：上传失败/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "重试失败项" }),
    ).toBeInTheDocument();

    vi.mocked(uploadEditorImage).mockReset();
    vi.mocked(uploadEditorImage).mockResolvedValue(createUploadResult());
    fireEvent.click(screen.getByRole("button", { name: "重试失败项" }));

    await waitFor(() =>
      expect(onInsertText).toHaveBeenCalledWith(
        [
          "\n::: scroll-image 320",
          "![a](<https://example.com/uploaded_(long).png?x=1&y=2>)",
          "",
          "![b](<https://example.com/uploaded_(long).png?x=1&y=2>)",
          "",
          "![c](<https://example.com/uploaded_(long).png?x=1&y=2>)",
          ":::\n",
        ].join("\n"),
      ),
    );
    expect(uploadEditorImage).toHaveBeenCalledTimes(1);
    expect(vi.mocked(uploadEditorImage).mock.calls[0][0].name).toBe("b.png");
  });

  it("部分失败后移除失败项，可直接插入已成功的图片", async () => {
    vi.mocked(uploadEditorImage).mockImplementation(async (file) => {
      if (file.name === "b.png") throw new Error("网络暂时不可用");
      return createUploadResult();
    });
    const onInsertText = vi.fn();
    render(<Toolbar onInsert={vi.fn()} onInsertText={onInsertText} />);

    selectScrollImage(
      createFile("a.png", 1024, "image/png", 1),
      createFile("b.png", 2048, "image/png", 2),
    );
    fireEvent.click(screen.getByRole("button", { name: "上传并插入" }));
    await waitFor(() => expect(uploadEditorImage).toHaveBeenCalledTimes(2));
    expect(onInsertText).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "移除第 2 张" }));
    const submit = screen.getByRole("button", { name: "插入" });
    expect(submit).toBeEnabled();

    fireEvent.click(submit);
    await waitFor(() =>
      expect(onInsertText).toHaveBeenCalledWith(
        "\n::: scroll-image 320\n![a](<https://example.com/uploaded_(long).png?x=1&y=2>)\n:::\n",
      ),
    );
    expect(uploadEditorImage).toHaveBeenCalledTimes(2);
  });

  it("公众号图床逐张按十进制体积拦截超限项", () => {
    useWechatHost();
    render(<Toolbar onInsert={vi.fn()} onInsertText={vi.fn()} />);

    selectScrollImage(
      createFile("ok.png", 949_999, "image/png", 1),
      createFile("too-big.png", 950_000, "image/png", 2),
    );

    expect(
      document.querySelectorAll(".scroll-image-file-item.is-invalid"),
    ).toHaveLength(1);
    expect(
      screen.getByText(
        /too-big\.png：950,000 字节，超过 950,000 字节上限，请先自行压缩或拆分后重选/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "上传并插入" })).toBeDisabled();
    expect(uploadEditorImage).not.toHaveBeenCalled();
  });

  it("十进制 1,000,000 与二进制 1,048,576 都被本地拦下且不发请求", () => {
    useWechatHost();
    render(<Toolbar onInsert={vi.fn()} onInsertText={vi.fn()} />);

    selectScrollImage(createFile("decimal.png", 1_000_000, "image/png", 1));
    expect(screen.getByRole("button", { name: "上传并插入" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "取消" }));
    selectScrollImage(createFile("binary.png", 1_048_576, "image/png", 2));
    expect(screen.getByRole("button", { name: "上传并插入" })).toBeDisabled();
    expect(uploadEditorImage).not.toHaveBeenCalled();
  });

  it("非微信图床分别按 4,500,000 与 9,000,000 门槛拦截", () => {
    render(<Toolbar onInsert={vi.fn()} onInsertText={vi.fn()} />);
    selectScrollImage(
      createFile("edge.png", 4_500_000, "image/png", 1),
      createFile("over.png", 4_500_001, "image/png", 2),
    );

    expect(
      document.querySelectorAll(".scroll-image-file-item.is-invalid"),
    ).toHaveLength(1);
    expect(
      screen.getByText(/over\.png：4,500,001 字节，超过 4,500,000 字节上限/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "取消" }));
    localStorage.setItem("imageHostConfig", JSON.stringify({ type: "qiniu" }));
    selectScrollImage(
      createFile("edge9.png", 9_000_000, "image/png", 3),
      createFile("over9.png", 9_000_001, "image/png", 4),
    );

    expect(
      screen.getByText(/over9\.png：9,000,001 字节，超过 9,000,000 字节上限/),
    ).toBeInTheDocument();
  });

  it("重新打开弹窗后方向与高度重置", () => {
    render(<Toolbar onInsert={vi.fn()} onInsertText={vi.fn()} />);
    selectScrollImage(createFile("a.png", 1024, "image/png", 1));
    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "512" },
    });
    fireEvent.click(screen.getByRole("radio", { name: "横向（左右滑动）" }));

    fireEvent.click(screen.getByRole("button", { name: "取消" }));
    selectScrollImage(createFile("b.png", 1024, "image/png", 2));

    expect(
      screen.getByRole("radio", { name: "纵向（上下滑动）" }),
    ).toBeChecked();
    expect(screen.getByRole("spinbutton")).toHaveValue(320);
  });

  it("普通图片上传仍使用原入口和插入回调", async () => {
    vi.mocked(uploadEditorImage).mockResolvedValue(createUploadResult());
    const onInsert = vi.fn();
    render(<Toolbar onInsert={onInsert} onInsertText={vi.fn()} />);

    const normalInput = document.querySelector<HTMLInputElement>(
      'input[type="file"]:not([aria-label])',
    );
    expect(normalInput).not.toBeNull();
    fireEvent.change(normalInput as HTMLInputElement, {
      target: { files: [createFile("long]image.png")] },
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
    expect(screen.getAllByText(/容器内可放 1–20 张/)).toHaveLength(2);
    expect(
      screen.getByText("::: scroll-image 320 horizontal"),
    ).toBeInTheDocument();
    expect(screen.getByText(/横向滚动长图/)).toBeInTheDocument();
  });
});
