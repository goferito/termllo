
const fs = require('fs')
const os = require('os')
const path = require('path')
const inquirer = require('inquirer')
const replace = require('replace-in-file')

const TrelloManager = require('./TrelloManager')
const ui = require('./lib/ui')


// Release the Kraken! (aka, run this thing)
getAuth()
  .then((auth) => {

  const tMan = new TrelloManager(auth)

  tMan.fillStore()
  .then((store) => ui.drawUI(store, tMan))
})



/**
 * Checks for existing auth files. If none, prompts for key and token
 * and stores the on $HOME/.termllo/auth.js
 */
async function getAuth () {

  // Check if local auth
  if (fs.existsSync("./auth.js")) {
    return require('./auth')
  }

  // Create config file on $HOME
  const homedir = os.homedir()
  const termlloDir = path.join(homedir, '.termllo')
  if (!fs.existsSync(termlloDir)) {
    fs.mkdirSync(termlloDir)
  }

  // Check for home auth
  const homeAuth = path.join(homedir, '.termllo', 'auth.js')
  if (fs.existsSync(homeAuth)) {
    return require(homeAuth)
  }

  // Prompt for auth
  console.log('\nAuth config missing. Please:')
  console.log(' 1. Get your api key and token from https://trello.com/app-key')
  console.log(' 2. Copy paste them here:')
  const answers = await inquirer.prompt([
    { type: 'input', name: 'key',   message: 'Your API Key:' },
    { type: 'input', name: 'token', message: 'Your Token:'    },
  ])

  // Copy example to $HOME/.termllo/auth.js
  const pathExample = path.join(__dirname, './auth.js.example')
  fs.copyFileSync(pathExample, homeAuth)


  // Replace key and token with placeholders
  await replace({
    files: homeAuth,
    from: 'your-key',
    to: answers.key,
  })
  await replace({
    files: homeAuth,
    from: 'your-token',
    to: answers.token,
  })

  return answers
}

