import React from 'react';
import { Photo, Role } from '../types';
import { X, Star, Trash2, Camera, Info, ShieldAlert, Award } from 'lucide-react';

interface PhotoDetailDrawerProps {
  photo: Photo | null;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onDeletePhoto: (id: string) => void;
  currentRole: Role;
}

export const PhotoDetailDrawer: React.FC<PhotoDetailDrawerProps> = ({
  photo,
  onClose,
  onToggleFavorite,
  onDeletePhoto,
  currentRole
}) => {
  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-[#ffffff] h-full shadow-2xl flex flex-col border-l border-[#e8e3dc] animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 px-6 border-b border-[#e8e3dc] flex items-center justify-between bg-[#fbf9f5]">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#c45a2c]" />
            <h3 className="font-semibold text-sm text-[#242120]">EXIF Technical Inspection</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#8a8175] hover:text-[#242120] hover:bg-[#ede7df] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Photo Preview */}
          <div className="relative rounded-lg overflow-hidden border border-[#e8e3dc] bg-[#1a1715] shadow-sm">
            <img
              src={photo.url}
              alt={photo.title}
              className="w-full h-64 object-cover object-center"
            />
            <div className="absolute top-3 left-3 flex gap-1.5">
              <span className="bg-black/70 backdrop-blur-md text-white text-[10px] font-mono px-2 py-0.5 rounded">
                SCORE: {photo.score}%
              </span>
              <span className="bg-[#c45a2c] text-white text-[10px] font-mono px-2 py-0.5 rounded uppercase">
                {photo.shoot}
              </span>
            </div>
          </div>

          <div>
            <h2 className="font-serif text-xl font-medium text-[#242120]">{photo.title}</h2>
            <p className="text-xs text-[#8a8175] font-mono mt-1">ID: {photo.id} · RAW Archive</p>
          </div>

          {/* Technical EXIF Grid */}
          <div className="bg-[#fbf9f5] rounded-xl p-4 border border-[#e8e3dc] space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-[#6e6659] uppercase tracking-wider">
              <Info className="w-3.5 h-3.5 text-[#c45a2c]" />
              <span>Optics & Sensor Calibration</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-white rounded-lg border border-[#e8e3dc]">
                <div className="text-[10px] font-mono text-[#8a8175]">CAMERA BODY</div>
                <div className="font-semibold text-[#242120] mt-0.5">{photo.camera}</div>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-[#e8e3dc]">
                <div className="text-[10px] font-mono text-[#8a8175]">LENS OPTIC</div>
                <div className="font-semibold text-[#242120] mt-0.5">{photo.lens}</div>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-[#e8e3dc]">
                <div className="text-[10px] font-mono text-[#8a8175]">APERTURE</div>
                <div className="font-semibold text-[#242120] mt-0.5">{photo.aperture}</div>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-[#e8e3dc]">
                <div className="text-[10px] font-mono text-[#8a8175]">SHUTTER SPEED</div>
                <div className="font-semibold text-[#242120] mt-0.5">{photo.shutter}</div>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-[#e8e3dc]">
                <div className="text-[10px] font-mono text-[#8a8175]">ISO SENSITIVITY</div>
                <div className="font-semibold text-[#242120] mt-0.5">{photo.iso}</div>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-[#e8e3dc]">
                <div className="text-[10px] font-mono text-[#8a8175]">NATIVE RESOLUTION</div>
                <div className="font-semibold text-[#242120] mt-0.5">{photo.dimensions}</div>
              </div>
            </div>
          </div>

          {/* AI Curatorial Assessment */}
          <div className="bg-[#eaf4ef] p-4 rounded-xl border border-[#c3dfce] text-xs">
            <div className="flex items-center gap-1.5 text-[#2b6e4e] font-semibold mb-1">
              <Award className="w-4 h-4" />
              <span>Curatorial Metric: {photo.score}% Monograph Readiness</span>
            </div>
            <p className="text-[#2b6e4e]/90 text-[11px] leading-relaxed">
              Tonal gradation across highlights and shadow falloff complies with silver-gelatin archival print standards.
            </p>
          </div>

          {/* Client Feedback Log if available */}
          {photo.clientNotes && photo.clientNotes.length > 0 && (
            <div className="bg-[#fef3c7] p-3.5 rounded-xl border border-[#fde68a] text-xs">
              <div className="font-semibold text-[#92400e] text-[11px] uppercase font-mono mb-1">
                Client Reviewer Feedback
              </div>
              <p className="text-[#78350f] text-xs italic">"{photo.clientNotes[0]}"</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 border-t border-[#e8e3dc] bg-[#fbf9f5] flex items-center justify-between gap-3">
          <button
            onClick={() => onToggleFavorite(photo.id)}
            className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              photo.isFavorite
                ? 'bg-[#c45a2c] border-[#c45a2c] text-white'
                : 'bg-white border-[#e8e3dc] text-[#242120] hover:bg-[#f1ede6]'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${photo.isFavorite ? 'fill-current' : ''}`} />
            <span>{photo.isFavorite ? 'Favorited Plate' : 'Mark as Favorite'}</span>
          </button>

          {currentRole === 'OWNER' ? (
            <button
              onClick={() => onDeletePhoto(photo.id)}
              className="py-2 px-4 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete RAW</span>
            </button>
          ) : (
            <span
              title="Only Studio Owner has permission to delete master RAWs"
              className="py-2 px-3 rounded-lg border border-[#e8e3dc] bg-gray-100 text-[#8a8175] text-[11px] font-mono flex items-center gap-1 cursor-not-allowed"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              <span>Delete Restricted</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
