const Trello = require('node-trello')
const jsonfile = require('jsonfile')


/**
 * Keeps a local store (cache) of the data, and adds methods to modify the
 * data in trello, while trying to keep both in sync.
 */
class TrelloManager {

  constructor ({key, token}) {
    this.api = new Trello(key, token)
    this.activeBoardIdx = 0
    this.activeListIdx  = 0
  }


  /**
   * Loads the data for the active board
   */
  async fillStore ({ boardIdx } = {}) {

    if (!this.boards) this.boards = await this.loadBoards()

    if (Number.isInteger(boardIdx)) {
      this.activeBoardIdx = boardIdx
      this.activeListIdx  = 0
    }

    this.activeBoardName = this.boards[this.activeBoardIdx].name
    this.activeBoardId = this.boards[this.activeBoardIdx].id
    this.lists = await this.loadLists(this.activeBoardId)
    this.cards = await this.loadCards(this.activeBoardId)
    this.lists.forEach((list) => { list.cards = this.cards[list.id] })
    this.boards[this.activeBoardIdx].lists = this.lists
    this.store = this.boards
    return this.store
  }


  loadFrom (path) {
    try {
      const json = jsonfile.readFileSync(path)
      return json
    } catch (e) {
      if (e.code === 'ENOENT') {
        return null
      } else {
        console.error(e)
        return null
      }
    }
  }


  /**
   * Returns STARRED boards, sorted by last view date
   */
  loadBoards () {
    return new Promise((resolve, reject) => {
      const boardsFile = '/tmp/termllo-boards.json'
      //const storedBoards = this.loadFrom(boardsFile)
      //if (storedBoards) resolve(storedBoards)

      console.log('Downloading boards data...')
      this.api.get('/1/members/me/boards', (err, data) => {
        if (err) return reject(err)
        const starred = data
            .filter(board => board.starred)
            .sort((a, b) => new Date(b.dateLastView) - new Date(a.dateLastView))
            .map(board => ({
              id: board.id,
              name: board.name,
              lastMod: board.dateLastActivity,
            }))
        jsonfile.writeFileSync(boardsFile, starred)
        return resolve(starred)
      })
    })
  }


  /**
   * Loads all cards in the given board
   */
  loadCards (boardId) {
    return new Promise((resolve, reject) => {
      const cardsFile = `/tmp/termllo-cards-${boardId}.json`
      //const storedCards = this.loadFrom(cardsFile)
      //if (storedCards) return resolve(storedCards)

      console.log('Downloading cards data...')
      this.api.get(`/1/boards/${boardId}/cards`, (err, data) => {
        if (err) return reject(err)
        const cards = data.map(card => ({
          id: card.id,
          name: card.name,
          desc: card.desc,
          idList: card.idList,
          pos: card.pos,
        }))
        .reduce((byList, card) => {
          byList[card.idList] = byList[card.idList] || []
          byList[card.idList].push(card)
          return byList
        }, {})

        jsonfile.writeFileSync(cardsFile, cards)
        return resolve(cards)
      })
    })
  }


  /**
   * Loads to the local store the lists in the given board
   */
  loadLists (boardId) {
    return new Promise((resolve, reject) => {
      const listsFile = `/tmp/termllo-lists-${boardId}.json`
      //const storedLists = this.loadFrom(listsFile)
      //if (storedLists) return resolve(storedLists)

      console.log('Downloading lists data...')
      this.api.get(`/1/boards/${boardId}/lists`, (err, data) => {
        if (err) return reject(err)
        const lists = data.map(list => ({id: list.id, name: list.name}))
        jsonfile.writeFileSync(listsFile, lists)
        return resolve(lists)
      })
    })
  }


  /**
   * Moves a card to the given position in the given list
   *
   * Note: To avoid hammering the api when moving a card several
   * positions up/down, or several lists away, the api call is
   * postponed with a timeout. If a new movement is done before
   * timeout, the toList and toPos are updated, and the timeout reset.
   *
   * @param {String} fromList - List ID of the current card list
   * @param {Number} fromPos  - Index in the list of the current card
   */
  moveCard ({fromList, fromPos, toList, toPos}) {

    if (this.moveTimeout) clearTimeout(this.moveTimeout)

    // Remove the card from the list
    const card = this.cards[fromList].splice(fromPos, 1)[0]

    // Get trello pos from surounding cards of toPos
    const trelloPosTo = !toPos
      ? 'top'
      : this.cards[toList].length <= toPos
        ? 'bottom'
        : (this.cards[toList][toPos].pos + this.cards[toList][toPos - 1].pos) / 2

    card.pos = trelloPosTo

    // New active list is the destination list
    this.activeListIdx = this.lists.findIndex(l => l.id === toList)

    // Add the card to the right position
    this.cards[toList].splice(toPos, 0, card)

    return new Promise((resolve, reject) => {

      //TODO
      // It makes no sense to have a promise. UI should refresh with
      // the keypress. If everything goes ok with the api call, no
      // further action is needed, otherwise, the screen should be
      // re-rendered
      this.api.put(`/1/cards/${card.id}`,
        { idList: toList, pos: trelloPosTo },
        (err, data) => {
        if (err) return reject(err)
        card.pos = data.pos

        return resolve({
          fromList: this.cards[fromList].map(card => card.name),
          toList: this.cards[toList].map(card => card.name),
        })
      })
    })
  }


  /**
   * Create a new card. Updates trello and the local store
   */
  createCard ({
    name,
    desc,
    idList,
  }) {
    return new Promise((resolve, reject) => {

      this.api.post('/1/cards', {
        name,
        desc,
        idList,
        pos: 'top',
      }, (err, card) => {
        if (err) return reject(err)

        this.cards[idList] = [card, ...(this.cards[idList] || [])]

        return resolve({
          id: card.id,
          name: card.name,
          desc: card.desc,
          idList: card.idList,
          pos: card.pos,
        })
      })
    })
  }


  /**
   * Edits name and description of the card.
   * Updates trello and the local store.
   */
  editCard ({
    name,
    desc,
    idList,
    id,
  }) {
    return new Promise((resolve, reject) => {
      const storedCard = this.cards[idList].find(card => card.id === id)
      storedCard.name = name
      storedCard.desc = desc

      this.api.put(`/1/cards/${id}`,
        { name, desc },
        (err, data) => {
        if (err) return reject(err)
        return resolve()
      })
    })
  }
}


module.exports = TrelloManager

