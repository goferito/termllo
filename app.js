
// Check if auth file is there
try {
  require('./auth')
} catch (e) {
  console.error('\nERROR: No file \'auth.js\' found.\n'
  + 'You need to \'cp auth.js.example auth.js\' and fill it with your data.')
  process.exit(1)
}


const blessed = require('blessed')
const TrelloManager = require('./TrelloManager')

const auth = require('./auth')

const MIN_COL_WIDTH = 30


/****************************  MVP  *************************
 *                                                          *
 *  jsonfile cache properly working
 *                                                          *
 *  select board dialog
 *                                                          *
 ************************************************************/


const tMan = new TrelloManager(auth)
tMan.fillStore()
.then(drawUI)

function drawUI (store) {

  const screen = blessed.screen({
    smartCSR: true,
    title: 'Termllo',
    dockBorders: true,
  })

  // Quit on Control-C.
  screen.key('C-c', () => process.exit(0))

  // Show boards dialog
  screen.key('b', () => {
    boardList.show()
    boardList.focus()
  })

  const listBoxes = tMan.lists.map((list, i) => {
    const lBox = blessed.list({
      left: i * 30,
      width: 30,
      height: '95%',
      keys: false,
      items: list.cards.map(card => card.name),
      border: {
        type: 'line',
      },
      label: `[ ${list.name} ]`,
      scrollbar: true,
      style: {
        label: {
          fg: 'gray',
          bold: true,
        },
        selected: {
          bg: 'black',
          fg: 'white',
        },
        item: {
          bg: 'black',
          height: '100',
        },
        focus: {
          selected: {
            bg: 'blue',
            bold: true,
          },
          border: {
            fg: 'cyan',
          },
          label: {
            fg: 'cyan',
          },
        },
        scrollbar: {
          bg: 'blue',
        },
      },
    })

    // Select next card
    lBox.key(['j'], () => lBox.down(1))

    // Select prev card
    lBox.key(['k'], () => lBox.up(1))

    // Select list on the left
    lBox.key(['h'], () => {
      const numLists = tMan.lists.length
      tMan.activeBoardIdx = Math.max(0, tMan.activeBoardIdx - 1)
      listBoxes[tMan.activeBoardIdx].focus()

      const screenWidth = process.stdout.columns
      const nCols = Math.floor(screenWidth / MIN_COL_WIDTH)
      const offset = Math.max(tMan.activeBoardIdx - (nCols - 1), 0) * MIN_COL_WIDTH
      listBoxes.forEach((box, i) => {
        box.left = MIN_COL_WIDTH * i - offset
      })

      screen.render()
    })

    // Select list on the right
    lBox.key(['l'], () => {
      const numLists = tMan.lists.length
      tMan.activeBoardIdx = Math.min(numLists - 1, tMan.activeBoardIdx + 1)
      listBoxes[tMan.activeBoardIdx].focus()

      const screenWidth = process.stdout.columns
      const nCols = Math.floor(screenWidth / MIN_COL_WIDTH)
      const offset = Math.max(tMan.activeBoardIdx - (nCols - 1), 0) * MIN_COL_WIDTH
      listBoxes.forEach((box, i) => {
        box.left = MIN_COL_WIDTH * i - offset
      })

      screen.render()
    })

    // Insert new card
    lBox.key(['n'], () => {
      cardForm.reset()
      cardForm.setLabel('[ New Card ]')
      cardForm.show()
      titleBox.focus()
      screen.render()
    })

    // Select active card
    lBox.key(['enter', 'o', 'e'], () => {
      const card = tMan.cards[list.id][lBox.selected]
      tMan.editingCard = card
      titleBox.setValue(card.name)
      descrBox.setValue(card.desc)
      cardForm.setLabel('[ Edit Card ]')
      cardForm.show()
      cardForm.focus()
      screen.render()
    })

    // Move card to left list
    lBox.key(['S-h'], () => {
      if (i < 1) return
      const toListIdx = i - 1
      const toList = tMan.lists[toListIdx].id
      const toPos = lBox.selected
      const fromList = list.id
      const fromPos = lBox.selected

      tMan.moveCard({fromList, fromPos, toList, toPos})
      .then((newItems) => {
        lBox.setItems(newItems.fromList)

        // Update desination box
        const destBox = listBoxes[toListIdx]
        destBox.setItems(newItems.toList)
        destBox.select(toPos)
        destBox.focus()
      })
    })

    // Move card to right list
    lBox.key(['S-l'], () => {
      if (i > tMan.lists.length - 2) return
      const toListIdx = i + 1
      const toList = tMan.lists[toListIdx].id
      const toPos = lBox.selected
      const fromList = list.id
      const fromPos = lBox.selected

      tMan.moveCard({fromList, fromPos, toList, toPos})
      .then((newItems) => {
        lBox.setItems(newItems.fromList)

        // Update desination box
        const destBox = listBoxes[toListIdx]
        destBox.setItems(newItems.toList)
        destBox.select(toPos)
        destBox.focus()
      })
    })

    // Move card up
    lBox.key(['S-k'], () => {
      if (lBox.selected === 0) return
      const fromList = list.id
      const fromPos = lBox.selected
      const toList = list.id
      const toPos = fromPos - 1

      tMan.moveCard({fromList, fromPos, toList, toPos})
      .then((newItems) => {
        lBox.setItems(newItems.fromList)
      })
    })

    // Move card down
    lBox.key(['S-j'], () => {
      const numCards = lBox.items.length
      const fromList = list.id
      const fromPos = lBox.selected
      if (fromPos > numCards - 2) return
      const toList = list.id
      const toPos = fromPos + 1
      tMan.moveCard({fromList, fromPos, toList, toPos})
      .then((newItems) => {
        lBox.setItems(newItems.fromList)
      })
    })


    return lBox
  })

  listBoxes.forEach((list) => {
    screen.append(list)
  })
  listBoxes[0].focus()

  const boardList = blessed.list({
    parent: screen,
    shadow: true,
    left: '25%',
    width: '50%',
    top: '35%',
    height: '25%',
    keys: false,
    items: tMan.boards.map(b => b.name),
    border: {
      type: 'line',
    },
    label: `[ Boards ]`,
    scrollbar: true,
    style: {
      label: {
        fg: 'gray',
        bold: true,
      },
      selected: {
        bg: 'black',
        fg: 'white',
      },
      item: {
        bg: 'black',
        height: '100',
      },
      focus: {
        selected: {
          bg: 'blue',
          bold: true,
        },
        border: {
          fg: 'cyan',
        },
        label: {
          fg: 'cyan',
        },
      },
      scrollbar: {
        bg: 'blue',
      },
    },
  })

  // Select next board
  boardList.key(['j'], () => boardList.down(1))

  // Select prev board
  boardList.key(['k'], () => boardList.up(1))

  // Close board dialog
  boardList.key(['q', 'escape'], () => boardList.hide())
  boardList.key(['enter'], () => {
    tMan.fillStore({boardIdx: boardList.selected})
    .then((store) => {
      screen.destroy()
      drawUI(store)
    })
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
  })


  const cardForm = blessed.form({
    parent: screen,
    top: '10%',
    left: '10%',
    width: '80%',
    height: '80%',
    keys: true,
    vi: true,
    shadow: true,
    padding: {
      top: 1,
      left: 1,
      right: 1,
      bottom: 0,
    },
    border: {
      type: 'line',
    },
    style: {
      label: {
        fg: 'green',
        left: 'center',
        bold: true,
      },
      border: {
        fg: 'green',
      },
    },
  })
  const titleBox = blessed.textbox({
    parent: cardForm,
    name: 'name',
    height: 3,
    keys: true,
    vi: true,
    inputOnFocus: true,
    border: {
      type: 'line',
    },
    label: ` Title `,
    style: {
      label: {
        fg: 'green',
      },
      border: {
        fg: 'green',
      },
      focus: {
        label: {
          bold: true,
        },
        border: {
          bold: true,
        }
      }
    },
  })
  const descrBox = blessed.textarea({
    parent: cardForm,
    name: 'desc',
    top: 3,
    keys: true,
    vi: true,
    inputOnFocus: true,
    border: {
      type: 'line',
    },
    label: ` Description `,
    style: {
      label: {
        fg: 'green',
        left: '50%',
      },
      border: {
        fg: 'green',
      },
      focus: {
        label: {
          bold: true,
        },
        border: {
          bold: true,
        },
      }
    },
  })
  const submitBtn = blessed.button({
    parent: descrBox,
    mouse: true,
    shadow: true,
    keys: true,
    shrink: true,
    padding: {
      top: 1,
      left: 3,
      right: 3,
      bottom: 1,
    },
    top: '100%-5',
    left: '50%',
    shrink: true,
    name: 'submit',
    content: 'Submit',
    style: {
      bg: 'blue',
      focus: {
        bg: 'red'
      },
      hover: {
        bg: 'red'
      }
    }
  })
  const cancelBtn = blessed.button({
    parent: descrBox,
    keys: true,
    shrink: true,
    mouse: true,
    padding: {
      top: 1,
      left: 3,
      right: 3,
      bottom: 1,
    },
    left: '70%',
    top: '100%-5',
    shrink: true,
    name: 'cancel',
    content: 'Cancel',
    style: {
      bg: 'blue',
      focus: {
        bg: 'red'
      },
      hover: {
        bg: 'red'
      }
    }
  })
  cancelBtn.on('press', () => {
    cardForm.reset()
    cardForm.hide()
    listBoxes[tMan.activeListIdx].focus()
    screen.render()
  })
  submitBtn.on('press', () => cardForm.submit())
  cardForm.key('enter', () => cardForm.submit())
  cardForm.on('submit', (card) => {
    if (!card.name) return

    const list = tMan.lists[tMan.activeBoardIdx]
    let actionFn
    if (tMan.editingCard) {

      // If no change, just close
      if (tMan.editCard.name === card.name && tMan.editCard.desc === card.desc) {
        cardForm.reset()
        cardForm.hide()
      }

      actionFn = 'editCard'
      card = Object.assign(tMan.editingCard, card)
    } else {
      actionFn = 'createCard'
      card.idList = list.id
    }

    tMan[actionFn](card)
    .then(() => {
      cardForm.reset()
      cardForm.hide()
      listBoxes[tMan.activeListIdx].focus()
      const newItems = tMan.cards[list.id].map(card => card.name)
      listBoxes[tMan.activeListIdx].setItems(newItems)
      if (!tMan.editingCard) {
        listBoxes[tMan.activeListIdx].select(0)
     }
      tMan.editingCard = false
      screen.render()
    })
    .catch((e) => { throw e })
  })

  // Cancel and close
  cardForm.key(['escape', 'c', 'q', 'u'], () => {
    cardForm.reset()
    cardForm.hide()
  })

  // Hidden at start
  cardForm.hide()
  boardList.hide()


  // Initial render
  screen.render()
}

