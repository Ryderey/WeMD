import { Rss } from "lucide-react";
import type {
  BuiltInComponentDefinition,
  MpProfileValues,
} from "./builtInComponents";

interface ComponentPreviewProps {
  definition: BuiltInComponentDefinition;
  values: Record<string, string>;
}

function parseTags(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.map((item) => String(item ?? ""))
      : [];
  } catch {
    return [];
  }
}

export function ComponentPreview({
  definition,
  values,
}: ComponentPreviewProps) {
  if (definition.name === "MpProfile") {
    const profile = values as MpProfileValues;
    return (
      <div className="mp-profile-preview" aria-label="公众号名片预览">
        {profile.headimg.trim() ? (
          <img src={profile.headimg.trim()} alt="" />
        ) : (
          <Rss size={24} />
        )}
        <div>
          <strong>{profile.nickname || "公众号名称"}</strong>
          <span>{profile.signature || "公众号简介"}</span>
        </div>
      </div>
    );
  }

  if (definition.name === "QRCodeBlock") {
    const requestedSize = Number(values.size);
    const size = Number.isFinite(requestedSize)
      ? Math.min(Math.max(requestedSize, 72), 160)
      : 150;
    const source = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(values.url ?? "")}`;
    return (
      <div className="component-preview qrcode-preview" aria-label="二维码预览">
        <img src={source} alt="QR Code" width={size} height={size} />
        <span>{values.text || "扫码访问"}</span>
      </div>
    );
  }

  if (definition.name === "AuthorBlock") {
    return (
      <div
        className="component-preview author-preview"
        aria-label="作者信息预览"
      >
        {values.avatar ? <img src={values.avatar} alt="" /> : <Rss size={24} />}
        <div>
          <strong>{values.name || "作者名称"}</strong>
          <span>{values.bio || "作者简介"}</span>
        </div>
      </div>
    );
  }

  const color = /^#[\da-f]{6}$/i.test(values.color ?? "")
    ? values.color
    : "#07c160";
  return (
    <div className="component-preview badge-preview" aria-label="标签组预览">
      {parseTags(values.tags ?? "").map((tag, index) => (
        <span
          key={`${tag}-${index}`}
          style={{
            background: `${color}1a`,
            borderColor: `${color}40`,
            color,
          }}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
