import { useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Plus, Rss, Trash2, Zap } from "lucide-react";
import { MP_PROFILE_DEFINITION } from "./builtInComponents";
import { ComponentFields } from "./ComponentFields";
import {
  createMpAccount,
  EMPTY_MP_PROFILE,
  hasRequiredMpProfileValues,
  readMpAccounts,
  writeMpAccounts,
  type MpAccount,
  type MpProfileValues,
} from "./mpProfile";

interface MpAccountsSectionProps {
  onInsert: (account: MpAccount) => void;
}

export function MpAccountsSection({ onInsert }: MpAccountsSectionProps) {
  const [accounts, setAccounts] = useState<MpAccount[]>(readMpAccounts);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [values, setValues] = useState<MpProfileValues>(EMPTY_MP_PROFILE);

  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasRequiredMpProfileValues(values)) {
      toast.error("请填写公众号 ID 和公众号名称");
      return;
    }
    const next = editingId
      ? accounts.map((account) =>
          account.id === editingId ? { ...account, ...values } : account,
        )
      : [...accounts, createMpAccount(values)];
    setAccounts(next);
    writeMpAccounts(next);
    setFormOpen(false);
    setEditingId(null);
    setValues(EMPTY_MP_PROFILE);
    toast.success("公众号名片已保存");
  };

  const remove = (id: string) => {
    const next = accounts.filter((account) => account.id !== id);
    setAccounts(next);
    writeMpAccounts(next);
    setDeletingId(null);
    toast.success("公众号名片已删除");
  };

  return (
    <div className="saved-accounts-section">
      <div className="saved-accounts-header">
        <span>
          <Rss size={15} />
          已保存的公众号
        </span>
        <button
          type="button"
          onClick={() => {
            setFormOpen(true);
            setEditingId(null);
            setValues(EMPTY_MP_PROFILE);
          }}
        >
          <Plus size={14} />
          添加
        </button>
      </div>
      {formOpen && (
        <form className="saved-account-form" onSubmit={save}>
          <ComponentFields
            definition={MP_PROFILE_DEFINITION}
            values={values}
            onChange={(next) => setValues(next as MpProfileValues)}
          />
          <div>
            <button type="button" onClick={() => setFormOpen(false)}>
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
                    onClick={() => remove(account.id)}
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
                    onClick={() => onInsert(account)}
                  >
                    <Zap size={14} />
                  </button>
                  <button
                    type="button"
                    aria-label={`编辑 ${account.nickname}`}
                    onClick={() => {
                      setFormOpen(true);
                      setEditingId(account.id);
                      setValues(account);
                    }}
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
  );
}
