import React, { useState } from 'react';
import { Modal } from '../common/Modal.jsx';
import { QrCode, Scan, CheckCircle } from 'lucide-react';

export const BarcodeScannerModal = ({ isOpen, onClose, onScanComplete }) => {
  const [scanning, setScanning] = useState(true);
  const [scannedCode, setScannedCode] = useState('');

  const handleSimulateScan = () => {
    setScanning(true);
    setTimeout(() => {
      const generated = `MTA-GH-AST-${Math.floor(1000 + Math.random() * 9000)}`;
      setScannedCode(generated);
      setScanning(false);
    }, 1200);
  };

  const handleUseCode = () => {
    onScanComplete(scannedCode);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Asset Barcode Scanner Simulation">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', textAlign: 'center' }}>
        <div style={{
          width: '100%',
          height: '180px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: '#0F172A',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          border: '2px dashed #3B82F6'
        }}>
          {/* Laser scanning beam line effect */}
          <div style={{
            position: 'absolute',
            top: scanning ? '10%' : '50%',
            left: 0,
            right: 0,
            height: '2px',
            backgroundColor: '#38BDF8',
            boxShadow: '0 0 15px #38BDF8',
            transition: 'top 0.8s ease-in-out'
          }}></div>

          <QrCode size={56} color="#94A3B8" />
          <span style={{ color: '#94A3B8', fontSize: '0.8125rem', marginTop: '0.5rem' }}>
            {scanning ? 'Align camera viewport over asset barcode label...' : 'Barcode Detected Successfully!'}
          </span>
        </div>

        {scannedCode ? (
          <div style={{
            width: '100%',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-primary-light)',
            border: '1px solid var(--border-focus)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontWeight: 700, fontSize: '1.125rem' }}>
              <CheckCircle size={20} /> {scannedCode}
            </div>
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: '0.75rem', width: '100%', justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={handleSimulateScan}>
            <Scan size={16} /> {scannedCode ? 'Scan Again' : 'Trigger Camera Scan'}
          </button>
          {scannedCode && (
            <button className="btn btn-primary" onClick={handleUseCode}>
              Use Scanned Code
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
