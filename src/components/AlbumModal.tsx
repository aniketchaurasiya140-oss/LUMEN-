import React, { useState } from 'react';
import { Photo, Album } from '../types';
import { FolderPlus, X, Check, Image as ImageIcon } from 'lucide-react';

interface AlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: Photo[];
  onCreateAlbum: (title: string, description: string, photoIds: string[]) => Promise<void>;
}

export const AlbumModal: React.FC<AlbumModalProps> = ({
  isOpen,
  onClose,
  photos,
  onCreateAlbum
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const toggleSelectPhoto = (id: string) => {
    setSelectedPhotoIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Album title is required.');
      return;
    }

    setIsSubmitting(true);
    await onCreateAlbum(title.trim(), description.trim(), selectedPhotoIds);
    setIsSubmitting(false);
    setTitle('');
    setDescription('');
    setSelectedPhotoIds([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-[#e8e3dc] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#e8e3dc] flex items-center justify-between bg-[#fbf9f5] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#c45a2c]/10 text-[#c45a2c] flex items-center justify-center">
              <FolderPlus className="w-4 h-4 text-[#c45a2c]" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-medium text-[#242120]">
                Create Studio Album
              </h3>
              <p className="text-[11px] font-mono text-[#8a8175]">
                Organize photographs into monographs & client galleries
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#8a8175] hover:text-[#242120] hover:bg-[#ede7df] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#242120] mb-1">
              Album Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="e.g. European Couture 2026 Edition"
              className="w-full bg-[#fbf9f5] border border-[#e8e3dc] rounded-lg px-3 py-2 text-xs text-[#242120] focus:outline-none focus:border-[#c45a2c]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#242120] mb-1">
              Description / Curatorial Premise
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Silver-gelatin chiaroscuro series shot on Leica M11 & Noctilux 50mm f/0.95"
              className="w-full bg-[#fbf9f5] border border-[#e8e3dc] rounded-lg px-3 py-2 text-xs text-[#242120] focus:outline-none focus:border-[#c45a2c]"
            />
          </div>

          {/* Select Photos from Archive */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#242120]">
                Select Photographs for this Album ({selectedPhotoIds.length} selected)
              </label>
              <button
                type="button"
                onClick={() => {
                  if (selectedPhotoIds.length === photos.length) {
                    setSelectedPhotoIds([]);
                  } else {
                    setSelectedPhotoIds(photos.map((p) => p.id));
                  }
                }}
                className="text-[11px] text-[#c45a2c] hover:underline cursor-pointer"
              >
                {selectedPhotoIds.length === photos.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-2 bg-[#fbf9f5] border border-[#e8e3dc] rounded-xl">
              {photos.map((p) => {
                const isSelected = selectedPhotoIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleSelectPhoto(p.id)}
                    className={`relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all aspect-square bg-[#121110] ${
                      isSelected
                        ? 'border-[#c45a2c] ring-2 ring-[#c45a2c]/30'
                        : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={p.url} alt={p.title} className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#c45a2c] text-white flex items-center justify-center shadow-sm">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                      <div className="text-[9px] font-mono text-white truncate">{p.title}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex justify-end gap-2 border-t border-[#e8e3dc]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#e8e3dc] rounded-lg text-xs font-medium text-[#6e6659] hover:bg-[#f1ede6] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-5 py-2 bg-[#c45a2c] hover:bg-[#b04f24] text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Album...</span>
                </>
              ) : (
                <>
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Save Album</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
