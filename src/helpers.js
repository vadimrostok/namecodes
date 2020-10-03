import { CARD_BLUE, CARD_KILLER, CARD_NEUTRAL, CARD_RED } from './constants';
import getDictionary from './dictionary/';

let dictionary = getDictionary('UA').slice(0);

export const getNewKeyBoard = () => {
  // first? getNewKeyBoard
  const isRedFirst = Math.random() > 0.5;
  const newBoard = [CARD_KILLER, CARD_NEUTRAL, CARD_NEUTRAL, isRedFirst ? CARD_RED: CARD_BLUE];
  for (let i = 0; i < 7; i++) {
    newBoard.push(CARD_RED);
    newBoard.push(CARD_BLUE);
    newBoard.push(CARD_NEUTRAL);
  }

  // Shuffle board:
  for(let i = newBoard.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * i);
    const temp = newBoard[i];
    newBoard[i] = newBoard[j];
    newBoard[j] = temp;
  }

  return { isRedFirst, boardKey: newBoard };
};

export const getNewCardBoard = () => {
  // Shuffle board:
  const indices = new Array(dictionary.length).fill(0).map((_, index) => index);
  for(let i = dictionary.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * i);
    const temp = dictionary[i];
    dictionary[i] = dictionary[j];
    dictionary[j] = temp;

    const indTemp = indices[i];
    indices[i] = indices[j];
    indices[j] = indTemp;
  }

  const result = {
    indices: indices.slice(0, 25),
    cards: dictionary.slice(0, 25),
  };

  // Reset Dictionary
  dictionary = getDictionary('UA').slice(0);

  return result;
};

export const isRevealed = (index, revealed) => revealed.indexOf(index) !== -1;
