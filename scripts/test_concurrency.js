/**
 * calls the add number endpoint 100 times in parallel
 */

const axios = require('axios')

const addNumber = async (number) => {
  const response = await axios.post('http://localhost:3000/numbers/' + number)
  console.log(response.data)
}

const main = async () => {
  const promises = []
  for (let i = 0; i < 100; i++) {
    promises.push(addNumber(i))
  }
  await Promise.all(promises)

  const response = await axios.get('http://localhost:3000/numbers')
  console.log(response.data)
}

main()