import QRCode from 'qrcode';
import React, { useEffect, useRef, Fragment, useState, useCallback } from 'react';

export default function({ showQr, code }) {
  const canvasRef = useRef();

  useEffect(() => {
    if (canvasRef.current && code.length) {
      const width = window.innerWidth;
      const height = window.innerHeight;

      let side = width > height ? height : width;
      side -= side < 800 ? 8 : 40;

      const qrcode = code;
      QRCode.toCanvas(canvasRef.current, qrcode, {
        width: side,
        height: side,
      }, (error) => {
        if (error) {
          console.error(error);
        }
      });
    }
  }, [canvasRef.current, code]);

  return (
    <>
      <hr />
      <code>{code}</code>
      <hr />
      <canvas className={showQr ? '' : 'hidden'} ref={canvasRef} id="canvas"></canvas>
    </>);
}
