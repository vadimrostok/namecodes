import React, { Component, useEffect, useRef, Fragment, useState, useCallback } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import adapter from 'webrtc-adapter';

import QRCode from '../QRCode/QRCode';
import Scanner from '../Scanner/Scanner';

let remoteConnection, sendChannel;
class RTCConnectionWizard extends Component {

  state = {
    rtcOffer: null,
    showP2pOfferQr: false,
  };

  remotePlayersDuetMode = false

  constructor(props) {
    super(props);

    this.state.showP2pOfferQr = props.isInitiator;
  }

  componentDidMount() {
    this.remotePlayersDuetMode = confirm(this.props.intl.formatMessage({ id: 'Are players remote?' }));

    const { isInitiator } = this.props;

    console.log('creating remoteConnection, isInitiator', isInitiator);
    remoteConnection = new window.RTCPeerConnection({
      iceServers: [{
        url: 'stun:stun.l.google.com:19302'
      }],
    });

    sendChannel = remoteConnection.createDataChannel('sendChannel');
    sendChannel.onopen = () => {
      console.error('OPEN');
      if (isInitiator) {
        sendChannel.send('ping');
      }
    };
    sendChannel.onclose = () => {
      console.error('CLOSE');
      alert(this.props.intl.formatMessage({ id: 'Connection is corrupt, restart the game' }));
    };
    if (isInitiator) {
      sendChannel.onmessage = message => {

        console.log('offerer, new message:', message);

        if (message.data === 'pong') {
          this.props.onSuccess(sendChannel);
        }
      };
    }

    if (isInitiator) {
      const offerPromise = remoteConnection.createOffer();
      
      offerPromise.then(offer => remoteConnection.setLocalDescription(offer));

      remoteConnection.onicecandidate = e => {
        if (!e.candidate) {
          // All candidates have been added
          console.log('all added');
          offerPromise
            .then(() => {
              this.setState({ rtcOffer: JSON.stringify(remoteConnection.localDescription.toJSON()) });
            });
        } else {
          console.log('ice candidate: ', e.candidate);
        }
      };
    } else if (this.props.duetSdp) {
      this.handleScanSuccess(this.props.duetSdp);
    }
  }

  handleGoToNextStep = () => {
    this.setState({
      showP2pOfferQr: !this.state.showP2pOfferQr
    });
  }

  renderButtons() {
    const { onClose, isInitiator } = this.props;
    const { showP2pOfferQr } = this.state;

    return (
      <>
        {isInitiator ? (
          <button className="button button--light" onClick={onClose}>
            <FormattedMessage id="Close" />
          </button>
        ) : null}
        {isInitiator && showP2pOfferQr ? (
          <button className="button button--light" onClick={this.handleGoToNextStep}>
            <FormattedMessage id="Next" />
          </button>
        ) : null}
      </>
    );
  };

  handleScanSuccess = (sdp) => {
    const { isInitiator } = this.props;

    console.log('handleScanSuccess, isInitiator', isInitiator, sdp);

    if (isInitiator) {
      console.log('scan success', sdp);
      const rsd = new window.RTCSessionDescription(JSON.parse(sdp));

      remoteConnection.setRemoteDescription(rsd);
      console.log('set remote', rsd);

    } else {
      console.log('handleScanSuccess', sdp, JSON.parse(sdp));

      const rsd = new window.RTCSessionDescription(JSON.parse(sdp));
      remoteConnection.setRemoteDescription(rsd);

      console.log('remote - ', rsd);

      const answserPromise = remoteConnection.createAnswer()
            .then(offer => remoteConnection.setLocalDescription(offer));

      remoteConnection.onicecandidate = e => {
        if (!e.candidate) {
          // All candidates have been added
          console.log('all ices added');
          answserPromise.then(() => {
            this.setState({
              rtcOffer: JSON.stringify(remoteConnection.localDescription.toJSON()),
              showP2pOfferQr: true,
            });
          });
        } else {
          console.log('ice candidate: ', e.candidate);
        }
      };

      remoteConnection.ondatachannel = (event) => {

        console.log('new channel', event);
        const receiveChannel = event.channel;

        receiveChannel.onmessage = message => {
          console.log('answerer, new message:', message);

          if (message.data === 'ping') {
            receiveChannel.send('pong');

            this.props.onSuccess(event.channel);
          }
        };
        receiveChannel.onopen = () => {
          console.log('open');
        };
        receiveChannel.onclose = () => {
          console.log('handleSendChannelStatusChange');
        };
      };

      return;
    }
  }

  renderQR() {
    const { isInitiator } = this.props;
    const { rtcOffer, showP2pOfferQr } = this.state;

    return rtcOffer ? <QRCode
                        isInitiator={isInitiator}
                        showQr={showP2pOfferQr}
                        code={rtcOffer}
                        remotePlayersDuetMode={this.remotePlayersDuetMode}
                      /> : null;
  }

  render() {
    const { isInitiator } = this.props;
    const { rtcOffer, showP2pOfferQr } = this.state;

    return (
      <div className="rtc-wizard">
        <h3 className="header"><FormattedMessage id="RTC Wizard" /></h3>
        {this.renderButtons()}
        {showP2pOfferQr ? (
          <>{this.renderQR()}</>
        ) : (
          <Scanner remotePlayersDuetMode={this.remotePlayersDuetMode} onScanSuccess={this.handleScanSuccess}/>
        )}
      </div>
    );
  }
};

export default injectIntl(RTCConnectionWizard);

