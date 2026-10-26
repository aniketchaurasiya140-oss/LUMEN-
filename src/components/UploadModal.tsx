import React, { useState, useRef } from 'react';
import { Photo, Category } from '../types';
import { supabaseService } from '../services/supabaseService';
import {
  Upload,
  X,
  Camera,
  Check,
  Plus,
  AlertCircle,
  FileImage,
  Sparkles,
  Layers,
  HardDrive
} from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (newPhoto: Photo) => void;
  categories: Category[];
  onAddCategory: (categoryName: string) => Promise<{ success: boolean; error?: string; category?: Category }>;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  categories,
  onAddCategory
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [fileDetails, setFileDetails] = useState<{ sizeStr: string; sizeBytes: number; dimensions: string }>({
    sizeStr: '48.2 MB',
    sizeBytes: 50541363,
    dimensions: '9528 × 6328'
  });

  const [title, setTitle] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('cat-fashion');
  const [camera, setCamera] = useState('Leica M11');
  const [lens, setLens] = useState('Noctilux-M 50mm f/0.95');
  const [aperture, setAperture] = useState('f/1.4');
  const [shutter, setShutter] = useState('1/1000s');
  const [iso, setIso] = useState('64');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Inline Category Creation State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  if (!isOpen) return null;

  // Format bytes to human readable format
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Handle local device file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Auto-generate title from filename if empty
    if (!title) {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
      setTitle(cleanName);
    }

    // Determine dimensions via Image
    const img = new Image();
    img.src = objectUrl;
    img.onload = () => {
      setFileDetails({
        sizeStr: formatBytes(file.size),
        sizeBytes: file.size,
        dimensions: `${img.naturalWidth} × ${img.naturalHeight}`
      });
    };
  };

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      if (!title) {
        setTitle(
          file.name
            .replace(/\.[^/.]+$/, '')
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase())
        );
      }
      const img = new Image();
      img.src = objectUrl;
      img.onload = () => {
        setFileDetails({
          sizeStr: formatBytes(file.size),
          sizeBytes: file.size,
          dimensions: `${img.naturalWidth} × ${img.naturalHeight}`
        });
      };
    }
  };

  // Handle inline category submission
  const handleCreateCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryError('');
    setIsCreatingCategory(true);

    const res = await onAddCategory(newCategoryName);
    setIsCreatingCategory(false);

    if (!res.success) {
      setCategoryError(res.error || 'Failed to create category');
    } else if (res.category) {
      setSelectedCategoryId(res.category.id);
      setNewCategoryName('');
      setIsAddingCategory(false);
      setCategoryError('');
    }
  };

  // Handle upload form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setUploadProgress(20);

    let finalImageUrl = previewUrl || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85';
    let finalSizeBytes = fileDetails.sizeBytes;
    let finalDimensions = fileDetails.dimensions;

    // Upload local device file to Supabase Storage if file was picked
    if (selectedFile) {
      setUploadProgress(45);
      const uploadRes = await supabaseService.uploadDeviceFile(selectedFile);
      setUploadProgress(85);
      if (uploadRes.url) {
        finalImageUrl = uploadRes.url;
        finalSizeBytes = uploadRes.fileSize;
        finalDimensions = uploadRes.dimensions;
      }
    }

    const currentCat = categories.find((c) => c.id === selectedCategoryId);
    const categoryName = currentCat?.name || 'Fashion & Runway';

    const newPhoto: Photo = {
      id: `p-${Date.now()}`,
      title: title.trim(),
      url: finalImageUrl,
      camera,
      lens,
      aperture,
      shutter,
      iso,
      dimensions: finalDimensions,
      fileSize: finalSizeBytes,
      categoryId: selectedCategoryId,
      categoryName: categoryName,
      shoot: selectedCategoryId.replace('cat-', '') || 'fashion',
      shootLabel: categoryName,
      score: Math.floor(Math.random() * 8) + 92,
      isFavorite: false,
      inActivePortfolio: false,
      createdAt: new Date().toISOString()
    };

    setUploadProgress(100);
    setTimeout(() => {
      onUpload(newPhoto);
      setIsSubmitting(false);
      setTitle('');
      setSelectedFile(null);
      setPreviewUrl('');
      onClose();
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-[#e8e3dc] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#e8e3dc] flex items-center justify-between bg-[#fbf9f5] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#c45a2c]/10 text-[#c45a2c] flex items-center justify-center">
              <Upload className="w-4 h-4 text-[#c45a2c]" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-medium text-[#242120]">
                Ingest RAW Photograph
              </h3>
              <p className="text-[11px] font-mono text-[#8a8175]">
                Secure Cloud Vault: <span className="text-[#c45a2c]">lumen-raw-vault</span>
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* DEVICE FILE UPLOAD ZONE */}
          <div>
            <label className="block text-xs font-semibold text-[#242120] mb-1.5 flex items-center justify-between">
              <span>Select High-Resolution RAW / Image File from Device *</span>
              {selectedFile && (
                <span className="font-mono text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {fileDetails.sizeStr} · {fileDetails.dimensions}
                </span>
              )}
            </label>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,.dng,.raw,.cr3,.arw,.nef"
              onChange={handleFileChange}
              className="hidden"
            />

            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-[#d8d0c4] hover:border-[#c45a2c] bg-[#fbf9f5] hover:bg-[#f7f2ea] rounded-xl p-6 text-center cursor-pointer transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-[#f1ede6] group-hover:bg-[#f5ede3] text-[#8a8175] group-hover:text-[#c45a2c] flex items-center justify-center mx-auto mb-3 transition-colors">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="font-semibold text-sm text-[#242120]">
                  Click to browse from your device
                </div>
                <div className="text-[11px] text-[#8a8175] mt-1">
                  Drag and drop Leica DNG, Sony ARW, Hasselblad RAW, or JPEG/PNG
                </div>
                <div className="inline-flex items-center gap-1 mt-3 px-2.5 py-1 rounded-full bg-white border border-[#e8e3dc] text-[10px] font-mono text-[#6e6659]">
                  <HardDrive className="w-3 h-3 text-[#c45a2c]" />
                  <span>Max file size: 100 MB · Automatic EXIF Telemetry</span>
                </div>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-[#e8e3dc] bg-[#141210] group">
                <img
                  src={previewUrl}
                  alt="Upload preview"
                  className="w-full h-44 object-cover object-center"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-white/90 text-[#242120] text-xs font-medium hover:bg-white cursor-pointer"
                  >
                    Replace Image
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl('');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-red-600/90 text-white text-xs font-medium hover:bg-red-600 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
                <div className="absolute bottom-2 left-2 right-2 bg-black/75 backdrop-blur-md px-2.5 py-1.5 rounded-lg flex items-center justify-between text-white text-[11px] font-mono">
                  <span className="truncate max-w-[200px]">{selectedFile?.name || 'Local capture'}</span>
                  <span>{fileDetails.sizeStr}</span>
                </div>
              </div>
            )}
          </div>

          {/* Photograph Title */}
          <div>
            <label className="block text-xs font-semibold text-[#242120] mb-1">
              Photograph Title / Plate Monograph Name *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Carrara Light — Monolith Study"
              className="w-full bg-[#fbf9f5] border border-[#e8e3dc] rounded-lg px-3 py-2 text-xs text-[#242120] focus:outline-none focus:border-[#c45a2c]"
            />
          </div>

          {/* DYNAMIC CATEGORY DROPDOWN & INLINE ADDITION */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#242120]">
                Photography Category / Genre *
              </label>
              {!isAddingCategory && (
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(true)}
                  className="text-[11px] font-medium text-[#c45a2c] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Add New Category</span>
                </button>
              )}
            </div>

            {!isAddingCategory ? (
              <select
                value={selectedCategoryId}
                onChange={(e) => {
                  if (e.target.value === '__add_new__') {
                    setIsAddingCategory(true);
                  } else {
                    setSelectedCategoryId(e.target.value);
                  }
                }}
                className="w-full bg-[#fbf9f5] border border-[#e8e3dc] rounded-lg px-3 py-2 text-xs text-[#242120] cursor-pointer focus:outline-none focus:border-[#c45a2c]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.isCustom ? '★ Custom' : ''}
                  </option>
                ))}
                <option value="__add_new__">+ Add New Category...</option>
              </select>
            ) : (
              /* Inline Category Creation Field with Validation */
              <div className="p-3 bg-[#fbf9f5] border border-[#c45a2c]/50 rounded-xl space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#8a8175]">
                  <span className="font-semibold text-[#c45a2c]">CREATE CUSTOM CATEGORY</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCategory(false);
                      setCategoryError('');
                      setNewCategoryName('');
                    }}
                    className="text-[#8a8175] hover:text-[#242120]"
                  >
                    ✕ Cancel
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => {
                      setNewCategoryName(e.target.value);
                      if (categoryError) setCategoryError('');
                    }}
                    placeholder="Enter unique category name..."
                    className="flex-1 bg-white border border-[#e8e3dc] rounded-lg px-3 py-1.5 text-xs text-[#242120] focus:outline-none focus:border-[#c45a2c]"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleCreateCategorySubmit}
                    disabled={isCreatingCategory || !newCategoryName.trim()}
                    className="px-3 py-1.5 bg-[#c45a2c] hover:bg-[#b04f24] text-white rounded-lg text-xs font-medium disabled:opacity-50 cursor-pointer"
                  >
                    {isCreatingCategory ? 'Adding...' : 'Save Category'}
                  </button>
                </div>

                {categoryError && (
                  <div className="text-[11px] text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{categoryError}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Camera Body & Lens */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#242120] mb-1">Camera Body</label>
              <select
                value={camera}
                onChange={(e) => setCamera(e.target.value)}
                className="w-full bg-[#fbf9f5] border border-[#e8e3dc] rounded-lg px-2.5 py-2 text-xs text-[#242120]"
              >
                <option value="Leica M11">Leica M11</option>
                <option value="Hasselblad X2D 100C">Hasselblad X2D 100C</option>
                <option value="Sony A7R V">Sony A7R V</option>
                <option value="Canon EOS R5">Canon EOS R5</option>
                <option value="Nikon Z9">Nikon Z9</option>
                <option value="Fujifilm GFX 100 II">Fujifilm GFX 100 II</option>
                <option value="Leica Q3">Leica Q3</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#242120] mb-1">Lens Optic</label>
              <input
                type="text"
                value={lens}
                onChange={(e) => setLens(e.target.value)}
                placeholder="e.g. Noctilux-M 50mm f/0.95"
                className="w-full bg-[#fbf9f5] border border-[#e8e3dc] rounded-lg px-2.5 py-2 text-xs text-[#242120]"
              />
            </div>
          </div>

          {/* Technical EXIF Parameters */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-mono text-[#8a8175] mb-1">APERTURE</label>
              <input
                type="text"
                value={aperture}
                onChange={(e) => setAperture(e.target.value)}
                className="w-full bg-[#fbf9f5] border border-[#e8e3dc] rounded-lg px-2.5 py-1.5 text-xs text-[#242120]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-[#8a8175] mb-1">SHUTTER</label>
              <input
                type="text"
                value={shutter}
                onChange={(e) => setShutter(e.target.value)}
                className="w-full bg-[#fbf9f5] border border-[#e8e3dc] rounded-lg px-2.5 py-1.5 text-xs text-[#242120]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-[#8a8175] mb-1">ISO</label>
              <input
                type="text"
                value={iso}
                onChange={(e) => setIso(e.target.value)}
                className="w-full bg-[#fbf9f5] border border-[#e8e3dc] rounded-lg px-2.5 py-1.5 text-xs text-[#242120]"
              />
            </div>
          </div>

          {/* Storage Assurance Pill */}
          <div className="p-3 bg-[#f5ede3] rounded-xl border border-[#edd5c3] text-[11px] text-[#8a4422] flex items-center gap-2">
            <Camera className="w-4 h-4 shrink-0 text-[#c45a2c]" />
            <span>
              Real-time synchronization into Cloud Storage Vault with encrypted access control.
            </span>
          </div>

          {/* Progress Bar when Submitting */}
          {isSubmitting && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-[#8a8175]">
                <span>Uploading RAW master to Cloud Vault...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-[#eee8de] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#c45a2c] transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

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
                  <span>Ingesting RAW...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Confirm Ingest to Vault</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
