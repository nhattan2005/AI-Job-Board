Here is the full content for the file `client/src/services/api.js`:

import axios from 'axios';

const API_URL = '/api/career';

export const generateCareerPath = async (cvText) => {
  try {
    const response = await axios.post(`${API_URL}/generate-career-path`, { cvText });
    return response.data;
  } catch (error) {
    throw new Error('Error generating career path');
  }
};