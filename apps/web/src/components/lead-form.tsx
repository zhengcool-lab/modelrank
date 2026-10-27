"use client";

import { useEffect, useRef, useState } from "react";

type LeadDraft = {
  name: string;
  email: string;
  company: string;
  need: string;
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 32,
  padding: "0 10px",
  border: "1px solid var(--mr-border)",
  borderRadius: 4,
  fontSize: 12,
  boxSizing: "border-box",
  outline: "none",
  background: "var(--mr-card)",
  color: "var(--mr-text)",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  height: "auto",
  minHeight: 64,
  padding: "8px 10px",
  resize: "vertical",
  fontFamily: "inherit",
  lineHeight: 1.5,
};

export function LeadForm() {
  const [draft, setDraft] = useState<LeadDraft>({ name: "", email: "", company: "", need: "" });
  const [submitted, setSubmitted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const update = (key: keyof LeadDraft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDraft((d) => ({ ...d, [key]: e.target.value }));

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // 纯本地 mock：不调用任何 /api/*，仅 console.log
    console.log("[lead-form] 本地提交（mock，未接后端）", {
      ...draft,
      submittedAt: new Date().toISOString(),
    });
    setSubmitted(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSubmitted(false);
      setDraft({ name: "", email: "", company: "", need: "" });
    }, 3000);
  };

  return (
    <div className="mr-card" style={{ padding: "18px 20px", marginTop: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--mr-text)" }}>企业咨询留资</div>
      <div style={{ fontSize: 11, color: "var(--mr-text-3)", marginTop: 2 }}>
        留下需求，商务将在 1 个工作日内联系
      </div>
      <form onSubmit={onSubmit} style={{ marginTop: 10 }}>
        <input
          placeholder="姓名"
          value={draft.name}
          onChange={update("name")}
          style={inputStyle}
          required
        />
        <input
          placeholder="工作邮箱"
          type="email"
          value={draft.email}
          onChange={update("email")}
          style={{ ...inputStyle, marginTop: 8 }}
          required
        />
        <input
          placeholder="公司"
          value={draft.company}
          onChange={update("company")}
          style={{ ...inputStyle, marginTop: 8 }}
        />
        <textarea
          placeholder="需求描述（预计月用量、合规要求、接入方式等）"
          rows={3}
          value={draft.need}
          onChange={update("need")}
          style={{ ...textareaStyle, marginTop: 8 }}
        />
        <button
          type="submit"
          disabled={submitted}
          style={{
            display: "block",
            width: "100%",
            textAlign: "center",
            marginTop: 10,
            fontSize: 13,
            fontWeight: 600,
            color: "#fff",
            background: submitted ? "var(--mr-up)" : "var(--mr-primary)",
            height: 32,
            lineHeight: "32px",
            borderRadius: 4,
            border: "none",
            cursor: submitted ? "default" : "pointer",
          }}
        >
          {submitted ? "已提交 ✓" : "提交咨询"}
        </button>
      </form>
    </div>
  );
}
