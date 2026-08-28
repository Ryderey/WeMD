import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RichPostAiSettings } from "../../components/Settings/RichPostAiSettings";
import {
  DEFAULT_RICH_POST_AI_PROMPT,
  DEFAULT_RICH_POST_AI_SETTINGS,
} from "../../services/richPostAi";

describe("RichPostAiSettings", () => {
  it("imports a txt prompt and restores the built-in prompt", async () => {
    const onSettingsChange = vi.fn();
    const customSettings = {
      ...DEFAULT_RICH_POST_AI_SETTINGS,
      prompt: "当前提示词",
    };
    const { rerender } = render(
      <RichPostAiSettings
        settings={customSettings}
        apiKey=""
        onSettingsChange={onSettingsChange}
        onApiKeyChange={vi.fn()}
      />,
    );
    const file = new File(["导入的提示词"], "prompt.txt", {
      type: "text/plain",
    });
    Object.defineProperty(file, "text", {
      value: vi.fn(async () => "导入的提示词"),
    });
    fireEvent.change(screen.getByLabelText("导入提示词文件"), {
      target: { files: [file] },
    });
    await waitFor(() => {
      expect(onSettingsChange).toHaveBeenCalledWith({
        ...customSettings,
        prompt: "导入的提示词",
      });
    });

    rerender(
      <RichPostAiSettings
        settings={{ ...customSettings, prompt: "导入的提示词" }}
        apiKey=""
        onSettingsChange={onSettingsChange}
        onApiKeyChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "恢复默认" }));
    expect(onSettingsChange).toHaveBeenLastCalledWith({
      ...customSettings,
      prompt: DEFAULT_RICH_POST_AI_PROMPT,
    });
  });

  it("rejects unsupported prompt files", async () => {
    render(
      <RichPostAiSettings
        settings={DEFAULT_RICH_POST_AI_SETTINGS}
        apiKey=""
        onSettingsChange={vi.fn()}
        onApiKeyChange={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("导入提示词文件"), {
      target: { files: [new File(["x"], "prompt.json")] },
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "仅支持 .txt 或 .md",
    );
  });

  it("keeps the clear action available when secure persistence is unavailable", () => {
    const onClearApiKey = vi.fn();
    render(
      <RichPostAiSettings
        settings={DEFAULT_RICH_POST_AI_SETTINGS}
        apiKey=""
        onSettingsChange={vi.fn()}
        onApiKeyChange={vi.fn()}
        onClearApiKey={onClearApiKey}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "清除 Key" }));
    expect(onClearApiKey).toHaveBeenCalledOnce();
    expect(screen.queryByText(/Web 版 API Key/)).not.toBeInTheDocument();
  });
});
