import React, { useState, useEffect, useRef } from "react";
import { Send, AtSign, Loader2, User as UserIcon } from "lucide-react";
import axios from "../utils/axios.customize";

/**
 * Component nhập bình luận hỗ trợ @tag thành viên trong dự án
 */
export default function MentionCommentInput({
  projectId,
  onSubmit,
  placeholder = "Nhập bình luận hoặc ghi chú (gõ @ để nhắc thành viên)...",
  submitting = false,
  maxLength = 2000,
}) {
  const [content, setContent] = useState("");
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cursorPos, setCursorPos] = useState(0);
  const [taggedUserIds, setTaggedUserIds] = useState(new Set());

  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);

  // Tải danh sách thành viên trong dự án
  useEffect(() => {
    if (!projectId) return;
    let isMounted = true;
    setLoadingMembers(true);

    axios
      .get(`/projects/${projectId}/members`)
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.content)
          ? res.data.content
          : [];
        setMembers(list);
      })
      .catch((err) => {
        console.warn("Không thể tải thành viên để tag:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingMembers(false);
      });

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Xử lý khi gõ text trong textarea
  const handleChange = (e) => {
    const val = e.target.value;
    setContent(val);

    const pos = e.target.selectionStart;
    setCursorPos(pos);

    // Kiểm tra xem ký tự ngay trước con trỏ có phải là tag @ không
    const textBeforeCursor = val.slice(0, pos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const query = textBeforeCursor.slice(lastAtIndex + 1);
      // Chỉ hiện dropdown nếu không có khoảng trắng quá dài sau @
      if (!query.includes("\n") && query.length < 25) {
        setSearchQuery(query);
        setShowDropdown(true);
        return;
      }
    }

    setShowDropdown(false);
  };

  // Chọn thành viên để tag
  const handleSelectMember = (member) => {
    const memberName = member.userFullName || member.name || member.userEmail || "thanhvien";
    const memberId = member.userId || member.id;

    const pos = textareaRef.current ? textareaRef.current.selectionStart : cursorPos;
    const textBeforeCursor = content.slice(0, pos);
    const textAfterCursor = content.slice(pos);

    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    let newContent = "";
    if (lastAtIndex !== -1) {
      newContent =
        textBeforeCursor.slice(0, lastAtIndex) +
        `@${memberName} ` +
        textAfterCursor;
    } else {
      newContent = content + (content.length && !content.endsWith(" ") ? " " : "") + `@${memberName} `;
    }

    setContent(newContent);
    if (memberId) {
      setTaggedUserIds((prev) => new Set([...prev, memberId]));
    }
    setShowDropdown(false);

    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Gửi bình luận
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || submitting) return;

    // Quét thêm ID của các thành viên có tên trong content
    const finalTaggedIds = new Set(taggedUserIds);
    members.forEach((m) => {
      const name = m.userFullName || m.name;
      const email = m.userEmail;
      const uid = m.userId || m.id;
      if (
        uid &&
        ((name && trimmed.toLowerCase().includes(`@${name.toLowerCase()}`)) ||
          (email && trimmed.toLowerCase().includes(`@${email.toLowerCase()}`)))
      ) {
        finalTaggedIds.add(uid);
      }
    });

    if (onSubmit) {
      await onSubmit({
        content: trimmed,
        taggedUserIds: Array.from(finalTaggedIds),
      });
      setContent("");
      setTaggedUserIds(new Set());
    }
  };

  // Lọc thành viên theo searchQuery
  const filteredMembers = members.filter((m) => {
    const name = (m.userFullName || m.name || "").toLowerCase();
    const email = (m.userEmail || "").toLowerCase();
    const q = searchQuery.toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  return (
    <div className="relative w-full">
      {/* Dropdown gợi ý @tag thành viên */}
      {showDropdown && members.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full left-0 z-50 mb-2 w-72 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl transition-all"
        >
          <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 border-b border-slate-100 flex items-center justify-between">
            <span>Gợi ý nhắc thành viên (@tag)</span>
            <span className="text-[10px] text-blue-600">{filteredMembers.length} kết quả</span>
          </div>
          {filteredMembers.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400 text-center">
              Không tìm thấy thành viên phù hợp
            </div>
          ) : (
            filteredMembers.map((m) => (
              <button
                key={m.userId || m.id}
                type="button"
                onClick={() => handleSelectMember(m)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-600">
                  {(m.userFullName || m.name || "U")[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-slate-800">
                    {m.userFullName || m.name || "Thành viên"}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {m.role || m.userEmail || ""}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Form nhập bình luận */}
      <form onSubmit={handleSubmit} className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowDropdown(false);
          }}
          placeholder={placeholder}
          rows={3}
          maxLength={maxLength}
          className="w-full border-0 p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 resize-none bg-transparent"
        />

        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-3 py-2">
          <div className="flex items-center gap-2">
            {/* Nút bấm nhanh để tag thành viên */}
            <button
              type="button"
              onClick={() => {
                setShowDropdown((prev) => !prev);
                setSearchQuery("");
                if (textareaRef.current) textareaRef.current.focus();
              }}
              title="Nhắc đến thành viên (@tag)"
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200/70 hover:text-blue-600 transition-colors"
            >
              <AtSign className="h-3.5 w-3.5 text-blue-600" />
              <span>Tag thành viên</span>
            </button>

            <span className="text-[11px] text-slate-400">
              {content.length}/{maxLength}
            </span>
          </div>

          <button
            type="submit"
            disabled={!content.trim() || submitting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Đang gửi...</span>
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                <span>Gửi bình luận</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * Helper format text bình luận có hiển thị @tag nổi bật
 */
export function renderCommentText(text) {
  if (!text) return "";
  const parts = text.split(/(@[^\s@]+)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("@")) {
      return (
        <span
          key={idx}
          className="inline-flex items-center font-semibold text-blue-600 bg-blue-50/80 px-1.5 py-0.5 rounded text-xs mx-0.5 ring-1 ring-blue-200/50"
        >
          {part}
        </span>
      );
    }
    return part;
  });
}
