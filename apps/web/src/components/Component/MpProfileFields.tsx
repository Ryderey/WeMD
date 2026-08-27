import type { MpProfileValues } from "./mpProfile";

const FIELD_LABELS: Array<{
  key: keyof MpProfileValues;
  label: string;
  required?: boolean;
}> = [
  { key: "mpId", label: "公众号 ID", required: true },
  { key: "nickname", label: "公众号名称", required: true },
  { key: "headimg", label: "公众号头像 URL" },
  { key: "signature", label: "公众号简介" },
];

interface MpProfileFieldsProps {
  values: MpProfileValues;
  onChange: (values: MpProfileValues) => void;
}

export function MpProfileFields({ values, onChange }: MpProfileFieldsProps) {
  const update = (key: keyof MpProfileValues, value: string) =>
    onChange({ ...values, [key]: value });

  return (
    <div className="mp-profile-fields">
      {FIELD_LABELS.map(({ key, label, required }) => (
        <label key={key}>
          <span>
            {label}
            {required && <em> *</em>}
          </span>
          <input
            value={values[key]}
            onChange={(event) => update(key, event.target.value)}
          />
        </label>
      ))}
      <label>
        <span>账号类型</span>
        <select
          value={values.serviceType}
          onChange={(event) => update("serviceType", event.target.value)}
        >
          <option value="1">订阅号</option>
          <option value="2">服务号</option>
        </select>
      </label>
      <label>
        <span>认证状态</span>
        <select
          value={values.verifyStatus}
          onChange={(event) => update("verifyStatus", event.target.value)}
        >
          <option value="0">未认证</option>
          <option value="1">个人认证</option>
          <option value="2">企业认证</option>
        </select>
      </label>
    </div>
  );
}
