import { describe, expect, it } from "vitest";
import { useThemeStore } from "../../store/themeStore";
import { designerPresets } from "../../store/themes/designerPresets";
import { generateCSS } from "../../components/Theme/ThemeDesigner/generateCSS";

const seedOf = (id: string) => {
  const preset = designerPresets.find((item) => item.id === id);
  if (!preset) throw new Error(`找不到种子 ${id}`);
  return preset;
};

describe("duplicateTheme", () => {
  it("复制模板得到独立副本：变量深拷贝、CSS 重新生成、仍可可视化编辑", () => {
    const seed = seedOf("jade-notes");
    const copy = useThemeStore
      .getState()
      .duplicateTheme("jade-notes", "青岚 副本");

    expect(copy.isBuiltIn).toBe(false);
    expect(copy.editorMode).toBe("visual");
    expect(copy.css).toBe(generateCSS(seed.variables));

    // 深拷贝：改副本的嵌套字段不能碰到模板与其它副本
    expect(copy.designerVariables).not.toBe(seed.variables);
    expect(copy.designerVariables?.h1).not.toBe(seed.variables.h1);
    copy.designerVariables!.primaryColor = "#123456";
    copy.designerVariables!.h1.fontSize = 99;
    expect(seed.variables.primaryColor).toBe("#27675C");
    expect(seed.variables.h1.fontSize).toBe(24);
  });

  it("第二次复制仍然独立于第一份副本", () => {
    const first = useThemeStore
      .getState()
      .duplicateTheme("jade-notes", "副本甲");
    const second = useThemeStore
      .getState()
      .duplicateTheme("jade-notes", "副本乙");
    expect(second.designerVariables).not.toBe(first.designerVariables);
    expect(second.css).toBe(first.css);
  });

  it("复制 CSS 主题维持原样：只带 css，不产生变量", () => {
    const copy = useThemeStore.getState().duplicateTheme("default", "默认副本");
    expect(copy.editorMode).toBe("css");
    expect(copy.designerVariables).toBeUndefined();
    expect(copy.css.length).toBeGreaterThan(0);
  });
});
