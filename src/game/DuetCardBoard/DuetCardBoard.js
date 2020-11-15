// https://habr.com/ru/company/badoo/blog/315812/

import { FormattedMessage, useIntl } from 'react-intl';
import React, { useEffect, useRef, Fragment, useState, useCallback } from 'react';
import adapter from 'webrtc-adapter';

import QRCode from '../QRCode/QRCode';
import Scanner from '../Scanner/Scanner';
import RTCConnectionWizard from '../RTCConnectionWizard/RTCConnectionWizard';

import getDictionary from '../../dictionary/';
const dictionary = getDictionary('UA').slice(0);

import rtcService from './../service/rtc';

import { CARD_BLUE, CARD_KILLER, CARD_RED, keyToClass, keyToDuetClass } from '../../constants';
import { getNewKeyBoard, getNewDuetKeyBoard, getNewCardBoard, isRevealed } from '../../helpers';

let sendChannel;
let remoteConnections = [];

export default function({ duetSdp, onSetUseDuet }) {
  const [board, setBoard] = useState({ isRedFirst: false, boardKey: [] });
  const [visibleBoard, setVisibleBoard] = useState({ isRedFirst: false, boardKey: [] });
  const [secondBoard, setSecondBoard] = useState({ isRedFirst: false, boardKey: [] });

  const [cardBoard, setCardBoard] = useState({ indices: [], cards: [] });

  const [revealed, setRevealed] = useState([]);
  const [redCount, setRedCount] = useState(0);
  const [blueCount, setBlueCount] = useState(0);

  const [p2pWizardActive, setP2pWizardActive] = useState(!!duetSdp || false);
  const [isP2pInitiator, setIsP2pInitiator] = useState(!duetSdp);

  const intl = useIntl();

  useEffect(() => {
    remoteConnections = [];
  }, []);

  useEffect(() => {
    const [firstBoard, secondBoard, newBoard] = getNewDuetKeyBoard();
    setBoard(newBoard);
    setVisibleBoard(firstBoard);
    setSecondBoard(secondBoard);
    setCardBoard(getNewCardBoard());
  }, [setBoard, setCardBoard]);

  const restartGame = useCallback(() => {
    if (confirm(intl.formatMessage({ id: 'Are you sure?' }))) {
      if (!confirm(intl.formatMessage({ id: 'Duet?' }))) {
        onSetUseDuet(false);
      } else {
        if (duetSdp) {
          
        } else {
          const [firstBoard, secondBoard, newBoard] = getNewDuetKeyBoard();
          const newCardBoard = getNewCardBoard();

          setBoard(newBoard);
          setVisibleBoard(firstBoard);
          setSecondBoard(secondBoard);
          setRevealed([]);
          setBlueCount(0);
          setRedCount(0);

          console.error('restart game');
          setCardBoard(newCardBoard);

          remoteConnections.forEach(remoteConnection => {
            remoteConnection.send(
              'setBoard:' + JSON.stringify({
                board: newBoard,
                visibleBoard: secondBoard,
                cardBoard: newCardBoard,
              }),
            );
            remoteConnections[0].send('setRevealed:');
          });
        }
      }
    }
  }, [setBoard, setRevealed, cardBoard, remoteConnections]);

  const restartCards = useCallback(() => {
    if (confirm(intl.formatMessage({ id: 'Are you sure?' }))) {
      const newCardBoard = getNewCardBoard();
      console.error('restart cards');
      setCardBoard(newCardBoard);

      remoteConnections.forEach(sendChannel => {
        sendChannel.send('setBoard:' + JSON.stringify({
          board,
          visibleBoard: secondBoard,
          cardBoard: newCardBoard,
        }),);
      });

    }
  }, [setCardBoard, remoteConnections, board, secondBoard]);

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

  const handleRTCConnection = useCallback((channel) => {
    console.log('handleRTCConnection', channel, board, cardBoard);

    remoteConnections.push(channel);
    remoteConnections = [...remoteConnections];

    if (isP2pInitiator) {
      // const [firstBoard, secondBoard, newBoard] = getNewDuetKeyBoard();

      // setBoard(newBoard);
      // setVisibleBoard(firstBoard);
      setRevealed([]);
      setBlueCount(0);
      setRedCount(0);

      channel.send(
        'setBoard:' + JSON.stringify({
          board,
          visibleBoard: secondBoard,
          cardBoard,
        }),
      );
      channel.send('setRevealed:');
    }

    channel.onmessage = message => {
      console.log('new message', message);
      const action = message.data.slice(0, message.data.indexOf(':'));
      const actionData = message.data.slice(message.data.indexOf(':') + 1);

      console.log('action', action, 'actionData', actionData);

      switch (action) {
        case 'setBoard': {
          const { board, visibleBoard, cardBoard } = JSON.parse(actionData);
          setBoard(board);
          setVisibleBoard(visibleBoard);
          console.error('set board');
          setCardBoard(cardBoard);
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
      }
    };

    setP2pWizardActive(false);
  }, [setP2pWizardActive, board, secondBoard, cardBoard, setRevealed, remoteConnections, isP2pInitiator]);

  // console.log('RENDER: ', board, cardBoard);

  // console.log('keyToDuetClass[visibleBoard[index]]}', keyToDuetClass, visibleBoard);

  return (
    <Fragment>
      {p2pWizardActive ? (
        <RTCConnectionWizard
          onClose={() => setP2pWizardActive(false)}
          isInitiator={isP2pInitiator}
          duetMode={true}
          onSuccess={handleRTCConnection}
          remotePlayersDuetMode={true}
          duetSdp={duetSdp}
        />
      ) : (
        <>
          <div className={`button-block ${board.isRedFirst ? 'red-text' : 'blue-text'}`}>            
            <button className="button" onClick={restartGame}>
              <FormattedMessage id="Restart" />
            </button>
            <button className="button" onClick={restartCards}>
              <FormattedMessage id="Change Cards" />
            </button>
            
            {remoteConnections.length < 1 ? (
              <>
                <button className="button" onClick={() => {
                  setP2pWizardActive(true);
                }}>
                  <FormattedMessage id="Connect Partner" />
                </button>
                <button className="button" onClick={() => {
                  setIsP2pInitiator(false);
                  setP2pWizardActive(true);
                }}>
                  <FormattedMessage id="Connect as Partner" />
                </button>
              </>
            ) : null}

            {revealed.length ? (
              <>
                &nbsp;
                {redCount ? <span className="red-counter">{redCount}</span> : ''}
                &nbsp;
                {blueCount ? <span className="blue-counter">{blueCount}</span> : ''}
                &nbsp;
              </>
            ) : null}
          </div>
          <div className={`board`} id="card-board">
            {board.boardKey.length && cardBoard.cards.length ? (
              board.boardKey.map((key, index) => (
                <div
                  key={key+index}
                  className={`board-item ${isRevealed(index, revealed) ? keyToClass[key] : keyToDuetClass[visibleBoard.boardKey[index]]}`}
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
