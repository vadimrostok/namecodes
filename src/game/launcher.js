import React, { useEffect, useState, useCallback, Fragment } from 'react';
import { render } from 'react-dom';
import { IntlProvider, useIntl } from 'react-intl';

// The wake lock sentinel.
let wakeLock = null;

// Function that attempts to request a wake lock.
const requestWakeLock = async () => {
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => {
      console.log('Wake Lock was released');
    });
    console.log('Wake Lock is active');
  } catch (err) {
    console.error(`${err.name}, ${err.message}`);
  }
};

let i18nConfig = {
  locale: 'uk-UA',
  messages: {
    'Are you sure?': 'Ви впевнені?',
    'Show QR': 'Показати QR ключа поля',
    'Restart': 'Нова гра',
    'Change Cards': 'Змінити слова',
    'Be a Captain': 'Стати капітаном',
    'Close': 'Закрити',
    'Stop Scanning': 'Зупинити сканування',
    'Scan new key QR': 'Налаштувати нове з\'єднання',
    'Go to new card board': 'Вийти з режиму капітана',
    'Scan board Qr code': 'Скануйте QR код ключа поля',
    'KILLER!!! You lost!': 'ВБИВЦЯ!!! Ви програли!',
    'Upload from file': 'Завантажити фото',
    'QR scan error': 'Помилка зчитування QR, спробуйте зробити краще фото.',
    'Connect Captain': 'Під\'єднати капітана',
    'Next': 'Далі',
    'RTC Wizard': 'Налаштування з\'єднання',
    'Copy-paste sdp code in captain interface': 'Скопіюйте і вставте sdp код в інтерфейсі капітана',
    'Copy-paste sdp code in gameboard interface': 'Скопіюйте і вставте sdp код в інтерфейсі ігрового поля',
    'Paste copied sdp code here and press submit': 'Вставте скопійований sdp код сюди і натисніть "Задіяти"',
    'Submit': 'Задіяти',
    'Upload from file': 'Завантажити фото QR sdp кода',
    'Or upload photo of QR code': 'Або завантажите фото QR sdp кода',
    'Or scan board Qr code': 'Або скануйте QR sdp кода за допомогою вбудованої камери',
    'Duet?': 'Дует?',
    'Here': 'Вставте сюди',
    'Upload from file': 'Завантажити фото QR sdp кода',
    'Connect Partner': 'Ініціювати з\'єднання',
    'Share this link to the second player': 'Передайте це посилання другому гравцю',
    'Share this sdp code to another player': 'Передайте це sdp код іншому гравцю',
    'Connection is corrupt, restart the game': 'З\'єднання зіпсоване, перезапустіть гру',
    'Are players remote?': 'Використати посилання замість QR коду?',
    'Connect as Partner': 'Підєднатись',
  }
};

import CardBoard from './CardBoard/';
import DuetCardBoard from './DuetCardBoard/';
import KeyBoard from './KeyBoard/';

function Game() {
  const intl = useIntl();

  const [isCaptain, setIsCaptain] = useState(window.location.search === '?captain');
  const [isDuet, setIsDuet] = useState(window.location.search === '?duet');
  const [duetSdp, setDuetSdp] = useState(null);

  useEffect(() => {
    // console.log(window.location.search, window.location.search.startsWith('?connect-duet='));
    if (window.location.search.startsWith('?connect-duet=')) {
      setIsDuet(true);
      setDuetSdp(decodeURIComponent(window.location.search.slice(
        window.location.search.indexOf('?connect-duet=') + '?connect-duet='.length,
      )));
      // console.log('decode', decodeURIComponent(window.location.search.slice(
      //   window.location.search.indexOf('?connect-duet=') + '?connect-duet='.length,
      // )));
    }
  }, [setIsDuet, setDuetSdp]);

  const toggle = useCallback(() => {
    if (confirm(intl.formatMessage({ id: 'Are you sure?' }))) {
      setIsCaptain(!isCaptain);
    }
  }, [
    isCaptain, setIsCaptain
  ]);

  const handleSetUseDuet = useCallback((useDuet) => {
    setIsDuet(useDuet);
  }, [
    setIsDuet,
  ]);

  console.log('render', isDuet, duetSdp);
  return (
    <div className="app-container">
      {isDuet ? (
        <DuetCardBoard onSetUseDuet={handleSetUseDuet} duetSdp={duetSdp} />
      ) : (
        <>
          {isCaptain ? <KeyBoard onGoToNewBoard={toggle} /> : <CardBoard onSetUseDuet={handleSetUseDuet} onBeACaptain={toggle} />}
        </>
      )}
    </div>
  );
}

export function init() {
  render(
    <IntlProvider
      locale={i18nConfig.locale}
      defaultLocale={i18nConfig.locale}
      messages={i18nConfig.messages}
    >
      <Game />
    </IntlProvider>,
    document.getElementById('container'),
  );
}
