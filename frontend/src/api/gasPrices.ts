import axios from "axios";
import { API_URL } from "@/config/api";

import { GasPrice } from "@/types/index";

const gasPricesApi = {
  getGasPrices: async (): Promise<GasPrice[]> => {
    const response = await axios.get(`${API_URL}/gasprice`);
    return response.data;
  },
};

export default gasPricesApi;
