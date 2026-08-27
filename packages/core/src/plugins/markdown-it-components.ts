import type MarkdownIt from "markdown-it";
import type Token from "markdown-it/lib/token";

type BuiltInComponentName =
  | "MpProfile"
  | "QRCodeBlock"
  | "AuthorBlock"
  | "BadgeGroup";

interface ParsedComponent {
  name: BuiltInComponentName;
  props: Record<string, string>;
}

const ATTRIBUTE_PATTERN = /([\w-]+)=(?:"([^"]*)"|'([^']*)')/g;
const COMPONENT_PROPS: Record<BuiltInComponentName, Set<string>> = {
  MpProfile: new Set([
    "mpId",
    "nickname",
    "headimg",
    "signature",
    "serviceType",
    "verifyStatus",
  ]),
  QRCodeBlock: new Set(["url", "text", "size"]),
  AuthorBlock: new Set(["name", "avatar", "bio"]),
  BadgeGroup: new Set(["tags", "color"]),
};

function isBuiltInComponentName(value: string): value is BuiltInComponentName {
  return Object.prototype.hasOwnProperty.call(COMPONENT_PROPS, value);
}

function parseComponent(
  source: string,
  unescape: (text: string) => string,
): ParsedComponent | null {
  const match = source.match(/^<([A-Z][\w]*)(?:\s+([\s\S]*?))?\s*\/>$/);
  if (!match || !isBuiltInComponentName(match[1])) return null;

  const name = match[1];
  const attributes = match[2] ?? "";
  const props: Record<string, string> = {};
  let consumed = "";

  for (const attribute of attributes.matchAll(ATTRIBUTE_PATTERN)) {
    const [raw, propName, doubleQuoted, singleQuoted] = attribute;
    if (!COMPONENT_PROPS[name].has(propName) || propName in props) return null;
    consumed += raw;
    props[propName] = unescape(doubleQuoted ?? singleQuoted ?? "");
  }

  if (consumed.replace(/\s/g, "") !== attributes.replace(/\s/g, "")) {
    return null;
  }
  return { name, props };
}

function renderMpProfile(
  props: Record<string, string>,
  escape: (text: string) => string,
): string {
  const mpId = props.mpId;
  const nickname = props.nickname;
  const serviceType = props.serviceType ?? "1";
  const verifyStatus = props.verifyStatus ?? "0";
  if (!mpId || !nickname) return "";
  if (serviceType !== "1" && serviceType !== "2") return "";
  if (!["0", "1", "2"].includes(verifyStatus)) return "";

  return (
    '<section class="mp_profile_iframe_wrp custom_select_card_wrp" data-wemd-component="MpProfile" nodeleaf="">\n' +
    '  <mp-common-profile class="mpprofile js_uneditable custom_select_card mp_profile_iframe" data-pluginname="mpprofile"' +
    ` data-id="${escape(mpId)}"` +
    ` data-nickname="${escape(nickname)}"` +
    ` data-headimg="${escape(props.headimg ?? "")}"` +
    ` data-signature="${escape(props.signature ?? "")}"` +
    ` data-service_type="${serviceType}"` +
    ` data-verify_status="${verifyStatus}"></mp-common-profile>\n` +
    '  <br class="ProseMirror-trailingBreak">\n' +
    "</section>\n"
  );
}

function renderQrCode(
  props: Record<string, string>,
  escape: (text: string) => string,
): string {
  const size = /^\d+(?:\.\d+)?$/.test(props.size ?? "") ? props.size : "150";
  const text = props.text ?? "扫码访问";

  return (
    '<section data-wemd-component="QRCodeBlock" style="text-align: center; margin: 20px auto; padding: 16px 0;">\n' +
    `  <img src="https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&amp;data=${escape(props.url ?? "")}" alt="QR Code" style="width: ${size}px; height: ${size}px; display: block; margin: 0 auto; border-radius: 4px;">\n` +
    `  <p style="text-align: center; font-size: 14px; color: var(--md-comp-text-tertiary, #999); margin-top: 8px; margin-bottom: 0;">${escape(text)}</p>\n` +
    "</section>\n"
  );
}

function renderAuthor(
  props: Record<string, string>,
  escape: (text: string) => string,
): string {
  const name = escape(props.name ?? "");

  return (
    '<section data-wemd-component="AuthorBlock" style="display: table; width: 100%; padding: 16px 0; margin: 16px 0; box-sizing: border-box;">\n' +
    '  <section style="display: table-cell; vertical-align: middle; width: 64px;">\n' +
    `    <img src="${escape(props.avatar ?? "")}" alt="${name}" style="width: 56px; height: 56px; border-radius: 50%; display: block;">\n` +
    "  </section>\n" +
    '  <section style="display: table-cell; vertical-align: middle; padding-left: 12px;">\n' +
    `    <p style="margin: 0 0 4px; font-size: 15px; font-weight: bold; color: var(--md-comp-text-primary, #333);">${name}</p>\n` +
    `    <p style="margin: 0; font-size: 13px; color: var(--md-comp-text-tertiary, #999); line-height: 1.5;">${escape(props.bio ?? "")}</p>\n` +
    "  </section>\n" +
    "</section>\n"
  );
}

function renderBadgeGroup(
  props: Record<string, string>,
  escape: (text: string) => string,
): string {
  let tags: unknown[] = [];
  try {
    const parsed: unknown = JSON.parse(props.tags);
    if (Array.isArray(parsed)) tags = parsed;
  } catch {
    // Invalid JSON renders an empty group, matching the reference component.
  }
  const color = /^#[\da-f]{6}$/i.test(props.color ?? "")
    ? props.color
    : "#07c160";
  const badges = tags
    .map(
      (tag) =>
        `<span style="display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 13px; font-weight: 500; background: ${color}1a; color: ${color}; border: 1px solid ${color}40;">${escape(String(tag ?? ""))}</span>`,
    )
    .join("");

  return `<section data-wemd-component="BadgeGroup" style="display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0;">\n${badges}\n</section>\n`;
}

const RENDERERS: Record<
  BuiltInComponentName,
  (props: Record<string, string>, escape: (text: string) => string) => string
> = {
  MpProfile: renderMpProfile,
  QRCodeBlock: renderQrCode,
  AuthorBlock: renderAuthor,
  BadgeGroup: renderBadgeGroup,
};

function isParsedComponent(value: unknown): value is ParsedComponent {
  if (typeof value !== "object" || value === null) return false;
  const component = value as Record<string, unknown>;
  return (
    typeof component.name === "string" &&
    isBuiltInComponentName(component.name) &&
    typeof component.props === "object" &&
    component.props !== null
  );
}

export default function markdownItComponents(md: MarkdownIt): void {
  md.block.ruler.before(
    "html_block",
    "built-in-component",
    (state, startLine, endLine, silent) => {
      if (
        startLine + 1 > endLine ||
        state.sCount[startLine] - state.blkIndent > 3
      ) {
        return false;
      }

      const source = state
        .getLines(startLine, startLine + 1, state.blkIndent, false)
        .trim();
      const component = parseComponent(source, md.utils.unescapeAll);
      if (!component) return false;
      if (silent) return true;

      const token = state.push("built_in_component", "section", 0);
      token.block = true;
      token.meta = component;
      state.line = startLine + 1;
      return true;
    },
  );

  md.renderer.rules.built_in_component = (
    tokens: Token[],
    index: number,
  ): string => {
    const component = tokens[index].meta;
    if (!isParsedComponent(component)) return "";
    return RENDERERS[component.name](component.props, md.utils.escapeHtml);
  };
}
