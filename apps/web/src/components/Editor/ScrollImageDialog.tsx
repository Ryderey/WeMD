import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import {
  WECHAT_IMAGE_MAX_SIZE_BYTES,
  formatImageSize,
} from "../../services/image/autoCompressImage";
import { uploadEditorImage } from "../../services/image/imageUploadFlow";
import { Modal } from "../common/Modal";
import "./ScrollImageDialog.css";

const DEFAULT_HEIGHT = 320;
const MIN_HEIGHT = 160;
const MAX_HEIGHT = 800;
const HEIGHT_PRESETS = [240, 320, 420];

type ScrollImageDirection = "vertical" | "horizontal";

interface ScrollImageDialogProps {
  file: File;
  previewUrl: string;
  onCancel: () => void;
  onInsert: (markdown: string) => void;
}

const parseHeight = (value: string): number | null => {
  if (!/^\d+$/.test(value)) return null;
  const height = Number(value);
  return height >= MIN_HEIGHT && height <= MAX_HEIGHT ? height : null;
};

const buildScrollImageMarkdown = (
  fileName: string,
  url: string,
  height: number,
  direction: ScrollImageDirection,
) => {
  const alt = fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/]/g, "\\]");
  const destination = url
    .replace(/</g, "%3C")
    .replace(/>/g, "%3E")
    .replace(/\s/g, (character) => encodeURIComponent(character));
  const directionSuffix = direction === "horizontal" ? " horizontal" : "";

  return `\n::: scroll-image ${height}${directionSuffix}\n![${alt}](<${destination}>)\n:::\n`;
};

export function ScrollImageDialog({
  file,
  previewUrl,
  onCancel,
  onInsert,
}: ScrollImageDialogProps) {
  const [heightInput, setHeightInput] = useState(String(DEFAULT_HEIGHT));
  const [direction, setDirection] = useState<ScrollImageDirection>("vertical");
  const [uploading, setUploading] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const height = parseHeight(heightInput);
  const isHorizontal = direction === "horizontal";

  useEffect(() => {
    setHeightInput(String(DEFAULT_HEIGHT));
    setDirection("vertical");
    setUploading(false);
  }, [file]);

  const handleDirectionChange = (nextDirection: ScrollImageDirection) => {
    setDirection(nextDirection);
    if (previewRef.current) {
      previewRef.current.scrollTop = 0;
      previewRef.current.scrollLeft = 0;
    }
  };

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !uploading) onCancel();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onCancel, uploading]);

  const handleClose = () => {
    if (!uploading) onCancel();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (height === null || uploading) return;

    setUploading(true);
    const needAutoCompress = file.size > WECHAT_IMAGE_MAX_SIZE_BYTES;
    const loadingToastId = toast.loading(
      needAutoCompress ? "正在压缩并上传滚动长图..." : "正在上传滚动长图...",
    );

    try {
      const result = await uploadEditorImage(file, {
        compressionOptions: { maxSizeBytes: WECHAT_IMAGE_MAX_SIZE_BYTES },
      });
      onInsert(
        buildScrollImageMarkdown(file.name, result.url, height, direction),
      );

      const successMessage = result.compressed
        ? `滚动长图上传成功（已自动压缩 ${formatImageSize(
            result.originalSize,
          )} -> ${formatImageSize(result.finalSize)}）`
        : "滚动长图上传成功";
      toast.success(successMessage);
    } catch (error) {
      console.error("滚动长图上传失败:", error);
      toast.error(error instanceof Error ? error.message : "滚动长图上传失败");
      setUploading(false);
    } finally {
      toast.dismiss(loadingToastId);
    }
  };

  return (
    <Modal
      open
      onClose={handleClose}
      title="滚动长图"
      className="scroll-image-dialog"
    >
      <form
        className="scroll-image-dialog-content"
        onSubmit={handleSubmit}
        role="dialog"
        aria-label="滚动长图设置"
      >
        <p className="scroll-image-dialog-description">
          {isHorizontal
            ? "图片将按展示高度等比缩放，读者可左右滑动查看完整内容。"
            : "图片将在固定高度区域中展示，读者可上下滑动查看完整内容。"}
        </p>

        <fieldset
          className="scroll-image-direction-fieldset"
          disabled={uploading}
        >
          <legend>滚动方向</legend>
          <div className="scroll-image-direction-options">
            <label>
              <input
                type="radio"
                name="scroll-image-direction"
                value="vertical"
                checked={direction === "vertical"}
                onChange={() => handleDirectionChange("vertical")}
              />
              纵向（上下滑动）
            </label>
            <label>
              <input
                type="radio"
                name="scroll-image-direction"
                value="horizontal"
                checked={direction === "horizontal"}
                onChange={() => handleDirectionChange("horizontal")}
              />
              横向（左右滑动）
            </label>
          </div>
        </fieldset>

        <div
          ref={previewRef}
          className={`scroll-image-dialog-preview${isHorizontal ? " is-horizontal" : ""}`}
          style={{ height: height ?? DEFAULT_HEIGHT }}
          tabIndex={0}
          aria-label={
            isHorizontal
              ? "滚动长图预览，可左右滚动"
              : "滚动长图预览，可上下滚动"
          }
        >
          <img src={previewUrl} alt={`${file.name} 预览`} />
        </div>
        <p className="scroll-image-dialog-hint">
          {isHorizontal ? "↔ 左右滑动查看完整图片" : "↕ 上下滑动查看完整图片"}
        </p>

        <fieldset className="scroll-image-height-fieldset" disabled={uploading}>
          <legend>展示高度</legend>
          <div className="scroll-image-height-controls">
            <div className="scroll-image-presets" aria-label="高度预设">
              {HEIGHT_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={height === preset ? "active" : ""}
                  onClick={() => setHeightInput(String(preset))}
                >
                  {preset}px
                </button>
              ))}
            </div>
            <label className="scroll-image-custom-height">
              自定义
              <input
                type="number"
                min={MIN_HEIGHT}
                max={MAX_HEIGHT}
                step={1}
                value={heightInput}
                onChange={(event) => setHeightInput(event.target.value)}
                aria-describedby="scroll-image-height-help"
              />
              px
            </label>
          </div>
          <span
            id="scroll-image-height-help"
            className={height === null ? "scroll-image-height-error" : ""}
          >
            {height === null
              ? `请输入 ${MIN_HEIGHT}–${MAX_HEIGHT} 之间的整数`
              : `可设置 ${MIN_HEIGHT}–${MAX_HEIGHT}px`}
          </span>
        </fieldset>

        <div className="scroll-image-dialog-actions">
          <button
            type="button"
            className="scroll-image-dialog-secondary"
            onClick={handleClose}
            disabled={uploading}
          >
            取消
          </button>
          <button
            type="submit"
            className="scroll-image-dialog-primary"
            disabled={height === null || uploading}
          >
            {uploading ? (
              <>
                <Loader2 size={16} className="spinning" />
                正在上传
              </>
            ) : (
              "上传并插入"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
