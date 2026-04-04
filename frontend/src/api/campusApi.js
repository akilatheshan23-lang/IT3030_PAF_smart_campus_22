import axios from 'axios'

const campusApi = axios.create({
  baseURL: 'http://localhost:8080/api'
})

export default campusApi
