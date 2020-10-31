// https://habr.com/ru/company/badoo/blog/315812/

import { FormattedMessage, useIntl } from 'react-intl';
import React, { useEffect, useRef, Fragment, useState, useCallback } from 'react';
import adapter from 'webrtc-adapter';

import QRCode from '../QRCode/QRCode';
import Scanner from '../Scanner/Scanner';
import RTCConnectionWizard from '../RTCConnectionWizard/RTCConnectionWizard';

import rtcService from './../service/rtc';

import { CARD_BLUE, CARD_KILLER, CARD_RED, keyToClass } from '../../constants';
import { getNewKeyBoard, getNewCardBoard, isRevealed } from '../../helpers';

let sendChannel;

export default function({ onBeACaptain }) {
  const [board, setBoard] = useState({ isRedFirst: false, boardKey: [] });
  const [cardBoard, setCardBoard] = useState({ indices: [], cards: [] });
  const [revealed, setRevealed] = useState([]);
  const [redCount, setRedCount] = useState(0);
  const [blueCount, setBlueCount] = useState(0);

  const [p2pWizardActive, setP2pWizardActive] = useState(false);

  const intl = useIntl();

  useEffect(() => {
    setBoard(getNewKeyBoard());
    setCardBoard(getNewCardBoard());
  }, [setBoard, setCardBoard]);

  const restartKey = useCallback(() => {
    if (confirm(intl.formatMessage({ id: 'Are you sure?' }))) {
      setBoard(getNewKeyBoard());
      setRevealed([]);
      setBlueCount(0);
      setRedCount(0);
    }
  }, [setBoard, setRevealed]);

  const restartCards = useCallback(() => {
    if (confirm(intl.formatMessage({ id: 'Are you sure?' }))) {
      setCardBoard(getNewCardBoard());
    }
  }, [setCardBoard]);

  const handleClick = useCallback((index, key) => e => {
    if (confirm(intl.formatMessage({ id: 'Are you sure?' }))) {
      setRevealed(revealed.concat([index]));
      if (key === CARD_RED) {
        setRedCount(redCount + 1);
      } else if (key === CARD_BLUE) {
        setBlueCount(blueCount + 1);
      } else if (key === CARD_KILLER) {
        alert(intl.formatMessage({ id: 'KILLER!!! You lost!' }));
      }
    }
  }, [setRevealed, revealed, redCount, setRedCount, blueCount, setBlueCount]);

  const handleRTCConnection = useCallback((channel) => {
    console.log('handleRTCConnection', channel);
    sendChannel = channel;
  }, []);

  return (
    <Fragment>
      <div className={`button-block ${board.isRedFirst ? 'red-text' : 'blue-text'}`}>
        <button className="button" onClick={() => {
          setP2pWizardActive(true);
        }}>
          <FormattedMessage id="Connect Captain" />
        </button>
        <button className="button" onClick={restartKey}>
          <FormattedMessage id="Restart" />
        </button>
        <button className="button" onClick={restartCards}>
          <FormattedMessage id="Change Cards" />
        </button>
        {revealed.length ? (
          <>
            &nbsp;
            {redCount ? <span className="red-counter">{redCount}</span> : ''}
            &nbsp;
            {blueCount ? <span className="blue-counter">{blueCount}</span> : ''}
            &nbsp;
          </>
        ) : <button className="button" onClick={onBeACaptain}>
              <FormattedMessage id="Be a Captain" />
            </button>}
      </div>

      {p2pWizardActive ? (
        <RTCConnectionWizard
          onClose={() => setP2pWizardActive(false)}
          isInitiator={true}
          onSuccess={handleRTCConnection}
        />
      ) : (
        <div className={`board`} id="card-board">
          {board.boardKey.length && cardBoard.cards.length ? (
            board.boardKey.map((key, index) => (
              <div
                key={key+index}
                className={`board-item ${isRevealed(index, revealed) ? keyToClass[key] : ''}`}
                onClick={handleClick(index, key)}
              >
                <div className="board-item-text">{cardBoard.cards[index]}</div>
                <div className="board-item-text-upsidedown">{cardBoard.cards[index]}</div>
              </div>
            ))
          ) : null}
        </div>
      )}
      
    </Fragment>
    
  );
}
