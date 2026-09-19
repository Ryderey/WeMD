import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ChevronDown, ChevronUp, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";
import { SCROLL_IMAGE_MAX_IMAGES } from "@wemd/core";

import {
  exceedsImageUploadLimit,
  formatByteCount,
  formatTotalUploadSize,
  resolveImageUploadLimit,
} from "../../services/image/imageUploadLimits";
import {
  getStoredImageHostConfig,
  uploadEditorImage,
} from "../../services/image/imageUploadFlow";
import { Modal } from "../common/Modal";
import {
  scrollImageFileKey,
  type ScrollImageSelection,
} from "./scrollImageSelection";
import "./ScrollImageDialog.css";

const DEFAULT_HEIGHT = 320;
const MIN_HEIGHT = 160;
const MAX_HEIGHT = 800;
const HEIGHT_PRESETS = [240, 320, 420];

type ScrollImageDirection = "vertical" | "horizontal";

interface ScrollImageDialogProps {
  items: ScrollImageSelection[];
  onAddFiles: () => void;
  onRemove: (index: number) => void;
  onMove: (index: number, delta: number) => void;
  onCancel: () => void;
  onInsert: (markdown: string) => void;
}

type ItemUploadStatus = "uploading" | "uploaded" | "failed";

interface ItemUploadState {
  status: ItemUploadStatus;
  url?: string;
  error?: string;
}

interface ImageSize {
  width: number;
  height: number;
}

const parseHeight = (value: string): number | null => {
  if (!/^\d+$/.test(value)) return null;
  const height = Number(value);
  return height >= MIN_HEIGHT && height <= MAX_HEIGHT ? height : null;
};

const escapeAltText = (fileName: string) =>
  fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/]/g, "\\]");

const escapeDestination = (url: string) =>
  url
    .replace(/</g, "%3C")
    .replace(/>/g, "%3E")
    .replace(/\s/g, (character) => encodeURIComponent(character));

const buildScrollImageMarkdown = (
  images: { fileName: string; url: string }[],
  height: number,
  direction: ScrollImageDirection,
) => {
  const directionSuffix = direction === "horizontal" ? " horizontal" : "";
  const body = images
    .map(
      ({ fileName, url }) =>
        `![${escapeAltText(fileName)}](<${escapeDestination(url)}>)`,
    )
    .join("\n\n");

  return `\n::: scroll-image ${height}${directionSuffix}\n${body}\n:::\n`;
};

