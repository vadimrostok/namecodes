// https://habr.com/ru/company/badoo/blog/315812/

import { FormattedMessage, useIntl } from 'react-intl';
import React, { useEffect, useRef, Fragment, useState, useCallback } from 'react';
import adapter from 'webrtc-adapter';

import QRCode from '../QRCode/QRCode';
import Scanner from '../Scanner/Scanner';
import RTCConnectionWizard from '../RTCConnectionWizard/RTCConnectionWizard';

import rtcService from './../service/rtc';

import { CARD_BLUE, CARD_KILLER, CARD_RED, keyToClass } from '../../constants';
import { getNewKeyBoard, getNewDuetKeyBoard, getNewCardBoard, isRevealed } from '../../helpers';

let sendChannel;
let remoteConnections = [];

export default function({ onBeACaptain }) {
  const [board, setBoard] = useState({ isRedFirst: false, boardKey: [] });
  const [cardBoard, setCardBoard] = useState({ indices: [], cards: [] });
  const [revealed, setRevealed] = useState([]);
  const [redCount, setRedCount] = useState(0);
  const [blueCount, setBlueCount] = useState(0);

  const [p2pWizardActive, setP2pWizardActive] = useState(false);

  const intl = useIntl();

  useEffect(() => {
    remoteConnections = [];
  }, []);

  useEffect(() => {
    setBoard(getNewKeyBoard());
    setCardBoard(getNewCardBoard());
  }, [setBoard, setCardBoard]);

  const restartKey = useCallback(() => {
    if (confirm(intl.formatMessage({ id: 'Are you sure?' }))) {
      if (duetMode) {
        const [firstBoard, secondBoard, newBoard] = getNewDuetKeyBoard();

        setBoard(newBoard);
        setRevealed([]);
        setBlueCount(0);
        setRedCount(0);

        remoteConnections[0].send('setBoard:' + firstBoard.boardKey.join('') + '|' + cardBoard.indices.join(','));
        remoteConnections[0].send('setRevealed:');

        remoteConnections[1].send('setBoard:' + secondBoard.boardKey.join('') + '|' + cardBoard.indices.join(','));
        remoteConnections[1].send('setRevealed:');
      } else {
        const newBoard = getNewKeyBoard();

        setBoard(newBoard);
        setRevealed([]);
        setBlueCount(0);
        setRedCount(0);

        remoteConnections.forEach(sendChannel => {
          sendChannel.send('setBoard:' + newBoard.boardKey.join('') + '|' + cardBoard.indices.join(','));
          sendChannel.send('setRevealed:');
        });
      }
    }
  }, [setBoard, setRevealed, cardBoard, remoteConnections, duetMode]);

  const restartCards = useCallback(() => {
    if (confirm(intl.formatMessage({ id: 'Are you sure?' }))) {
      const newCardBoard = getNewCardBoard();
      setCardBoard(newCardBoard);

      remoteConnections.forEach(sendChannel => {
        sendChannel.send('setBoard:' + board.boardKey.join('') + '|' + newCardBoard.indices.join(','));
      });

    }
  }, [setCardBoard, remoteConnections, board]);

  const handleClick = useCallback((index, key) => e => {
    if (confirm(intl.formatMessage({ id: 'Are you sure?' }))) {
      setRevealed(revealed.concat([index]));

      console.log('click, remoteConnections', remoteConnections);
      remoteConnections.forEach(sendChannel => {
        sendChannel.send('setRevealed:' + revealed.concat([index]).join(','));
      });

      if (key === CARD_RED) {
        setRedCount(redCount + 1);
      } else if (key === CARD_BLUE) {
        setBlueCount(blueCount + 1);
      } else if (key === CARD_KILLER) {
        alert(intl.formatMessage({ id: 'KILLER!!! You lost!' }));
      }
    }
  }, [setRevealed, revealed, redCount, setRedCount, blueCount, setBlueCount, remoteConnections]);

  const [duetMode, setDuetMode] = useState(false);

  const handleRTCConnection = useCallback((channel, useDuet) => {
    console.log('handleRTCConnection', channel, board, cardBoard);

    remoteConnections.push(channel);
    remoteConnections = [...remoteConnections];

    if (useDuet) {
      setDuetMode(true);

      if (remoteConnections.length === 2) {
        const [firstBoard, secondBoard, newBoard] = getNewDuetKeyBoard();

        setBoard(newBoard);
        setRevealed([]);
        setBlueCount(0);
        setRedCount(0);

        remoteConnections[0].send('setBoard:' + firstBoard.boardKey.join('') + '|' + cardBoard.indices.join(','));
        remoteConnections[0].send('setRevealed:');

        remoteConnections[1].send('setBoard:' + secondBoard.boardKey.join('') + '|' + cardBoard.indices.join(','));
        remoteConnections[1].send('setRevealed:');

      } else {
        setTimeout(() => {
          alert(intl.formatMessage({ id: 'Connect second captain' }));
          setP2pWizardActive(true);
        }, 100);
      }

    } else {

      channel.send('setBoard:' + board.boardKey.join('') + '|' + cardBoard.indices.join(','));
      channel.send('setRevealed:' + revealed.join(','));
      
    }

    setP2pWizardActive(false);
  }, [setDuetMode, setP2pWizardActive, board, cardBoard, revealed, remoteConnections]);

  return (
    <Fragment>
      {p2pWizardActive ? (
        <RTCConnectionWizard
          onClose={() => setP2pWizardActive(false)}
          isInitiator={true}
          duetMode={duetMode}
          onSuccess={handleRTCConnection}
        />
      ) : (
        <>
          <div className={`button-block ${board.isRedFirst ? 'red-text' : 'blue-text'}`}>
            {!duetMode || remoteConnections.length < 2 ? (
              <button className="button" onClick={() => {
                setP2pWizardActive(true);
              }}>
                <FormattedMessage id="Connect Captain" />
              </button>
            ) : null}
            
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
        </>
      )}
      
    </Fragment>
    
  );
}
