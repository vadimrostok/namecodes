//https://habr.com/ru/company/badoo/blog/315812/

import { FormattedMessage, useIntl } from 'react-intl';
import React, { useCallback, Fragment, useRef, useEffect, useState } from 'react';
import adapter from 'webrtc-adapter';

import { keyToClass } from '../../constants';
import QRCode from '../QRCode/QRCode';
import Scanner from '../Scanner/Scanner';
import getDictionary from '../../dictionary/';
import RTCConnectionWizard from '../RTCConnectionWizard/RTCConnectionWizard';

const dictionary = getDictionary('UA').slice(0);

let remoteConnection;
let sendChannel;

let pendingCandidates = [];

export default function({ onGoToNewBoard }) {
  const intl = useIntl();

  const [board, setBoard] = useState([]);
  const [cardBoard, setCardBoard] = useState([]);

  const [p2pWizardActive, setP2pWizardActive] = useState(true);

  const handleRTCConnection = useCallback((channel) => {
    console.log('handleRTCConnection', channel);
    sendChannel = channel;
  }, []);

  return (
    <Fragment>
      <button className="button toggle-scanning-button" onClick={() => {
        setP2pWizardActive(true);
      }}>
        {intl.formatMessage({ id: 'Scan new key QR' })}
      </button>
      <button className="button" onClick={onGoToNewBoard}>
        <FormattedMessage id="Go to new card board" />
      </button>
      
      {p2pWizardActive ? (
        <RTCConnectionWizard
          onClose={() => setP2pWizardActive(false)}
          isInitiator={false}
          onSuccess={handleRTCConnection}
        />
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
