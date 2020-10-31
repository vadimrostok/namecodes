// https://habr.com/ru/company/badoo/blog/315812/

import { FormattedMessage, useIntl } from 'react-intl';
import React, { useEffect, useRef, Fragment, useState, useCallback } from 'react';
import adapter from 'webrtc-adapter';

import QRCode from '../QRCode/QRCode';
import Scanner from '../Scanner/Scanner';

import { CARD_BLUE, CARD_KILLER, CARD_RED, keyToClass } from '../../constants';
import { getNewKeyBoard, getNewCardBoard, isRevealed } from '../../helpers';

let remoteConnection, sendChannel;

export default function({ onBeACaptain }) {

  const [rtcIceCandidates, setRtcIceCandidates] = useState([]);
  const [rtcOffer, setRtcOffer] = useState('');

  useEffect(() => {
    remoteConnection = new window.RTCPeerConnection({
      iceServers: [{
        url: 'stun:stun.l.google.com:19302'
      }],
    });


    sendChannel = remoteConnection.createDataChannel('sendChannel');
    
    sendChannel.onopen = () => {
      console.log('handleSendChannelStatusChange');

      sendChannel.send('ping');
    };
    sendChannel.onclose = () => {
      console.log('handleSendChannelStatusChange');
    };
    sendChannel.onmessage = (m) => {
      console.log('message->', m);
    };

    remoteConnection.createOffer()
      .then(offer => remoteConnection.setLocalDescription(offer))
      .then(() => {
        console.log('localConnection.localDescription', remoteConnection.localDescription, JSON.stringify(remoteConnection.localDescription.toJSON()));
        setRtcOffer(JSON.stringify(remoteConnection.localDescription.toJSON()));
      });

    // remoteConnection.onicecandidate = e => {
    //   if (e.candidate) {
    //     rtcIceCandidates.push(JSON.stringify(e.candidate.toJSON()));
    //     setRtcIceCandidates([...rtcIceCandidates]);
    //   }
    // };

    // localConnection.createOffer()
    //   .then(offer => localConnection.setLocalDescription(offer))
    //   .then(() => remoteConnection.setRemoteDescription(localConnection.localDescription))
    //   .then(() => remoteConnection.createAnswer())
    //   .then(answer => remoteConnection.setLocalDescription(answer))
    //   .then(() => localConnection.setRemoteDescription(remoteConnection.localDescription))
    //   .catch(handleCreateDescriptionError);
  }, []);

  const [board, setBoard] = useState({ isRedFirst: false, boardKey: [] });
  const [cardBoard, setCardBoard] = useState({ indices: [], cards: [] });
  const [revealed, setRevealed] = useState([]);
  const [redCount, setRedCount] = useState(0);
  const [blueCount, setBlueCount] = useState(0);

  const [p2pConnection, setP2pConnection] = useState(false);
  const [showP2pOfferQr, setShowP2pOfferQr] = useState(false);
  const [showP2pAnswerScanner, setShowP2pAnswerScanner] = useState(false);

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

  return (
    <Fragment>
      <div className={`button-block ${board.isRedFirst ? 'red-text' : 'blue-text'}`}>
        {p2pConnection ? 
         <>
           <button className="button button-light" onClick={() => {
             setP2pConnection(false);
             setShowP2pOfferQr(false);
             setShowP2pAnswerScanner(false);
           }}>
             <FormattedMessage id="Close" />
           </button>
           <button className="button button-light" onClick={() => {
             setP2pConnection(true);
             setShowP2pOfferQr(false);
             setShowP2pAnswerScanner(true);
           }}>
             <FormattedMessage id="Next" />
           </button>
         </> :
         <>
           <button className="button" onClick={() => {
             setP2pConnection(true);
             setShowP2pOfferQr(true);
             setShowP2pAnswerScanner(false);
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
         </>
        }
      </div>

      <QRCode showQr={showP2pOfferQr} code={rtcOffer} />
      {showP2pAnswerScanner ? (
        <Scanner onScanSuccess={(sdp) => {
          console.log('scan success', sdp);
          const rsd = new window.RTCSessionDescription(JSON.parse(sdp));
          remoteConnection.setRemoteDescription(rsd);
          console.log('set remote', rsd);

          const sendChannel2 = remoteConnection.createDataChannel('sendChannel2');
          
          sendChannel2.onopen = () => {
            console.log('handleSendChannelStatusChange2');

            sendChannel2.send('ping2');
          };
          sendChannel2.onclose = () => {
            console.log('handleSendChannelStatusChange2');
          };
          sendChannel2.onmessage = (m) => {
            console.log('message->', m);
          };

          //sendChannel.send({ message: 'ping' });

        }}/>
      ) : null}
      

      <div className={`board ${p2pConnection ? 'hidden' : ''}`} id="card-board">
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
