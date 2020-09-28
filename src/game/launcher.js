import React, { useState, useCallback, Fragment } from 'react';
import { render } from 'react-dom';

import CardBoard from './CardBoard/';
import KeyBoard from './KeyBoard/';

function Game() {
  const [isCaptain, setIsCaptain] = useState(false);
  const toggle = useCallback(() => {
    if (confirm('Are you sure?')) {
      setIsCaptain(!isCaptain);
    }
  }, [
    isCaptain, setIsCaptain
  ]);

  return (
    <Fragment>
      {isCaptain ?
       <button className="toggle-button" onClick={toggle}>Go to new cards</button> :
       <button className="toggle-button" onClick={toggle}>Go to new key</button>}
      {isCaptain ? <KeyBoard /> : <CardBoard />}
    </Fragment>
  );
}

export function init() {
  render(
    <Game />,
    document.getElementById('container'),
  );
}
