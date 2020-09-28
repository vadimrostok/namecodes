import UA from './UA.json';

const dictionaries = {
  UA,
};

export default function (locale) {
  return dictionaries[locale];
}
