import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { anyApi } from 'convex/server';
import { Plus, Trash2, Image as ImageIcon, Loader, KeyRound, Save } from 'lucide-react';

// References to the website's Convex functions (convex/homeGallery.ts).
// These images appear in the homepage hero gallery on blackpinksrilanka.org.
const fn = {
  list: anyApi.homeGallery.list,
  generateUploadUrl: anyApi.homeGallery.generateUploadUrl,
  add: anyApi.homeGallery.add,
  update: anyApi.homeGallery.update,
  remove: anyApi.homeGallery.remove,
  projectsList: anyApi.projects.list,
};

// Admin identity: a phone in ALWAYS_ALLOWED_PHONES (convex/adminAuth.ts).
const ADMIN_PHONE = '714545776'; // Anjala

export default function GalleryManager() {
  const images = useQuery(fn.list, {});
  const projects = useQuery(fn.projectsList, {});
  const generateUploadUrl = useMutation(fn.generateUploadUrl);
  const addImage = useMutation(fn.add);
  const updateImage = useMutation(fn.update);
  const removeImage = useMutation(fn.remove);

  const projectList = projects || [];
  const projectTitleById = {};
  projectList.forEach((p) => { projectTitleById[p.id] = p.title; });

  const [adminKey, setAdminKey] = useState(() => localStorage.getItem('BPSL_ADMIN_KEY') || '');
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [order, setOrder] = useState('');
  const [projectId, setProjectId] = useState(''); // '' = homepage only
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const saveAdminKey = (k) => {
    const v = (k || '').trim();
    setAdminKey(v);
    if (v) localStorage.setItem('BPSL_ADMIN_KEY', v);
    else localStorage.removeItem('BPSL_ADMIN_KEY');
  };

  const creds = () => ({ actorPhone: ADMIN_PHONE, adminKey });

  const handleError = (err) => {
    const msg = (err && err.message) ? err.message : String(err);
    if (msg.includes('UNAUTHORIZED') || msg.includes('ADMIN_KEY_NOT_CONFIGURED')) {
      saveAdminKey('');
      setError('Admin key rejected. Re-enter it and try again.');
    } else {
      setError(msg);
    }
  };

  // Upload a file to Convex File Storage; returns its storageId.
  const uploadFile = async (f) => {
    const url = await generateUploadUrl(creds());
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': f.type }, body: f });
    if (!res.ok) throw new Error('Upload failed (' + res.status + ')');
    const json = await res.json();
    if (!json.storageId) throw new Error('No storageId returned');
    return json.storageId;
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!adminKey) { setError('Enter the admin key first.'); return; }
    if (!file) { setError('Choose an image to upload.'); return; }

    setBusy(true); setError('');
    try {
      const storageId = await uploadFile(file);
      const args = { ...creds(), storageId, caption: caption.trim() };
      if (order !== '') args.order = Number(order);
      if (projectId) args.projectId = projectId;
      await addImage(args);
      setFile(null); setCaption(''); setOrder(''); setProjectId('');
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (img) => {
    if (!adminKey) { setError('Enter the admin key first.'); return; }
    if (!confirm('Delete this gallery image?')) return;
    setBusy(true); setError('');
    try {
      await removeImage({ ...creds(), id: img.id });
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  };

  const saveMeta = async (img, nextCaption, nextOrder, nextProjectId, onDone) => {
    try {
      await updateImage({
        ...creds(),
        id: img.id,
        caption: nextCaption.trim(),
        order: Number(nextOrder) || 0,
        projectId: nextProjectId || null, // null unlinks (homepage)
      });
      onDone(true);
    } catch (err) {
      onDone(false);
      handleError(err);
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

      <p className="text-xs text-gray-500">
        These images appear in the homepage hero gallery on blackpinksrilanka.org.
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/40 text-red-300 text-sm rounded-lg p-3">{error}</div>
      )}

      {/* Upload form */}
      <form onSubmit={handleAdd} className="bg-gray-900/40 border border-gray-800 rounded-lg p-5 space-y-4">
        <h3 className="text-sm tracking-widest text-pink-200/70 uppercase">Add gallery image</h3>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
            <ImageIcon size={16} className="text-pink-400" />
            <span>{file ? file.name : 'Choose image'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          {file && <img src={URL.createObjectURL(file)} alt="" className="h-12 w-12 object-cover rounded border border-gray-800" />}
        </div>

        <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption (optional)"
          className="w-full bg-black/30 border border-gray-800 rounded px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-cyan-500/50" />

        <label className="block text-xs text-gray-500 uppercase tracking-wider">Order (optional)
          <input type="number" value={order} onChange={(e) => setOrder(e.target.value)} placeholder="auto"
            className="mt-1 w-full bg-black/30 border border-gray-800 rounded px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-cyan-500/50" />
        </label>

        <label className="block text-xs text-gray-500 uppercase tracking-wider">Link to project
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)}
            className="mt-1 w-full bg-black/30 border border-gray-800 rounded px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-cyan-500/50">
            <option value="">Homepage gallery (no project)</option>
            {projectList.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </label>

        <button type="submit" disabled={busy}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 disabled:opacity-50 text-black font-semibold py-2.5 rounded uppercase tracking-wider text-sm transition-all">
          {busy ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
          Add image
        </button>
      </form>

      {/* List */}
      {images === undefined ? (
        <div className="flex justify-center py-10"><Loader className="animate-spin text-cyan-500" /></div>
      ) : (
        <div>
          <h3 className="text-xs tracking-widest text-pink-200/70 uppercase mb-4">Gallery images ({images.length})</h3>
          {images.length === 0 ? (
            <p className="text-gray-600 text-sm">None yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((img) => (
                <GalleryTile key={img.id} img={img} projects={projectList} onSave={saveMeta} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GalleryTile({ img, projects, onSave, onDelete }) {
  const [caption, setCaption] = useState(img.caption || '');
  const [order, setOrder] = useState(typeof img.order === 'number' ? String(img.order) : '0');
  const [projectId, setProjectId] = useState(img.projectId || '');
  const [saved, setSaved] = useState(false);

  return (
    <div className="bg-gray-900/30 border border-gray-800 rounded-lg overflow-hidden flex flex-col">
      <img src={img.url} alt={img.caption || ''} className="w-full aspect-[4/5] object-cover bg-black" />
      <div className="p-2 space-y-2">
        <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption"
          className="w-full bg-black/30 border border-gray-800 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-cyan-500/50" />
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)}
          className="w-full bg-black/30 border border-gray-800 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-cyan-500/50">
          <option value="">Homepage gallery</option>
          {(projects || []).map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <div className="flex gap-2">
          <input type="number" value={order} onChange={(e) => setOrder(e.target.value)} placeholder="Order"
            className="w-16 bg-black/30 border border-gray-800 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-cyan-500/50" />
          <button onClick={() => onSave(img, caption, order, projectId, (ok) => { if (ok) { setSaved(true); setTimeout(() => setSaved(false), 1200); } })}
            className="flex-1 flex items-center justify-center gap-1 bg-cyan-900/30 hover:bg-cyan-800/40 text-cyan-300 rounded px-2 py-1 text-xs">
            <Save size={12} /> {saved ? 'Saved' : 'Save'}
          </button>
          <button onClick={() => onDelete(img)} className="bg-red-900/30 hover:bg-red-800/40 text-red-300 rounded px-2 py-1">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
