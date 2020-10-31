import React, { useState, useCallback, Fragment } from 'react';
import { render } from 'react-dom';
import { IntlProvider, useIntl } from 'react-intl';


let i18nConfig = {
  locale: 'uk-UA',
  messages: {
    'Are you sure?': 'Ви впевнені?',
    'Show QR': 'Показати QR ключа поля',
    'Restart': 'Рестарт',
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
  }
};

import CardBoard from './CardBoard/';
import KeyBoard from './KeyBoard/';

function Game() {
  const intl = useIntl();

  const [isCaptain, setIsCaptain] = useState(window.location.search === '?captain');

  const toggle = useCallback(() => {
    if (confirm(intl.formatMessage({ id: 'Are you sure?' }))) {
      setIsCaptain(!isCaptain);
    }
  }, [
    isCaptain, setIsCaptain
  ]);

  return (
    <div className="app-container">
      {isCaptain ? <KeyBoard onGoToNewBoard={toggle} /> : <CardBoard onBeACaptain={toggle} />}
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
