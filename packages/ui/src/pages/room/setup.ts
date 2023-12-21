import axios from 'axios';

export default {
  async setup() {
    const isPageValid = (await axios.get<string>('http://localhost:3000/api/create_room')).data;
    return {
      isPageValid,
    };
  },
};
