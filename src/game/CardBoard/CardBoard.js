import QRCode from 'qrcode';
import React, { useEffect, useRef, Fragment, useState, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';


import { CARD_BLUE, CARD_KILLER, CARD_RED, keyToClass } from '../../constants';
import { getNewKeyBoard, getNewCardBoard, isRevealed } from '../../helpers';

export default function({ onBeACaptain }) {
  const [board, setBoard] = useState({ isRedFirst: false, boardKey: [] });
  const [cardBoard, setCardBoard] = useState({ indices: [], cards: [] });
  const [revealed, setRevealed] = useState([]);
  const [redCount, setRedCount] = useState(0);
  const [blueCount, setBlueCount] = useState(0);
  const [showQr, setShowQr] = useState(false);
  const canvasRef = useRef();
  const intl = useIntl();

  const toggle = useCallback(() => setShowQr(!showQr), [
    showQr, setShowQr,
  ]);

  useEffect(() => {
    setBoard(getNewKeyBoard());
    setCardBoard(getNewCardBoard());
  }, [setBoard, setCardBoard]);

  useEffect(() => {
    if (canvasRef.current && board.boardKey.length) {
      const width = window.innerWidth;
      const height = window.innerHeight;

      let side = width > height ? height : width;
      side -= side < 800 ? 8 : 40;

      const qrcode = board.boardKey.join('') + '|' + cardBoard.indices.join(',');
      // console.log('qrcode', qrcode);
      QRCode.toCanvas(canvasRef.current, qrcode, {
        width: side,
        height: side,
      }, (error) => {
        if (error) {
          console.error(error);
        }
      });
    }
  }, [canvasRef.current, board]);

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

  return (
    <Fragment>
      <div className={`button-block ${board.isRedFirst ? 'red-text' : 'blue-text'}`}>
        {showQr ? 
         <button className="button button-light" onClick={toggle}>
           <FormattedMessage id="Close" />
         </button> :
         <>
           <button className="button" onClick={toggle}>
             <FormattedMessage id="Show QR" />
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
         </>
        }
      </div>
      <canvas className={showQr ? '' : 'hidden'} ref={canvasRef} id="canvas"></canvas>
      <div className={`board ${showQr ? 'hidden' : ''}`} id="card-board">
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
    </Fragment>
    
  );
}
