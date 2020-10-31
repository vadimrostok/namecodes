import QRCode from 'qrcode';
import React, { useEffect, useRef, Fragment, useState, useCallback } from 'react';

export default function({ showQr, code }) {
  const canvasRef = useRef();
  const textRef = useRef();

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

      window.setTimeout(() => {
        textRef.current.select();
        document.execCommand('copy');
      }, 1);
    }
  }, [canvasRef, textRef, code]);

  return (
    <>
      <hr />
      <textarea className="copy-textarea" rows="3" ref={textRef}>{code}</textarea>
      <hr />
      <canvas className={showQr ? 'qr-code-canvas' : 'hidden'} ref={canvasRef} id="canvas"></canvas>
    </>);
}
