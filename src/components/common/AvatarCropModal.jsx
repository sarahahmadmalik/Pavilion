import React, { useState, useRef, useEffect } from 'react';
import { Modal } from './Modal.jsx';
import { ZoomIn, RotateCw, Upload, Check } from 'lucide-react';

export const AvatarCropModal = ({ isOpen, onClose, imageFile, onSave }) => {
  const canvasRef = useRef(null);
  const [imgObj, setImgObj] = useState(null);
  const [zoom, setZoom] = useState(1.1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!imageFile) {
      setImgObj(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    const img = new Image();
    img.onload = () => {
      setImgObj(img);
      setZoom(1.1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgObj) return;
    const ctx = canvas.getContext('2d');
    const size = 260;
    ctx.clearRect(0, 0, size, size);

    ctx.save();
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, size, size);

    // Draw image with pan, zoom, rotation
    ctx.translate(size / 2 + offset.x, size / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);

    const baseScale = Math.max(size / imgObj.width, size / imgObj.height);
    const scale = baseScale * zoom;
    const drawW = imgObj.width * scale;
    const drawH = imgObj.height * scale;
    ctx.drawImage(imgObj, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Circular WhatsApp-style crop overlay
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.58)';
    ctx.beginPath();
    ctx.rect(0, 0, size, size);
    ctx.arc(size / 2, size / 2, size / 2 - 12, 0, Math.PI * 2, true);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }, [imgObj, zoom, rotation, offset]);

  const handlePointerDown = (e) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handlePointerMove = (e) => {
    if (!dragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handlePointerUp = () => setDragging(false);

  const handleConfirm = async () => {
    if (!imgObj) return;
    setSaving(true);
    const out = document.createElement('canvas');
    out.width = 400;
    out.height = 400;
    const ctx = out.getContext('2d');
    const ratio = 400 / 260;

    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, 400, 400);
    ctx.translate(200 + offset.x * ratio, 200 + offset.y * ratio);
    ctx.rotate((rotation * Math.PI) / 180);

    const baseScale = Math.max(400 / imgObj.width, 400 / imgObj.height);
    const scale = baseScale * zoom;
    const drawW = imgObj.width * scale;
    const drawH = imgObj.height * scale;
    ctx.drawImage(imgObj, -drawW / 2, -drawH / 2, drawW, drawH);

    out.toBlob(async (blob) => {
      try {
        await onSave(blob);
      } finally {
        setSaving(false);
      }
    }, 'image/jpeg', 0.9);
  };

  return (
    <Modal isOpen={isOpen} onClose={saving ? () => {} : onClose} title="Edit Profile Photo" maxWidth="400px">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div
          style={{
            borderRadius: '14px',
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
            cursor: dragging ? 'grabbing' : 'grab',
            touchAction: 'none'
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <canvas ref={canvasRef} width={260} height={260} style={{ display: 'block' }} />
        </div>

        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Drag photo to reposition • Use slider to zoom
        </p>

        {/* Zoom & Rotate Controls */}
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ZoomIn size={16} color="var(--text-muted)" />
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--color-primary)' }}
          />
          <button
            type="button"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="btn btn-secondary btn-sm"
            title="Rotate 90°"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <RotateCw size={14} /> Rotate
          </button>
        </div>

        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.25rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleConfirm} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            {saving ? <Upload size={15} /> : <Check size={15} />}
            {saving ? 'Uploading...' : 'Save Photo'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
