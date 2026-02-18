import { useState, useRef } from 'react';
import { GripVertical, Trash2, Plus } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import type { FieldDefinition } from '../../config/fields';

interface Props {
  onSaved: () => void;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

const FIELD_TYPES = ['text', 'number', 'date'];

export default function FieldEditor({ onSaved }: Props) {
  const { fieldDefinitions, setFieldDefinitions } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState('text');
  const [newRequired, setNewRequired] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const dragIdx = useRef<number | null>(null);
  const overIdx = useRef<number | null>(null);

  function handleDelete(name: string) {
    if (deleteConfirm === name) {
      setFieldDefinitions(fieldDefinitions.filter((f) => f.name !== name));
      setDeleteConfirm(null);
      onSaved();
    } else {
      setDeleteConfirm(name);
    }
  }

  function handleToggleRequired(name: string) {
    setFieldDefinitions(
      fieldDefinitions.map((f) =>
        f.name === name ? { ...f, required: !f.required } : f
      )
    );
    onSaved();
  }

  function handleAdd() {
    if (!newLabel.trim()) return;
    const name = slugify(newLabel) || `field_${Date.now()}`;
    const field: FieldDefinition = { name, label: newLabel.trim(), type: newType as FieldDefinition['type'], required: newRequired };
    setFieldDefinitions([...fieldDefinitions, field]);
    setNewLabel('');
    setNewType('text');
    setNewRequired(false);
    setShowAdd(false);
    onSaved();
  }

  function handleDragStart(idx: number) {
    dragIdx.current = idx;
  }

  function handleDragOver(idx: number) {
    overIdx.current = idx;
  }

  function handleDrop() {
    if (dragIdx.current === null || overIdx.current === null) return;
    if (dragIdx.current === overIdx.current) return;
    const updated = [...fieldDefinitions];
    const [moved] = updated.splice(dragIdx.current, 1);
    updated.splice(overIdx.current, 0, moved);
    setFieldDefinitions(updated);
    dragIdx.current = null;
    overIdx.current = null;
    onSaved();
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {fieldDefinitions.map((field, idx) => (
          <div
            key={field.name}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => { e.preventDefault(); handleDragOver(idx); }}
            onDrop={handleDrop}
            className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors"
          >
            <GripVertical size={15} className="text-slate-300 cursor-grab flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-slate-700">{field.label}</span>
                <code className="text-xs text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                  {field.name}
                </code>
                <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium capitalize">
                  {field.type}
                </span>
              </div>
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0">
              <span className="text-xs text-slate-500">Required</span>
              <div
                onClick={() => handleToggleRequired(field.name)}
                className={`relative w-8 h-4 rounded-full transition-colors cursor-pointer ${
                  field.required ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${
                    field.required ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </div>
            </label>
            <button
              onClick={() => handleDelete(field.name)}
              className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                deleteConfirm === field.name
                  ? 'bg-red-500 text-white'
                  : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
              }`}
              title={deleteConfirm === field.name ? 'Click again to confirm' : 'Delete field'}
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      {!showAdd ? (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 w-full p-3 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-500 hover:border-blue-300 hover:text-blue-600 transition-colors"
        >
          <Plus size={15} />
          Add Field
        </button>
      ) : (
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
          <p className="text-sm font-medium text-slate-700">New Field</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Label</label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Field Label"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                autoFocus
              />
              {newLabel && (
                <p className="text-xs text-slate-400 mt-1 font-mono">{slugify(newLabel)}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => setNewRequired((v) => !v)}
              className={`relative w-8 h-4 rounded-full transition-colors cursor-pointer ${
                newRequired ? 'bg-blue-600' : 'bg-slate-200'
              }`}
            >
              <div
                className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${
                  newRequired ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </div>
            <span className="text-sm text-slate-600">Required field</span>
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!newLabel.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              Add Field
            </button>
            <button
              onClick={() => { setShowAdd(false); setNewLabel(''); }}
              className="px-4 py-2 bg-white text-slate-600 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
