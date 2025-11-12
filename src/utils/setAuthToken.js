import api from '../api';

const setAuthToken = token => {
  if (token) {
    // Apply authorization token to every request if logged in
    api.defaults.headers.common['x-auth-token'] = token;
  } else {
    // Delete auth header
    delete api.defaults.headers.common['x-auth-token'];
  }
};

export default setAuthToken;
