import React, { useState, useCallback, Fragment } from 'react';
import { render } from 'react-dom';
import { IntlProvider, useIntl } from 'react-intl';


let i18nConfig = {
  locale: 'ua',
  messages: {
    'Are you sure?': 'Ви впевнені?',
    'Show QR': 'Показати QR',
    'Restart': 'Рестарт',
    'Change Cards': 'Змінити слова',
    'Be a Captain': 'Стати капітаном',
    'Close': 'Закрити',
    'Stop Scanning': 'Зупинити сканування',
    'Scan new key QR': 'Сканувати новий QR ключа',
    'Scan board Qr code': 'Скануйте QR код ключа поля',
    'Go to new card board': 'Перейти до нового поля',
    'KILLER!!! You lost!': 'ВБИВЦЯ!!! Ви програли!',
  }
};

import CardBoard from './CardBoard/';
import KeyBoard from './KeyBoard/';

function Game() {
  const intl = useIntl();

  const [isCaptain, setIsCaptain] = useState(false);

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
