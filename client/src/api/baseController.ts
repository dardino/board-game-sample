/**
 * Type helper to extract path parameters from a string.
 */
type _PathParams<T extends string> = T extends `:${infer P}` ? P : never;

/**
 * Type helper to recursively extract path parameters from a string.
 */
type PathParams<T extends string> = T extends `${infer L}/${infer R}` ? _PathParams<L> | PathParams<R> : never;

/**
 * Replaces path parameters in a given path string with corresponding values from an object.
 *
 * @param path - The path string containing path parameters to be replaced.
 * @param pathArgs - An object containing key-value pairs representing the path parameters and their values.
 * @returns The updated path string with replaced path parameters.
 */
function replacePathParameters<T> (path: string, pathArgs: T): string {

  let newPath: string = path;
  (Object.entries(pathArgs ?? {}) as [string, string][]).forEach(([
    key,
    value
  ]) => {

    newPath = path.replace(
      new RegExp(
        ":" + key,
        "g"
      ),
      value
    );

  });
  return newPath;

}

/**
 * Base controller class for making API requests.
 */
export class BaseController {

  #basePath: string;

  /**
   * Creates an instance of BaseController.
   * @param basePath - The base path for the API requests.
   */
  constructor (basePath: string) {

    this.#basePath = basePath;

  }

  /**
   * Sends a GET request to the specified path.
   * @param path - The path for the GET request.
   * @param pathArgs - The path parameters for the GET request.
   * @returns A promise that resolves to the response data.
   */
  async get<ReturnType, T extends string> (path: T, pathArgs?: PathParams<T>): Promise<ReturnType> {

    const newPath = replacePathParameters(
      path,
      pathArgs
    );
    return this.fetch(
      newPath,
      "GET"
    );

  }

  /**
   * Sends a POST request to the specified path.
   * @param path - The path for the POST request.
   * @param bodyArgs - The body data for the POST request.
   * @param pathArgs - The path parameters for the POST request.
   * @returns A promise that resolves to the response data.
   */
  async post<ReturnType, T extends string, TBody> (path: T, bodyArgs: TBody, pathArgs?: PathParams<T>): Promise<ReturnType> {

    const newPath = replacePathParameters(
      path,
      pathArgs
    );
    return this.fetch(
      newPath,
      "POST",
      bodyArgs
    );

  }

  /**
   * Sends a DELETE request to the specified path.
   * @param path - The path for the DELETE request.
   * @param pathArgs - The path parameters for the DELETE request.
   * @returns A promise that resolves to the response data.
   */
  async delete<ReturnType, T extends string> (path: T, pathArgs?: PathParams<T>): Promise<ReturnType> {

    const newPath = replacePathParameters(
      path,
      pathArgs
    );
    return this.fetch(
      newPath,
      "DELETE"
    );

  }

  /**
   * Sends an HTTP request to the specified path.
   * @param path - The path for the request.
   * @param method - The HTTP method for the request.
   * @param data - The request data.
   * @returns A promise that resolves to the response data.
   */
  private async fetch<TResp> (
    path: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    data?: unknown
  ): Promise<TResp> {

    const headers = data
      ? {
        "Content-Type": "application/json"
        // 'Content-Type': 'application/x-www-form-urlencoded',
      }
      : undefined;
    const result = await fetch(
      `/api/${this.#basePath}${path
        ? "/"
        : ""}${path}`,
      {
        method,
        body: JSON.stringify(data), // body data type must match "Content-Type" header
        headers
      }
    );
    return processResponse<TResp>(result);

  }

}

/**
 * Processes the response from an HTTP request.
 * @param response - The response object.
 * @returns A promise that resolves to the response data.
 * @throws {ResponseError} If the response is not successful.
 */
async function processResponse<TResp> (response: Response): Promise<TResp> {

  if (response.ok) {

    return await response.json();

  } else {

    const jsonError = await response.json();
    throw new ResponseError(
      response.status,
      response.statusText,
      jsonError
    );

  }

}

/**
 * Represents an error response from an HTTP request.
 */
export class ResponseError {


  /**
   * Creates an instance of ResponseError.
   * @param status - The HTTP status code of the error response.
   * @param statusText - The HTTP status text of the error response.
   * @param body - The body of the error response.
   */
  constructor (public status: number, public statusText: string, public body: {
    message: string;
    error?: string;
    statusCode: number;
  }) { }

}
