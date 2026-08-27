import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Blocks,
  ChevronDown,
  Pencil,
  Plus,
  Rss,
  Trash2,
  Zap,
} from "lucide-react";
import { Modal } from "../common";
import { dispatchEditorInsert } from "../Editor/editorInsert";
import { MpProfileFields } from "./MpProfileFields";
import {
  buildMpProfileSnippet,
  createMpAccount,
  EMPTY_MP_PROFILE,
  hasRequiredMpProfileValues,
  MP_PROFILE_EXAMPLE,
  readMpAccounts,
  writeMpAccounts,
  type MpAccount,
  type MpProfileValues,
} from "./mpProfile";
import "./ComponentDialog.css";

interface ComponentDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ComponentDialog({ open, onClose }: ComponentDialogProps) {
  const [expanded, setExpanded] = useState(false);
  const [values, setValues] = useState<MpProfileValues>(MP_PROFILE_EXAMPLE);
  const [accounts, setAccounts] = useState<MpAccount[]>(readMpAccounts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [accountValues, setAccountValues] =
    useState<MpProfileValues>(EMPTY_MP_PROFILE);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  const close = () => {
    setEditingId(null);
    setDeletingId(null);
    onClose();
  };

  const insert = (profile: MpProfileValues) => {
    if (!hasRequiredMpProfileValues(profile)) {
      toast.error("请填写公众号 ID 和公众号名称");
      return;
    }
    dispatchEditorInsert(`\n${buildMpProfileSnippet(profile)}\n`);
    toast.success(`已插入公众号名片「${profile.nickname.trim()}」`);
    close();
  };

  const saveAccount = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasRequiredMpProfileValues(accountValues)) {
      toast.error("请填写公众号 ID 和公众号名称");
      return;
    }
    const next = editingId
      ? accounts.map((account) =>
          account.id === editingId ? { ...account, ...accountValues } : account,
        )
      : [...accounts, createMpAccount(accountValues)];
    setAccounts(next);
    writeMpAccounts(next);
    setEditingId(null);
    setAccountValues(EMPTY_MP_PROFILE);
    toast.success("公众号名片已保存");
  };

  const editAccount = (account: MpAccount) => {
    setEditingId(account.id);
    setAccountValues(account);
  };

  const deleteAccount = (id: string) => {
    const next = accounts.filter((account) => account.id !== id);
    setAccounts(next);
    writeMpAccounts(next);
    setDeletingId(null);
    toast.success("公众号名片已删除");
  };

  const toggle = () => setExpanded((current) => !current);

  return (
    <Modal
      open={open}
      onClose={close}
      title="组件"
      className="component-dialog-modal"
    >
      <section role="dialog" aria-modal="true" aria-label="组件">
        <p className="component-dialog-intro">
          在 Markdown 中插入 JSX 风格组件，如{" "}
          <code>&lt;MpProfile mpId="…" /&gt;</code>
        </p>
        <section className={`component-card${expanded ? " is-expanded" : ""}`}>
          <div
            className="component-card-summary"
            role="button"
            tabIndex={0}
            onClick={toggle}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                toggle();
              }
            }}
          >
            <div className="component-card-icon">
              <Blocks size={18} />
            </div>
            <div className="component-card-info">
              <div>
                <code>MpProfile</code>
                <small>6 个属性</small>
              </div>
              <p>公众号名片组件，展示微信公众号名片</p>
            </div>
            <div
              className="component-card-actions"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="component-insert-button"
                onClick={() => insert(MP_PROFILE_EXAMPLE)}
              >
                <Zap size={14} />
                插入
              </button>
              <button
                type="button"
                className="component-expand-button"
                aria-label={
                  expanded ? "收起公众号名片组件" : "展开公众号名片组件"
                }
                aria-expanded={expanded}
                onClick={toggle}
              >
                <ChevronDown size={18} />
              </button>
            </div>
          </div>
          {expanded && (
            <div className="component-card-detail">
              <MpProfileFields values={values} onChange={setValues} />
              <div className="mp-profile-preview" aria-label="公众号名片预览">
                {values.headimg.trim() ? (
                  <img src={values.headimg.trim()} alt="" />
                ) : (
                  <Rss size={24} />
                )}
                <div>
                  <strong>{values.nickname || "公众号名称"}</strong>
                  <span>{values.signature || "公众号简介"}</span>
                </div>
              </div>
              <pre>
                <code>{buildMpProfileSnippet(values)}</code>
              </pre>
              <button
                type="button"
                className="component-insert-button"
                onClick={() => insert(values)}
              >
                <Zap size={14} />
                按当前属性插入
              </button>
              <div className="saved-accounts-header">
                <span>
                  <Rss size={15} />
                  已保存的公众号
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId("new");
                    setAccountValues(EMPTY_MP_PROFILE);
                  }}
                >
                  <Plus size={14} />
                  添加
                </button>
              </div>
              {editingId && (
                <form className="saved-account-form" onSubmit={saveAccount}>
                  <MpProfileFields
                    values={accountValues}
                    onChange={setAccountValues}
                  />
                  <div>
                    <button type="button" onClick={() => setEditingId(null)}>
                      取消
                    </button>
                    <button type="submit" className="component-insert-button">
                      保存
                    </button>
                  </div>
                </form>
              )}
              {accounts.length === 0 ? (
                <p className="saved-accounts-empty">
                  暂无保存的公众号，可添加后快速插入。
                </p>
              ) : (
                <ul className="saved-accounts-list">
                  {accounts.map((account) => (
                    <li key={account.id}>
                      {account.headimg ? (
                        <img src={account.headimg} alt="" />
                      ) : (
                        <Rss size={16} />
                      )}
                      <span>
                        <strong>{account.nickname}</strong>
                        <small>{account.signature || account.mpId}</small>
                      </span>
                      {deletingId === account.id ? (
                        <>
                          <small>确定删除？</small>
                          <button
                            type="button"
                            aria-label={`确认删除 ${account.nickname}`}
                            onClick={() => deleteAccount(account.id)}
                          >
                            删除
                          </button>
                          <button
                            type="button"
                            aria-label={`取消删除 ${account.nickname}`}
                            onClick={() => setDeletingId(null)}
                          >
                            取消
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            aria-label={`插入 ${account.nickname}`}
                            onClick={() => insert(account)}
                          >
                            <Zap size={14} />
                          </button>
                          <button
                            type="button"
                            aria-label={`编辑 ${account.nickname}`}
                            onClick={() => editAccount(account)}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            aria-label={`删除 ${account.nickname}`}
                            onClick={() => setDeletingId(account.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      </section>
    </Modal>
  );
}
