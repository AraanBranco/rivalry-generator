const readline = require('readline')
const fetch = require('node-fetch')
const moment = require('moment')
const fs = require('fs')
const today = moment().format('YYYY-MM-DD')
const fileName = "odds.txt"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const normalizeDate = (date) => {
  return moment(date).format('YYYY-MM-DD')
}

const normalizeHour = (date) => {
  return moment(date).format('HH:mm')
}

const getMatches = async () => {
  return fetch('https://www.rivalry.com/api/v1/games/3', {
    method: 'GET'
  })
    .then(res => res.json())
    .then(json => {
      return json.data.matches.filter(i => normalizeDate(i.scheduled_at) == today && i.markets.length > 0)
    })
}

const getOdds = async (matchId) => {
  return fetch(`https://app.rivalry.com/app/match/${matchId}/markets`, {
    method: 'GET'
  })
    .then(res => res.json())
    .then(json => {
      return json.data.filter(i => i.name === 'Winner')[0]
    })
}

const roundValue = (value) => {
  return value.toFixed(2)
}

const createFile = (text) => {
  fs.writeFile(`./${fileName}`, text, (err) => {
    if(err) {
      rl.write('Erro ao criar o arquivo!')
      console.log(err)
    }

    rl.write('Arquivo criado com sucesso!')
    rl.close()
  })
}

const run = async () => {
  console.log('Start application...')
  let resMatches = await getMatches()

  rl.write('Listando jogos de *HOJE* de Dota 2...\n')
  rl.write('.......\n')
  await choose()

  async function choose () {
    for (r in resMatches) {
      let template = `[${r}] ${resMatches[r].competitors[0].name} x ${resMatches[r].competitors[1].name} - ${normalizeHour(resMatches[r].scheduled_at)}\n`
      rl.write(template)
    }

    rl.question('Qual ODDs você deseja gerar? =>  ', async (answer) => {
      answer = parseInt(answer)
      if (!resMatches[answer]) {
        rl.write('Número inválido \n\n')
        choose()
      } else {
        const match = resMatches[answer]
        const odd = await getOdds(match.id)

        let templateFile = `${odd.outcomes[0].competitor.name} ${roundValue(odd.outcomes[0].odds)} x ${roundValue(odd.outcomes[1].odds)} ${odd.outcomes[1].competitor.name}`
        createFile(templateFile)
      }
    })
  }
}

run()