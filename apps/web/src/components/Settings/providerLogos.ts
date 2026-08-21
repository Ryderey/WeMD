import deepseek from "../../assets/providers/deepseek.webp";
import moonshot from "../../assets/providers/moonshot.webp";
import openai from "../../assets/providers/openai.webp";
import openrouter from "../../assets/providers/openrouter.webp";
import qwen from "../../assets/providers/qwen.webp";
import siliconflow from "../../assets/providers/siliconflow.webp";
import zhipu from "../../assets/providers/zhipu.webp";

import type { AiProviderId } from "../../services/ai/aiConfig";

export const PROVIDER_LOGOS: Partial<Record<AiProviderId, string>> = {
  deepseek,
  zhipu,
  moonshot,
  qwen,
  siliconflow,
  openai,
  openrouter,
};
