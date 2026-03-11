import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "../__generated__/schema";

export const fetchClient = createFetchClient<paths>();
export const $api = createClient(fetchClient);
