import type { CSSProperties } from "react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Toaster } from "react-hot-toast";
import { Header } from "./components/Header/Header";
import { FileSidebar } from "./components/Sidebar/FileSidebar";
import { MarkdownEditor } from "./components/Editor/MarkdownEditor";
import { MarkdownPreview } from "./components/Preview/MarkdownPreview";
import { useFileSystem } from "./hooks/useFileSystem";
import { useMobileView } from "./hooks/useMobileView";
import { MobileToolbar } from "./components/common/MobileToolbar";
import { useEditorStore } from "./store/editorStore";
import "./styles/global.css";
import "./App.css";

import { useStorageContext } from "./storage/StorageContext";
import { Loader2 } from "lucide-react";
import { useHistoryStore } from "./store/historyStore";
import { useFileStore } from "./store/fileStore";
import { platform } from "./lib/platformAdapter";

const HistoryPanel = lazy(() =>
  import("./components/History/HistoryPanel").then((m) => ({
    default: m.HistoryPanel,
  })),
);
const HistoryManager = lazy(() =>
  import("./components/History/HistoryManager").then((m) => ({
    default: m.HistoryManager,
  })),
);
const Welcome = lazy(() =>
  import("./components/Welcome/Welcome").then((m) => ({ default: m.Welcome })),
);
import { MobileThemeSelector } from "./components/Theme/MobileThemeSelector";

function App() {
  const { workspacePath, saveFile } = useFileSystem({ enableEffects: true });
  const { type: storageType, ready } = useStorageContext();
  const historyLoading = useHistoryStore((state) => state.loading);
  const fileLoading = useFileStore((state) => state.isLoading);
  const {
    isMobile: isMobileScreen,
    activeView,
    setActiveView,
  } = useMobileView();
  const isMobile = isMobileScreen && !platform.isElectron;
  const copyToWechat = useEditorStore((state) => state.copyToWechat);
  const copyAsHtml = useEditorStore((state) => state.copyAsHtml);
  const [showThemePanel, setShowThemePanel] = useState(false);

  // 全局保存快捷键（统一监听器）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveFile(true); // showToast = true
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [saveFile]);

  const isElectron = platform.isElectron;

  const [showHistory, setShowHistory] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem("wemd-show-history");
    return saved !== "false";
  });
  const [historyWidth, setHistoryWidth] = useState<string>(
    showHistory ? "280px" : "0px",
  );

  useEffect(() => {
    try {
      localStorage.setItem("wemd-show-history", String(showHistory));
    } catch {
      /* 忽略持久化错误 */
    }
  }, [showHistory]);

  useEffect(() => {
    if (showHistory) {
      setHistoryWidth("280px");
      return;
    }
    const timer = window.setTimeout(() => setHistoryWidth("0px"), 350);
    return () => window.clearTimeout(timer);
  }, [showHistory]);

  const mainClass = "app-main";
  const mainStyle = useMemo(
    () =>
      ({
        "--history-width": historyWidth,
      }) as CSSProperties,
    [historyWidth],
  );

  // Electron 模式：强制选择工作区
  if (isElectron && !workspacePath) {
    return (
      <>
        <Toaster position="top-center" />
        <Suspense
          fallback={
            <div className="workspace-loading">
              <Loader2 className="animate-spin" size={24} />
            </div>
          }
        >
          <Welcome />
        </Suspense>
      </>
    );
  }

  return (
    <div className="app" data-layout-mode={isMobile ? "mobile" : "desktop"}>
      {/* 只在存储上下文完全就绪且确认为 IndexedDB 模式时才渲染 HistoryManager */}
      {!isElectron && ready && storageType === "indexeddb" && (
        <Suspense fallback={null}>
          <HistoryManager />
        </Suspense>
      )}

      <>
        <Toaster
          position="top-center"
          toastOptions={{
            className: "premium-toast",
            style: {
              background: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              color: "#1a1a1a",
              boxShadow: "0 12px 30px -10px rgba(0, 0, 0, 0.12)",
              borderRadius: "50px",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: 500,
              border: "1px solid rgba(0, 0, 0, 0.05)",
              maxWidth: "400px",
            },
            success: {
              iconTheme: {
                primary: "#07c160",
                secondary: "#fff",
              },
              duration: 2000,
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
              duration: 3000,
            },
          }}
        />
        <Header />
        <button
          className={`history-toggle ${showHistory ? "" : "is-collapsed"}`}
          onClick={() => setShowHistory((prev) => !prev)}
          aria-label={showHistory ? "隐藏列表" : "显示列表"}
        >
          <span className="sr-only">
            {showHistory ? "隐藏列表" : "显示列表"}
          </span>
        </button>
        <main
          className={mainClass}
          style={mainStyle}
          data-show-history={showHistory}
        >
          <div
            className={`history-pane ${showHistory ? "is-visible" : "is-hidden"}`}
            aria-hidden={!showHistory}
          >
            <div className="history-pane__content">
              {/* ready 后渲染，防止闪烁 */}
              {ready &&
                (isElectron || storageType === "filesystem" ? (
                  <FileSidebar />
                ) : (
                  <Suspense
                    fallback={
                      <div className="workspace-loading">
                        <Loader2 className="animate-spin" size={24} />
                      </div>
                    }
                  >
                    <HistoryPanel />
                  </Suspense>
                ))}
            </div>
          </div>
          <div
            className="workspace"
            data-mobile-view={isMobile ? activeView : undefined}
          >
            <div className="editor-pane">
              {/* 存储未就绪或文件/历史加载中显示 loading */}
              {!ready ||
              fileLoading ||
              (historyLoading && !isElectron && storageType === "indexeddb") ? (
                <div className="workspace-loading">
                  <Loader2 className="animate-spin" size={24} />
                  <p>正在加载文章</p>
                </div>
              ) : (
                <MarkdownEditor />
              )}
            </div>
            <div className="preview-pane">
              {!ready ||
              fileLoading ||
              (historyLoading && !isElectron && storageType === "indexeddb") ? (
                <div className="workspace-loading">
                  <Loader2 className="animate-spin" size={24} />
                  <p>正在加载文章</p>
                </div>
              ) : (
                <MarkdownPreview />
              )}
            </div>
          </div>

          {/* 移动端底部工具栏 */}
          {isMobile && (
            <MobileToolbar
              activeView={activeView}
              onViewChange={setActiveView}
              onCopyToWechat={copyToWechat}
              onCopyAsHtml={copyAsHtml}
              onOpenTheme={() => setShowThemePanel(true)}
            />
          )}
        </main>
      </>

      {/* 移动端主题选择器 */}
      {isMobile && (
        <MobileThemeSelector
          open={showThemePanel}
          onClose={() => setShowThemePanel(false)}
        />
      )}
    </div>
  );
}

export default App;
