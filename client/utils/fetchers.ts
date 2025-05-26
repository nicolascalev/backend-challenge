// create a simple fetcher with axios for useSWR
import axios from "axios";

export const fetcherSimple = (url: string) =>
  axios.get(url).then((res) => res.data);

export const fetcherWithAuth = (url: string, token: string) =>
  axios
    .get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => res.data);

export const fetcherWithParams = (
  url: string,
  params: Record<string, string>
) =>
  axios
    .get(url, {
      params,
    })
    .then((res) => res.data);
