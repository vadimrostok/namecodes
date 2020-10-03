import { FormattedMessage, useIntl } from 'react-intl';
import React, { useCallback, Fragment, useRef, useEffect, useState } from 'react';
import QrScanner from 'qr-scanner';

import { keyToClass } from '../../constants';
import getDictionary from '../../dictionary/';

QrScanner.WORKER_PATH = 'lib/qr-scanner-worker.min.js';

const dictionary = getDictionary('UA').slice(0);

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

export default function({ onGoToNewBoard }) {
  const intl = useIntl();

  const [board, setBoard] = useState([]);
  const [cardBoard, setCardBoard] = useState([]);
  
  const videoRef = useRef();

  const [isScanning, setIsScanning] = useState(true);
  const toggleIsScanning = useCallback(() => {
    setIsScanning(!isScanning);
  }, [setIsScanning, isScanning]);

  useEffect(() => {
    try { // Absent camera should not crash the app.
      if (videoRef.current && !scannerHandles.qrScannerRef && isScanning) {
        scannerHandles.qrScannerRef = new window.Instascan.Scanner({
          video: videoRef.current
        });
        scannerHandles.qrScannerRef.addListener('scan', function (content) {
          const [keyStr, cardsStr] = content.split('|');
          setBoard(keyStr.split(''));
          setCardBoard(cardsStr.split(',').map(index => dictionary[index]));
          setIsScanning(false);
          stopScanning();
        });
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
      if (scannerHandles.qrScannerRef && !isScanning) {
        stopScanning();
      }
    } catch (e) {
      console.error(e);
    }

    return () => {
      stopScanning();
    };
  }, [videoRef.current, isScanning, scannerHandles, scannerHandles.qrScannerRef]);

  const handleFile = useCallback((e) => {
    const fileList = e.target.files;
    var img = new Image();   // Create new img element
    img.src = window.URL.createObjectURL(fileList[0]); // set src to blob url

    const context = canvasRef.current.getContext('2d');
    img.onload = () => {
      const height = Math.floor(img.height/img.width*500);
      canvasRef.current.height = height;
      context.drawImage(img, 0, 0, 500, height);

      QrScanner.scanImage(canvasRef.current)
        .then(result => {
          const [keyStr, cardsStr] = result.split('|');
          setBoard(keyStr.split(''));
          setCardBoard(cardsStr.split(',').map(index => dictionary[index]));
          setIsScanning(false);
          stopScanning();
        })
        .catch(error => {
          alert(intl.formatMessage({ id: 'QR scan error' }));
        });
    };

  }, []);

  const fileRef = useRef();
  const canvasRef = useRef();

  const handleOpenUploader = useCallback(() => {
    fileRef.current.click();
  }, []);

  return (
    <Fragment>
      <button className="button toggle-scanning-button" onClick={toggleIsScanning}>
        {isScanning ?
         intl.formatMessage({ id: 'Stop Scanning' }) :
         intl.formatMessage({ id: 'Scan new key QR' })
        }
      </button>
      {!isScanning ? (
        <button className="button" onClick={onGoToNewBoard}>
          <FormattedMessage id="Go to new card board" />
        </button>
      ) : null}
      {isScanning ? (
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
          <canvas className="hidden" width="600" ref={canvasRef}></canvas>
          <i>
            <FormattedMessage id="Scan board Qr code" />:
          </i>
          <video
            width={window.innerWidth - (window.innerWidth < 800 ? 8 : 40)}
            /* autoPlay */
            ref={videoRef}
          ></video>
        </>
      ) : (
        <>
          {board.length ? (
            <div className="board key-board">
              {board.map((key, index) => (
                <div key={key+index} className={`board-item ${keyToClass[key]}`}>
                  <div className="board-item-text">{cardBoard[index]}</div>
                  <div className="board-item-text-upsidedown">{cardBoard[index]}</div>
                </div>
              ))}
            </div>
          ) : null}
        </>
      )}
      
    </Fragment>
  );
}
