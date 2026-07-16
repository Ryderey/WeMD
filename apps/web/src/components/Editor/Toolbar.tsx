import { useRef, useState, useEffect } from "react";
import {
  Heading,
  List,
  Image,
  Loader2,
  Workflow,
  ChevronRight,
  ChevronLeft,
  ListEnd,
  Smile,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  WECHAT_IMAGE_MAX_SIZE_BYTES,
  formatImageSize,
} from "../../services/image/autoCompressImage";
import { uploadEditorImage } from "../../services/image/imageUploadFlow";
import {
  blockTools,
  headingOptions,
  listOptions,
  mermaidMoreTemplates,
  mermaidPrimaryTemplates,
  textFormatTools,
} from "./toolbarConfigs";
import { setLinkToFootnoteEnabled } from "./ToolbarState";
import { EmojiPicker } from "./EmojiPicker";
import { SyntaxHelpPopover } from "./SyntaxHelpPopover";
import "./Toolbar.css";

interface ToolbarProps {
  onInsert: (prefix: string, suffix: string, placeholder: string) => void;
  onInsertText: (text: string) => void;
}

export function Toolbar({ onInsert, onInsertText }: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showMermaidMenu, setShowMermaidMenu] = useState(false);
  const [showMermaidMore, setShowMermaidMore] = useState(false);
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const [showListMenu, setShowListMenu] = useState(false);
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);
  const mermaidMenuRef = useRef<HTMLDivElement>(null);
  const headingMenuRef = useRef<HTMLDivElement>(null);
  const listMenuRef = useRef<HTMLDivElement>(null);
  const emojiMenuRef = useRef<HTMLDivElement>(null);
  const mermaidMoreRef = useRef<HTMLDivElement>(null);
  const mermaidSubmenuRef = useRef<HTMLDivElement>(null);
  const [mermaidSubmenuSide, setMermaidSubmenuSide] = useState<
    "left" | "right"
  >("right");
  const [linkToFootnote, setLinkToFootnote] = useState(() => {
    const saved = localStorage.getItem("wemd-link-to-footnote");
    return saved === "true";
  });

  // 同步状态到全局变量和 localStorage
  useEffect(() => {
    setLinkToFootnoteEnabled(linkToFootnote);
    localStorage.setItem("wemd-link-to-footnote", String(linkToFootnote));
  }, [linkToFootnote]);

  // 点击外部关闭所有菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // 关闭标题菜单
      if (headingMenuRef.current && !headingMenuRef.current.contains(target)) {
        setShowHeadingMenu(false);
      }
      // 关闭列表菜单
      if (listMenuRef.current && !listMenuRef.current.contains(target)) {
        setShowListMenu(false);
      }
      // 关闭 Mermaid 菜单
      if (mermaidMenuRef.current && !mermaidMenuRef.current.contains(target)) {
        setShowMermaidMenu(false);
        setShowMermaidMore(false);
      }
      if (emojiMenuRef.current && !emojiMenuRef.current.contains(target)) {
        setShowEmojiMenu(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setShowHeadingMenu(false);
      setShowListMenu(false);
      setShowMermaidMenu(false);
      setShowMermaidMore(false);
      setShowEmojiMenu(false);
    };

    const anyMenuOpen =
      showHeadingMenu || showListMenu || showMermaidMenu || showEmojiMenu;
    if (anyMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showEmojiMenu, showHeadingMenu, showListMenu, showMermaidMenu]);

  useEffect(() => {
    if (!showMermaidMore) return;

    const updateSubmenuSide = () => {
      const container = mermaidMoreRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const spaceRight = window.innerWidth - rect.right;

      const isInRightHalf = rect.left > window.innerWidth / 2;
      const isTightSpace = spaceRight < 300;

      if (isInRightHalf || isTightSpace) {
        setMermaidSubmenuSide("left");
      } else {
        setMermaidSubmenuSide("right");
      }
    };

    const rafId = requestAnimationFrame(updateSubmenuSide);
    window.addEventListener("resize", updateSubmenuSide);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updateSubmenuSide);
    };
  }, [showMermaidMore]);

  const handleMermaidInsert = (code: string) => {
    onInsert("```mermaid\n", "\n```", code);
    setShowMermaidMenu(false);
    setShowMermaidMore(false);
  };

  const toggleMermaidMenu = () => {
    setShowMermaidMenu((prev) => {
      const next = !prev;
      if (!next) {
        setShowMermaidMore(false);
      } else {
        // 关闭其他菜单
        setShowHeadingMenu(false);
        setShowListMenu(false);
        setShowEmojiMenu(false);
      }
      return next;
    });
  };

  const toggleEmojiMenu = () => {
    setShowEmojiMenu((prev) => {
      const next = !prev;
      if (next) {
        setShowHeadingMenu(false);
        setShowListMenu(false);
        setShowMermaidMenu(false);
        setShowMermaidMore(false);
      }
      return next;
    });
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      toast.error("请选择图片文件");
      return;
    }

    setUploading(true);
    const needAutoCompress = file.size > WECHAT_IMAGE_MAX_SIZE_BYTES;
    const loadingMessage = needAutoCompress
      ? "正在压缩并上传图片..."
      : "正在上传图片...";
    const loadingToastId = toast.loading(loadingMessage);

    try {
      const result = await uploadEditorImage(file, {
        compressionOptions: { maxSizeBytes: WECHAT_IMAGE_MAX_SIZE_BYTES },
      });

      // 插入 Markdown
      onInsert("![", `](${result.url})`, file.name.replace(/\.[^/.]+$/, ""));

      const successMessage = result.compressed
        ? `图片上传成功（已自动压缩 ${formatImageSize(
            result.originalSize,
          )} -> ${formatImageSize(result.finalSize)}）`
        : "图片上传成功";
      toast.success(successMessage);
    } catch (error) {
      console.error("图片上传失败:", error);
      toast.error(error instanceof Error ? error.message : "图片上传失败");
    } finally {
      toast.dismiss(loadingToastId);
      setUploading(false);
      // 清空 input，允许重复上传同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const toggleLinkToFootnote = () => {
    const next = !linkToFootnote;
    setLinkToFootnote(next);
    toast.success(next ? "已开启：外链转脚注" : "已关闭：外链转脚注", {
      duration: 2000,
    });
  };

  return (
    <div className="md-toolbar">
      {/* 文本格式工具 */}
      {textFormatTools.map((tool, index) => (
        <button
          key={index}
          className="md-toolbar-btn"
          onClick={() => onInsert(tool.prefix, tool.suffix, tool.placeholder)}
          data-tooltip={tool.label}
        >
          <tool.icon size={16} />
        </button>
      ))}

      {/* 标题下拉菜单 */}
      <div className="md-toolbar-dropdown-container" ref={headingMenuRef}>
        <button
          className={`md-toolbar-btn ${showHeadingMenu ? "active" : ""}`}
          onClick={() => {
            setShowHeadingMenu((prev) => !prev);
            setShowListMenu(false);
            setShowMermaidMenu(false);
            setShowEmojiMenu(false);
          }}
          data-tooltip="标题"
        >
          <Heading size={16} />
        </button>
        {showHeadingMenu && (
          <div className="md-toolbar-dropdown-menu">
            {headingOptions.map((option, idx) => (
              <button
                key={idx}
                className="md-toolbar-dropdown-item"
                onClick={() => {
                  onInsert(option.prefix, option.suffix, option.placeholder);
                  setShowHeadingMenu(false);
                }}
              >
                <option.icon size={14} className="mr-2" />
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 列表下拉菜单 */}
      <div className="md-toolbar-dropdown-container" ref={listMenuRef}>
        <button
          className={`md-toolbar-btn ${showListMenu ? "active" : ""}`}
          onClick={() => {
            setShowListMenu((prev) => !prev);
            setShowHeadingMenu(false);
            setShowMermaidMenu(false);
            setShowEmojiMenu(false);
          }}
          data-tooltip="列表"
        >
          <List size={16} />
        </button>
        {showListMenu && (
          <div className="md-toolbar-dropdown-menu">
            {listOptions.map((option, idx) => (
              <button
                key={idx}
                className="md-toolbar-dropdown-item"
                onClick={() => {
                  onInsert(option.prefix, option.suffix, option.placeholder);
                  setShowListMenu(false);
                }}
              >
                <option.icon size={14} className="mr-2" />
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 块级工具 */}
      {blockTools.map((tool, index) => (
        <button
          key={index}
          className="md-toolbar-btn"
          onClick={() => onInsert(tool.prefix, tool.suffix, tool.placeholder)}
          data-tooltip={tool.label}
        >
          <tool.icon size={16} />
        </button>
      ))}

      {/* Mermaid 下拉菜单 */}
      <div className="md-toolbar-dropdown-container" ref={mermaidMenuRef}>
        <button
          className={`md-toolbar-btn ${showMermaidMenu ? "active" : ""}`}
          onClick={toggleMermaidMenu}
          data-tooltip="插入图表"
        >
          <Workflow size={16} />
        </button>

        {showMermaidMenu && (
          <div className="md-toolbar-dropdown-menu">
            {mermaidPrimaryTemplates.map((template, idx) => (
              <button
                key={idx}
                className="md-toolbar-dropdown-item"
                onClick={() => handleMermaidInsert(template.code)}
              >
                <template.icon size={14} className="mr-2" />
                <span>{template.label}</span>
              </button>
            ))}
            <div className="md-toolbar-dropdown-more" ref={mermaidMoreRef}>
              <button
                type="button"
                className={`md-toolbar-dropdown-item md-toolbar-dropdown-more-btn ${
                  showMermaidMore ? "active" : ""
                }`}
                onClick={() => setShowMermaidMore((prev) => !prev)}
                aria-expanded={showMermaidMore}
              >
                <span>查看更多</span>
                {mermaidSubmenuSide === "left" ? (
                  <ChevronLeft
                    size={12}
                    className="md-toolbar-dropdown-chevron"
                  />
                ) : (
                  <ChevronRight
                    size={12}
                    className="md-toolbar-dropdown-chevron"
                  />
                )}
              </button>
              {showMermaidMore && (
                <div
                  ref={mermaidSubmenuRef}
                  className={`md-toolbar-dropdown-submenu ${
                    mermaidSubmenuSide === "left" ? "is-left" : ""
                  }`}
                >
                  {mermaidMoreTemplates.map((template, idx) => (
                    <button
                      key={idx}
                      className="md-toolbar-dropdown-item"
                      onClick={() => handleMermaidInsert(template.code)}
                    >
                      <template.icon size={14} className="mr-2" />
                      <span>{template.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 图片上传按钮 */}
      <button
        className="md-toolbar-btn"
        onClick={handleImageClick}
        disabled={uploading}
        data-tooltip="上传图片"
        aria-label="上传图片"
      >
        {uploading ? (
          <Loader2 size={16} className="spinning" />
        ) : (
          <Image size={16} />
        )}
      </button>

      {/* Emoji 选择器 */}
      <div className="md-toolbar-dropdown-container" ref={emojiMenuRef}>
        <button
          type="button"
          className={"md-toolbar-btn " + (showEmojiMenu ? "active" : "")}
          onClick={toggleEmojiMenu}
          data-tooltip="插入 Emoji"
          aria-label="插入 Emoji"
          aria-expanded={showEmojiMenu}
          aria-haspopup="dialog"
        >
          <Smile size={16} />
        </button>
        {showEmojiMenu && <EmojiPicker onSelect={onInsertText} />}
      </div>

      {/* 分隔符 */}
      <div className="md-toolbar-divider" />

      {/* 外链转脚注开关 */}
      <button
        className={`md-toolbar-btn md-toolbar-toggle ${linkToFootnote ? "active" : ""}`}
        onClick={toggleLinkToFootnote}
        data-tooltip={linkToFootnote ? "外链转脚注：开启" : "外链转脚注：关闭"}
      >
        <ListEnd size={16} />
      </button>

      {/* 语法帮助 */}
      <SyntaxHelpPopover />

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </div>
  );
}
