import { isObject } from "lodash";

export function isPromise(promise) {
	return (
		isObject(promise) &&
		typeof promise.then === "function" &&
		typeof promise.catch === "function"
	);
}
