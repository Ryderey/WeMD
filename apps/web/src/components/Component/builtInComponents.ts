export type BuiltInComponentName =
  | "MpProfile"
  | "QRCodeBlock"
  | "AuthorBlock"
  | "BadgeGroup";

export interface MpProfileValues extends Record<string, string> {
  mpId: string;
  nickname: string;
  headimg: string;
  signature: string;
  serviceType: "1" | "2";
  verifyStatus: "0" | "1" | "2";
}

export interface ComponentPropDefinition {
  name: string;
  label: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
}

export interface BuiltInComponentDefinition {
  name: BuiltInComponentName;
  description: string;
  props: ComponentPropDefinition[];
  example: string;
  initialValues: Record<string, string>;
}

export const MP_PROFILE_EXAMPLE: MpProfileValues = {
  mpId: "MzIxNjA5ODQ0OQ==",
  nickname: "Doocs",
  headimg:
    "https://cdn-doocs.oss-cn-shenzhen.aliyuncs.com/gh/doocs/md/images/mp-logo.png",
  signature: "GitHub 开源组织",
  serviceType: "1",
  verifyStatus: "1",
};

export const EMPTY_MP_PROFILE: MpProfileValues = {
  mpId: "",
  nickname: "",
  headimg: "",
  signature: "",
  serviceType: "1",
  verifyStatus: "0",
};

export const MP_PROFILE_DEFINITION: BuiltInComponentDefinition = {
  name: "MpProfile",
  description: "公众号名片组件，展示微信公众号名片",
  props: [
    { name: "mpId", label: "公众号 ID", required: true },
    { name: "nickname", label: "公众号名称", required: true },
    { name: "headimg", label: "公众号头像 URL" },
    { name: "signature", label: "公众号简介" },
    {
      name: "serviceType",
      label: "账号类型",
      options: [
        { value: "1", label: "订阅号" },
        { value: "2", label: "服务号" },
      ],
    },
    {
      name: "verifyStatus",
      label: "认证状态",
      options: [
        { value: "0", label: "未认证" },
        { value: "1", label: "个人认证" },
        { value: "2", label: "企业认证" },
      ],
    },
  ],
  example:
    '<MpProfile mpId="MzIxNjA5ODQ0OQ==" nickname="Doocs" headimg="https://cdn-doocs.oss-cn-shenzhen.aliyuncs.com/gh/doocs/md/images/mp-logo.png" signature="GitHub 开源组织" serviceType="1" verifyStatus="1" />',
  initialValues: MP_PROFILE_EXAMPLE,
};

export const BUILT_IN_COMPONENTS: BuiltInComponentDefinition[] = [
  MP_PROFILE_DEFINITION,
  {
    name: "QRCodeBlock",
    description: "二维码组件，将 URL 渲染为可扫描的二维码图片",
    props: [
      { name: "url", label: "二维码内容（URL）", required: true },
      { name: "text", label: "二维码下方提示文字" },
      { name: "size", label: "二维码尺寸（px）" },
    ],
    example:
      '<QRCodeBlock url="https://md.doocs.org" text="扫码访问" size="150" />',
    initialValues: {
      url: "https://md.doocs.org",
      text: "扫码访问",
      size: "150",
    },
  },
  {
    name: "AuthorBlock",
    description: "作者信息组件，展示作者头像、名称和简介",
    props: [
      { name: "name", label: "作者名称", required: true },
      { name: "avatar", label: "头像图片 URL" },
      { name: "bio", label: "作者简介" },
    ],
    example:
      '<AuthorBlock name="yanglbme" avatar="https://avatars.githubusercontent.com/u/21008209?v=4" bio="Doocs 创建者" />',
    initialValues: {
      name: "yanglbme",
      avatar: "https://avatars.githubusercontent.com/u/21008209?v=4",
      bio: "Doocs 创建者",
    },
  },
  {
    name: "BadgeGroup",
    description: "标签组组件，展示一组彩色标签",
    props: [
      { name: "tags", label: "JSON 字符串数组，标签列表", required: true },
      { name: "color", label: "标签主色调（hex）" },
    ],
    example: `<BadgeGroup tags='["Vue 3","TypeScript","Vite","Tailwind CSS"]' color="#07c160" />`,
    initialValues: {
      tags: '["Vue 3","TypeScript","Vite","Tailwind CSS"]',
      color: "#07c160",
    },
  },
];

function escapeSnippetValue(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function buildComponentSnippet(
  definition: BuiltInComponentDefinition,
  values: Record<string, string>,
): string {
  const attributes = definition.props.flatMap((prop) => {
    const value = values[prop.name]?.trim() ?? "";
    if (!value && !prop.required) return [];
    return `${prop.name}="${escapeSnippetValue(value)}"`;
  });
  return `<${definition.name}${attributes.length ? ` ${attributes.join(" ")}` : ""} />`;
}

export function missingRequiredProps(
  definition: BuiltInComponentDefinition,
  values: Record<string, string>,
): string[] {
  return definition.props
    .filter((prop) => prop.required && !values[prop.name]?.trim())
    .map((prop) => prop.label);
}
