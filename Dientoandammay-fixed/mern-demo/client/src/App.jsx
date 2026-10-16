import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");
const API_URL = `${API_BASE}/api/students`;

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const EMPTY_FORM = { studentId: "", name: "", email: "" };

// Gọi API, luôn trả về JSON và ném Error kèm thông điệp từ server nếu thất bại
async function request(url, options) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options && options.headers) },
  });
  let data = null;
  try {
    data = await response.json();
  } catch {
    // phản hồi không có body JSON
  }
  if (!response.ok) {
    throw new Error((data && data.message) || `Lỗi ${response.status}`);
  }
  return data;
}

const initials = (name) =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

function validate(form) {
  const errors = {};
  if (!form.studentId.trim()) errors.studentId = "Vui lòng nhập MSSV";
  if (!form.name.trim()) errors.name = "Vui lòng nhập họ tên";
  if (!form.email.trim()) errors.email = "Vui lòng nhập email";
  else if (!EMAIL_RE.test(form.email.trim())) errors.email = "Email không hợp lệ";
  return errors;
}

function App() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const toastTimer = useRef(null);
  const firstFieldRef = useRef(null);

  const showToast = useCallback((type, message) => {
    clearTimeout(toastTimer.current);
    setToast({ type, message });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const fetchStudents = useCallback(async () => {
    try {
      const data = await request(API_URL);
      if (!Array.isArray(data)) throw new Error("Dữ liệu trả về không hợp lệ");
      setStudents(data);
      setLoadError("");
    } catch (error) {
      console.error("Lỗi khi lấy danh sách sinh viên:", error);
      setLoadError(error.message || "Không thể tải danh sách sinh viên");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      [s.studentId, s.name, s.email].some((v) => v.toLowerCase().includes(q))
    );
  }, [students, query]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setEditingId(null);
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const payload = {
      studentId: form.studentId.trim(),
      name: form.name.trim(),
      email: form.email.trim(),
    };

    setSaving(true);
    try {
      if (editingId) {
        await request(`${API_URL}/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        showToast("success", "Cập nhật sinh viên thành công");
      } else {
        await request(API_URL, { method: "POST", body: JSON.stringify(payload) });
        showToast("success", "Thêm sinh viên thành công");
      }
      resetForm();
      await fetchStudents();
    } catch (error) {
      console.error("Lỗi khi lưu sinh viên:", error);
      showToast("error", error.message || "Có lỗi xảy ra khi lưu sinh viên");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (student) => {
    setEditingId(student._id);
    setForm({
      studentId: student.studentId,
      name: student.name,
      email: student.email,
    });
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
    firstFieldRef.current?.focus({ preventScroll: true });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await request(`${API_URL}/${pendingDelete._id}`, { method: "DELETE" });
      if (pendingDelete._id === editingId) resetForm();
      showToast("success", "Đã xóa sinh viên");
      setPendingDelete(null);
      await fetchStudents();
    } catch (error) {
      console.error("Lỗi khi xóa sinh viên:", error);
      showToast("error", error.message || "Có lỗi xảy ra khi xóa sinh viên");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="app">
      <header className="hero">
        <div className="hero__inner">
          <span className="hero__badge">Phiên bản 2.0</span>
          <h1>Quản lý sinh viên</h1>
          <p>Thêm, chỉnh sửa và theo dõi danh sách sinh viên trên nền tảng MERN.</p>
        </div>
      </header>

      <main className="layout">
        <section className="card form-card" aria-labelledby="form-title">
          <div className="card__head">
            <h2 id="form-title">
              {editingId ? "Cập nhật sinh viên" : "Thêm sinh viên"}
            </h2>
            {editingId && <span className="pill pill--warn">Đang chỉnh sửa</span>}
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className={`field ${errors.studentId ? "field--error" : ""}`}>
              <label htmlFor="studentId">MSSV</label>
              <input
                id="studentId"
                ref={firstFieldRef}
                type="text"
                placeholder="Ví dụ: 235191"
                value={form.studentId}
                onChange={handleChange("studentId")}
                autoComplete="off"
              />
              {errors.studentId && <small role="alert">{errors.studentId}</small>}
            </div>

            <div className={`field ${errors.name ? "field--error" : ""}`}>
              <label htmlFor="name">Họ tên</label>
              <input
                id="name"
                type="text"
                placeholder="Ví dụ: Nguyễn Hoài Ngọc"
                value={form.name}
                onChange={handleChange("name")}
                autoComplete="off"
              />
              {errors.name && <small role="alert">{errors.name}</small>}
            </div>

            <div className={`field ${errors.email ? "field--error" : ""}`}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="ten@example.com"
                value={form.email}
                onChange={handleChange("email")}
                autoComplete="off"
              />
              {errors.email && <small role="alert">{errors.email}</small>}
            </div>

            <div className="actions">
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? "Đang lưu..." : editingId ? "Cập nhật" : "Thêm sinh viên"}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Hủy
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="card list-card" aria-labelledby="list-title">
          <div className="card__head">
            <h2 id="list-title">
              Danh sách sinh viên
              <span className="count">{students.length}</span>
            </h2>
            <input
              className="search"
              type="search"
              placeholder="Tìm theo MSSV, tên, email..."
              aria-label="Tìm kiếm sinh viên"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          {loading ? (
            <ul className="list" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <li key={i} className="row row--skeleton">
                  <span className="avatar skeleton" />
                  <span className="skeleton skeleton--line" />
                </li>
              ))}
            </ul>
          ) : loadError ? (
            <div className="state state--error">
              <p>Không thể tải danh sách: {loadError}</p>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => {
                  setLoading(true);
                  fetchStudents();
                }}
              >
                Thử lại
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="state">
              <p>
                {students.length === 0
                  ? "Chưa có sinh viên nào. Hãy thêm sinh viên đầu tiên!"
                  : "Không tìm thấy sinh viên phù hợp."}
              </p>
            </div>
          ) : (
            <ul className="list">
              {filtered.map((student) => (
                <li
                  key={student._id}
                  className={`row ${student._id === editingId ? "row--active" : ""}`}
                >
                  <span className="avatar" aria-hidden="true">
                    {initials(student.name)}
                  </span>
                  <div className="row__info">
                    <strong>{student.name}</strong>
                    <span>{student.email}</span>
                  </div>
                  <span className="pill">{student.studentId}</span>
                  <div className="row__actions">
                    <button
                      type="button"
                      className="btn btn--small"
                      onClick={() => handleEdit(student)}
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      className="btn btn--small btn--danger"
                      onClick={() => setPendingDelete(student)}
                    >
                      Xóa
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {pendingDelete && (
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={() => !deleting && setPendingDelete(null)}
        >
          <div className="modal__box" onClick={(event) => event.stopPropagation()}>
            <h3 id="modal-title">Xóa sinh viên?</h3>
            <p>
              Bạn có chắc chắn muốn xóa <strong>{pendingDelete.name}</strong> (
              {pendingDelete.studentId}) không? Hành động này không thể hoàn tác.
            </p>
            <div className="actions actions--end">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn--danger-solid"
                onClick={confirmDelete}
                disabled={deleting}
                autoFocus
              >
                {deleting ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast toast--${toast.type}`} role="status">
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default App;
