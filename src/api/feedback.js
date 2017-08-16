import axios from 'axios'

export default function createFeedback (action) {
  axios.post('http://localhost:3000/api/feedback', {
    action,
  }).then(function (res) {
    console.log('res', res)
  }).catch(function (err) {
    console.log('err', err)
  })
}
