interface FormActionsProps {
  status: string;
  hint?: string;
  onSaveDraft: () => void;
  onSubmitReview: () => void;
  onList?: () => void;
  onUnlist?: () => void;
  saveDisabled?: boolean;
  submitDisabled?: boolean;
}

export function FormActions({
  status,
  hint,
  onSaveDraft,
  onSubmitReview,
  onList,
  onUnlist,
  saveDisabled,
  submitDisabled,
}: FormActionsProps) {
  return (
    <div className="space-y-3">
      <div className="text-sm text-slate-700">
        当前状态：<span className="font-semibold">{status}</span>
      </div>
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={saveDisabled}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 disabled:opacity-50"
        >
          保存草稿
        </button>
        <button
          type="button"
          onClick={onSubmitReview}
          disabled={submitDisabled}
          className="rounded-md border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs text-white disabled:opacity-50"
        >
          提交审核
        </button>
        {onList ? (
          <button type="button" onClick={onList} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700">
            上架
          </button>
        ) : null}
        {onUnlist ? (
          <button type="button" onClick={onUnlist} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700">
            下架
          </button>
        ) : null}
      </div>
    </div>
  );
}
