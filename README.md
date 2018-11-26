[![NPM downloads per month][npm-downloads-img]][npm-url]
[![NPM version][npm-version-img]][npm-url]
[![NPM license][npm-license-img]][npm-url]

# Termllo
Trello on the Terminal

## Usage
1. `cp auth.js.example auth.js` and fill `auth.js` in with your data.
2. `npm i`
3. `node app.js`

## On development
Nodemon and blessed don't play very well together. To avoid nodemon
messing with input run it as `nodemon -I app.js`.

For debuging, the best option I found so far is to console.error in the
code, pipe stderr to a file (`nodemon -I app.js 2>> /tmp/termllo.log`), and
tail on a different terminal that file (`tail -f /tmp/termllo.log`)

## License
MIT © Sadoht Gomez Fernandez

[npm-url]: https://npmjs.org/package/termllo
[npm-downloads-img]: https://img.shields.io/npm/dm/termllo.svg
[npm-version-img]: https://badge.fury.io/js/termllo.svg
[npm-license-img]: https://img.shields.io/npm/l/termllo.svg
