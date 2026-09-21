# Error Handling

> How errors are handled in this project.

---

## Overview

<!--
Document your project's error handling conventions here.

Questions to answer:
- What error types do you define?
- How are errors propagated?
- How are errors logged?
- How are errors returned to clients?
-->

(To be filled by the team)

---

## Error Types

<!-- Custom error classes/types -->

(To be filled by the team)

---

## Error Handling Patterns

<!-- Try-catch patterns, error propagation -->

(To be filled by the team)

---

## API Error Responses

<!-- Standard error response format -->

(To be filled by the team)

## Scenario: WeChat IP allowlist rejection

### 1. Scope / Trigger

When `WechatImageService` receives WeChat error code `40164` while acquiring
an access token, the image-host settings UI needs the server's egress IPv4 so
the operator can add it to the WeChat allowlist.

### 2. Signatures

- Upstream response: `{ errcode: 40164, errmsg: string }`
- Backend response: `502` with a Nest error `message`

### 3. Contracts

If `errmsg` contains a valid IPv4, append only that IP to the backend message:

`获取微信 access token 失败 (40164)：服务器出口 IP <IPv4> 未加入白名单`

The web client already displays this `message`; it must not parse the raw
WeChat response.

### 4. Validation & Error Matrix

| Condition                 | Returned message                              |
| ------------------------- | --------------------------------------------- |
| `40164` with a valid IPv4 | Include the fixed allowlist guidance and IPv4 |
| `40164` without an IPv4   | Keep the code-only message                    |
| Any other upstream code   | Keep the code-only message                    |

### 5. Good/Base/Bad Cases

- Good: `invalid ip 203.0.113.10 not in whitelist` exposes only
  `203.0.113.10`.
- Base: a `40164` response without an IPv4 remains a normal gateway error.
- Bad: returning the entire upstream `errmsg` can expose credentials, tokens,
  or unrelated diagnostics.

### 6. Tests Required

The `WechatImageService` spec must verify that a `40164` response shows the
IPv4 and excludes trailing raw details, and that another error code does not
append an IP.

### 7. Wrong vs Correct

#### Wrong

```ts
throw new BadGatewayException(`${prefix}: ${response.errmsg}`);
```

#### Correct

```ts
const ip = errcode === 40164 ? ipv4Address(response.errmsg) : undefined;
return new BadGatewayException(
  `${prefix}${ip ? `：服务器出口 IP ${ip} 未加入白名单` : ""}`,
);
```

---

## Scenario: WeChat size rejection (40009)

### 1. Scope / Trigger

`WechatImageService.upload` gets WeChat error code `40009` even though our own
byte checks passed. The caller must be able to tell "rejected by this service"
from "rejected upstream" without reading raw WeChat codes.

### 2. Signatures

- Upstream response: `{ errcode: 40009, errmsg: string }`
- Backend response: `502` with
  `微信图片上传失败 (40009)：微信判定图片尺寸或大小超限`

### 3. Contracts

- Local size rejection stays `413` with
  `微信公众号图片必须小于 1,000,000 字节`（byte count in the message；decimal
  WeChat limit, see `WECHAT_IMAGE_MAX_BYTES`）。
- On the multipart HTTP path multer rejects `fileSize >= WECHAT_IMAGE_MAX_BYTES`
  first (busboy emits `limit` when the size equals the limit), so the service's
  own `validateFile` size check is a defense layer — do not assume its message
  is reachable over HTTP.
- Never append the raw upstream `errmsg`.

### 4. Validation & Error Matrix

| Condition   | Returned message                       |
| ----------- | -------------------------------------- |
| `40009`     | Include the fixed size guidance suffix |
| Other codes | Keep the code-only message (unchanged) |

### 6. Tests Required

The `WechatImageService` spec must assert the `40009` message and that the
upstream `errmsg` is not included.

---

## Common Mistakes

<!-- Error handling mistakes your team has made -->

(To be filled by the team)
