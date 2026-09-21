#!/usr/bin/env node
// 微信图床大小边界探针：生成精确字节数的合法 PNG，直连 <base>/wechat-images 上传并记录 HTTP 状态与响应体。
//
// 用法：
//   node probe-image-limit.mjs --base http://localhost:4000/api --key <WECHAT_UPLOAD_KEY>
//   node probe-image-limit.mjs --key-file apps/server/.env        # 密钥从 .env 读取，不进命令行
//   node probe-image-limit.mjs --sizes 949000,999000 --out out.md
//
// 说明：本脚本生成的 PNG 是合法图片（1x1 灰度 + 用于定长的 tEXt 文本块），
// 只验证字节口径，不验证像素内容。带真实凭据运行时才会真正打到微信。

import { readFileSync, writeFileSync } from 'node:fs';
import zlib from 'node:zlib';

const DEFAULT_SIZES = [949000, 999000, 1000000, 1001000, 1048000, 1048576];

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const key = process.argv[i];
  if (!key.startsWith('--')) {
    console.error(`无法解析参数: ${key}`);
    process.exit(2);
  }
  args.set(key.slice(2), process.argv[i + 1] ?? '');
  i += 1;
}

const base = (args.get('base') ?? 'http://localhost:4000/api').replace(/\/+$/, '');
const sizes = (args.get('sizes') ?? DEFAULT_SIZES.join(','))
  .split(',')
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isInteger(value) && value > 0);
const outPath = args.get('out');

if (sizes.length === 0) {
  console.error('没有可用的字节数列表');
  process.exit(2);
}

function readKey() {
  const direct = args.get('key');
  if (direct) return direct;
  const file = args.get('key-file') ?? 'apps/server/.env';
  const line = readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .find((l) => l.startsWith('WECHAT_UPLOAD_KEY='));
  if (!line) throw new Error(`${file} 中没有 WECHAT_UPLOAD_KEY`);
  return line.slice('WECHAT_UPLOAD_KEY='.length).trim();
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'latin1');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(Buffer.concat([typeBuf, data])) >>> 0);
  return Buffer.concat([length, typeBuf, data, crc]);
}

function makeExactPng(targetBytes) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(2, 0); // width
  ihdrData.writeUInt32BE(2, 4); // height
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 0; // grayscale
  const ihdr = pngChunk('IHDR', ihdrData);
  const raw = Buffer.from([0x00, 0x11, 0x22, 0x00, 0x33, 0x44]);
  const idat = pngChunk('IDAT', zlib.deflateSync(raw));
  const iend = pngChunk('IEND', Buffer.alloc(0));
  const keyword = Buffer.from('Comment\0', 'latin1');
  const baseLength = signature.length + ihdr.length + idat.length + iend.length;
  const textLength = targetBytes - baseLength - (12 + keyword.length);
  if (textLength < 0) throw new Error(`目标 ${targetBytes} 字节太小，装不下 PNG 结构`);
  const text = pngChunk('tEXt', Buffer.concat([keyword, Buffer.alloc(textLength, 0x41)]));
  const png = Buffer.concat([signature, ihdr, idat, text, iend]);
  if (png.length !== targetBytes) {
    throw new Error(`生成 ${png.length} 字节，期望 ${targetBytes}`);
  }
  return png;
}

async function probe(key, size) {
  const png = makeExactPng(size);
  const form = new FormData();
  form.append('file', new Blob([png], { type: 'image/png' }), `probe-${size}.png`);
  const startedAt = Date.now();
  let status = 0;
  let body = '';
  try {
    const response = await fetch(`${base}/wechat-images`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    });
    status = response.status;
    body = (await response.text()).slice(0, 300);
  } catch (error) {
    body = `请求失败: ${error instanceof Error ? error.message : String(error)}`;
  }
  return { size, status, body, ms: Date.now() - startedAt };
}

const key = readKey();
const rows = [];
for (const size of sizes) {
  const row = await probe(key, size);
  rows.push(row);
  console.log(
    `${String(size).padStart(9)} 字节 → HTTP ${row.status}  ${row.body.replace(/\s+/g, ' ')}`,
  );
}

const markdown = [
  '| 字节数 | HTTP | 响应体 |',
  '| --- | --- | --- |',
  ...rows.map(
    (row) =>
      `| ${row.size.toLocaleString('en-US')} | ${row.status} | ${row.body.replace(/\|/g, '\\|').replace(/\s+/g, ' ')} |`,
  ),
].join('\n');

if (outPath) writeFileSync(outPath, `${markdown}\n`);
console.log(`\n${markdown}`);
