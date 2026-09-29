import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import toast from "react-hot-toast";
import { useEditorStore } from "../../store/editorStore";
import { useThemeStore } from "../../store/themeStore";
import { useHistoryStore } from "../../store/historyStore";
import { platformActions } from "../../lib/platformAdapter";
import { type DesignerVariables, defaultVariables } from "./ThemeDesigner";
import { generateCSS } from "./ThemeDesigner/generateCSS";
import {
  designerTemplateIds,
  type CustomTheme,
} from "../../store/themes/builtInThemes";
import { designerPresets } from "../../store/themes/designerPresets";
import { ThemePanelView } from "./ThemePanelView";
import "./ThemePanel.css";

interface ThemePanelProps {
  open: boolean;
  onClose: () => void;
}

const normalizeDesignerVariables = (
  variables?: DesignerVariables,
): DesignerVariables => ({
  ...defaultVariables,
  ...variables,
  h1: { ...defaultVariables.h1, ...variables?.h1 },
  h2: { ...defaultVariables.h2, ...variables?.h2 },
  h3: { ...defaultVariables.h3, ...variables?.h3 },
  h4: { ...defaultVariables.h4, ...variables?.h4 },
});

const areDesignerVariablesEqual = (
  a?: DesignerVariables,
  b?: DesignerVariables,
) => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return JSON.stringify(a) === JSON.stringify(b);
};

