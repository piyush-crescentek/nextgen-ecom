import axios from "axios";
import { apiUrlWithSlash } from "@/lib/env";

const api = axios.create({
  baseURL: apiUrlWithSlash,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export default api;
