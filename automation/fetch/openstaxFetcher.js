import { openstaxSource } from "../sources/openstax.js";

export async function fetchOpenStax(url) {
    if (!url.startsWith(openstaxSource.baseUrl)) {
        throw new Error("URL is not an OpenStax URL");
    }

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Failed to fetch OpenStax page: ${response.status} ${response.statusText}`
        );
    }

    return await response.text();
}