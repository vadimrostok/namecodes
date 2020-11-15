import { FormattedMessage } from 'react-intl';
import QRCode from 'qrcode';
import React, { useEffect, useRef, Fragment, useState, useCallback } from 'react';

const { pathname, origin } = new window.URL(window.location.href);
const currentLocation = origin + pathname;

export default function({ isInitiator, showQr, code, remotePlayersDuetMode }) {
  const canvasRef = useRef();
  const textRef = useRef();

  useEffect(() => {
    if (remotePlayersDuetMode) {
      window.setTimeout(() => {
        textRef.current.select();
        document.execCommand('copy');
      }, 1);
    } else if (canvasRef.current && code.length) {
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
  }, [canvasRef, textRef, code, isInitiator, remotePlayersDuetMode]);

  return (
    <>
      <hr />
      {remotePlayersDuetMode ? (
        <>
          {isInitiator ? (
            <>
              <span className="nice-text">
                <FormattedMessage id="Share this link to the second player" />:
              </span>
              <textarea
                className="copy-textarea"
                rows="3"
                ref={textRef}
                defaultValue={`${currentLocation}?connect-duet=${encodeURIComponent(code)}`}
              ></textarea>
            </>
          ) : (
            <>
              <span className="nice-text">
                <FormattedMessage id="Share this sdp code to another player" />:
              </span>
              <textarea
                className="copy-textarea"
                rows="3"
                ref={textRef}
                defaultValue={code}
              ></textarea>
            </>
          )}
          
        </>
      ) : (
        <>
          <span className="nice-text">
            {isInitiator ? (
              <FormattedMessage id="Copy-paste sdp code in captain interface" />
            ) : (
              <FormattedMessage id="Copy-paste sdp code in gameboard interface" />
            )}
          </span>
          <textarea
            className="copy-textarea"
            rows="3"
            ref={textRef}
            defaultValue={code}
          ></textarea>
          <hr />
          <span className="nice-text"><FormattedMessage id="Or scan board Qr code" /></span>
          <canvas className={showQr ? 'qr-code-canvas' : 'hidden'} ref={canvasRef} id="canvas"></canvas>
        </>
      )}
    </>);
}
