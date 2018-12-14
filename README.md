[![NPM downloads per month][npm-downloads-img]][npm-url]
[![NPM version][npm-version-img]][npm-url]
[![NPM license][npm-license-img]][npm-url]

# Termllo
*Trello on the Terminal*

So far it implements basic Trello features (select board, add card with title
and description, move cards around and edit cards), so it's just useful for
solo boards (not that cool for colaborative boards (yet)).

**Note:** Only starred boards appear for now. So starring at least one board via
Trello Web or the Trello App is necessary to see something in Termllo.

More advance features will be implemented on the future. If someone out there
ever gets to really use this, any feedback would be really appreciated.

```
//TODO Screenshot here
```

*Made with <3 by Mr. Goferito*


## Usage
Navigation is Vim-inspired:

```
* h, j, k, l  -> Move around
* H, J, K, L  -> Move selected card around
* Enter, o, e -> Open card dialog (for the selected card)
* n           -> New Card (on the active list)
* b           -> Boards dialog (just starred boards)
* Esc, q      -> Close dialog (boards or card)
* Ctrl+c      -> Terminate
```

## Installation
First you need to get your key & token from trello:
[https://trello.com/app-key](https://trello.com/app-key)

Then there are two options:

### NPM Install (recommended)
1. `npm i -g termllo`
2. `termllo`
3. Introduce your key and token when prompted
* This will generate a file in `$HOME/.termllo/auth.js`. You can also
create that file yourself from the `auth.js.example` on the root of this repo*

### Clone this repo
1. `git clone https://github.com/goferito/termllo.git`
2. `cd termllo && npm i`
3. Copy/move the `auth.js.example` to `auth.js`, and edit it with your data
4. `node app.js`

## TODO
- [ ] Check for trello server data from time to time to corroborate termllo state
- [x] Prompt for trello token if missing, and save it in $HOME/.termllo/auth.js
- [ ] Add screenshot to readme
- [ ] Delay and pool move requests to minimize api calls
- [ ] Notify new version available
- [ ] Checklist support on the cards
- [ ] Lables support
- [ ] Type ? for help of shortcuts

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