export function ThemePanel({ open, onClose }: ThemePanelProps) {
  const theme = useThemeStore((state) => state.themeId);
  const selectTheme = useThemeStore((state) => state.selectTheme);
  const createTheme = useThemeStore((state) => state.createTheme);
  const updateTheme = useThemeStore((state) => state.updateTheme);
  const deleteTheme = useThemeStore((state) => state.deleteTheme);
  const duplicateTheme = useThemeStore((state) => state.duplicateTheme);
  const getAllThemes = useThemeStore((state) => state.getAllThemes);
  const exportTheme = useThemeStore((state) => state.exportTheme);
  const exportThemeCSS = useThemeStore((state) => state.exportThemeCSS);
  const importTheme = useThemeStore((state) => state.importTheme);
  const customThemesFromStore = useThemeStore((state) => state.customThemes);
  const persistActiveSnapshot = useHistoryStore(
    (state) => state.persistActiveSnapshot,
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);

  const allThemes = useMemo(
    () => [
      ...getAllThemes().filter((item) => item.isBuiltIn),
      ...customThemesFromStore,
    ],
    [getAllThemes, customThemesFromStore],
  );

  const [selectedThemeId, setSelectedThemeId] = useState<string>("");
  const [nameInput, setNameInput] = useState("");
  const [cssInput, setCssInput] = useState("");
  const [visualCss, setVisualCss] = useState("");
  const [designerVariables, setDesignerVariables] = useState<
    DesignerVariables | undefined
  >(undefined);
  const [isCreating, setIsCreating] = useState(false);
  const [creationStep, setCreationStep] = useState<"select-mode" | "editing">(
    "select-mode",
  );
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editorMode, setEditorMode] = useState<"visual" | "css">("visual");
  const [originalName, setOriginalName] = useState("");
  const [originalCss, setOriginalCss] = useState("");
  const [originalDesignerVariables, setOriginalDesignerVariables] = useState<
    DesignerVariables | undefined
  >(undefined);
  const [useCurrentArticle, setUseCurrentArticle] = useState(true);

  const selectedTheme = allThemes.find((item) => item.id === selectedThemeId);
  const isCustomTheme = selectedTheme && !selectedTheme.isBuiltIn;
  const isTemplateTheme = Boolean(
    selectedTheme?.isBuiltIn && designerTemplateIds.has(selectedTheme.id),
  );

  /** 按 id 取主题一律查当前 store 状态，避免用到渲染期快照（复制/新建后立刻选中时会拿到旧列表） */
  const resolveTheme = (id: string): CustomTheme | undefined =>
    useThemeStore
      .getState()
      .getAllThemes()
      .find((item) => item.id === id);

  /** 面板状态一律由主题对象初始化，新建/复制/普通点击走同一条路 */
  const applyThemeToPanel = useCallback((target: CustomTheme | undefined) => {
    if (!target) {
      setSelectedThemeId("");
      setNameInput("");
      setCssInput("");
      setVisualCss("");
      setEditorMode("css");
      setDesignerVariables(undefined);
      setOriginalDesignerVariables(undefined);
      setOriginalName("");
      setOriginalCss("");
      return;
    }

    const nextDesignerVariables =
      target.editorMode === "visual"
        ? normalizeDesignerVariables(target.designerVariables)
        : undefined;

    setSelectedThemeId(target.id);
    setNameInput(target.name);
    setCssInput(target.css);
    setVisualCss(target.css);
    setEditorMode(target.editorMode || "css");
    setDesignerVariables(nextDesignerVariables);
    setOriginalDesignerVariables(nextDesignerVariables);
    setOriginalName(target.name);
    setOriginalCss(target.css);
  }, []);

  useEffect(() => {
    setExportMenuOpen(false);
  }, [selectedThemeId, isCustomTheme]);

  useEffect(() => {
    if (!open) {
      setExportMenuOpen(false);
    }
  }, [open]);

  const isVisualCustom =
    isCustomTheme && selectedTheme?.editorMode === "visual";
  const hasDesignerChanges =
    isVisualCustom &&
    !areDesignerVariablesEqual(designerVariables, originalDesignerVariables);
  const hasChanges =
    isCustomTheme &&
    (nameInput !== originalName ||
      cssInput !== originalCss ||
      hasDesignerChanges);

  const prevOpenRef = useRef(false);
  useEffect(() => {
    const wasOpen = prevOpenRef.current;
    prevOpenRef.current = open;

    if (open && !wasOpen) {
      applyThemeToPanel(resolveTheme(theme));
      setIsCreating(false);
      setCreationStep("select-mode");
      setShowDeleteConfirm(false);
    }
  }, [open, theme, applyThemeToPanel]);

  const handleSelectTheme = (themeId: string) => {
    applyThemeToPanel(resolveTheme(themeId));
    setIsCreating(false);
    setCreationStep("select-mode");
    setShowDeleteConfirm(false);
  };

  const handleCreateNew = () => {
    applyThemeToPanel(undefined);
    setIsCreating(true);
    setCreationStep("select-mode");
    setShowDeleteConfirm(false);
  };

  const handleSelectCreationMode = (mode: "visual" | "css") => {
    setEditorMode(mode);
    setCreationStep("editing");
  };

  const handleVisualCssChange = (nextCss: string) => {
    setVisualCss(nextCss);
    setCssInput(nextCss);
  };

  const handleVariablesChange = (vars: DesignerVariables) => {
    setDesignerVariables(normalizeDesignerVariables(vars));
  };

  const handleCssInputChange = (value: string) => {
    setCssInput(value);
  };

  useEffect(() => {
    if (!exportMenuOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setExportMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setExportMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [exportMenuOpen]);

  const handleApply = async () => {
    if (isCustomTheme && hasChanges) {
      const cssToVerify =
        editorMode === "visual" ? visualCss || cssInput : cssInput;
      if (!nameInput.trim() || !cssToVerify.trim()) {
        toast.error("无法保存更改：主题名称或内容不能为空");
        return;
      }
      await handleSave();
    }

    selectTheme(selectedThemeId);
    if (platformActions.shouldPersistHistory()) {
      const state = useEditorStore.getState();
      await persistActiveSnapshot({
        markdown: state.markdown,
        theme: selectedThemeId,
        customCSS: "",
        themeName: selectedTheme?.name || "默认主题",
      });
    }
    onClose();
  };

  const handleSave = async () => {
    if (isCreating) {
      const cssToSave =
        editorMode === "visual" ? visualCss || cssInput : cssInput;
      const newTheme = createTheme(
        nameInput,
        editorMode,
        cssToSave,
        editorMode === "visual" ? designerVariables : undefined,
      );
      selectTheme(newTheme.id);

      if (platformActions.shouldPersistHistory()) {
        const state = useEditorStore.getState();
        await persistActiveSnapshot({
          markdown: state.markdown,
          theme: newTheme.id,
          customCSS: "",
          themeName: newTheme.name,
        });
      }

      setSelectedThemeId(newTheme.id);
      setCssInput(cssToSave);
      setOriginalName(nameInput);
      setOriginalCss(cssToSave);
      setOriginalDesignerVariables(
        editorMode === "visual" ? designerVariables : undefined,
      );
      setIsCreating(false);
      toast.success("主题创建成功");
      return;
    }

    if (isCustomTheme) {
      const isVisualMode =
        selectedTheme?.editorMode === "visual" && designerVariables;
      const cssToSave = isVisualMode
        ? generateCSS(designerVariables)
        : cssInput;

      const updates: {
        name: string;
        css: string;
        designerVariables?: DesignerVariables;
      } = {
        name: nameInput.trim() || "未命名主题",
        css: cssToSave,
      };
      if (isVisualMode) {
        updates.designerVariables = designerVariables;
      }
      updateTheme(selectedThemeId, updates);

      if (platformActions.shouldPersistHistory()) {
        const editorState = useEditorStore.getState();
        const themeState = useThemeStore.getState();
        if (themeState.themeId === selectedThemeId) {
          await persistActiveSnapshot({
            markdown: editorState.markdown,
            theme: selectedThemeId,
            customCSS: "",
            themeName: nameInput.trim() || "未命名主题",
          });
        }
      }

      setOriginalName(nameInput.trim() || "未命名主题");
      setCssInput(cssToSave);
      setVisualCss(isVisualMode ? cssToSave : "");
      setOriginalCss(cssToSave);
      setOriginalDesignerVariables(
        isVisualMode ? designerVariables : undefined,
      );
      toast.success("主题已保存");
    }
  };

  const handleDeleteClick = () => {
    if (!isCustomTheme) return;
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (!isCustomTheme) return;
    deleteTheme(selectedThemeId);
    selectTheme("default");
    handleSelectTheme("default");
    setShowDeleteConfirm(false);
    toast.success("主题已删除");
  };

  const handleDuplicate = () => {
    if (!selectedTheme) return;
    const duplicated = duplicateTheme(
      selectedThemeId,
      `${selectedTheme.name} (副本)`,
    );
    // 直接用返回的副本对象初始化面板，避免再从可能滞后的列表里查一次
    applyThemeToPanel(duplicated);
    toast.success("主题已复制");
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    if (theme) {
      handleSelectTheme(theme);
    }
  };

  const handleImportThemeFile = async (file: File) => {
    const success = await importTheme(file);
    if (success) {
      toast.success("主题导入成功");
    } else {
      toast.error("导入失败，请检查文件格式");
    }
  };

  const templateThemes = allThemes.filter(
    (item) => item.isBuiltIn && designerTemplateIds.has(item.id),
  );
  const builtInThemes = allThemes.filter(
    (item) => item.isBuiltIn && !designerTemplateIds.has(item.id),
  );
  const customThemes = allThemes.filter((item) => !item.isBuiltIn);
  const templateTaglines = useMemo(
    () =>
      Object.fromEntries(
        designerPresets.map((preset) => [preset.id, preset.tagline]),
      ),
    [],
  );
  const isVisualEditing =
    (isCreating && editorMode === "visual") ||
    (!isCreating && isCustomTheme && selectedTheme?.editorMode === "visual");
  const previewCss = isVisualEditing ? visualCss || cssInput : cssInput;
  const canSave = Boolean(
    nameInput.trim() &&
      (editorMode === "visual"
        ? visualCss.trim() || cssInput.trim()
        : cssInput.trim()),
  );

  return (
    <ThemePanelView
      open={open}
      onClose={onClose}
      fileInputRef={fileInputRef}
      builtInThemes={builtInThemes}
      templateThemes={templateThemes}
      templateTaglines={templateTaglines}
      customThemes={customThemes}
      selectedTheme={selectedTheme}
      selectedThemeId={selectedThemeId}
      isCustomTheme={Boolean(isCustomTheme)}
      isTemplateTheme={isTemplateTheme}
      isCreating={isCreating}
      creationStep={creationStep}
      editorMode={editorMode}
      isVisualEditing={Boolean(isVisualEditing)}
      showDeleteConfirm={showDeleteConfirm}
      useCurrentArticle={useCurrentArticle}
      previewCss={previewCss}
      designerVariables={designerVariables}
      nameInput={nameInput}
      cssInput={cssInput}
      canSave={canSave}
      hasChanges={Boolean(hasChanges)}
      exportMenuOpen={exportMenuOpen}
      exportMenuRef={exportMenuRef}
      onSelectTheme={handleSelectTheme}
      onCreateNew={handleCreateNew}
      onImportThemeFile={handleImportThemeFile}
      onSelectCreationMode={handleSelectCreationMode}
      onSetUseCurrentArticle={setUseCurrentArticle}
      onVisualCssChange={handleVisualCssChange}
      onVariablesChange={handleVariablesChange}
      onNameInputChange={setNameInput}
      onCssInputChange={handleCssInputChange}
      onCloseDeleteConfirm={() => setShowDeleteConfirm(false)}
      onConfirmDelete={handleConfirmDelete}
      onCancelCreate={handleCancelCreate}
      onDuplicate={handleDuplicate}
      onToggleExportMenu={() => setExportMenuOpen((prev) => !prev)}
      onExportJson={() => {
        exportTheme(selectedThemeId);
        setExportMenuOpen(false);
      }}
      onExportCss={() => {
        exportThemeCSS(selectedThemeId);
        setExportMenuOpen(false);
      }}
      onDeleteClick={handleDeleteClick}
      onSave={handleSave}
      onApply={handleApply}
    />
  );
}
