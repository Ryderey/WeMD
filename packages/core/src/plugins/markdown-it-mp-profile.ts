import type MarkdownIt from "markdown-it";
import type Token from "markdown-it/lib/token";

interface MpProfileProps {
  mpId: string;
  nickname: string;
  headimg: string;
  signature: string;
  serviceType: "1" | "2";
  verifyStatus: "0" | "1" | "2";
}

const ATTRIBUTE_PATTERN = /([\w-]+)=(?:"([^"]*)"|'([^']*)')/g;
const MP_PROFILE_NAMES = new Set([
  "mpId",
  "nickname",
  "headimg",
  "signature",
  "serviceType",
  "verifyStatus",
]);

function parseMpProfile(
  source: string,
  unescape: (text: string) => string,
): MpProfileProps | null {
  const match = source.match(/^<MpProfile(?:\s+([\s\S]*?))?\s*\/>$/);
  if (!match) return null;

  const attributes = match[1] ?? "";
  const props: Record<string, string> = {};
  let consumed = "";

  for (const attribute of attributes.matchAll(ATTRIBUTE_PATTERN)) {
    const [raw, name, doubleQuoted, singleQuoted] = attribute;
    if (!MP_PROFILE_NAMES.has(name) || name in props) {
      return null;
    }
    consumed += raw;
    props[name] = unescape(doubleQuoted ?? singleQuoted ?? "");
  }

  if (consumed.replace(/\s/g, "") !== attributes.replace(/\s/g, "")) {
    return null;
  }
  const mpId = props.mpId;
  const nickname = props.nickname;
  const serviceType = props.serviceType ?? "1";
  const verifyStatus = props.verifyStatus ?? "0";
  if (!mpId || !nickname) return null;
  if (serviceType !== "1" && serviceType !== "2") {
    return null;
  }
  if (verifyStatus !== "0" && verifyStatus !== "1" && verifyStatus !== "2") {
    return null;
  }

  return {
    mpId,
    nickname,
    headimg: props.headimg ?? "",
    signature: props.signature ?? "",
    serviceType,
    verifyStatus,
  };
}

function isMpProfileProps(value: unknown): value is MpProfileProps {
  if (typeof value !== "object" || value === null) return false;
  const props = value as Record<string, unknown>;
  return (
    typeof props.mpId === "string" &&
    typeof props.nickname === "string" &&
    typeof props.headimg === "string" &&
    typeof props.signature === "string" &&
    (props.serviceType === "1" || props.serviceType === "2") &&
    (props.verifyStatus === "0" ||
      props.verifyStatus === "1" ||
      props.verifyStatus === "2")
  );
}

export default function markdownItMpProfile(md: MarkdownIt): void {
  md.block.ruler.before(
    "html_block",
    "mp-profile",
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
      const props = parseMpProfile(source, md.utils.unescapeAll);
      if (!props) return false;
      if (silent) return true;

      const token = state.push("mp_profile", "section", 0);
      token.block = true;
      token.meta = props;
      state.line = startLine + 1;
      return true;
    },
  );

  md.renderer.rules.mp_profile = (tokens: Token[], index: number): string => {
    const props = tokens[index].meta;
    if (!isMpProfileProps(props)) return "";
    const escape = md.utils.escapeHtml;

    return (
      '<section class="mp_profile_iframe_wrp custom_select_card_wrp" nodeleaf="">\n' +
      '  <mp-common-profile class="mpprofile js_uneditable custom_select_card mp_profile_iframe" data-pluginname="mpprofile"' +
      ` data-id="${escape(props.mpId)}"` +
      ` data-nickname="${escape(props.nickname)}"` +
      ` data-headimg="${escape(props.headimg)}"` +
      ` data-signature="${escape(props.signature)}"` +
      ` data-service_type="${props.serviceType}"` +
      ` data-verify_status="${props.verifyStatus}"></mp-common-profile>\n` +
      '  <br class="ProseMirror-trailingBreak">\n' +
      "</section>\n"
    );
  };
}
