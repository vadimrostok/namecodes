//https://habr.com/ru/company/badoo/blog/315812/

import { FormattedMessage, useIntl } from 'react-intl';
import React, { useCallback, Fragment, useRef, useEffect, useState } from 'react';
import adapter from 'webrtc-adapter';

import { isRevealed } from '../../helpers';
import { keyToClass } from '../../constants';
import QRCode from '../QRCode/QRCode';
import RTCConnectionWizard from '../RTCConnectionWizard/RTCConnectionWizard';
import Scanner from '../Scanner/Scanner';
import getDictionary from '../../dictionary/';

const dictionary = getDictionary('UA').slice(0);

let remoteConnection;
let sendChannel;

let pendingCandidates = [];

export default function({ onGoToNewBoard }) {
  const intl = useIntl();

  const [board, setBoard] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [cardBoard, setCardBoard] = useState([]);

  const [p2pWizardActive, setP2pWizardActive] = useState(true);
  const [remotePlayersDuetMode, setRemotePlayersDuetMode] = useState(false);

  const handleRTCConnection = useCallback((channel) => {
    console.log('handleRTCConnection', channel);
    sendChannel = channel;
    channel.onmessage = message => {
      console.log('new message', message);
      const action = message.data.slice(0, message.data.indexOf(':'));
      const actionData = message.data.slice(message.data.indexOf(':') + 1);

      switch (action) {
        case 'setBoard': {
          const [keyStr, cardsStr] = actionData.split('|');
          setBoard(keyStr.split(''));
          setCardBoard(cardsStr.split(',').map(index => dictionary[index]));
          setP2pWizardActive(false);
          break;
        }
        case 'setRevealed': {
          if (actionData.length) {
            const newRevealed = actionData.split(',').map(item => parseInt(item, 10));
            setRevealed(newRevealed);
          } else {
            setRevealed([]);
          }
          break;
        }
        case 'useRemotePlayersDuetMode': {
          setRemotePlayersDuetMode(true);
          break;
        }
      }
    };
  }, [setP2pWizardActive]);

  return (
    <Fragment>     
      {p2pWizardActive ? (
        <RTCConnectionWizard
          onClose={() => setP2pWizardActive(false)}
          isInitiator={false}
          onSuccess={handleRTCConnection}
        />
      ) : (
        <>
          <button className="button button-wide toggle-scanning-button" onClick={() => {
            setP2pWizardActive(true);
          }}>
            {intl.formatMessage({ id: 'Scan new key QR' })}
          </button>
          <button className="button button-wide" onClick={onGoToNewBoard}>
            <FormattedMessage id="Go to new card board" />
          </button>

          {board.length ? (
            <div className="board key-board">
              {board.map((key, index) => (
                <div
                  key={key+index}
                  className={`board-item ${keyToClass[key]}  ` +
                             `${isRevealed(index, revealed) ? 'captain-revealed' : ''}`}
                >
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
