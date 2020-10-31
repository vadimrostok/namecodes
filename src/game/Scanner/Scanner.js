import { FormattedMessage, useIntl } from 'react-intl';
import React, { useCallback, Fragment, useRef, useEffect, useState } from 'react';
import QrScanner from 'qr-scanner';

QrScanner.WORKER_PATH = 'lib/qr-scanner-worker.min.js';

const scannerHandles = {
  qrScannerRef: null,
  streamRef: null,
};

const stopScanning = () => {
  if (scannerHandles.qrScannerRef) {
    scannerHandles.qrScannerRef.stop().then(() => {
      scannerHandles.qrScannerRef = null;
    });
  }
};

export default function({ onScanSuccess }) {
  const intl = useIntl();

  const [board, setBoard] = useState([]);
  const [cardBoard, setCardBoard] = useState([]);
  
  const videoRef = useRef();

  const handleScanSuccess = useCallback((content) => {
    console.log('scanned ', content);
    onScanSuccess(content);
  }, []);

  useEffect(() => {
    try { // Absent camera should not crash the app.
      if (videoRef.current && !scannerHandles.qrScannerRef) {
        scannerHandles.qrScannerRef = new window.Instascan.Scanner({
          video: videoRef.current
        });
        scannerHandles.qrScannerRef.addListener('scan', handleScanSuccess);
        window.Instascan.Camera.getCameras().then(function (cameras) {
          if (cameras.length > 0) {
            scannerHandles.qrScannerRef.start(cameras[0]);
          } else {
            console.error('No cameras found.');
          }
        }).catch(function (e) {
          console.error(e);
        });
      }
    } catch (e) {
      console.error(e);
    }

    return () => {
      stopScanning();
    };
  }, [videoRef.current, scannerHandles, scannerHandles.qrScannerRef]);

  const handleFile = useCallback((e) => {
    const fileList = e.target.files;
    var img = new Image();   // Create new img element
    img.src = window.URL.createObjectURL(fileList[0]); // set src to blob url

    const context = canvasRef.current.getContext('2d');
    img.onload = () => {
      const height = Math.floor(img.height/img.width*1500);
      canvasRef.current.height = height;
      context.drawImage(img, 0, 0, 1500, height);

      QrScanner.scanImage(canvasRef.current)
        .then(handleScanSuccess)
        .catch(error => {
          console.error(error);
          alert(intl.formatMessage({ id: 'QR scan error' }));
        });
    };

  }, []);

  const fileRef = useRef();
  const canvasRef = useRef();

  const handleOpenUploader = useCallback(() => {
    fileRef.current.click();
  }, []);

  const ref = React.useRef();

  return (
    <>
      <div className="button" onClick={handleOpenUploader}>
        <FormattedMessage id="Upload from file" />
      </div>
      <input
        ref={fileRef}
        type="file"
        accepts="image/*"
        onChange={handleFile}
        style={{ display: 'none' }}
        id="qr-photo-file-input"
      />
      <canvas className="hidden" width="1500" ref={canvasRef}></canvas>
      <textarea ref={ref}></textarea>
      <button onClick={() => {
        handleScanSuccess(ref.current.value);
      }}>Submit</button>
      <i>
        <FormattedMessage id="Scan board Qr code" />:
      </i>
      <video
        width={window.innerWidth - (window.innerWidth < 800 ? 8 : 40)}
        /* autoPlay */
        ref={videoRef}
      ></video>
    </>
  );
}
