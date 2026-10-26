import React, { useState } from 'react';
import { Photo } from '../types';
import { Upload, X, Camera, Check } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (newPhoto: Photo) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUpload }) => {
  const [title, setTitle] = useState('');
  const [camera, setCamera] = useState('Leica M11');
  const [lens, setLens] = useState('Noctilux-M 50mm f/0.95');
  const [shoot, setShoot] = useState<'fashion' | 'wedding' | 'arch'>('fashion');
  const [aperture, setAperture] = useState('f/1.4');
  const [shutter, setShutter] = useState('1/1000s');
  const [iso, setIso] = useState('64');
  const [imageUrl, setImageUrl] = useState(
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const sampleImages = [
    {
      label: 'Editorial Silhouette',
      url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85'
    },
    {
      label: 'Runway Couture',
      url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=85'
    },
    {
      label: 'Ceremony Sunlight',
      url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85'
    },
    {
      label: 'Brutalist Architecture',
      url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=85'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const shootLabelMap = {
        fashion: 'Autumn Couture & Runway',
        wedding: 'Sharma & Mehta Ceremony',
        arch: 'Urban Geometries & Brutalism'
      };

      const newPhoto: Photo = {
        id: `p-${Date.now()}`,
        title: title.trim(),
        url: imageUrl,
        camera,
        lens,
        aperture,
        shutter,
        iso,
        dimensions: '9528 × 6328',
        shoot,
        shootLabel: shootLabelMap[shoot],
        score: Math.floor(Math.random() * 8) + 92,
        isFavorite: false,
        inActivePortfolio: false
      };

      onUpload(newPhoto);
      setIsSubmitting(false);
      setTitle('');
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-[#e8e3dc] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-[#e8e3dc] flex items-center justify-between bg-[#fbf9f5]">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#c45a2c]" />
            <h3 className="font-serif text-lg font-medium text-[#242120]">Ingest RAW Photograph</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#8a8175] hover:text-[#242120] hover:bg-[#ede7df] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#242120] mb-1">
              Photograph Title / Monograph Plate Name *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Scaffolding in Low Winter Sun"
              className="w-full bg-[#fbf9f5] border border-[#e8e3dc] rounded-lg px-3 py-2 text-sm text-[#242120] focus:outline-none focus:border-[#c45a2c]"
            />
          </div>

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
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#242120] mb-1">Shoot Category</label>
              <select
                value={shoot}
                onChange={(e) => setShoot(e.target.value as any)}
                className="w-full bg-[#fbf9f5] border border-[#e8e3dc] rounded-lg px-2.5 py-2 text-xs text-[#242120]"
              >
                <option value="fashion">Fashion & Runway</option>
                <option value="wedding">Wedding & Ceremony</option>
                <option value="arch">Urban & Architecture</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-mono text-[#8a8175] mb-1">APERTURE</label>
              <input
                type="text"
                value={aperture}
                onChange={(e) => setAperture(e.target.value)}
                className="w-full bg-[#fbf9f5] border border-[#e8e3dc] rounded-lg px-2.5 py-1.5 text-xs text-[#242120]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-[#8a8175] mb-1">SHUTTER</label>
              <input
                type="text"
                value={shutter}
                onChange={(e) => setShutter(e.target.value)}
                className="w-full bg-[#fbf9f5] border border-[#e8e3dc] rounded-lg px-2.5 py-1.5 text-xs text-[#242120]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-[#8a8175] mb-1">ISO</label>
              <input
                type="text"
                value={iso}
                onChange={(e) => setIso(e.target.value)}
                className="w-full bg-[#fbf9f5] border border-[#e8e3dc] rounded-lg px-2.5 py-1.5 text-xs text-[#242120]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#242120] mb-1.5">
              Select Sample Studio Capture
            </label>
            <div className="grid grid-cols-4 gap-2">
              {sampleImages.map((img, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setImageUrl(img.url)}
                  className={`relative rounded-lg overflow-hidden border-2 h-16 transition-all cursor-pointer ${
                    imageUrl === img.url ? 'border-[#c45a2c] ring-2 ring-[#c45a2c]/30' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                  {imageUrl === img.url && (
                    <div className="absolute inset-0 bg-[#c45a2c]/30 flex items-center justify-center text-white">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-[#f5ede3] rounded-lg border border-[#edd5c3] text-[11px] text-[#8a4422] flex items-center gap-2">
            <Camera className="w-4 h-4 shrink-0" />
            <span>EXIF telemetry will be automatically ingested into the 100 GB vault.</span>
          </div>

          <div className="pt-2 flex justify-end gap-2">
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
              className="px-5 py-2 bg-[#c45a2c] hover:bg-[#b04f24] text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Ingesting RAW...' : 'Confirm Ingest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