export function ScrollImageDialog({
  items,
  onAddFiles,
  onRemove,
  onMove,
  onCancel,
  onInsert,
}: ScrollImageDialogProps) {
  const [heightInput, setHeightInput] = useState(String(DEFAULT_HEIGHT));
  const [direction, setDirection] = useState<ScrollImageDirection>("vertical");
  const [uploading, setUploading] = useState(false);
  const [uploadStates, setUploadStates] = useState<
    Record<string, ItemUploadState>
  >({});
  const [imageSizes, setImageSizes] = useState<Record<string, ImageSize>>({});
  const previewRef = useRef<HTMLDivElement>(null);
  const height = parseHeight(heightInput);
  const isHorizontal = direction === "horizontal";
  const limit = resolveImageUploadLimit(getStoredImageHostConfig());

  const entries = items.map((item) => ({
    item,
    key: scrollImageFileKey(item.file),
  }));
  const overLimitKeys = new Set(
    entries
      .filter(({ item }) => exceedsImageUploadLimit(item.file.size, limit))
      .map(({ key }) => key),
  );
  const uploadedCount = entries.filter(
    ({ key }) => uploadStates[key]?.status === "uploaded",
  ).length;
  const failedCount = entries.filter(
    ({ key }) => uploadStates[key]?.status === "failed",
  ).length;
  const totalBytes = items.reduce((sum, item) => sum + item.file.size, 0);
  const hasOverLimit = overLimitKeys.size > 0;
  const submitDisabled =
    height === null || uploading || hasOverLimit || items.length === 0;

  const contentHint = (() => {
    if (entries.some(({ key }) => !imageSizes[key])) {
      return "正在读取图片尺寸…";
    }
    if (isHorizontal) {
      const totalWidth = entries.reduce((sum, { key }) => {
        const size = imageSizes[key];
        if (size.width <= 0 || size.height <= 0) return sum;
        return (
          sum +
          Math.round((size.width / size.height) * (height ?? DEFAULT_HEIGHT))
        );
      }, 0);
      return `内容总宽约 ${formatByteCount(totalWidth)} px · ${items.length} 张`;
    }
    const previewWidth = previewRef.current?.clientWidth ?? 0;
    if (previewWidth <= 0) return `共 ${items.length} 张图片`;
    const totalHeight = entries.reduce((sum, { key }) => {
      const size = imageSizes[key];
      if (size.width <= 0) return sum;
      return sum + Math.round((size.height / size.width) * previewWidth);
    }, 0);
    return `内容总高约 ${formatByteCount(totalHeight)} px · ${items.length} 张`;
  })();

  const handleDirectionChange = (nextDirection: ScrollImageDirection) => {
    setDirection(nextDirection);
    if (previewRef.current) {
      previewRef.current.scrollTop = 0;
      previewRef.current.scrollLeft = 0;
    }
  };

  const handleImageLoad = (
    key: string,
    event: React.SyntheticEvent<HTMLImageElement>,
  ) => {
    const element = event.currentTarget;
    const nextSize = {
      width: element.naturalWidth,
      height: element.naturalHeight,
    };
    setImageSizes((prev) => {
      const current = prev[key];
      if (
        current &&
        current.width === nextSize.width &&
        current.height === nextSize.height
      ) {
        return prev;
      }
      return { ...prev, [key]: nextSize };
    });
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
    if (height === null || uploading || hasOverLimit) return;

    const pending = entries.filter(
      ({ key }) => uploadStates[key]?.status !== "uploaded",
    );
    const nextStates: Record<string, ItemUploadState> = { ...uploadStates };

    if (pending.length > 0) {
      setUploading(true);
      for (const { item, key } of pending) {
        nextStates[key] = { status: "uploading" };
        setUploadStates({ ...nextStates });
        try {
          const result = await uploadEditorImage(item.file, {
            skipCompression: true,
          });
          nextStates[key] = { status: "uploaded", url: result.url };
        } catch (error) {
          nextStates[key] = {
            status: "failed",
            error: error instanceof Error ? error.message : "上传失败",
          };
        }
        setUploadStates({ ...nextStates });
      }
      setUploading(false);
    }

    const failedEntry = entries.find(
      ({ key }) => nextStates[key]?.status !== "uploaded",
    );
    if (failedEntry) {
      const failedIndex = entries.indexOf(failedEntry);
      toast.error(
        `第 ${failedIndex + 1} 张（${failedEntry.item.file.name}）上传失败：${nextStates[failedEntry.key].error}`,
      );
      return;
    }

    onInsert(
      buildScrollImageMarkdown(
        entries.map(({ item, key }) => ({
          fileName: item.file.name,
          url: nextStates[key].url ?? "",
        })),
        height,
        direction,
      ),
    );
    toast.success(
      items.length > 1
        ? `已插入 ${items.length} 张滚动长图`
        : "滚动长图上传成功",
    );
  };

  const renderPreviewImages = () =>
    entries.map(({ item, key }) => (
      <img
        key={key}
        src={item.url}
        alt={`${item.file.name} 预览`}
        onLoad={(event) => handleImageLoad(key, event)}
      />
    ));

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
            ? "图片将按展示高度等比缩放，读者可左右滑动依次查看多张长图。"
            : "图片将在固定高度区域中依次展示，读者可上下滑动查看完整内容。"}
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
          {isHorizontal ? (
            <div className="scroll-image-dialog-track">
              {renderPreviewImages()}
            </div>
          ) : (
            renderPreviewImages()
          )}
        </div>
        <p className="scroll-image-dialog-hint">
          {isHorizontal ? "↔ 左右滑动查看完整图片" : "↕ 上下滑动查看完整图片"}
        </p>
        <p className="scroll-image-dialog-content-hint">{contentHint}</p>

        <fieldset className="scroll-image-list-fieldset" disabled={uploading}>
          <legend>
            已选图片（{items.length}/{SCROLL_IMAGE_MAX_IMAGES}）
          </legend>
          <ul className="scroll-image-file-list" aria-label="已选图片列表">
            {entries.map(({ item, key }, index) => {
              const state = uploadStates[key];
              const isOverLimit = overLimitKeys.has(key);
              return (
                <li
                  key={key}
                  className={`scroll-image-file-item${isOverLimit ? " is-invalid" : ""}`}
                >
                  <span className="scroll-image-file-index">{index + 1}</span>
                  <img
                    className="scroll-image-file-thumb"
                    src={item.url}
                    alt={`${item.file.name} 缩略图`}
                  />
                  <div className="scroll-image-file-info">
                    <span
                      className="scroll-image-file-name"
                      title={item.file.name}
                    >
                      {item.file.name}
                    </span>
                    <span className="scroll-image-file-meta">
                      {formatByteCount(item.file.size)} 字节
                      {state?.status === "uploading" && " · 上传中…"}
                      {state?.status === "uploaded" && " · 已上传"}
                      {!state && " · 待上传"}
                    </span>
                    {isOverLimit && (
                      <span className="scroll-image-file-error">
                        {item.file.name}：{formatByteCount(item.file.size)}{" "}
                        字节，超过 {formatByteCount(limit.limitBytes)}{" "}
                        字节上限，请先自行压缩或拆分后重选
                      </span>
                    )}
                    {state?.status === "failed" && (
                      <span className="scroll-image-file-error">
                        {item.file.name}：上传失败，{state.error}
                      </span>
                    )}
                  </div>
                  <div className="scroll-image-file-actions">
                    <button
                      type="button"
                      aria-label={`上移第 ${index + 1} 张`}
                      onClick={() => onMove(index, -1)}
                      disabled={uploading || index === 0}
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label={`下移第 ${index + 1} 张`}
                      onClick={() => onMove(index, 1)}
                      disabled={uploading || index === entries.length - 1}
                    >
                      <ChevronDown size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label={`移除第 ${index + 1} 张`}
                      onClick={() => onRemove(index)}
                      disabled={uploading}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="scroll-image-list-footer">
            <button
              type="button"
              className="scroll-image-dialog-secondary"
              onClick={onAddFiles}
              disabled={uploading || items.length >= SCROLL_IMAGE_MAX_IMAGES}
            >
              {items.length >= SCROLL_IMAGE_MAX_IMAGES
                ? `已达 ${SCROLL_IMAGE_MAX_IMAGES} 张上限`
                : "继续添加"}
            </button>
            <span className="scroll-image-list-total">
              合计 {formatTotalUploadSize(totalBytes)}
            </span>
          </div>
        </fieldset>

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
          {(uploading || uploadedCount > 0) && (
            <span className="scroll-image-dialog-progress" role="status">
              已上传 {uploadedCount}/{items.length}
            </span>
          )}
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
            disabled={submitDisabled}
          >
            {uploading ? (
              <>
                <Loader2 size={16} className="spinning" />
                正在上传
              </>
            ) : failedCount > 0 ? (
              "重试失败项"
            ) : uploadedCount === items.length ? (
              "插入"
            ) : (
              "上传并插入"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
