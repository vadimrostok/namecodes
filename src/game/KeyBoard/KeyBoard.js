import { FormattedMessage, useIntl } from 'react-intl';
import React, { useCallback, Fragment, useRef, useEffect, useState } from 'react';

import { keyToClass } from '../../constants';
import getDictionary from '../../dictionary/';

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

    return () => {
      stopScanning();
    };
  }, [videoRef.current, isScanning, scannerHandles, scannerHandles.qrScannerRef]);

  return (
    <Fragment>
      <button className="button toggle-scanning-button" onClick={toggleIsScanning}>
        {isScanning ?
         intl.formatMessage({ id: 'Stop Scanning' }) :
         intl.formatMessage({ id: 'Scan new key QR' })
        }
      </button>
      <button className="button" onClick={onGoToNewBoard}>
        <FormattedMessage id="Go to new card board" />
      </button>
      {isScanning ? (
        <>
          <i>            
            <FormattedMessage id="Scan board Qr code" />:
          </i>
          <video
            width={window.innerWidth - (window.innerWidth < 600 ? 8 : 40)}
            /* autoPlay */
            ref={videoRef}
          ></video>
        </>
      ) : (
        <>
          {board.length ? (
            <div className="board">
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
