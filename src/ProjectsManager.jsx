import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { anyApi } from 'convex/server';
import { Plus, Trash2, Edit3, Image as ImageIcon, Youtube, Link as LinkIcon, X, Loader, KeyRound, Save } from 'lucide-react';

// References to the website's Convex functions (convex/projects.ts).
// anyApi.<module>.<fn> resolves to the "module:fn" reference without codegen.
const fn = {
  list: anyApi.projects.list,
  generateUploadUrl: anyApi.projects.generateUploadUrl,
  add: anyApi.projects.add,
  update: anyApi.projects.update,
  remove: anyApi.projects.remove,
};

// Admin identity: a phone in ALWAYS_ALLOWED_PHONES (convex/adminAuth.ts).
const ADMIN_PHONE = '714545776'; // Anjala

const EMPTY_FORM = {
  id: null,
  title: '',
  body: '',
  category: 'past',
  order: '',
  youtubeUrl: '',
  linkUrl: '',
  imageUrl: '',
  eventType: '',
};

export default function ProjectsManager() {
  const projects = useQuery(fn.list, {});
  const generateUploadUrl = useMutation(fn.generateUploadUrl);
  const addProject = useMutation(fn.add);
  const updateProject = useMutation(fn.update);
  const removeProject = useMutation(fn.remove);

  const [adminKey, setAdminKey] = useState(() => localStorage.getItem('BPSL_ADMIN_KEY') || '');
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const saveAdminKey = (k) => {
    const v = (k || '').trim();
    setAdminKey(v);
    if (v) localStorage.setItem('BPSL_ADMIN_KEY', v);
    else localStorage.removeItem('BPSL_ADMIN_KEY');
  };

  const creds = () => ({ actorPhone: ADMIN_PHONE, adminKey });

  const { upcoming, past } = useMemo(() => {
    const list = projects || [];
    return {
      upcoming: list.filter((p) => p.category === 'upcoming'),
      past: list.filter((p) => p.category !== 'upcoming'),
    };
  }, [projects]);

  const startNew = () => { setForm(EMPTY_FORM); setFile(null); setError(''); };
  const startEdit = (p) => {
    setForm({
      id: p.id, title: p.title || '', body: p.body || '', category: p.category || 'past',
      order: typeof p.order === 'number' ? String(p.order) : '',
      youtubeUrl: p.youtubeUrl || '', linkUrl: p.linkUrl || '', imageUrl: p.imageUrl || '',
      eventType: p.eventType || '',
    });
    setFile(null); setError('');
  };

  const onField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Upload a file to Convex File Storage; returns its storageId.
  const uploadFile = async (f) => {
    const url = await generateUploadUrl(creds());
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': f.type }, body: f });
    if (!res.ok) throw new Error('Upload failed (' + res.status + ')');
    const json = await res.json();
    if (!json.storageId) throw new Error('No storageId returned');
    return json.storageId;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!adminKey) { setError('Enter the admin key first.'); return; }
    if (!form.title.trim()) { setError('Title is required.'); return; }

    setBusy(true); setError('');
    try {
      let storageId;
      if (file) storageId = await uploadFile(file);

      const base = {
        ...creds(),
        title: form.title.trim(),
        body: form.body,
        category: form.category,
        youtubeUrl: form.youtubeUrl.trim(),
        linkUrl: form.linkUrl.trim(),
        eventType: form.eventType,
      };
      if (form.order !== '') base.order = Number(form.order);

      if (form.id) {
        const args = { ...base, id: form.id };
        if (storageId) args.storageId = storageId;
        await updateProject(args);
      } else {
        if (storageId) base.storageId = storageId;
        await addProject(base);
      }
      startNew();
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (p) => {
    if (!adminKey) { setError('Enter the admin key first.'); return; }
    if (!confirm('Delete "' + (p.title || 'this project') + '"?')) return;
    setBusy(true); setError('');
    try {
      await removeProject({ ...creds(), id: p.id });
      if (form.id === p.id) startNew();
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  };

  const handleError = (err) => {
    const msg = (err && err.message) ? err.message : String(err);
    if (msg.includes('UNAUTHORIZED') || msg.includes('ADMIN_KEY_NOT_CONFIGURED')) {
      saveAdminKey('');
      setError('Admin key rejected. Re-enter it and try again.');
    } else {
      setError(msg);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* Admin key bar */}
      <div className="flex items-center gap-3 bg-gray-900/40 border border-gray-800 rounded-lg p-3">
        <KeyRound size={16} className={adminKey ? 'text-green-500' : 'text-pink-400'} />
        <input
          type="password"
          value={adminKey}
          onChange={(e) => saveAdminKey(e.target.value)}
          placeholder="Admin key (stored on this device)"
          className="flex-1 bg-black/30 border border-gray-800 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-cyan-500/50"
        />
        <span className={`text-xs ${adminKey ? 'text-green-500' : 'text-gray-500'}`}>
          {adminKey ? 'set' : 'required'}
        </span>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/40 text-red-300 text-sm rounded-lg p-3">{error}</div>
      )}

      {/* Editor form */}
      <form onSubmit={handleSubmit} className="bg-gray-900/40 border border-gray-800 rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm tracking-widest text-pink-200/70 uppercase">
            {form.id ? 'Edit project' : 'New project'}
          </h3>
          {form.id && (
            <button type="button" onClick={startNew} className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
              <X size={14} /> Cancel edit
            </button>
          )}
        </div>

        <input value={form.title} onChange={onField('title')} placeholder="Title"
          className="w-full bg-black/30 border border-gray-800 rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-cyan-500/50" />

        <textarea value={form.body} onChange={onField('body')} placeholder="Description (blank line between paragraphs)" rows={4}
          className="w-full bg-black/30 border border-gray-800 rounded px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-cyan-500/50" />

        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-gray-500 uppercase tracking-wider">Category
            <select value={form.category} onChange={onField('category')}
              className="mt-1 w-full bg-black/30 border border-gray-800 rounded px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-cyan-500/50">
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
          </label>
          <label className="text-xs text-gray-500 uppercase tracking-wider">Order (optional)
            <input type="number" value={form.order} onChange={onField('order')} placeholder="auto"
              className="mt-1 w-full bg-black/30 border border-gray-800 rounded px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-cyan-500/50" />
          </label>
        </div>

        <div className="relative">
          <Youtube size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input value={form.youtubeUrl} onChange={onField('youtubeUrl')} placeholder="YouTube URL (optional)"
            className="w-full bg-black/30 border border-gray-800 rounded pl-9 pr-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-cyan-500/50" />
        </div>
        <div className="relative">
          <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input value={form.linkUrl} onChange={onField('linkUrl')} placeholder="Read-more link (optional)"
            className="w-full bg-black/30 border border-gray-800 rounded pl-9 pr-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-cyan-500/50" />
        </div>

        <label className="text-xs text-gray-500 uppercase tracking-wider block">Event Type (optional)
          <select value={form.eventType} onChange={onField('eventType')}
            className="mt-1 w-full bg-black/30 border border-gray-800 rounded px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-cyan-500/50">
            <option value="">None (Regular Project)</option>
            <option value="collaborative">Collaborative Event</option>
            <option value="community">Community Event</option>
          </select>
        </label>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
            <ImageIcon size={16} className="text-pink-400" />
            <span>{file ? file.name : (form.imageUrl ? 'Replace cover image' : 'Add cover image')}</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          {(file || form.imageUrl) && (
            <img src={file ? URL.createObjectURL(file) : form.imageUrl} alt="" className="h-12 w-12 object-cover rounded border border-gray-800" />
          )}
        </div>

        <button type="submit" disabled={busy}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 disabled:opacity-50 text-black font-semibold py-2.5 rounded uppercase tracking-wider text-sm transition-all">
          {busy ? <Loader size={16} className="animate-spin" /> : (form.id ? <Save size={16} /> : <Plus size={16} />)}
          {form.id ? 'Save changes' : 'Add project'}
        </button>
      </form>

      {/* Lists */}
      {projects === undefined ? (
        <div className="flex justify-center py-10"><Loader className="animate-spin text-cyan-500" /></div>
      ) : (
        <div className="space-y-8">
          <ProjectGroup title="Upcoming" items={upcoming} onEdit={startEdit} onDelete={handleDelete} editingId={form.id} />
          <ProjectGroup title="Past" items={past} onEdit={startEdit} onDelete={handleDelete} editingId={form.id} />
        </div>
      )}
    </div>
  );
}

