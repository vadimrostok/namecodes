//https://habr.com/ru/company/badoo/blog/315812/

import { FormattedMessage, useIntl } from 'react-intl';
import React, { useCallback, Fragment, useRef, useEffect, useState } from 'react';
import adapter from 'webrtc-adapter';

import { keyToClass } from '../../constants';
import QRCode from '../QRCode/QRCode';
import Scanner from '../Scanner/Scanner';
import getDictionary from '../../dictionary/';

const dictionary = getDictionary('UA').slice(0);

let remoteConnection;

let pendingCandidates = [];

export default function({ onGoToNewBoard }) {
  const intl = useIntl();

  const [board, setBoard] = useState([]);
  const [cardBoard, setCardBoard] = useState([]);

  const [rtcOffer, setRtcOffer] = useState('');
  const [p2pConnection, setP2pConnection] = useState(false);
  const [showP2pOfferQr, setShowP2pOfferQr] = useState(false);
  const [showP2pAnswerScanner, setShowP2pAnswerScanner] = useState(false);

  useEffect(() => {
    remoteConnection = new window.RTCPeerConnection({
      iceServers: [{
        url: 'stun:stun.l.google.com:19302'
      }],
    });

    const sendChannel = remoteConnection.createDataChannel('sendChannel');

    sendChannel.onopen = () => {
      console.log('handleSendChannelStatusChange');
    };
    sendChannel.onclose = () => {
      console.log('handleSendChannelStatusChange');
    };
  }, [setRtcOffer]);

  const handleScanSuccess = useCallback((sdp) => {

    console.log('handleScanSuccess', sdp, JSON.parse(sdp));

    const rsd = new window.RTCSessionDescription(JSON.parse(sdp));
    remoteConnection.setRemoteDescription(rsd);

    console.log('remote - ', rsd);

    // while (pendingCandidates.length) {
    //   try {
    //     const candidate = pendingCandidates.pop();

    //     this.peerConnection.addIceCandidate(new window.RTCIceCandidate(candidate));
    //     this.log('Added his ICE-candidate:' + candidate.candidate, 'gray');
    //   } catch (err) {
    //     this.log('Error adding remote ice candidate' + err.message, 'red');
    //   }
    // }
    
    remoteConnection.createAnswer()
      .then(offer => remoteConnection.setLocalDescription(offer))
      .then(() => {
        console.log('localConnection.localDescription', remoteConnection.localDescription, JSON.stringify(remoteConnection.localDescription.toJSON()));

        setRtcOffer(JSON.stringify(remoteConnection.localDescription.toJSON()));

        setShowP2pAnswerScanner(false);
        setShowP2pOfferQr(true);
      });

    remoteConnection.ondatachannel = (event) => {
      console.log('new channel', event);
      const receiveChannel = event.channel;
      receiveChannel.onmessage = (m) => {
        console.log('message->', m);

        receiveChannel.send('pong');
      };
      receiveChannel.onopen = () => {
        console.log('open');
      };
      receiveChannel.onclose = () => {
        console.log('handleSendChannelStatusChange');
      };
    };

    return;

    // FIXME:
    // const [keyStr, cardsStr] = content.split('|');

    // setBoard(keyStr.split(''));
    // setCardBoard(cardsStr.split(',').map(index => dictionary[index]));
    // setIsScanning(false);
  }, [remoteConnection]);

  return (
    <Fragment>
      {p2pConnection ? (
        <button className="button toggle-scanning-button" onClick={() => {
          setP2pConnection(false);
          setShowP2pOfferQr(false);
          setShowP2pAnswerScanner(false);
        }}>
          {intl.formatMessage({ id: 'Stop Scanning' })}
        </button>
      ) : (
        <button className="button toggle-scanning-button" onClick={() => {
          setP2pConnection(true);
          setShowP2pOfferQr(false);
          setShowP2pAnswerScanner(true);
        }}>
          {intl.formatMessage({ id: 'Scan new key QR' })}
        </button>
      )}
      {!p2pConnection ? (
        <button className="button" onClick={onGoToNewBoard}>
          <FormattedMessage id="Go to new card board" />
        </button>
      ) : null}
      {p2pConnection ? (
        <>
          {showP2pAnswerScanner ? (
            <Scanner onScanSuccess={handleScanSuccess} />
          ) : null}
          <QRCode showQr={showP2pOfferQr} code={rtcOffer} />
        </>
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
