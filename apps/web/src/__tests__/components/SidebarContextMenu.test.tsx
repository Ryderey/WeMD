import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ContextMenu } from "../../components/Sidebar/ContextMenu";
import type { FileItem } from "../../store/fileTypes";

const file: FileItem = {
  name: "article.md",
  path: "C:\\workspace\\article.md",
  createdAt: new Date(),
  updatedAt: new Date(),
  size: 0,
};

const renderMenu = (onRevealFile?: (path: string) => void) =>
  render(
    <ContextMenu
      position={{ x: 0, y: 0 }}
      menuTarget={file}
      menuTargetFolder={null}
      showMoveMenu={false}
      allFolders={[]}
      folderMoveTargets={[]}
      onClose={vi.fn()}
      onCopyTitle={vi.fn()}
      onRevealFile={onRevealFile}
      onStartRename={vi.fn()}
      onToggleMoveMenu={vi.fn()}
      onMoveToFolder={vi.fn()}
      onMoveFolder={vi.fn()}
      onDeleteFile={vi.fn()}
      onDeleteFolder={vi.fn()}
      onStartRenameFolder={vi.fn()}
      onNewFolder={vi.fn()}
    />,
  );

describe("Sidebar ContextMenu", () => {
  it("invokes open file location when available", () => {
    const onRevealFile = vi.fn();
    renderMenu(onRevealFile);

    fireEvent.click(screen.getByRole("button", { name: "打开文件位置" }));
    expect(onRevealFile).toHaveBeenCalledWith(file.path);
  });

  it("hides open file location when unavailable", () => {
    renderMenu();

    expect(
      screen.queryByRole("button", { name: "打开文件位置" }),
    ).not.toBeInTheDocument();
  });
});