function ProjectGroup({ title, items, onEdit, onDelete, editingId }) {
  return (
    <div>
      <h3 className="text-xs tracking-widest text-pink-200/70 uppercase mb-4">{title} ({items.length})</h3>
      {items.length === 0 ? (
        <p className="text-gray-600 text-sm">None yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((p) => (
            <div key={p.id}
              className={`flex gap-3 p-3 rounded-lg border bg-gray-900/30 ${editingId === p.id ? 'border-cyan-500/60' : 'border-gray-800'}`}>
              <div className="h-16 w-16 shrink-0 rounded overflow-hidden bg-black/40 flex items-center justify-center">
                {p.imageUrl ? <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                  : p.youtubeUrl ? <Youtube size={20} className="text-gray-600" />
                  : <ImageIcon size={20} className="text-gray-700" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-200 font-medium truncate flex items-center gap-2">
                  <span className="truncate">{p.title}</span>
                  {p.eventType === 'collaborative' && (
                    <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-semibold bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 rounded">
                      Collaborative
                    </span>
                  )}
                  {p.eventType === 'community' && (
                    <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 rounded">
                      Community
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 line-clamp-2">{p.body}</div>
                <div className="text-[10px] text-gray-600 mt-1">order {p.order}</div>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => onEdit(p)} className="text-cyan-400 hover:text-cyan-300"><Edit3 size={16} /></button>
                <button onClick={() => onDelete(p)} className="text-red-400 hover:text-red-300"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
