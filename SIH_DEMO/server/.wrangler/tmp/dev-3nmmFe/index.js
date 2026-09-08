var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/buffer.js
var bufferToFormData = /* @__PURE__ */ __name((arrayBuffer, contentType) => {
  const response = new Response(arrayBuffer, {
    headers: {
      // Normalize the media type (case-insensitive) while keeping parameters like the boundary
      "Content-Type": contentType.replace(/^[^;]+/, (mediaType) => mediaType.toLowerCase())
    }
  });
  return response.formData();
}, "bufferToFormData");

// node_modules/hono/dist/utils/body.js
var MAX_NESTING_DEPTH = 32;
var MAX_NESTED_OBJECTS = 1e4;
var isRawRequest = /* @__PURE__ */ __name((request) => "headers" in request, "isRawRequest");
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const contentType = headers.get("Content-Type");
  const mediaType = contentType?.split(";")[0].trim().toLowerCase();
  if (mediaType === "multipart/form-data" || mediaType === "application/x-www-form-urlencoded") {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  if (!isRawRequest(request) && request.bodyCache.formData) {
    return convertFormDataToBodyData(
      await request.bodyCache.formData,
      options
    );
  }
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const arrayBuffer = await request.arrayBuffer();
  const formDataPromise = bufferToFormData(arrayBuffer, headers.get("Content-Type") || "");
  if (!isRawRequest(request)) {
    request.bodyCache.formData = formDataPromise;
  }
  const formData = await formDataPromise;
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  const nestingState = { count: 0 };
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value, nestingState);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value, state) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form;
  const keys = key.split(".", MAX_NESTING_DEPTH + 2);
  if (keys.length > MAX_NESTING_DEPTH + 1) {
    throwNestingLimitExceeded();
  }
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        if (state.count++ >= MAX_NESTED_OBJECTS) {
          throwNestingLimitExceeded();
        }
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");
var throwNestingLimitExceeded = /* @__PURE__ */ __name(() => {
  throw new Error("Nesting limit exceeded");
}, "throwNestingLimitExceeded");

// node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (segment.charCodeAt(segment.length - 1) === 63) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.slice(0, -1);
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => str.indexOf("%") !== -1 ? tryDecode(str, decodeURIComponent_) : str, "tryDecodeURIComponent");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return tryDecodeURIComponent(value);
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  const hashIndex = url.indexOf("#", 8);
  if (hashIndex !== -1) {
    url = url.slice(0, hashIndex);
  }
  let encoded;
  if (!multiple && key && key.indexOf("%") === -1 && key.indexOf("+") === -1) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = /* @__PURE__ */ Object.create(null);
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex]?.[1][key];
    const param = this.#getParamValue(paramKey);
    return param && tryDecodeURIComponent(param);
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex]?.[1] ?? {});
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = tryDecodeURIComponent(value);
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = /* @__PURE__ */ Object.create(null);
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = /* @__PURE__ */ __name((key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    for (const anyCachedKey in bodyCache) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  }, "#cachedBody");
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * `.bytes()` parses the request body as a `Uint8Array`.
   *
   * @see {@link https://hono.dev/docs/api/request#bytes}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.bytes()
   * })
   * ```
   */
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    ;
    (this.#validatedData ??= {})[target] = data;
  }
  valid(target) {
    return this.#validatedData?.[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var createResponseInstance = /* @__PURE__ */ __name((body, init) => new Response(body, init), "createResponseInstance");
var Context = class {
  static {
    __name(this, "Context");
  }
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   // Append multiple headers using the append option (e.g. Vary)
   *   c.header('Vary', 'Accept-Encoding', { append: true })
   *   c.header('Vary', 'User-Agent', { append: true })
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = /* @__PURE__ */ __name((name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    let responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders;
    if (typeof arg === "object" && arg.headers) {
      responseHeaders ??= new Headers();
      for (const [key, value] of new Headers(arg.headers)) {
        if (key === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      if (!responseHeaders) {
        let count = 0;
        for (const k in headers) {
          if (++count > 1 || typeof headers[k] !== "string") {
            responseHeaders = new Headers();
            break;
          }
        }
      }
      if (responseHeaders) {
        for (const k in headers) {
          const v = headers[k];
          if (typeof v === "string") {
            responseHeaders.set(k, v);
          } else {
            responseHeaders.delete(k);
            for (const v2 of v) {
              responseHeaders.append(k, v2);
            }
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, {
      status,
      headers: responseHeaders ?? headers
    });
  }
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = /* @__PURE__ */ __name((text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  }, "text");
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  }, "json");
  html = /* @__PURE__ */ __name((html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  }, "html");
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = /* @__PURE__ */ __name((location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch", "query"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = class _Hono {
  static {
    __name(this, "_Hono");
  }
  get;
  post;
  put;
  delete;
  options;
  patch;
  query;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        const methodName = method.toUpperCase();
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(methodName, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(methodName, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          const methodName = m.toUpperCase();
          for (const handler of handlers) {
            this.#addRoute(methodName, this.#path, handler);
          }
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler, r.basePath);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = this.getPath(request).slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler, baseRoutePath) {
    path = mergePath(this._basePath, path);
    const r = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path,
      method,
      handler
    };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} env - env Object
   * @param {ExecutionContext} executionCtx - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  }, "request");
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};

// node_modules/hono/dist/router/utils.js
var createNullObject = /* @__PURE__ */ __name(() => /* @__PURE__ */ Object.create(null), "createNullObject");

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name(((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }), "match2");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return b === TAIL_WILDCARD_REG_EXP_STR ? -1 : 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = class _Node {
  static {
    __name(this, "_Node");
  }
  // handler index of a dynamic path, or -1 for a static path terminal
  #index;
  #varIndex;
  #children = createNullObject();
  insert(tokens, index, paramMap, context, isStatic) {
    let node = this;
    for (let i = 0, len = tokens.length; i < len; i++) {
      const token = tokens[i];
      const pattern = token.length === 1 ? token === "*" ? i === len - 1 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : null : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
      let nextNode;
      if (pattern) {
        const name = pattern[1];
        let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
        if (name && pattern[2]) {
          if (regexpStr === ".*") {
            throw PATH_ERROR;
          }
          regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
          if (/\((?!\?:)/.test(regexpStr)) {
            throw PATH_ERROR;
          }
          if (regexpStr.length === 1 && regExpMetaChars.has(regexpStr)) {
            throw PATH_ERROR;
          }
        }
        nextNode = node.#children[regexpStr];
        if (!nextNode) {
          if (regexpStr !== ONLY_WILDCARD_REG_EXP_STR && regexpStr !== TAIL_WILDCARD_REG_EXP_STR) {
            for (const k in node.#children) {
              if (
                // a single-char pattern coexists with single-char literals as a literal does
                (regexpStr.length > 1 || k.length > 1) && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
              ) {
                throw PATH_ERROR;
              }
            }
          }
          nextNode = node.#children[regexpStr] = new _Node();
        }
        if (name !== "") {
          nextNode.#varIndex ??= context.varIndex++;
          paramMap.push([name, nextNode.#varIndex]);
        }
      } else {
        nextNode = node.#children[token];
        if (!nextNode) {
          for (const k in node.#children) {
            if (k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR) {
              throw PATH_ERROR;
            }
          }
          nextNode = node.#children[token] = new _Node();
        }
      }
      node = nextNode;
    }
    if (node.#index !== void 0) {
      throw PATH_ERROR;
    }
    node.#index = isStatic ? -1 : index;
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      const childStr = c.buildRegExpStr();
      return childStr === "" ? "" : (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + childStr;
    }).filter(Boolean);
    if (typeof this.#index === "number" && this.#index !== -1) {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  static {
    __name(this, "Trie");
  }
  #context = { varIndex: 0 };
  #root = new Node();
  #index = 0;
  // dynamic path -> [handler index, param assoc]; static paths are not registered
  paths = createNullObject();
  insert(path, isStatic) {
    if (isStatic) {
      this.#root.insert(path.split(""), 0, [], this.#context, true);
      return;
    }
    const paramAssoc = [];
    const groups = [];
    let markedPath = path;
    for (let i = 0; ; ) {
      let replaced = false;
      markedPath = markedPath.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = markedPath.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, this.#index, paramAssoc, this.#context, false);
    this.paths[path] = [this.#index++, paramAssoc];
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var wildcardRegExpCache = createNullObject();
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    `^${path.replace(
      /\/:[^/{}]+(?:\{\[\^\/]\+})?(?=[/{]|$)|\/?\*$|([.\\+*[^\]$()?{}|])/g,
      (match2, metaChar) => metaChar ? `\\${metaChar}` : match2 === "/*" ? TAIL_WILDCARD_REG_EXP_STR : match2 === "*" ? ONLY_WILDCARD_REG_EXP_STR : `/:${LABEL_REG_EXP_STR}`
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function findMiddleware(middleware, path) {
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  name = "RegExpRouter";
  #middleware;
  #routes;
  #tries;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: createNullObject() };
    this.#routes = { [METHOD_NAME_ALL]: createNullObject() };
    this.#tries = { [METHOD_NAME_ALL]: new Trie() };
  }
  #insertPath(method, path) {
    try {
      this.#tries[method].insert(path, !/\*|\/:/.test(path));
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      this.#tries[method] = new Trie();
      for (const handlerMap of [middleware, routes]) {
        handlerMap[method] = createNullObject();
        for (const p in handlerMap[METHOD_NAME_ALL]) {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
          this.#insertPath(method, p);
        }
      }
    }
    if (path === "/*") {
      path = "*";
    }
    const methods = method === METHOD_NAME_ALL ? Object.keys(middleware) : [method];
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      for (const m of methods) {
        if (!middleware[m][path]) {
          this.#insertPath(m, path);
          middleware[m][path] = findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        }
      }
      for (const handlerMap of [middleware, routes]) {
        for (const m of methods) {
          for (const p in handlerMap[m]) {
            re.test(p) && handlerMap[m][p].push([handler, path]);
          }
        }
      }
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (const path2 of paths) {
      for (const m of methods) {
        if (!routes[m][path2]) {
          this.#insertPath(m, path2);
          routes[m][path2] = findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || [];
        }
        routes[m][path2].push([handler, path2]);
      }
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = createNullObject();
    for (const method of Object.keys(this.#routes)) {
      matchers[method] = this.#buildMatcher(method);
    }
    this.#middleware = this.#routes = this.#tries = void 0;
    wildcardRegExpCache = createNullObject();
    return matchers;
  }
  #buildMatcher(method) {
    const middleware = this.#middleware[method];
    const routes = this.#routes[method];
    const trie = this.#tries[method];
    const staticMap = createNullObject();
    const handlerData = [];
    const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
    for (const r of [middleware, routes]) {
      for (const path in r) {
        const handlers = r[path];
        const pathData = trie.paths[path];
        if (!pathData) {
          staticMap[path] = [handlers.map(([h]) => [h, createNullObject()]), emptyParam];
          continue;
        }
        handlerData[pathData[0]] = handlers.map(([h, handlerPath]) => [
          h,
          trie.paths[handlerPath][1].reduceRight((map, [key], i) => {
            map[key] = paramReplacementMap[pathData[1][i][1]];
            return map;
          }, createNullObject())
        ]);
      }
    }
    return [regexp, indexReplacementMap.map((i) => handlerData[i]), staticMap];
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = createNullObject();
var order = 0;
var Node2 = class _Node2 {
  static {
    __name(this, "_Node");
  }
  #methods = [];
  #children = createNullObject();
  #patterns = [];
  #pattern;
  #params = emptyParams;
  insert(method, path, handler) {
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = /* @__PURE__ */ new Set();
    let i = 0;
    for (const p of parts) {
      const nextP = parts[++i];
      const pattern = getPattern(p, nextP) || (nextP === void 0 && p && p.indexOf("*") === p.length - 1 ? p : null);
      const isParam = Array.isArray(pattern);
      const key = isParam ? pattern[0] : pattern || p;
      const child = curNode.#children[key] ||= new _Node2();
      if (pattern && !child.#pattern) {
        child.#pattern = pattern;
        curNode.#patterns.push(child);
      }
      curNode = child;
      if (isParam) {
        possibleKeys.add(pattern[1]);
      }
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: [...possibleKeys],
        score: ++order
      }
    });
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      if (handlerSet) {
        handlerSet.params = createNullObject();
        handlerSets.push(handlerSet);
        for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
          const key = handlerSet.possibleKeys[i2];
          handlerSet.params[key] = params?.[key] && !i2 ? params[key] : nodeParams[key] ?? params?.[key];
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (const child of node.#patterns) {
          const pattern = child.#pattern;
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (typeof pattern === "string") {
            if (pattern === "*" || part.startsWith(pattern.slice(0, -1))) {
              this.#pushHandlerSets(handlerSets, child, method, node.#params);
              if (pattern === "*") {
                child.#params = params;
                tempNodes.push(child);
              }
            }
            continue;
          }
          const [, name, matcher] = pattern;
          if (!part && matcher === true) {
            continue;
          }
          if (matcher !== true) {
            if (!partOffsets) {
              partOffsets = [];
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.slice(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (m[0].length === restPathString.length && child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  node.#params,
                  params
                );
              }
              for (const _ in child.#children) {
                child.#params = params;
                const componentCount = m[0].match(/\//g)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
                break;
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets[1]) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  name = "TrieRouter";
  #node = new Node2();
  add(method, path, handler) {
    for (const result of checkOptionalParameter(path) || [path]) {
      this.#node.insert(method, result, handler);
    }
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// ../content/concepts/introduction-to-trigonometry/02-angles.json
var angles_default = {
  id: "angles",
  title: "Angles",
  subject: "mathematics",
  topic: "trigonometry",
  section: "intro-trigono",
  difficulty: 1,
  connections: {
    prerequisites: [],
    leads_to: [
      "angle-measurement",
      "degrees-and-radians",
      "angles-on-a-circle"
    ],
    related: [
      "geometry",
      "coordinate-plane",
      "rotation"
    ]
  },
  theory: {
    introduction: "An angle is not merely a shape drawn between two lines. It can be understood as a geometric object created by two rays and, dynamically, as the amount of rotation from one ray to another. This rotational viewpoint is especially important in trigonometry because trigonometric functions eventually describe what happens as an angle rotates around a circle.",
    sections: [
      {
        id: "what-is-a-ray",
        title: "1. The Ray: The Building Block of an Angle",
        content: [
          {
            type: "paragraph",
            id: "ray-definition",
            text: "A ray is a directed part of a line that begins at one endpoint and continues indefinitely in one direction. The endpoint is the starting point of the ray, while the other points extend away from it."
          },
          {
            type: "paragraph",
            id: "ray-naming",
            text: "A ray can be named using its endpoint followed by any other point lying on the ray. For example, if E is the endpoint and F is another point on the ray, the ray can be written as ray EF. The order matters because the first point identifies the endpoint."
          },
          {
            type: "paragraph",
            id: "ray-direction",
            text: "The idea of direction is important. Unlike an ordinary line segment, a ray has one fixed endpoint and extends infinitely in only one direction. This directional nature becomes important when an angle is viewed as a rotation."
          }
        ]
      },
      {
        id: "parts-of-an-angle",
        title: "2. What Is an Angle?",
        content: [
          {
            type: "paragraph",
            id: "angle-definition",
            text: "An angle is formed by two rays that have a common endpoint. The common endpoint is called the vertex, and the two rays are called the sides of the angle."
          },
          {
            type: "paragraph",
            id: "angle-vertex",
            text: "The vertex is the point about which the angle is formed. It is the point shared by both sides of the angle. In an angle written with three letters, the vertex is always the middle letter."
          },
          {
            type: "paragraph",
            id: "angle-sides",
            text: "The sides of an angle are the two rays that extend from the vertex. The angle is therefore determined by the two directions in which these rays point."
          },
          {
            type: "paragraph",
            id: "angle-visual-intuition",
            text: "A useful way to picture an angle is to imagine two rays initially lying on top of one another. Keep one ray fixed and rotate the other. The amount through which the moving ray turns determines the angle."
          }
        ]
      },
      {
        id: "naming-angles",
        title: "3. How Angles Are Named",
        content: [
          {
            type: "paragraph",
            id: "three-letter-naming",
            text: "An angle can be named using three letters: one point on the first side, the vertex, and one point on the second side. The vertex must be the middle letter. For example, angle DEF has vertex E, because E is the middle letter."
          },
          {
            type: "paragraph",
            id: "single-letter-naming",
            text: "When there is no ambiguity about which angle at a vertex is being discussed, an angle may also be named using the letter of its vertex alone."
          },
          {
            type: "paragraph",
            id: "greek-angle-letters",
            text: "Greek letters are frequently used to represent angles or their measures. Common symbols include theta (\u03B8), phi (\u03C6), alpha (\u03B1), beta (\u03B2), and gamma (\u03B3). These symbols are variables: they do not represent one particular fixed angle unless the context defines them."
          }
        ]
      },
      {
        id: "angle-as-rotation",
        title: "4. An Angle as Rotation",
        content: [
          {
            type: "paragraph",
            id: "dynamic-angle",
            text: "An angle can be understood dynamically as a rotation. Imagine two rays starting on top of each other. Keep one ray fixed and rotate the other around the common endpoint. The fixed ray is the initial side, and the ray that moves is the terminal side."
          },
          {
            type: "paragraph",
            id: "initial-side",
            text: "The initial side is the ray from which the rotation begins. It provides the starting direction of the angle."
          },
          {
            type: "paragraph",
            id: "terminal-side",
            text: "The terminal side is the ray at which the rotation ends. The final direction of this ray determines where the angle finishes."
          },
          {
            type: "paragraph",
            id: "rotation-arrow",
            text: "When an angle is drawn as a rotation, an arrow near the vertex can indicate the direction in which the terminal side moved. This is useful because the same two geometric rays can be associated with different rotations depending on the direction and number of turns."
          },
          {
            type: "paragraph",
            id: "angle-measure-concept",
            text: "The measure of an angle is the amount of rotation from the initial side to the terminal side. The numerical unit used to describe that rotation will be studied separately."
          }
        ]
      },
      {
        id: "positive-negative-angles",
        title: "5. Positive and Negative Angles",
        content: [
          {
            type: "paragraph",
            id: "counterclockwise-positive",
            text: "By convention, a counterclockwise rotation is represented by a positive angle. Starting from the initial side, moving counterclockwise means the angle has a positive measure."
          },
          {
            type: "paragraph",
            id: "clockwise-negative",
            text: "A clockwise rotation is represented by a negative angle. The negative sign therefore communicates direction; it does not mean that the angle is somehow a physically negative size."
          },
          {
            type: "paragraph",
            id: "same-terminal-different-rotation",
            text: "A positive and a negative angle can end at the same terminal side if they differ by complete rotations. Thus, the final position of the terminal side alone does not always tell us how much rotation occurred or in which direction."
          },
          {
            type: "paragraph",
            id: "multiple-rotations",
            text: "An angle can represent more than one complete rotation. For example, a rotation can go all the way around once and continue further before stopping. This is important because trigonometry works with angles as rotations, not merely with the small region visually enclosed by two rays."
          }
        ]
      },
      {
        id: "standard-position",
        title: "6. Angles in Standard Position",
        content: [
          {
            type: "paragraph",
            id: "standard-position-definition",
            text: "For systematic work in trigonometry, angles are commonly placed on the coordinate plane in standard position. An angle is in standard position when its vertex is at the origin and its initial side lies along the positive x-axis."
          },
          {
            type: "paragraph",
            id: "why-standard-position",
            text: "Standard position gives every angle the same starting point and starting direction. This makes different angles easier to compare and provides a common framework for connecting angles with the coordinate plane and, later, with the unit circle."
          },
          {
            type: "paragraph",
            id: "standard-position-start",
            text: "To place an angle in standard position, first place the vertex at the origin. Then place the initial side along the positive x-axis. The terminal side is obtained by rotating from that starting ray in the required direction."
          },
          {
            type: "paragraph",
            id: "standard-position-direction",
            text: "For a positive angle, rotate counterclockwise from the positive x-axis. For a negative angle, rotate clockwise from the positive x-axis."
          },
          {
            type: "paragraph",
            id: "terminal-side-determines-position",
            text: "Once an angle is in standard position, its terminal side tells us where the rotation ends. The terminal side may lie inside a quadrant or directly on one of the coordinate axes."
          }
        ]
      },
      {
        id: "quadrantal-angles",
        title: "7. Quadrantal Angles",
        content: [
          {
            type: "paragraph",
            id: "quadrantal-definition",
            text: "A quadrantal angle is an angle in standard position whose terminal side lies along a coordinate axis."
          },
          {
            type: "paragraph",
            id: "quadrantal-values",
            text: "The basic quadrantal positions in one full rotation correspond to 0\xB0, 90\xB0, 180\xB0, 270\xB0, and 360\xB0. These positions lie on the positive x-axis, positive y-axis, negative x-axis, negative y-axis, and again the positive x-axis respectively."
          },
          {
            type: "paragraph",
            id: "zero-and-full-rotation",
            text: "An angle of 0\xB0 means that no rotation has occurred, so the initial and terminal sides coincide. A full rotation brings the terminal side back to the initial side, even though a complete turn has occurred."
          },
          {
            type: "paragraph",
            id: "quadrantal-importance",
            text: "Quadrantal angles are important because they provide the boundaries between the four quadrants of the coordinate plane. They also become important later when trigonometric functions are studied on the unit circle."
          }
        ]
      },
      {
        id: "drawing-standard-position",
        title: "8. How to Draw an Angle in Standard Position",
        content: [
          {
            type: "paragraph",
            id: "draw-step-one",
            text: "Step 1: Draw the coordinate axes and place the vertex of the angle at the origin."
          },
          {
            type: "paragraph",
            id: "draw-step-two",
            text: "Step 2: Draw the initial side along the positive x-axis."
          },
          {
            type: "paragraph",
            id: "draw-step-three",
            text: "Step 3: Determine the direction of rotation. Move counterclockwise for a positive angle and clockwise for a negative angle."
          },
          {
            type: "paragraph",
            id: "draw-step-four",
            text: "Step 4: Rotate through the required amount until reaching the terminal side. If the angle represents more than one full rotation, continue rotating through the additional turns before stopping."
          },
          {
            type: "paragraph",
            id: "draw-step-five",
            text: "Step 5: Mark or draw the terminal side clearly. The direction of rotation can be shown with a curved arrow near the vertex."
          },
          {
            type: "paragraph",
            id: "drawing-fraction-of-rotation",
            text: "When the angle is given in degrees, its position can be understood by comparing it with a full circular rotation. A complete rotation corresponds to 360\xB0, so the angle represents a particular fraction of one complete turn. Detailed conversion between angle units belongs to the later study of degree and radian measure."
          }
        ]
      },
      {
        id: "angles-and-coordinate-plane",
        title: "9. Angles and the Four Quadrants",
        content: [
          {
            type: "paragraph",
            id: "quadrant-idea",
            text: "The coordinate plane is divided into four quadrants by the x-axis and y-axis. When an angle is placed in standard position, its terminal side can point into any of these four regions or lie directly on an axis."
          },
          {
            type: "paragraph",
            id: "counterclockwise-quadrants",
            text: "Starting from the positive x-axis and rotating counterclockwise, the terminal side moves through the first quadrant, then the second, third, and fourth quadrants before returning to the positive x-axis after a complete rotation."
          },
          {
            type: "paragraph",
            id: "quadrant-not-measure",
            text: "A quadrant describes the location of the terminal side; it does not by itself give the exact angle. Many different angles can have terminal sides in the same quadrant, including angles that have made additional complete rotations."
          },
          {
            type: "paragraph",
            id: "why-quadrants-matter",
            text: "Knowing the quadrant of the terminal side becomes especially useful later because the signs and values of trigonometric functions depend on the position of the terminal side."
          }
        ]
      },
      {
        id: "angle-mental-model",
        title: "10. The Mental Model to Carry Forward",
        content: [
          {
            type: "paragraph",
            id: "angle-core-model",
            text: "The most useful way to think about an angle is as directed rotation. Start with an initial side, rotate it about the vertex, and stop at the terminal side. The amount of rotation is the angle's measure, while the direction tells us whether the angle is positive or negative."
          },
          {
            type: "paragraph",
            id: "geometry-to-trigonometry",
            text: "This viewpoint is the bridge from elementary geometry to trigonometry. Instead of treating an angle as merely the small opening between two rays, trigonometry treats it as a quantity that can rotate through a circle, make multiple turns, and be placed systematically on a coordinate plane."
          },
          {
            type: "paragraph",
            id: "next-concept-bridge",
            text: "Once the idea of an angle is clear, the next question is: how do we measure this amount of rotation precisely? That leads to angle measurement and, eventually, to the two most important angle units used in trigonometry: degrees and radians."
          }
        ]
      }
    ]
  },
  formulas: [],
  examples: [
    {
      id: "identify-angle-parts",
      question: "Two rays share the endpoint O. One ray passes through A and the other passes through B. Identify the vertex and the sides of the angle.",
      solution: "The common endpoint is O, so O is the vertex. The two sides are the rays extending from O through A and B. The angle can therefore be named angle AOB or angle BOA, provided there is no ambiguity about which angle is intended."
    },
    {
      id: "standard-position-positive",
      question: "Describe how you would place a positive angle in standard position on the coordinate plane.",
      solution: "Place the vertex at the origin and draw the initial side along the positive x-axis. Because the angle is positive, rotate the terminal side counterclockwise through the required amount."
    },
    {
      id: "standard-position-negative",
      question: "Describe how you would place a negative angle in standard position.",
      solution: "Place the vertex at the origin and the initial side along the positive x-axis. Because the angle is negative, rotate the terminal side clockwise through the required amount."
    },
    {
      id: "quadrantal-identification",
      question: "Why is an angle whose terminal side lies on the y-axis called a quadrantal angle?",
      solution: "A quadrantal angle is defined by the location of its terminal side. If the terminal side lies on a coordinate axis, the angle is quadrantal. The y-axis corresponds to the 90\xB0 and 270\xB0 positions in one full rotation."
    },
    {
      id: "same-terminal-side",
      question: "Can two different rotations end with the terminal side in exactly the same direction?",
      solution: "Yes. A rotation can make one or more complete turns and still finish in the same direction as a shorter rotation. This is why angles must be understood as rotations, including direction and the number of complete turns, rather than only as the final geometric position."
    },
    {
      id: "multiple-rotation",
      question: "What happens to the terminal side after one complete counterclockwise rotation?",
      solution: "It returns to the same position as the initial side. The terminal side overlaps the initial side, but a complete rotation has still occurred."
    }
  ],
  key_ideas: [
    "A ray has one endpoint and extends indefinitely in one direction.",
    "An angle is formed by two rays with a common endpoint.",
    "The common endpoint is the vertex and the rays are the sides of the angle.",
    "An angle can be viewed dynamically as rotation from an initial side to a terminal side.",
    "The initial side is fixed at the beginning of the rotation and the terminal side is where the rotation ends.",
    "Counterclockwise rotation represents a positive angle.",
    "Clockwise rotation represents a negative angle.",
    "An angle may represent more than one complete rotation.",
    "An angle in standard position has its vertex at the origin and its initial side along the positive x-axis.",
    "A quadrantal angle has its terminal side on a coordinate axis.",
    "The position of an angle's terminal side is different from the total amount of rotation used to reach it.",
    "The rotational viewpoint of angles provides the foundation for trigonometry and the unit circle."
  ],
  misconceptions: [
    "An angle is only the small region visually enclosed between two rays.",
    "Every angle must be positive.",
    "A negative angle means that the angle has a negative physical size rather than indicating clockwise direction.",
    "The terminal side must always lie inside one of the four quadrants.",
    "Two rotations ending at the same terminal side must represent the same angle.",
    "An angle cannot make more than one complete rotation.",
    "Standard position means placing the terminal side on the positive x-axis.",
    "The vertex of a three-letter angle name is the first letter rather than the middle letter.",
    "The numerical value of an angle tells its complete meaning without considering the direction of rotation."
  ],
  explorations: [],
  sources: []
};

// ../content/concepts/introduction-to-trigonometry/03-angle-measurement.json
var angle_measurement_default = {
  id: "angle-measurement",
  title: "Angle Measurement",
  subject: "mathematics",
  topic: "trigonometry",
  section: "intro-trigono",
  difficulty: 1,
  connections: {
    prerequisites: [
      "angles"
    ],
    leads_to: [
      "degrees-and-radians",
      "angles-on-a-circle"
    ],
    related: [
      "rotation",
      "circles",
      "arc-length",
      "coordinate-plane"
    ]
  },
  theory: {
    introduction: "In trigonometry, an angle represents an amount of rotation. To work with angles mathematically, we need a way to describe that rotation with numbers. A circle provides a natural reference for doing this: we can compare a rotation with a complete revolution, or relate the arc traced by the rotation to the radius of the circle.",
    sections: [
      {
        id: "why-measure-angles",
        title: "Why Do We Need to Measure an Angle?",
        content: [
          {
            type: "paragraph",
            id: "angle-needs-number",
            text: "An angle tells us how much one direction has rotated relative to another, but trigonometry needs more than a visual description. We need a numerical measure so that different rotations can be compared, calculated, and eventually used as inputs to trigonometric functions."
          },
          {
            type: "paragraph",
            id: "measurement-as-rotation",
            text: "For example, a quarter-turn, a half-turn, and a full turn are clearly different amounts of rotation. Angle measurement assigns numbers to these amounts so that the relationship between them can be expressed precisely."
          },
          {
            type: "paragraph",
            id: "measurement-and-trigonometry",
            text: "Once an angle has a numerical measure, trigonometry can connect that measure with geometric quantities such as side lengths, coordinates, and positions on a circle."
          }
        ]
      },
      {
        id: "rotation-and-circle",
        title: "Measuring Rotation Using a Circle",
        content: [
          {
            type: "paragraph",
            id: "circle-reference",
            text: "A complete rotation provides a natural reference for measuring an angle. If a rotating ray makes one complete turn, it has returned to its original direction. A smaller rotation can then be described as a fraction of that complete revolution."
          },
          {
            type: "paragraph",
            id: "fractions-of-revolution",
            text: "A quarter-turn represents one-fourth of a revolution, a half-turn represents one-half of a revolution, and three-quarters of a turn represents three-fourths of a revolution. Rotations can also continue beyond one complete revolution, so an angle may represent more than one full turn."
          },
          {
            type: "paragraph",
            id: "direction-matters",
            text: "The direction of rotation matters as well. In standard trigonometric convention, counterclockwise rotation is positive and clockwise rotation is negative. Therefore, the same terminal direction can be reached by rotations with different signed measures."
          }
        ]
      },
      {
        id: "circle-as-reference",
        title: "The Circle as a Reference for Angle Measurement",
        content: [
          {
            type: "paragraph",
            id: "same-angle-different-circles",
            text: "Consider the same angle drawn from the center of two circles with different radii. The larger circle produces a longer arc, while the smaller circle produces a shorter arc. However, the amount of rotation is unchanged, so the angle itself has not changed."
          },
          {
            type: "paragraph",
            id: "angle-versus-distance",
            text: "This shows an important distinction: an angle measures an amount of rotation, whereas the arc measures a physical distance travelled along a circle. Arc length can change when the circle changes size even though the angle remains the same."
          },
          {
            type: "paragraph",
            id: "scale-independent-angle",
            text: "A useful angle-measurement system should therefore describe the rotation independently of the particular circle on which we draw it."
          }
        ]
      },
      {
        id: "arcs-and-rotation",
        title: "Arcs and the Rotation They Represent",
        content: [
          {
            type: "paragraph",
            id: "arc-definition-context",
            text: "When a point on a circle moves as a ray rotates about the center, it traces a curved path called an arc. The arc records the part of the circular path swept out during the rotation."
          },
          {
            type: "paragraph",
            id: "partial-complete-multiple-arcs",
            text: "The traced arc may represent only part of a circle, an entire circle, or more than one complete revolution. Thus, circular motion gives us a visual way to see how much rotation has occurred."
          },
          {
            type: "paragraph",
            id: "arc-not-angle",
            text: "The arc and the angle are related, but they are not the same quantity. For a fixed angle, increasing the radius increases the arc length. The angle describes the rotation; the arc describes the resulting distance along the circle."
          }
        ]
      },
      {
        id: "central-angle",
        title: "Central Angles",
        content: [
          {
            type: "paragraph",
            id: "central-angle-definition",
            text: "When the vertex of an angle is at the center of a circle and its sides extend along radii, the angle is called a central angle."
          },
          {
            type: "paragraph",
            id: "central-angle-arc",
            text: "A central angle naturally determines an arc of the circle. The two sides of the angle meet the circle at two points, and the portion of the circumference between those points is the arc associated with the rotation."
          },
          {
            type: "paragraph",
            id: "central-angle-radian-bridge",
            text: "Central angles are especially important because they provide the geometric setting for radian measurement. Instead of defining an angle only by dividing a full revolution into equal pieces, we can connect its measure directly to the arc it subtends and the circle's radius."
          }
        ]
      },
      {
        id: "arc-length-radius-relationship",
        title: "Why the Radius Matters",
        content: [
          {
            type: "paragraph",
            id: "arc-grows-with-radius",
            text: "For a particular angle, a larger circle produces a proportionally larger arc. A smaller circle produces a proportionally smaller arc. The arc length therefore depends on both the angle and the size of the circle."
          },
          {
            type: "paragraph",
            id: "ratio-removes-scale",
            text: "Dividing the arc length by the radius removes this dependence on the scale of the circle. For a given angle, the ratio of arc length to radius is the same regardless of the radius used."
          },
          {
            type: "paragraph",
            id: "ratio-depends-on-angle",
            text: "This is a powerful idea: the arc length changes from circle to circle, the radius changes from circle to circle, but their ratio remains tied to the amount of rotation. This gives us a natural, scale-independent way to measure an angle."
          }
        ]
      },
      {
        id: "angle-measurement-units",
        title: "Angle Measurement Requires a Unit",
        content: [
          {
            type: "paragraph",
            text: "Angle measurement can use different units. This lesson introduces the need for a unit; the complete comparison, definition, conversion rules, and common values for degrees and radians are taught in degrees-and-radians."
          }
        ]
      },
      {
        id: "degrees-as-revolution",
        title: "Degrees as a Fraction of a Revolution",
        content: [
          {
            type: "paragraph",
            text: "A degree divides one full revolution into 360 equal parts. This is enough here to establish the idea of a measurement unit; the detailed degree/radian conversion system belongs to degrees-and-radians."
          }
        ]
      },
      {
        id: "toward-radians",
        title: "Why Another Angle Measure?",
        content: [
          {
            type: "paragraph",
            text: "Radians will be introduced as the natural circle-based angle measure in the next lesson. The full definition, why radians are useful, and conversion formulas are intentionally left to degrees-and-radians."
          }
        ]
      }
    ]
  },
  formulas: [],
  examples: [
    {
      id: "quarter-turn-measure",
      question: "A rotating ray turns through exactly one-fourth of a complete revolution. What fraction of a full rotation has occurred, and what is its degree measure?",
      solution: "One-fourth of a complete revolution has occurred. Since a complete revolution is 360 degrees in the degree system, the rotation measures 360 \xD7 1/4 = 90 degrees."
    },
    {
      id: "same-angle-different-circles",
      question: "The same central angle is drawn on two circles, one with radius 2 units and another with radius 5 units. Does the angle change because the circles have different sizes?",
      solution: "No. The amount of rotation is the same, so the angle is the same. The larger circle produces a longer arc, but the angle itself is independent of the circle's size."
    },
    {
      id: "arc-versus-angle",
      question: "Two circles are rotated through the same angle, but one circle has twice the radius of the other. Which circle produces the longer arc?",
      solution: "The circle with twice the radius produces the longer arc. For the same angle, increasing the radius increases the arc length proportionally. The angle remains unchanged."
    },
    {
      id: "clockwise-rotation",
      question: "A ray is rotated clockwise through one-quarter of a complete revolution. What is its degree measure under the usual signed-angle convention?",
      solution: "One-quarter of a revolution is 90 degrees. Because the rotation is clockwise, it is negative, so the signed angle measure is -90 degrees."
    },
    {
      id: "scale-independent-ratio",
      question: "Why can the ratio of an arc length to the radius be useful for describing an angle, even though the arc length itself changes when the circle gets larger?",
      solution: "For a fixed angle, increasing the radius increases the arc length in the same proportion. Dividing the arc length by the radius removes this scale effect, leaving a ratio determined by the amount of rotation."
    }
  ],
  key_ideas: [
    "In trigonometry, an angle can be understood as an amount of directed rotation.",
    "Angle measurement assigns a numerical value to an amount of rotation.",
    "A complete revolution provides a natural reference for comparing rotations.",
    "Arc length is a distance travelled along a circle, while angle measure describes the amount of rotation.",
    "The same angle can be drawn on circles of different radii.",
    "Changing the radius changes the arc length but does not change the angle.",
    "For a fixed angle, the ratio of arc length to radius is independent of the circle's size.",
    "A central angle has its vertex at the center of a circle and naturally determines an arc.",
    "Degrees represent a full revolution as 360 equal parts.",
    "Angle measurement systems are ways of assigning numbers to the same physical rotation.",
    "Radians arise naturally from the relationship between arc length and radius.",
    "Degrees and radians represent the same geometric idea using different measurement systems."
  ],
  misconceptions: [
    "A longer arc always means a larger angle.",
    "Changing the radius of a circle changes the angle.",
    "Arc length and angle measure are the same quantity.",
    "An angle can only represent less than one complete revolution.",
    "360 degrees is a fundamental property that every angle-measurement system must use.",
    "A negative angle means the angle is somehow physically smaller; it actually indicates clockwise direction under the signed-angle convention.",
    "If two rotations end in the same direction, they must have had the same angle measure.",
    "The ratio of arc length to radius depends on the size of the circle.",
    "Radians are simply another name for degrees."
  ],
  explorations: [],
  sources: []
};

// ../content/concepts/introduction-to-trigonometry/04-degrees-and-radians.json
var degrees_and_radians_default = {
  id: "degrees-and-radians",
  title: "Degrees and Radians",
  subject: "mathematics",
  topic: "trigonometry",
  section: "intro-trigono",
  difficulty: 1,
  connections: {
    prerequisites: [
      "angle-measurement"
    ],
    leads_to: [
      "angles-on-a-circle",
      "right-triangles"
    ],
    related: [
      "circles",
      "arc-length",
      "unit-circle",
      "rotation"
    ]
  },
  theory: {
    introduction: "An angle represents an amount of rotation, and that rotation can be assigned a numerical measure in more than one way. Degrees describe a rotation by dividing a full revolution into 360 equal parts, while radians describe the same rotation through the relationship between arc length and radius. Understanding both systems\u2014and being able to move between them\u2014is essential because trigonometry uses angles in both geometric and algebraic settings.",
    sections: [
      {
        id: "degree-measure",
        title: "Degrees: Measuring a Revolution in 360 Parts",
        content: [
          {
            type: "paragraph",
            id: "degree-definition",
            text: "A degree is a unit of angle measure in which one degree represents one three-hundred-sixtieth of a complete revolution. Therefore, a complete revolution measures 360\xB0, a half revolution measures 180\xB0, and a quarter revolution measures 90\xB0."
          },
          {
            type: "paragraph",
            id: "degree-as-convention",
            text: "The number 360 comes from the way the degree system divides a full turn. It is a convenient convention rather than a fundamental feature that every angle-measurement system must use."
          },
          {
            type: "paragraph",
            id: "signed-degree-measure",
            text: "Angles can also be directed. Under the usual convention, counterclockwise rotation is positive and clockwise rotation is negative. This allows degree measures to describe direction as well as the amount of rotation."
          }
        ]
      },
      {
        id: "radian-definition",
        title: "What Is a Radian?",
        content: [
          {
            type: "paragraph",
            id: "one-radian-definition",
            text: "One radian is the measure of a central angle whose intercepted arc has the same length as the radius of the circle."
          },
          {
            type: "paragraph",
            id: "radian-ratio",
            text: "More generally, the radian measure of a central angle is the ratio of the intercepted arc length to the radius. If an angle intercepts an arc of length s on a circle of radius r, its radian measure is s/r."
          },
          {
            type: "paragraph",
            id: "radian-scale-independence",
            text: "This definition does not depend on the size of the circle. If the radius becomes larger, the arc produced by the same angle becomes larger in exactly the same proportion, so the ratio of arc length to radius remains unchanged."
          }
        ]
      },
      {
        id: "why-radians-are-natural",
        title: "Why Radians Are a Natural Angle Measure",
        content: [
          {
            type: "paragraph",
            id: "geometry-built-in",
            text: "Radians arise directly from the geometry of a circle. Instead of first dividing a revolution into an arbitrary number of equal parts, radian measure uses two quantities already present in the circle: the arc length and the radius."
          },
          {
            type: "paragraph",
            id: "dimensionless-measure",
            text: 'Because radian measure is a ratio of two lengths, the length units cancel. Radian measure is therefore dimensionless, even though we commonly use the word "radian" to identify the angle-measurement system.'
          },
          {
            type: "paragraph",
            id: "unit-circle-meaning",
            text: "On a circle with radius 1, the radian measure of a central angle equals the length of the intercepted arc. This makes the unit circle especially useful when connecting angles to trigonometric functions."
          }
        ]
      },
      {
        id: "full-revolution-radian",
        title: "Why a Full Revolution Is 2\u03C0 Radians",
        content: [
          {
            type: "paragraph",
            id: "circumference-ratio",
            text: "A full revolution sweeps out the entire circumference of a circle. Since the circumference is 2\u03C0r, dividing the full arc length by the radius gives (2\u03C0r)/r = 2\u03C0."
          },
          {
            type: "paragraph",
            id: "full-half-quarter",
            text: "Therefore, one full revolution is 2\u03C0 radians, one half revolution is \u03C0 radians, and one quarter revolution is \u03C0/2 radians."
          },
          {
            type: "paragraph",
            id: "same-rotation-different-numbers",
            text: "The rotation itself has not changed when we write it as 180\xB0 or \u03C0 radians. These are two numerical descriptions of the same geometric rotation."
          }
        ]
      },
      {
        id: "degree-radian-relationship",
        title: "Connecting Degrees and Radians",
        content: [
          {
            type: "paragraph",
            id: "fundamental-equivalence",
            text: "Because 360\xB0 and 2\u03C0 radians describe the same full revolution, they provide the fundamental equivalence needed to convert between the two systems."
          },
          {
            type: "paragraph",
            id: "conversion-proportion",
            text: "For an angle measured as D degrees and R radians, the equality D/180 = R/\u03C0 follows from the fact that 180\xB0 = \u03C0 radians. This proportion can be rearranged to convert in either direction."
          },
          {
            type: "paragraph",
            id: "conversion-factor-idea",
            text: "To convert degrees to radians, multiply the degree measure by \u03C0/180. To convert radians to degrees, multiply the radian measure by 180/\u03C0."
          },
          {
            type: "paragraph",
            id: "exact-versus-decimal",
            text: "When possible, keep radian answers in exact form involving \u03C0 rather than replacing \u03C0 with a decimal. For example, 60\xB0 is exactly \u03C0/3 radians, whereas a decimal approximation is only an approximation."
          }
        ]
      },
      {
        id: "common-angle-pairs",
        title: "Common Angles in Both Systems",
        content: [
          {
            type: "paragraph",
            id: "quarter-half-full",
            text: "The most important starting points are 90\xB0 = \u03C0/2, 180\xB0 = \u03C0, 270\xB0 = 3\u03C0/2, and 360\xB0 = 2\u03C0. These correspond to quarter, half, three-quarter, and full revolutions."
          },
          {
            type: "paragraph",
            id: "thirty-fortyfive-sixty",
            text: "Other frequently encountered angles include multiples of 30\xB0, 45\xB0, 60\xB0, and 90\xB0. Their radian equivalents are especially important later when working with trigonometric functions and the unit circle."
          },
          {
            type: "paragraph",
            id: "special-angle-structure",
            text: "These angles are not a random collection to memorize. They arise naturally from familiar fractions of a circle and from the geometry of special right triangles. Their radian forms can be obtained from the degree-radian relationship."
          }
        ]
      },
      {
        id: "negative-and-large-radian-angles",
        title: "Negative Angles and Angles Beyond One Revolution",
        content: [
          {
            type: "paragraph",
            id: "negative-radians",
            text: "The sign convention used for degrees also applies to radians: counterclockwise rotation is positive and clockwise rotation is negative. Thus, a clockwise quarter-turn can be represented as -\u03C0/2 radians."
          },
          {
            type: "paragraph",
            id: "more-than-two-pi",
            text: "Angles do not have to stop after one revolution. A rotation through more than one full turn can have a radian measure greater than 2\u03C0, just as it can have a degree measure greater than 360\xB0."
          },
          {
            type: "paragraph",
            id: "coterminal-preview",
            text: "Different signed rotations can end on the same terminal side. This idea will become important when we work systematically with angles on a circle and identify coterminal angles."
          }
        ]
      },
      {
        id: "notation-and-reading",
        title: "How to Read Radian Measures",
        content: [
          {
            type: "paragraph",
            id: "radian-notation",
            text: 'Radian measures are often written without explicitly attaching the word "radians." For example, \u03C0/3 normally means \u03C0/3 radians when the context is angle measure.'
          },
          {
            type: "paragraph",
            id: "degree-symbol-distinction",
            text: "A degree measure is normally marked with the degree symbol, such as 60\xB0. A radian measure generally appears as a number involving \u03C0, such as \u03C0/3, although decimal radian values are also possible."
          },
          {
            type: "paragraph",
            id: "why-context-matters",
            text: "The numerical value alone does not tell us the geometric angle unless we know the measurement system. For example, 90\xB0 and 90 radians represent very different rotations."
          }
        ]
      },
      {
        id: "bridge-to-next-topic",
        title: "From Angle Measure to Angles on a Circle",
        content: [
          {
            type: "paragraph",
            id: "circle-position-bridge",
            text: "Once angles can be measured in degrees or radians, we can use them to describe positions around a circle. A starting direction and an amount of rotation determine where the terminal side points."
          },
          {
            type: "paragraph",
            id: "unit-circle-bridge",
            text: "This becomes especially powerful on the unit circle, where an angle can be associated with a point on the circle. That connection will eventually allow trigonometric functions to be understood beyond right triangles."
          }
        ]
      }
    ]
  },
  formulas: [
    {
      id: "radian-measure-formula",
      name: "Radian Measure",
      expression: "\u03B8 = s/r",
      explanation: "The radian measure \u03B8 of a central angle is the intercepted arc length s divided by the circle's radius r."
    },
    {
      id: "full-revolution-equivalence",
      name: "Full Revolution",
      expression: "360\xB0 = 2\u03C0 rad",
      explanation: "A complete revolution has the same geometric meaning in both angle-measurement systems."
    },
    {
      id: "half-revolution-equivalence",
      name: "Half Revolution",
      expression: "180\xB0 = \u03C0 rad",
      explanation: "A half-turn is \u03C0 radians."
    },
    {
      id: "degree-to-radian",
      name: "Degrees to Radians",
      expression: "R = D\u03C0/180",
      explanation: "Multiply a degree measure D by \u03C0/180 to obtain the equivalent radian measure R."
    },
    {
      id: "radian-to-degree",
      name: "Radians to Degrees",
      expression: "D = 180R/\u03C0",
      explanation: "Multiply a radian measure R by 180/\u03C0 to obtain the equivalent degree measure D."
    },
    {
      id: "conversion-proportion",
      name: "Degree-Radian Proportion",
      expression: "D/180 = R/\u03C0",
      explanation: "This proportion expresses the equivalence 180\xB0 = \u03C0 radians and can be used for conversion."
    },
    {
      id: "common-angle-equivalents",
      name: "Common Angle Equivalents",
      expression: "90\xB0=\u03C0/2, 180\xB0=\u03C0, 270\xB0=3\u03C0/2, 360\xB0=2\u03C0",
      explanation: "These are the quarter-turn, half-turn, three-quarter-turn, and full-turn measures in radians."
    }
  ],
  examples: [
    {
      id: "radian-from-arc",
      question: "A central angle intercepts an arc of length 8 units on a circle of radius 4 units. What is the angle's radian measure?",
      solution: "Use \u03B8 = s/r. Here s = 8 and r = 4, so \u03B8 = 8/4 = 2 radians."
    },
    {
      id: "one-third-revolution",
      question: "Find the radian measure of one-third of a complete revolution.",
      solution: "A full revolution is 2\u03C0 radians. One-third of a full revolution is (1/3)(2\u03C0) = 2\u03C0/3 radians."
    },
    {
      id: "three-fourths-revolution",
      question: "Find the radian measure of three-fourths of a complete revolution.",
      solution: "A full revolution is 2\u03C0 radians. Therefore, three-fourths is (3/4)(2\u03C0) = 3\u03C0/2 radians."
    },
    {
      id: "degree-to-radian-example",
      question: "Convert 150\xB0 to radians.",
      solution: "Multiply by \u03C0/180: 150 \xD7 \u03C0/180 = 5\u03C0/6 radians."
    },
    {
      id: "radian-to-degree-example",
      question: "Convert 7\u03C0/6 radians to degrees.",
      solution: "Multiply by 180/\u03C0: (7\u03C0/6)(180/\u03C0) = 210\xB0."
    },
    {
      id: "clockwise-quarter-turn",
      question: "A ray rotates clockwise through one quarter of a full revolution. Express the rotation in radians.",
      solution: "A quarter-turn is \u03C0/2 radians. Because the rotation is clockwise, its signed measure is -\u03C0/2 radians."
    },
    {
      id: "unit-circle-arc",
      question: "On a unit circle, a central angle intercepts an arc of length 3\u03C0/4. What is the radian measure of the angle?",
      solution: "For a unit circle, r = 1. Using \u03B8 = s/r gives \u03B8 = (3\u03C0/4)/1 = 3\u03C0/4 radians."
    }
  ],
  key_ideas: [
    "Degrees and radians are two different numerical systems for measuring the same geometric quantity: rotation.",
    "One degree is one 360th of a complete revolution.",
    "One radian is defined by an intercepted arc whose length equals the radius.",
    "Radian measure is the ratio of arc length to radius: \u03B8 = s/r.",
    "Radian measure is independent of the size of the circle.",
    "Radian measure is dimensionless because it is a ratio of two lengths.",
    "A full revolution is 360\xB0 or 2\u03C0 radians.",
    "A half revolution is 180\xB0 or \u03C0 radians.",
    "A quarter revolution is 90\xB0 or \u03C0/2 radians.",
    "To convert degrees to radians, multiply by \u03C0/180.",
    "To convert radians to degrees, multiply by 180/\u03C0.",
    "Radians connect angle measure directly to circle geometry and become especially useful on the unit circle.",
    "Angles can be negative or greater than one full revolution in either measurement system."
  ],
  misconceptions: [
    "A radian is a fixed angle that is unrelated to the circle being used.",
    "Changing the radius changes the radian measure of a fixed angle.",
    "Radians and degrees describe different geometric angles.",
    "2\u03C0 radians is approximately 6.28 degrees.",
    "The word radians must always be written after every radian measure.",
    "A negative angle is physically smaller than a positive angle of the same magnitude; the sign indicates direction of rotation.",
    "Angles cannot be larger than 360\xB0 or 2\u03C0 radians.",
    "\u03C0 radians and 180\xB0 are approximately equal rather than exactly equivalent.",
    "Every angle written without a degree symbol must be an ordinary whole-number radian value."
  ],
  explorations: [],
  sources: []
};

// ../content/concepts/introduction-to-trigonometry/05-angles-on-a-circle.json
var angles_on_a_circle_default = {
  id: "angles-on-a-circle",
  title: "Angles on a Circle",
  subject: "mathematics",
  topic: "trigonometry",
  section: "intro-trigono",
  difficulty: 1,
  connections: {
    prerequisites: [
      "angles",
      "degrees-and-radians"
    ],
    leads_to: [
      "clock-and-rotation",
      "right-triangles"
    ],
    related: [
      "coordinate-plane",
      "unit-circle",
      "quadrants",
      "coterminal-angles"
    ]
  },
  theory: {
    introduction: "An angle becomes much more useful in trigonometry when we stop viewing it only as an isolated drawing and use it to describe a position around a circle. Starting from a fixed direction, the angle tells us how far and in which direction to rotate. The terminal side then points into a particular part of the coordinate plane, giving us a geometric way to locate and classify the angle.",
    sections: [
      {
        id: "angle-as-position",
        title: "An Angle Can Locate a Direction",
        content: [
          {
            type: "paragraph",
            id: "rotation-to-location",
            text: "An angle does more than describe the size of a turn. If we begin from a fixed direction and rotate through a known angle, the terminal side ends up pointing in a definite direction. We can therefore use an angle to describe where a direction lies."
          },
          {
            type: "paragraph",
            id: "circle-tracing",
            text: "Imagine a point attached to the terminal side at a fixed distance from the vertex. As the side rotates, that point traces a circle. The angle therefore corresponds naturally to a location on a circular path."
          },
          {
            type: "paragraph",
            id: "same-direction-many-rotations",
            text: "A direction can be reached after different amounts of rotation. For example, continuing around the circle for an additional full revolution brings the rotating side back to the same direction. The numerical angle can change even though the final direction is unchanged."
          }
        ]
      },
      {
        id: "standard-position-review",
        title: "Putting the Circle on the Coordinate Plane",
        content: [
          {
            type: "paragraph",
            text: "Angles in standard position were introduced in Angles. Here the idea is used specifically to locate a terminal side on a circle and connect angle position with a point on the coordinate plane; see Angles for the full foundational treatment."
          }
        ]
      },
      {
        id: "quadrants",
        title: "The Four Quadrants",
        content: [
          {
            type: "paragraph",
            text: "The four quadrants are recalled only as a coordinate-plane map for terminal sides. The foundational explanation of standard position and positive/negative rotation belongs to Angles; this lesson uses the quadrants to prepare for trigonometric ratios and the unit circle."
          }
        ]
      },
      {
        id: "axis-angles",
        title: "Angles Whose Terminal Side Lies on an Axis",
        content: [
          {
            type: "paragraph",
            text: "Quadrantal angles are recalled from Angles. Here the emphasis is on what happens when a terminal side lands on an axis and why these positions matter later for exact trigonometric values."
          }
        ]
      },
      {
        id: "terminal-point",
        title: "The Terminal Side and a Point on the Circle",
        content: [
          {
            type: "paragraph",
            id: "point-on-terminal-side",
            text: "Choose a circle centered at the origin and place a point on the circle where the terminal side intersects it. That point gives a concrete location associated with the angle."
          },
          {
            type: "paragraph",
            id: "coordinates-as-information",
            text: "Because the point lies on the coordinate plane, it has an x-coordinate and a y-coordinate. These coordinates tell us how far the point lies horizontally and vertically from the axes."
          },
          {
            type: "paragraph",
            id: "coordinate-signs",
            text: "The signs of the coordinates depend on the quadrant: in Quadrant I both coordinates are positive; in Quadrant II x is negative and y is positive; in Quadrant III both are negative; in Quadrant IV x is positive and y is negative."
          }
        ]
      },
      {
        id: "unit-circle-preview",
        title: "Why the Unit Circle Will Matter",
        content: [
          {
            type: "paragraph",
            id: "unit-circle-definition-preview",
            text: "A unit circle is a circle with radius 1 centered at the origin. Because its radius is fixed at 1, the location of a point on the circle can be described especially cleanly using its coordinates."
          },
          {
            type: "paragraph",
            id: "angle-point-relationship",
            text: "An angle in standard position can be paired with the point where its terminal side meets the unit circle. This creates a direct bridge between angle measure and coordinates."
          },
          {
            type: "paragraph",
            id: "trig-function-preview",
            text: "Later, the coordinates of this point will become the basis for defining trigonometric functions for angles beyond the acute angles of a right triangle. For now, the important idea is simply that an angle can identify a point on a circle."
          }
        ]
      },
      {
        id: "reference-angle-preview",
        title: "Preview: Reference Angles",
        content: [
          {
            type: "paragraph",
            text: "A reference angle is a positive acute angle that can be used to relate a general position to a familiar first-quadrant angle."
          },
          {
            type: "paragraph",
            text: "The full procedure for finding reference angles and combining them with quadrant signs belongs to trigonometric-ratios-any-angle. This lesson only introduces the purpose of the idea."
          }
        ]
      },
      {
        id: "circle-as-map",
        title: "The Circle as a Map of Rotation",
        content: [
          {
            type: "paragraph",
            id: "angle-map",
            text: "A circle can be viewed as a map of all possible directions reached by rotating a ray around a fixed center. Every rotation places the terminal side somewhere on this circular map."
          },
          {
            type: "paragraph",
            id: "measure-and-location",
            text: "The angle measure tells us how much rotation has occurred, while the terminal side tells us where that rotation has placed the direction. The same location can therefore correspond to multiple angle measures when extra full revolutions are included."
          },
          {
            type: "paragraph",
            id: "bridge-forward",
            text: "This viewpoint prepares us to study rotation as something that happens continuously over time. The next concept will connect this circular motion to familiar repeating motion, such as the movement of the hands of a clock."
          }
        ]
      }
    ]
  },
  formulas: [
    {
      id: "quadrant-degree-ranges",
      name: "Quadrant Ranges in Degrees",
      expression: "QI: 0\xB0<\u03B8<90\xB0, QII: 90\xB0<\u03B8<180\xB0, QIII: 180\xB0<\u03B8<270\xB0, QIV: 270\xB0<\u03B8<360\xB0",
      explanation: "These intervals describe where the terminal side lies during one positive revolution, excluding the axis boundaries."
    },
    {
      id: "quadrant-radian-ranges",
      name: "Quadrant Ranges in Radians",
      expression: "QI: 0<\u03B8<\u03C0/2, QII: \u03C0/2<\u03B8<\u03C0, QIII: \u03C0<\u03B8<3\u03C0/2, QIV: 3\u03C0/2<\u03B8<2\u03C0",
      explanation: "These are the same four quadrant regions expressed using radian measure."
    },
    {
      id: "quadrantal-angles",
      name: "Main Quadrantal Angles",
      expression: "0\xB0, 90\xB0, 180\xB0, 270\xB0 \u2194 0, \u03C0/2, \u03C0, 3\u03C0/2",
      explanation: "These angles place the terminal side on one of the coordinate axes during one counterclockwise revolution."
    },
    {
      id: "reference-angle-definition",
      name: "Reference Angle",
      expression: "\u03B1 = smallest positive acute angle between the terminal side and the horizontal axis",
      explanation: "The reference angle is an acute angle associated with the original angle and is used to compare angles across different quadrants."
    }
  ],
  examples: [
    {
      id: "locate-60-degrees",
      question: "In which quadrant does an angle of 60\xB0 terminate when drawn in standard position?",
      solution: "Since 60\xB0 lies between 0\xB0 and 90\xB0, its terminal side lies in Quadrant I."
    },
    {
      id: "locate-135-degrees",
      question: "In which quadrant does an angle of 135\xB0 terminate?",
      solution: "135\xB0 lies between 90\xB0 and 180\xB0, so the terminal side lies in Quadrant II."
    },
    {
      id: "locate-five-pi-over-four",
      question: "In which quadrant does 5\u03C0/4 radians terminate?",
      solution: "5\u03C0/4 lies between \u03C0 and 3\u03C0/2, so the terminal side lies in Quadrant III."
    },
    {
      id: "axis-angle",
      question: "Where does the terminal side of 270\xB0 lie?",
      solution: "270\xB0 is a quadrantal angle. Its terminal side lies on the negative y-axis."
    },
    {
      id: "coordinate-signs",
      question: "A point where an angle's terminal side meets a circle lies in Quadrant IV. What can you say about the signs of its x- and y-coordinates?",
      solution: "In Quadrant IV, x is positive and y is negative."
    },
    {
      id: "reference-angle-qii",
      question: "What is the reference angle for 150\xB0?",
      solution: "The terminal side lies in Quadrant II. The acute angle between the terminal side and the negative x-axis is 180\xB0 \u2212 150\xB0 = 30\xB0, so the reference angle is 30\xB0."
    },
    {
      id: "multiple-rotations",
      question: "Can two different angle measures point in exactly the same direction on the circle?",
      solution: "Yes. Adding or subtracting a full revolution changes the amount of rotation but brings the terminal side back to the same direction. Such angles are coterminal."
    }
  ],
  key_ideas: [
    "An angle can be used to describe a direction or position around a circle.",
    "In standard position, the vertex is at the origin and the initial side lies on the positive x-axis.",
    "Positive rotation is counterclockwise and negative rotation is clockwise.",
    "The coordinate plane divides the circle's possible directions into four quadrants.",
    "Quadrant I has positive x and positive y coordinates.",
    "Quadrant II has negative x and positive y coordinates.",
    "Quadrant III has negative x and negative y coordinates.",
    "Quadrant IV has positive x and negative y coordinates.",
    "Angles whose terminal sides lie on an axis are quadrantal angles.",
    "A point where the terminal side meets a circle provides a coordinate representation of the angle's direction.",
    "The unit circle gives a particularly useful connection between angles and coordinates.",
    "A reference angle captures the smallest acute angle associated with an angle's terminal side and the horizontal axis.",
    "The same direction can correspond to multiple angle measures after additional full rotations."
  ],
  misconceptions: [
    "An angle only tells us the size of a turn and cannot tell us a direction.",
    "Every angle must terminate inside one of the four quadrants.",
    "Quadrant II means both coordinates are negative.",
    "A negative angle means its terminal side must be in Quadrant III or IV.",
    "An angle of 360\xB0 points somewhere different from an angle of 0\xB0.",
    "A reference angle is the same thing as the original angle.",
    "The reference angle tells us which quadrant the original angle is in.",
    "The coordinates of a point on a circle do not depend on which quadrant it lies in.",
    "A circle can represent only angles between 0\xB0 and 360\xB0.",
    "Different angle measures cannot produce the same terminal direction."
  ],
  explorations: [],
  sources: []
};

// ../content/concepts/introduction-to-trigonometry/06-clock-and-rotation.json
var clock_and_rotation_default = {
  id: "clock-and-rotation",
  title: "Clock and Rotation",
  subject: "mathematics",
  topic: "trigonometry",
  section: "intro-trigono",
  difficulty: 1,
  connections: {
    prerequisites: [
      "angles-on-a-circle",
      "degrees-and-radians"
    ],
    leads_to: [
      "right-triangles",
      "trig-ratios"
    ],
    related: [
      "rotation",
      "circular-motion",
      "arc-length",
      "angular-speed",
      "linear-speed"
    ]
  },
  theory: {
    introduction: "Angles are not only measurements of static positions. They can also describe how something turns as time passes. A clock hand, wheel, gear, or rotating planet can all be understood by tracking the angle through which they rotate.",
    sections: [
      {
        id: "rotation-as-motion",
        title: "Rotation turns angle into motion",
        content: [
          {
            type: "paragraph",
            id: "rotation-over-time",
            text: "When an object rotates, its position changes continuously around a circle. The amount of rotation can be described by an angle, while the time taken tells us how quickly that rotation occurs."
          },
          {
            type: "paragraph",
            id: "angle-as-change",
            text: "For example, a rotating object that completes one full revolution has turned through 360 degrees, or 2\u03C0 radians. A quarter revolution corresponds to 90 degrees, or \u03C0/2 radians."
          }
        ]
      },
      {
        id: "clock-hands",
        title: "A clock as a rotation model",
        content: [
          {
            type: "paragraph",
            id: "clock-hand-rotation",
            text: "The hands of a clock provide a familiar example of continuous circular rotation. As a hand moves, it sweeps out an angle around the center of the clock."
          },
          {
            type: "paragraph",
            id: "minute-hand-full-turn",
            text: "The minute hand completes one full revolution during one hour. Therefore, its angular rotation can be described as 360 degrees per hour, or 2\u03C0 radians per hour."
          },
          {
            type: "paragraph",
            id: "hour-hand-full-turn",
            text: "The hour hand completes one full revolution during twelve hours. Its angular rotation is therefore slower than the minute hand."
          },
          {
            type: "paragraph",
            id: "clock-angle-over-time",
            text: "This gives us a useful way to think about rotation: instead of asking only where a hand is, we can ask how much angle it has swept through during a given amount of time."
          }
        ]
      },
      {
        id: "angular-speed",
        title: "Angular speed",
        content: [
          {
            type: "paragraph",
            id: "angular-speed-definition",
            text: "Angular speed describes how much angular rotation occurs per unit of time. It tells us how quickly an object is turning, rather than how far a point on the object has traveled."
          },
          {
            type: "paragraph",
            id: "angular-speed-units",
            text: "Angular speed can be expressed in radians per second, rotations per minute, degrees per hour, or other angle-per-time units."
          },
          {
            type: "paragraph",
            id: "angular-speed-calculation",
            text: "To calculate angular speed, express the total rotation in a consistent angle unit, preferably radians when connecting it to linear speed, and divide by the elapsed time."
          }
        ]
      },
      {
        id: "linear-speed",
        title: "Linear speed along a circle",
        content: [
          {
            type: "paragraph",
            id: "linear-speed-definition",
            text: "A point on a rotating object travels along a circular path. Its linear speed describes the distance traveled along that path per unit of time."
          },
          {
            type: "paragraph",
            id: "arc-distance",
            text: "The distance traveled by a point on the circle is measured along an arc. Because arc length depends on both the angle swept and the radius, two points rotating through the same angle can travel different distances if they are at different radii."
          },
          {
            type: "paragraph",
            id: "radius-speed-relationship",
            text: "For the same angular speed, a point farther from the center travels a longer distance in the same amount of time. Therefore, its linear speed is greater."
          }
        ]
      },
      {
        id: "angular-and-linear-connection",
        title: "How angular and linear speed are connected",
        content: [
          {
            type: "paragraph",
            id: "speed-connection",
            text: "When angular speed is measured in radians per unit time, multiplying angular speed by the radius gives the corresponding linear speed."
          },
          {
            type: "paragraph",
            id: "why-radius-matters",
            text: "This relationship makes intuitive sense: angular speed tells us how quickly the object turns, while the radius determines how much circular distance is covered for that amount of turning."
          },
          {
            type: "paragraph",
            id: "same-rotation-different-speeds",
            text: "Points on the same rotating object share the same angular speed, but points at different distances from the center have different linear speeds."
          }
        ]
      },
      {
        id: "real-world-rotation",
        title: "Rotation in the real world",
        content: [
          {
            type: "paragraph",
            id: "wheel-example",
            text: "Wheels, gears, turntables, water wheels, satellites, and planetary motion can all be modeled using angular and linear quantities."
          },
          {
            type: "paragraph",
            id: "wheel-road-connection",
            text: "For a rolling wheel, the linear speed of a point on the outside of the tire corresponds to the speed at which the wheel moves along the road. This connects circular rotation with ordinary straight-line motion."
          },
          {
            type: "paragraph",
            id: "rotation-trigonometry-bridge",
            text: "Rotation gives trigonometry a broader meaning: an angle is not merely something drawn inside a triangle. It can describe position, direction, and motion around a circle."
          }
        ]
      },
      {
        id: "bridge-to-right-triangles",
        title: "From rotation to trigonometric functions",
        content: [
          {
            type: "paragraph",
            id: "circle-to-triangle",
            text: "Once an angle represents a position around a circle, we can look at the horizontal and vertical components of that position. A right triangle naturally appears when a point on the circle is connected to the coordinate axes."
          },
          {
            type: "paragraph",
            id: "next-step",
            text: "This is the bridge to the next stage: using right triangles to build precise relationships between an angle and side lengths."
          }
        ]
      }
    ]
  },
  formulas: [
    {
      id: "angular-speed",
      name: "Angular Speed",
      expression: "\u03C9 = \u03B8/t",
      explanation: "Angular speed is the angle of rotation divided by the elapsed time. When \u03B8 is measured in radians, \u03C9 is measured in radians per unit time."
    },
    {
      id: "linear-speed",
      name: "Linear Speed",
      expression: "v = s/t",
      explanation: "Linear speed is the distance traveled along a path divided by the elapsed time. For circular motion, the distance traveled is the arc length."
    },
    {
      id: "linear-angular-speed",
      name: "Linear Speed from Angular Speed",
      expression: "v = r\u03C9",
      explanation: "When angular speed is measured in radians per unit time, multiplying it by the radius gives the linear speed of a point moving along the circle."
    },
    {
      id: "full-revolution",
      name: "One Full Revolution",
      expression: "1 revolution = 360\xB0 = 2\u03C0 rad",
      explanation: "A complete turn around a circle corresponds to 360 degrees or 2\u03C0 radians."
    }
  ],
  examples: [
    {
      id: "minute-hand-angle",
      question: "How much angle does the minute hand rotate through in 15 minutes?",
      solution: "The minute hand completes 360\xB0 in 60 minutes. In 15 minutes it completes one-fourth of a revolution, so it rotates through 90\xB0, which is \u03C0/2 radians."
    },
    {
      id: "water-wheel-angular-speed",
      question: "A wheel completes 1 rotation every 5 seconds. Find its angular speed in radians per second.",
      solution: "One rotation is 2\u03C0 radians. Therefore, angular speed = 2\u03C0/5 radians per second."
    },
    {
      id: "clock-angular-speed",
      question: "What is the angular speed of the minute hand in radians per minute?",
      solution: "The minute hand completes 2\u03C0 radians in 60 minutes. Therefore, \u03C9 = 2\u03C0/60 = \u03C0/30 radians per minute."
    },
    {
      id: "linear-speed-from-angular",
      question: "A point on a circular object is 0.5 m from the center and the object rotates at 4 radians per second. What is the point's linear speed?",
      solution: "Use v = r\u03C9. Thus v = (0.5)(4) = 2 m/s."
    },
    {
      id: "bicycle-wheel",
      question: "A bicycle wheel has diameter 28 inches and rotates at 180 revolutions per minute. How can its rotation be connected to the bicycle's speed?",
      solution: "First convert the rotational rate to radians per minute. Then multiply the angular speed by the wheel radius using v = r\u03C9. The resulting linear speed is the speed of the wheel's outer edge, which corresponds to the bicycle's travel speed when the wheel rolls without slipping."
    }
  ],
  key_ideas: [
    "Rotation can be described by the angle swept through over time.",
    "A clock hand is a simple model of continuous circular rotation.",
    "Angular speed measures angular rotation per unit time.",
    "Linear speed measures distance traveled per unit time.",
    "For circular motion, the traveled distance is measured along an arc.",
    "For the same angular speed, a larger radius produces a larger linear speed.",
    "When angular speed is in radians per unit time, v = r\u03C9 connects angular and linear speed.",
    "One full revolution is 360\xB0 or 2\u03C0 radians.",
    "Circular motion connects angle measurement with real-world motion.",
    "The circle-based view of angles prepares us to connect angles with right triangles."
  ],
  misconceptions: [
    "Angular speed and linear speed are the same quantity.",
    "Every point on a rotating object has the same linear speed.",
    "A larger radius changes the angular speed of the whole rigid object.",
    "Degrees can always be substituted directly into v = r\u03C9 without conversion.",
    "A full rotation is \u03C0 radians.",
    "Clock hands move through angles but do not provide a mathematical model of rotation.",
    "The distance traveled by a rotating point is measured along a straight line instead of along the circular path.",
    "A point farther from the center rotates through a larger angle in the same time."
  ],
  explorations: [],
  sources: []
};

// ../content/concepts/introduction-to-trigonometry/07-right-triangles.json
var right_triangles_default = {
  id: "right-triangles",
  title: "Right Triangles",
  subject: "mathematics",
  topic: "trigonometry",
  section: "intro-trigono",
  difficulty: 1,
  connections: {
    prerequisites: [
      "clock-and-rotation",
      "angles-on-a-circle"
    ],
    leads_to: [
      "similar-triangles",
      "bridge-to-trig-ratios"
    ],
    related: [
      "geometry",
      "pythagorean-theorem",
      "complementary-angles",
      "unit-circle"
    ]
  },
  theory: {
    introduction: "Right triangles are the geometric setting in which trigonometry first becomes precise. Their structure gives us a way to connect an angle with the lengths of the sides around it, which will later lead naturally to trigonometric ratios.",
    sections: [
      {
        id: "what-makes-a-right-triangle",
        title: "What makes a triangle a right triangle?",
        content: [
          {
            type: "paragraph",
            id: "right-angle-definition",
            text: "A right triangle is a triangle containing one right angle, an angle measuring 90 degrees. Because the three angles of a triangle add to 180 degrees, the other two angles must together add to 90 degrees."
          },
          {
            type: "paragraph",
            id: "two-acute-angles",
            text: "The two non-right angles of a right triangle are therefore acute angles. They are complementary because their measures add to 90 degrees."
          }
        ]
      },
      {
        id: "parts-of-right-triangle",
        title: "The three important sides",
        content: [
          {
            type: "paragraph",
            id: "hypotenuse",
            text: "The side opposite the right angle is called the hypotenuse. It is the longest side of a right triangle."
          },
          {
            type: "paragraph",
            id: "legs",
            text: "The other two sides are the legs of the triangle. Which leg we call opposite or adjacent depends on which acute angle we are focusing on."
          },
          {
            type: "paragraph",
            id: "opposite-side",
            text: "For a chosen acute angle, the opposite side is the side directly across from that angle."
          },
          {
            type: "paragraph",
            id: "adjacent-side",
            text: "For a chosen acute angle, the adjacent side is the leg next to that angle. The hypotenuse is not treated as the adjacent leg in this terminology."
          },
          {
            type: "paragraph",
            id: "angle-changes-labels",
            text: "The triangle itself does not change when we switch from one acute angle to the other, but the labels opposite and adjacent switch. A side opposite one acute angle is adjacent to the other."
          }
        ]
      },
      {
        id: "pythagorean-structure",
        title: "The Pythagorean relationship",
        content: [
          {
            type: "paragraph",
            id: "pythagorean-theorem",
            text: "The side lengths of every right triangle satisfy the Pythagorean Theorem: the square of the hypotenuse equals the sum of the squares of the two legs."
          },
          {
            type: "paragraph",
            id: "finding-missing-side",
            text: "If two side lengths are known, the Pythagorean Theorem can be used to determine the third side. This gives us a way to recover missing geometric information before introducing trigonometric ratios."
          }
        ]
      },
      {
        id: "angle-and-side-information",
        title: "An angle tells us something about the sides",
        content: [
          {
            type: "paragraph",
            id: "shape-and-angle",
            text: "Changing an acute angle changes the shape of a right triangle. As the angle changes, the relative sizes of the opposite and adjacent legs change as well."
          },
          {
            type: "paragraph",
            id: "angle-side-pattern",
            text: "This suggests an important question: can we describe the relationship between an angle and the side lengths of a right triangle using a consistent numerical quantity?"
          },
          {
            type: "paragraph",
            id: "motivation-for-ratios",
            text: "The answer will be yes. The next ideas will show why ratios of side lengths are the natural quantities to use and why those ratios can be tied to an angle."
          }
        ]
      },
      {
        id: "complementary-angles",
        title: "The two acute angles are connected",
        content: [
          {
            type: "paragraph",
            id: "complementary-relationship",
            text: "Because the two acute angles of a right triangle add to 90 degrees, knowing one determines the other. If one acute angle is \u03B8, the other is 90 degrees minus \u03B8."
          },
          {
            type: "paragraph",
            id: "same-triangle-two-views",
            text: "The same right triangle can therefore be viewed from either acute angle. What is opposite from one viewpoint becomes adjacent from the other viewpoint."
          },
          {
            type: "paragraph",
            id: "cofunction-preview",
            text: "This exchange between opposite and adjacent sides will later explain an important relationship between trigonometric functions of complementary angles."
          }
        ]
      },
      {
        id: "right-triangles-and-circles",
        title: "Right triangles can live inside circles",
        content: [
          {
            type: "paragraph",
            id: "triangle-in-circle",
            text: "A right triangle can be formed using a radius of a circle together with horizontal and vertical distances. In particular, a right triangle naturally appears when a point on a circle is connected to the coordinate axes."
          },
          {
            type: "paragraph",
            id: "unit-circle-preview",
            text: "When the circle has radius 1, the resulting geometry becomes especially useful. This unit-circle viewpoint will later connect the triangle-based definitions of trigonometry with angles measured around a circle."
          }
        ]
      },
      {
        id: "applied-triangle-problems",
        title: "Why right triangles matter in the real world",
        content: [
          {
            type: "paragraph",
            id: "inaccessible-distance",
            text: "Right triangles allow distances and heights to be represented geometrically even when they cannot be measured directly. A vertical object, a horizontal distance, and a line of sight can form the three sides of a right triangle."
          },
          {
            type: "paragraph",
            id: "height-measurement",
            text: "For example, if the horizontal distance from an observer to a building and an appropriate angle are known, the building's height can be treated as an unknown side of a right triangle."
          },
          {
            type: "paragraph",
            id: "bridge-forward",
            text: "To solve such problems systematically, we need a numerical relationship that turns an angle into information about side lengths. That is the central idea behind trigonometric ratios."
          }
        ]
      }
    ]
  },
  formulas: [
    {
      id: "pythagorean-theorem",
      name: "Pythagorean Theorem",
      expression: "a\xB2 + b\xB2 = c\xB2",
      explanation: "For a right triangle, a and b are the legs and c is the hypotenuse."
    },
    {
      id: "complementary-angles",
      name: "Complementary Angles in a Right Triangle",
      expression: "\u03B8 + (90\xB0 \u2212 \u03B8) = 90\xB0",
      explanation: "The two acute angles of a right triangle are complementary."
    }
  ],
  examples: [
    {
      id: "identify-sides",
      question: "In a right triangle, an acute angle is selected. Which side is the hypotenuse, and how are the opposite and adjacent sides identified?",
      solution: "The hypotenuse is always the side opposite the 90\xB0 angle. Relative to the selected acute angle, the opposite side is directly across from the angle, while the adjacent side is the leg next to the angle."
    },
    {
      id: "missing-hypotenuse",
      question: "A right triangle has legs of lengths 6 and 8. Find the hypotenuse.",
      solution: "Using a\xB2 + b\xB2 = c\xB2: 6\xB2 + 8\xB2 = c\xB2, so 36 + 64 = c\xB2. Therefore c\xB2 = 100 and c = 10."
    },
    {
      id: "missing-leg",
      question: "A right triangle has a hypotenuse of length 13 and one leg of length 5. Find the other leg.",
      solution: "Using a\xB2 + b\xB2 = c\xB2: 5\xB2 + b\xB2 = 13\xB2. Thus 25 + b\xB2 = 169, so b\xB2 = 144 and b = 12."
    },
    {
      id: "complementary-angle",
      question: "One acute angle of a right triangle measures 32\xB0. What is the other acute angle?",
      solution: "The two acute angles are complementary, so the other angle is 90\xB0 \u2212 32\xB0 = 58\xB0."
    },
    {
      id: "tower-model",
      question: "An observer stands some distance from a vertical tower and looks toward its top. Why can this situation be modeled with a right triangle?",
      solution: "The ground provides a horizontal side, the tower provides a vertical side, and the line of sight provides the sloping side. The horizontal and vertical directions are perpendicular, so the resulting triangle contains a right angle."
    }
  ],
  key_ideas: [
    "A right triangle contains one 90\xB0 angle.",
    "The two remaining angles are acute and complementary.",
    "The hypotenuse is opposite the right angle and is the longest side.",
    "Opposite and adjacent are defined relative to the chosen acute angle.",
    "Switching to the other acute angle swaps the roles of the two legs.",
    "The Pythagorean Theorem relates the three side lengths of a right triangle.",
    "Changing an angle changes the relative lengths of the sides.",
    "Ratios of side lengths will provide a consistent way to connect an angle with triangle geometry.",
    "Right triangles can model inaccessible heights and distances.",
    "Right-triangle geometry can also be connected to circles and coordinates.",
    "The unit circle will later connect circle-based angles with triangle-based trigonometry."
  ],
  misconceptions: [
    "The hypotenuse is the side next to the chosen angle.",
    "The hypotenuse can be one of the legs.",
    "Opposite and adjacent are fixed labels that never depend on the chosen angle.",
    "A right triangle can have two right angles.",
    "The two acute angles of a right triangle add to 180\xB0.",
    "The Pythagorean Theorem applies to every triangle.",
    "Changing the orientation of a right triangle changes its geometric relationships.",
    "A larger angle automatically means every side of the triangle is longer.",
    "The side opposite an angle is always the same physical side regardless of which angle is chosen.",
    "Right triangles are useful only for abstract geometry and not for measuring real quantities."
  ],
  explorations: [],
  sources: []
};

// ../content/concepts/introduction-to-trigonometry/08-similar-triangles.json
var similar_triangles_default = {
  id: "similar-triangles",
  title: "Similar Triangles",
  subject: "mathematics",
  topic: "trigonometry",
  section: "intro-trigono",
  difficulty: 1,
  connections: {
    prerequisites: [
      "right-triangles"
    ],
    leads_to: [
      "bridge-to-trig-ratios"
    ],
    related: [
      "geometry",
      "proportionality",
      "scale-factor",
      "congruent-triangles"
    ]
  },
  theory: {
    introduction: "Similar triangles are triangles that have the same shape, even if their sizes are different. This is the missing link between a particular right triangle and the general trigonometric ratios that depend only on an angle. If two right triangles contain the same acute angle, they have the same shape and their corresponding side lengths change by the same scale factor. Therefore, ratios of corresponding sides remain unchanged.",
    sections: [
      {
        id: "what-similar-means",
        title: "What does it mean for triangles to be similar?",
        content: [
          {
            type: "paragraph",
            id: "same-shape",
            text: "Two triangles are similar when they have the same shape, although they do not have to have the same size. One triangle can be viewed as a scaled version of the other."
          },
          {
            type: "paragraph",
            id: "angle-correspondence",
            text: "For similar triangles, corresponding angles are equal. Corresponding sides are proportional, meaning that one triangle's corresponding side lengths are obtained from the other's by the same scale factor."
          },
          {
            type: "paragraph",
            id: "similar-not-congruent",
            text: "Similar does not mean identical in size. Congruent triangles have the same shape and the same size; similar triangles only need to have the same shape."
          }
        ]
      },
      {
        id: "shape-and-scale",
        title: "Shape versus size",
        content: [
          {
            type: "paragraph",
            id: "scale-factor",
            text: "Suppose a triangle has sides 3, 4, and 5. If every side is multiplied by 2, the new triangle has sides 6, 8, and 10. Its size has changed, but its shape has not."
          },
          {
            type: "paragraph",
            id: "uniform-scaling",
            text: "The important condition is that every corresponding length is multiplied by the same scale factor. If different sides were multiplied by different factors, the shape would generally change and the triangles would no longer be similar."
          },
          {
            type: "paragraph",
            id: "ratio-survives-scaling",
            text: "Because corresponding sides are multiplied by the same factor, ratios between corresponding sides stay the same. This invariance is the key idea that will lead to trigonometric ratios."
          }
        ]
      },
      {
        id: "same-angle-similarity",
        title: "Why do right triangles with the same acute angle have the same shape?",
        content: [
          {
            type: "paragraph",
            id: "two-angle-information",
            text: "Every right triangle already contains one angle of 90\xB0. If two right triangles also share the same acute angle, then they have two equal corresponding angles."
          },
          {
            type: "paragraph",
            id: "aa-similarity",
            text: "Once two corresponding angles are equal, the third angles must also be equal because the angles of a triangle add to 180\xB0. Thus the triangles have the same angle structure and are similar."
          },
          {
            type: "paragraph",
            id: "same-angle-same-shape",
            text: "This means that changing the size of a right triangle while keeping a particular acute angle fixed does not change the triangle's shape. The sides may become longer or shorter, but their relative proportions remain fixed."
          }
        ]
      },
      {
        id: "corresponding-sides-and-proportions",
        title: "Corresponding sides remain proportional",
        content: [
          {
            type: "paragraph",
            id: "correspondence",
            text: "To compare similar triangles correctly, first identify which angles correspond. The sides opposite corresponding angles are corresponding sides, as are the sides adjacent to those corresponding angles."
          },
          {
            type: "paragraph",
            id: "proportion-example",
            text: "If corresponding sides of two similar triangles are 3 and 6, 4 and 8, and 5 and 10, every corresponding pair has the same scale factor of 2. Consequently, 3/5 = 6/10 and 4/5 = 8/10."
          },
          {
            type: "paragraph",
            id: "ratio-survives-scaling-2",
            text: "If a side length is multiplied by a scale factor k, another corresponding side is also multiplied by k. In a ratio, the same factor appears in both numerator and denominator and cancels. That is why the ratio is independent of the triangle's size."
          }
        ]
      },
      {
        id: "the-trigonometry-connection",
        title: "The crucial connection to Trigonometry",
        content: [
          {
            type: "paragraph",
            id: "fixed-angle-family",
            text: "Imagine drawing many right triangles that all contain the same acute angle. They can be tiny or large, but as long as that angle stays fixed, the triangles remain similar."
          },
          {
            type: "paragraph",
            id: "ratios-depend-on-angle",
            text: "Because all of these triangles are similar, the ratios between corresponding sides are identical. Therefore, a ratio such as opposite side divided by hypotenuse is determined by the angle, not by the particular size of the triangle."
          },
          {
            type: "paragraph",
            id: "why-sine-is-possible",
            text: "This is the reason it makes sense to define a trigonometric ratio for an angle. We are not arbitrarily choosing a ratio from one triangle and hoping it works everywhere. Similarity guarantees that the same angle produces the same side ratio in every similar right triangle."
          },
          {
            type: "paragraph",
            id: "formula-not-yet",
            text: "The formal names sine, cosine, and tangent will be introduced next. The important idea here is the reason these ratios can belong to an angle itself: similar triangles make the relevant side ratios invariant under scaling."
          }
        ]
      },
      {
        id: "visualizing-similarity",
        title: "A useful way to visualize similarity",
        content: [
          {
            type: "paragraph",
            id: "nested-triangles",
            text: "Draw two rays from a common point and place a line segment across them at one distance from the point. Then place another parallel line segment farther away. The two triangles formed have the same angles and therefore the same shape, while the farther triangle is a scaled version of the nearer one."
          },
          {
            type: "paragraph",
            id: "same-angle-different-size",
            text: "The larger triangle contains longer sides, but each corresponding side has increased by the same factor. Any ratio formed from corresponding sides therefore remains unchanged."
          },
          {
            type: "paragraph",
            id: "exploration-hook",
            text: "This gives a natural visualization for the next stage of learning: continuously resize a right triangle while keeping one angle fixed and watch the side lengths change while their ratios remain constant."
          }
        ]
      },
      {
        id: "bridge-forward",
        title: "From Similarity to Trigonometric Ratios",
        content: [
          {
            type: "paragraph",
            id: "bridge-summary",
            text: "We can now make the central argument: a fixed acute angle determines a fixed triangle shape; fixed shape means corresponding side ratios are fixed; therefore those ratios can be treated as functions of the angle."
          },
          {
            type: "paragraph",
            id: "next-concept",
            text: "The next concept will name the three fundamental ratios\u2014sine, cosine, and tangent\u2014and define them using the sides of a right triangle relative to a chosen angle."
          }
        ]
      }
    ]
  },
  formulas: [
    {
      id: "similarity-scale-factor",
      name: "Corresponding Side Proportion",
      expression: "a\u2081/a\u2082 = b\u2081/b\u2082 = c\u2081/c\u2082",
      explanation: "For two similar triangles, the ratios of corresponding side lengths are equal."
    },
    {
      id: "scale-factor-relation",
      name: "Scale Factor",
      expression: "a\u2082 = k a\u2081,  b\u2082 = k b\u2081,  c\u2082 = k c\u2081",
      explanation: "Every corresponding side is multiplied by the same scale factor k."
    }
  ],
  examples: [
    {
      id: "example-3-4-5-scaling",
      question: "A right triangle has side lengths 3, 4, and 5. Another right triangle has corresponding side lengths 6, 8, and 10. Are the triangles similar?",
      solution: "Compare corresponding sides: 6/3 = 2, 8/4 = 2, and 10/5 = 2. Every corresponding side has the same scale factor, so the triangles are similar."
    },
    {
      id: "example-fixed-angle",
      question: "Two right triangles have the same acute angle. One has an opposite side of 3 and a hypotenuse of 5. A corresponding triangle has an opposite side of 9. What is its hypotenuse?",
      solution: "Because the triangles have the same acute angle and are both right triangles, they are similar. The scale factor from the first triangle to the second is 9/3 = 3. Therefore the hypotenuse is 5 \xD7 3 = 15."
    },
    {
      id: "example-ratio-invariance",
      question: "For a right triangle, the opposite side and hypotenuse are 4 and 10. A similar triangle has an opposite side of 12. What is its hypotenuse, and what happens to the ratio opposite/hypotenuse?",
      solution: "The scale factor is 12/4 = 3, so the hypotenuse becomes 10 \xD7 3 = 30. The original ratio is 4/10 = 0.4 and the new ratio is 12/30 = 0.4. The ratio is unchanged."
    },
    {
      id: "example-identify-correspondence",
      question: "Two similar triangles have corresponding side pairs (5, 7) and (10, 14). If another side of the smaller triangle is 9, what is the corresponding side of the larger triangle?",
      solution: "The scale factor is 10/5 = 2 and also 14/7 = 2. Therefore the corresponding side is 9 \xD7 2 = 18."
    },
    {
      id: "example-why-trig-ratio-is-stable",
      question: "Three right triangles all contain the same acute angle. Their opposite and hypotenuse sides are (2, 5), (4, 10), and (6, 15). Why can one ratio be associated with the angle rather than with a particular triangle?",
      solution: "The triangles are similar because they are right triangles with the same acute angle. Their opposite-to-hypotenuse ratios are 2/5, 4/10, and 6/15, all equal to 0.4. The ratio remains unchanged as the triangle is scaled, so it depends on the angle rather than the triangle's size."
    }
  ],
  key_ideas: [
    "Similar triangles have the same shape but can have different sizes.",
    "Corresponding angles of similar triangles are equal.",
    "Corresponding side lengths of similar triangles are proportional.",
    "A single scale factor multiplies every corresponding side.",
    "Scaling a triangle changes its size without changing its shape.",
    "In a ratio of corresponding sides, the scale factor cancels.",
    "Therefore, corresponding side ratios are invariant across similar triangles.",
    "Two right triangles with the same acute angle are similar.",
    "A fixed acute angle therefore determines fixed ratios between corresponding sides of a right triangle.",
    "This invariance is the conceptual foundation for sine, cosine, and tangent.",
    "Trigonometric ratios can be associated with angles because similarity makes them independent of triangle size."
  ],
  misconceptions: [
    "Similar triangles must have the same side lengths.",
    "Similar triangles must be the same size.",
    "Any two right triangles are automatically similar.",
    "If two triangles have one equal angle, they are always similar without any additional information.",
    "Corresponding sides are identified by position on the page rather than by corresponding angles.",
    "Changing the size of a triangle changes its side ratios.",
    "A trigonometric ratio is just a property of one particular triangle.",
    "Sine, cosine, and tangent are arbitrary formulas to memorize.",
    "Similarity and congruence mean the same thing.",
    "The scale factor can be different for different corresponding sides in similar triangles."
  ],
  explorations: [],
  sources: []
};

// ../content/concepts/introduction-to-trigonometry/09-bridge-to-trig-ratios.json
var bridge_to_trig_ratios_default = {
  id: "bridge-to-trig-ratios",
  title: "The Bridge to Trigonometric Ratios",
  subject: "mathematics",
  topic: "trigonometry",
  section: "intro-trigono",
  difficulty: 1,
  connections: {
    prerequisites: [
      "similar-triangles",
      "right-triangles",
      "degrees-and-radians"
    ],
    leads_to: [
      "trig-ratios"
    ],
    related: [
      "sine",
      "cosine",
      "tangent",
      "unit-circle",
      "special-angles"
    ]
  },
  theory: {
    introduction: "We can now turn the invariant side ratios of similar right triangles into functions of an angle. For a chosen acute angle, the ratios between the opposite side, adjacent side, and hypotenuse remain fixed no matter how large or small the similar right triangle is. Trigonometry gives these ratios names: sine, cosine, and tangent.",
    sections: [
      {
        id: "from-similarity-to-functions",
        title: "From Similarity to a Function of an Angle",
        content: [
          {
            type: "paragraph",
            text: "Similarity showed that right triangles with the same acute angle have the same side-length proportions. Therefore, a side ratio can be associated consistently with an angle rather than with one particular triangle."
          },
          {
            type: "paragraph",
            text: "This is the conceptual bridge to sine, cosine, and tangent. The next lesson owns the actual definitions, notation, calculations, and worked problems."
          }
        ]
      },
      {
        id: "naming-the-sides",
        title: "Opposite, Adjacent, and Hypotenuse",
        content: [
          {
            type: "paragraph",
            text: "Recall from Right Triangles that the three side labels are determined by the chosen reference angle. This lesson only reconnects those labels to the next topic; the complete treatment of trigonometric ratios is in trigonometric-ratios."
          }
        ]
      },
      {
        id: "sine",
        title: "Sine: Opposite over Hypotenuse",
        content: [
          {
            type: "paragraph",
            text: "Sine will be introduced formally in the next concept. Here, think of it only as a way to connect an angle in a right triangle with a side ratio. Full definition, calculation methods, and problem-solving examples are in trigonometric-ratios."
          }
        ]
      },
      {
        id: "cosine",
        title: "Cosine: Adjacent over Hypotenuse",
        content: [
          {
            type: "paragraph",
            text: "Cosine will be introduced formally in the next concept. Here, it is enough to see that an angle can determine a side ratio. Full definition, calculation methods, and examples are in trigonometric-ratios."
          }
        ]
      },
      {
        id: "tangent",
        title: "Tangent: Opposite over Adjacent",
        content: [
          {
            type: "paragraph",
            text: "Tangent will be introduced formally in the next concept. Here, it completes the idea that one angle can determine a stable ratio in similar right triangles. Full treatment is in trigonometric-ratios."
          }
        ]
      },
      {
        id: "sohcahtoa",
        title: "Remembering the Three Ratios",
        content: [
          {
            type: "paragraph",
            text: "SOH-CAH-TOA is the memory aid used in the next lesson: sin = opposite/hypotenuse, cos = adjacent/hypotenuse, tan = opposite/adjacent. Do not treat this bridge as a second full lesson on these ratios; the complete explanation belongs to trigonometric-ratios."
          }
        ]
      },
      {
        id: "worked-ratio-example",
        title: "Seeing the Ratios in One Triangle",
        content: [
          {
            type: "paragraph",
            text: "This bridge intentionally avoids a second full ratio-solving lesson. Use the worked examples in trigonometric-ratios for calculating missing sides or angles; the purpose here is only to see why similar triangles naturally lead to angle-dependent ratios."
          }
        ]
      },
      {
        id: "special-angles-preview",
        title: "Preview: Exact Trigonometric Values",
        content: [
          {
            type: "paragraph",
            text: "Some angles produce especially simple trigonometric values, such as 30\xB0, 45\xB0, and 60\xB0. These values will be derived and organized systematically in exact-trigonometric-values."
          },
          {
            type: "paragraph",
            text: "This bridge only signals why certain angles matter; it does not teach the exact-value table."
          }
        ]
      },
      {
        id: "limits-of-right-triangle-definition",
        title: "A Question the Right-Triangle Definition Raises",
        content: [
          {
            type: "paragraph",
            id: "acute-angle-limit",
            text: "The definitions above work directly for acute angles in right triangles. But earlier we learned that angles can represent any amount of rotation, including 0\xB0, 90\xB0, angles greater than 360\xB0, and negative angles."
          },
          {
            type: "paragraph",
            id: "unit-circle-question",
            text: "So a natural question appears: how can sine and cosine be defined for an arbitrary angle, not just an acute angle inside a right triangle? The answer comes from connecting angles to points on the unit circle."
          }
        ]
      },
      {
        id: "bridge-to-next",
        title: "The Big Picture",
        content: [
          {
            type: "paragraph",
            id: "full-chain",
            text: "The chain we have built is: an angle fixes the shape of a right triangle; similar triangles preserve side ratios; those ratios can therefore be attached to the angle; sine, cosine, and tangent give those ratios names."
          },
          {
            type: "paragraph",
            id: "next-stage",
            text: "This completes the introductory right-triangle foundation. From here, trigonometry can expand beyond individual triangles through the unit circle, allowing sine and cosine to describe arbitrary angles, coordinates, rotation, and eventually periodic phenomena."
          }
        ]
      }
    ]
  },
  formulas: [],
  examples: [
    {
      id: "example-basic-ratios",
      question: "A right triangle has sides 3, 4, and 5. Relative to an angle whose opposite side is 3, find sin(\u03B8), cos(\u03B8), and tan(\u03B8).",
      solution: "The opposite side is 3, the adjacent side is 4, and the hypotenuse is 5. Therefore sin(\u03B8) = 3/5, cos(\u03B8) = 4/5, and tan(\u03B8) = 3/4."
    },
    {
      id: "example-scaled-triangle",
      question: "A right triangle has opposite side 3 and hypotenuse 5. A similar triangle has opposite side 12. Find its hypotenuse and compare the sine ratio.",
      solution: "The scale factor is 12/3 = 4, so the hypotenuse is 5 \xD7 4 = 20. The original sine ratio is 3/5, while the new one is 12/20 = 3/5. The sine ratio is unchanged."
    },
    {
      id: "example-find-missing-side",
      question: "For an acute angle \u03B8 in a right triangle, sin(\u03B8) = 3/5 and the hypotenuse is 20. Find the opposite side.",
      solution: "Use sin(\u03B8) = opposite/hypotenuse. Thus 3/5 = opposite/20, so opposite = 20 \xD7 3/5 = 12."
    },
    {
      id: "example-tangent",
      question: "A right triangle has opposite side 6 and adjacent side 8 relative to \u03B8. Find tan(\u03B8).",
      solution: "Tangent is opposite/adjacent, so tan(\u03B8) = 6/8 = 3/4."
    },
    {
      id: "example-switching-angle",
      question: "In a right triangle, one acute angle has opposite side 3 and adjacent side 4. What happens to the opposite and adjacent labels when the other acute angle is chosen?",
      solution: "The 3-unit side becomes adjacent to the other acute angle, while the 4-unit side becomes opposite. The hypotenuse remains the hypotenuse."
    },
    {
      id: "example-conceptual",
      question: "Why does sin(\u03B8) have the same value for every right triangle containing the same acute angle?",
      solution: "Any two such right triangles have a 90\xB0 angle and the same acute angle, so they are similar by AA similarity. Corresponding sides are proportional, so opposite/hypotenuse is unchanged by scaling. Therefore the ratio depends on \u03B8, not on the triangle's size."
    }
  ],
  key_ideas: [
    "A fixed acute angle determines the shape of a right triangle.",
    "Right triangles with the same acute angle are similar.",
    "Similar triangles have proportional corresponding sides.",
    "Therefore, side ratios remain constant when the triangle is resized.",
    "This allows a side ratio to be associated with the angle itself.",
    "Sine is opposite over hypotenuse.",
    "Cosine is adjacent over hypotenuse.",
    "Tangent is opposite over adjacent.",
    "SOH-CAH-TOA is a memory aid, not the underlying reason the ratios work.",
    "Opposite and adjacent depend on which acute angle is selected.",
    "The hypotenuse is always opposite the right angle.",
    "The right-triangle definitions directly cover acute angles.",
    "The unit circle extends the meaning of trigonometric functions to arbitrary angles."
  ],
  misconceptions: [
    "Sine, cosine, and tangent are arbitrary formulas with no geometric reason behind them.",
    "SOH-CAH-TOA is the concept itself rather than a mnemonic.",
    "The adjacent side can be the hypotenuse.",
    "Opposite and adjacent are fixed labels that never change.",
    "The largest side is always called adjacent.",
    "Any triangle can use the right-triangle definitions of sine, cosine, and tangent directly.",
    "Changing the size of a triangle changes its sine, cosine, or tangent for the same angle.",
    "Sine means the opposite side itself rather than a ratio.",
    "Tangent is a side length rather than a ratio.",
    "The right-triangle definition alone explains sine and cosine for every possible angle.",
    "Special-angle values are unrelated memorized facts rather than consequences of triangle geometry."
  ],
  explorations: [],
  sources: []
};

// ../content/concepts/trigonometric-ratios/01_trigonometric-ratios.json
var trigonometric_ratios_default = {
  id: "trigonometric-ratios",
  title: "Trigonometric Ratios",
  subject: "mathematics",
  topic: "trigonometry",
  section: "intro-trigono",
  difficulty: 1,
  connections: {
    prerequisites: [
      "right-triangles",
      "similar-triangles"
    ],
    leads_to: [
      "reciprocal-trigonometric-ratios",
      "trigonometric-ratios-any-angle",
      "exact-trigonometric-values",
      "trigonometric-functions"
    ],
    related: []
  },
  theory: {
    introduction: "Trigonometry begins with a simple question: if we know something about an angle in a right triangle, what can that angle tell us about the lengths of its sides? Trigonometric ratios provide the answer. They create a connection between angles and side lengths and allow us to calculate quantities that would otherwise be difficult to measure. In this lesson, we will build the idea of trigonometric ratios from the beginning, understand why they work, learn sine, cosine and tangent, and use them to solve right-triangle problems.",
    sections: [
      {
        id: "what-is-trigonometry",
        title: "What Is Trigonometry?",
        content: [
          {
            type: "paragraph",
            text: "The word trigonometry comes from Greek roots that refer to the measurement of triangles. At its simplest, trigonometry is the study of relationships between the angles and sides of triangles.",
            id: "what-is-trigonometry-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Imagine a ladder leaning against a wall. You know the length of the ladder and the angle it makes with the ground, but you want to know how high the ladder reaches. Instead of measuring the height directly, trigonometry allows you to calculate it using the relationship between the angle and the sides of the triangle.",
            id: "what-is-trigonometry-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Trigonometry appears in many areas of mathematics and science, including geometry, physics, engineering, architecture, astronomy, navigation and computer graphics.",
            id: "what-is-trigonometry-paragraph-3"
          },
          {
            type: "paragraph",
            text: "We begin with right triangles because their geometry gives us especially simple and useful relationships between their sides and acute angles.",
            id: "what-is-trigonometry-paragraph-4"
          }
        ]
      },
      {
        id: "why-right-triangles",
        title: "Why Do We Start With Right Triangles?",
        content: [
          {
            type: "paragraph",
            text: "A right triangle is a triangle containing one angle of \\(90^\\circ\\). The side opposite this right angle has a special name: the hypotenuse.",
            id: "why-right-triangles-paragraph-1"
          },
          {
            type: "paragraph",
            text: "The other two sides are called the legs of the triangle. Together, the three sides form the geometric setting in which we first define sine, cosine and tangent.",
            id: "why-right-triangles-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The other two angles of a right triangle are acute angles. An acute angle is greater than \\(0^\\circ\\) and less than \\(90^\\circ\\).",
            id: "why-right-triangles-paragraph-3"
          },
          {
            type: "paragraph",
            text: "For now, our trigonometric ratios will be introduced using these acute angles. Later, trigonometry can be extended to angles of any size.",
            id: "why-right-triangles-paragraph-4"
          }
        ]
      },
      {
        id: "parts-of-right-triangle",
        title: "The Three Sides of a Right Triangle",
        content: [
          {
            type: "paragraph",
            text: "Before learning the formulas, you need to know how the sides of a right triangle are named. The three important names are hypotenuse, opposite and adjacent.",
            id: "parts-of-right-triangle-paragraph-1"
          },
          {
            type: "paragraph",
            text: "The hypotenuse is the side opposite the \\(90^\\circ\\) angle. It is always the longest side of a right triangle.",
            id: "parts-of-right-triangle-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The opposite side is the side directly across from the particular angle you are studying.",
            id: "parts-of-right-triangle-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The adjacent side is the leg that touches the chosen angle. In trigonometry, when we say adjacent, we mean the side next to the chosen angle that is not the hypotenuse.",
            id: "parts-of-right-triangle-paragraph-4"
          },
          {
            type: "paragraph",
            text: "There is an important detail here: opposite and adjacent are relative names. They depend on which angle you have chosen. If you switch to the other acute angle, the opposite and adjacent sides switch roles.",
            id: "parts-of-right-triangle-paragraph-5"
          }
        ]
      },
      {
        id: "understanding-the-hypotenuse",
        title: "Understanding the Hypotenuse",
        content: [
          {
            type: "paragraph",
            text: "The hypotenuse is the easiest side to identify because it does not depend on which acute angle you choose. It is always opposite the right angle.",
            id: "understanding-the-hypotenuse-paragraph-1"
          },
          {
            type: "paragraph",
            text: "For example, if a triangle has angles \\(90^\\circ\\), \\(30^\\circ\\), and \\(60^\\circ\\), the side opposite the \\(90^\\circ\\) angle is the hypotenuse.",
            id: "understanding-the-hypotenuse-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The hypotenuse is also always the longest side. This follows from the geometry of right triangles and the Pythagorean theorem.",
            id: "understanding-the-hypotenuse-paragraph-3"
          },
          {
            type: "paragraph",
            text: "A useful first step in almost every right-triangle trigonometry problem is therefore to identify the \\(90^\\circ\\) angle and mark the hypotenuse.",
            id: "understanding-the-hypotenuse-paragraph-4"
          }
        ]
      },
      {
        id: "similar-triangles-connection",
        title: "The Hidden Idea: Similar Triangles",
        content: [
          {
            type: "paragraph",
            text: "The reason trigonometric ratios work is closely connected to similar triangles.",
            id: "similar-triangles-connection-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Two triangles are similar when they have the same shape, even if they are different sizes. Their corresponding angles are equal and their corresponding side lengths are proportional.",
            id: "similar-triangles-connection-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Suppose one right triangle has sides \\(3\\), \\(4\\), and \\(5\\), while another has sides \\(6\\), \\(8\\), and \\(10\\). The second triangle is twice as large, but its shape is exactly the same.",
            id: "similar-triangles-connection-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Corresponding side ratios remain unchanged:",
            id: "similar-triangles-connection-paragraph-4"
          },
          {
            type: "paragraph",
            text: "\\[\\frac{3}{5}=\\frac{6}{10}=\\frac{4}{5}\\]",
            id: "similar-triangles-connection-paragraph-5"
          },
          {
            type: "paragraph",
            text: "This means that if two right triangles have the same acute angle, the corresponding side ratios are the same.",
            id: "similar-triangles-connection-paragraph-6"
          }
        ]
      },
      {
        id: "why-ratios-are-useful",
        title: "Why Do We Use Ratios?",
        content: [
          {
            type: "paragraph",
            text: "A side length tells us about the size of a triangle. A ratio tells us about the relationship between two sides.",
            id: "why-ratios-are-useful-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Consider two similar triangles. One might be small enough to draw on a notebook, while another might be large enough to form part of a building. Their actual side lengths are different, but the proportions between corresponding sides are the same.",
            id: "why-ratios-are-useful-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Ratios allow us to ignore the overall size of the triangle and focus on its shape.",
            id: "why-ratios-are-useful-paragraph-3"
          },
          {
            type: "paragraph",
            text: "This is exactly what we need in trigonometry. For a particular angle, the relationship between the sides remains fixed even when the triangle is enlarged or reduced.",
            id: "why-ratios-are-useful-paragraph-4"
          }
        ]
      },
      {
        id: "from-angle-to-ratio",
        title: "From an Angle to a Ratio",
        content: [
          {
            type: "paragraph",
            text: "Imagine drawing many right triangles that all contain the same acute angle \\(\\theta\\). The triangles can have different sizes, but because they have the same angle, they have the same shape.",
            id: "from-angle-to-ratio-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Since the triangles are similar, corresponding sides change by the same scale factor. Therefore, ratios such as opposite divided by hypotenuse remain constant.",
            id: "from-angle-to-ratio-paragraph-2"
          },
          {
            type: "paragraph",
            text: "This gives us a powerful idea: an angle can be associated with a particular numerical ratio.",
            id: "from-angle-to-ratio-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Sine, cosine and tangent are simply three different ways of comparing pairs of sides of a right triangle.",
            id: "from-angle-to-ratio-paragraph-4"
          }
        ]
      },
      {
        id: "sine",
        title: "Sine: Opposite Compared With Hypotenuse",
        content: [
          {
            type: "paragraph",
            text: "The first fundamental trigonometric ratio is sine, written as \\(\\sin(\\theta)\\).",
            id: "sine-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Sine compares the length of the opposite side with the length of the hypotenuse.",
            id: "sine-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The definition is:",
            id: "sine-paragraph-3"
          },
          {
            type: "paragraph",
            text: "\\[\\sin(\\theta)=\\frac{\\text{opposite}}{\\text{hypotenuse}}\\]",
            id: "sine-paragraph-4"
          },
          {
            type: "paragraph",
            text: "For example, if the opposite side is \\(6\\,\\text{cm}\\) and the hypotenuse is \\(10\\,\\text{cm}\\), then:",
            id: "sine-paragraph-5"
          },
          {
            type: "paragraph",
            text: "\\[\\sin(\\theta)=\\frac{6}{10}=\\frac{3}{5}=0.6\\]",
            id: "sine-paragraph-6"
          },
          {
            type: "paragraph",
            text: "Because the hypotenuse is always longer than the opposite side, the sine of an acute angle lies between \\(0\\) and \\(1\\).",
            id: "sine-paragraph-7"
          },
          {
            type: "paragraph",
            text: "Conceptually, sine tells us how large the opposite side is compared with the hypotenuse.",
            id: "sine-paragraph-8"
          }
        ]
      },
      {
        id: "cosine",
        title: "Cosine: Adjacent Compared With Hypotenuse",
        content: [
          {
            type: "paragraph",
            text: "The second fundamental trigonometric ratio is cosine, written as \\(\\cos(\\theta)\\).",
            id: "cosine-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Cosine compares the length of the adjacent side with the length of the hypotenuse.",
            id: "cosine-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The definition is:",
            id: "cosine-paragraph-3"
          },
          {
            type: "paragraph",
            text: "\\[\\cos(\\theta)=\\frac{\\text{adjacent}}{\\text{hypotenuse}}\\]",
            id: "cosine-paragraph-4"
          },
          {
            type: "paragraph",
            text: "For example, if the adjacent side is \\(8\\,\\text{cm}\\) and the hypotenuse is \\(10\\,\\text{cm}\\), then:",
            id: "cosine-paragraph-5"
          },
          {
            type: "paragraph",
            text: "\\[\\cos(\\theta)=\\frac{8}{10}=\\frac{4}{5}=0.8\\]",
            id: "cosine-paragraph-6"
          },
          {
            type: "paragraph",
            text: "For an acute angle, cosine is between \\(0\\) and \\(1\\).",
            id: "cosine-paragraph-7"
          },
          {
            type: "paragraph",
            text: "Conceptually, cosine tells us how large the adjacent side is compared with the hypotenuse.",
            id: "cosine-paragraph-8"
          }
        ]
      },
      {
        id: "tangent",
        title: "Tangent: Opposite Compared With Adjacent",
        content: [
          {
            type: "paragraph",
            text: "The third fundamental trigonometric ratio is tangent, written as \\(\\tan(\\theta)\\).",
            id: "tangent-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Tangent compares the opposite side directly with the adjacent side.",
            id: "tangent-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The definition is:",
            id: "tangent-paragraph-3"
          },
          {
            type: "paragraph",
            text: "\\[\\tan(\\theta)=\\frac{\\text{opposite}}{\\text{adjacent}}\\]",
            id: "tangent-paragraph-4"
          },
          {
            type: "paragraph",
            text: "For example, if the opposite side is \\(9\\,\\text{cm}\\) and the adjacent side is \\(12\\,\\text{cm}\\), then:",
            id: "tangent-paragraph-5"
          },
          {
            type: "paragraph",
            text: "\\[\\tan(\\theta)=\\frac{9}{12}=\\frac{3}{4}=0.75\\]",
            id: "tangent-paragraph-6"
          },
          {
            type: "paragraph",
            text: "Unlike sine and cosine, tangent does not use the hypotenuse.",
            id: "tangent-paragraph-7"
          },
          {
            type: "paragraph",
            text: "Tangent can be less than \\(1\\), equal to \\(1\\), or greater than \\(1\\), depending on the relative lengths of the opposite and adjacent sides.",
            id: "tangent-paragraph-8"
          }
        ]
      },
      {
        id: "soh-cah-toa",
        title: "SOH-CAH-TOA",
        content: [
          {
            type: "paragraph",
            text: "SOH-CAH-TOA is a mnemonic that helps us remember the three fundamental trigonometric ratios.",
            id: "soh-cah-toa-paragraph-1"
          },
          {
            type: "paragraph",
            text: "SOH means Sine = Opposite over Hypotenuse:",
            id: "soh-cah-toa-paragraph-2"
          },
          {
            type: "paragraph",
            text: "\\[\\sin(\\theta)=\\frac{O}{H}\\]",
            id: "soh-cah-toa-paragraph-3"
          },
          {
            type: "paragraph",
            text: "CAH means Cosine = Adjacent over Hypotenuse:",
            id: "soh-cah-toa-paragraph-4"
          },
          {
            type: "paragraph",
            text: "\\[\\cos(\\theta)=\\frac{A}{H}\\]",
            id: "soh-cah-toa-paragraph-5"
          },
          {
            type: "paragraph",
            text: "TOA means Tangent = Opposite over Adjacent:",
            id: "soh-cah-toa-paragraph-6"
          },
          {
            type: "paragraph",
            text: "\\[\\tan(\\theta)=\\frac{O}{A}\\]",
            id: "soh-cah-toa-paragraph-7"
          },
          {
            type: "paragraph",
            text: "The mnemonic is useful, but understanding what the ratios actually compare is more important than memorising three groups of letters.",
            id: "soh-cah-toa-paragraph-8"
          }
        ]
      },
      {
        id: "what-ratios-mean",
        title: "What Does a Ratio Actually Mean?",
        content: [
          {
            type: "paragraph",
            text: "A ratio is a comparison between two quantities.",
            id: "what-ratios-mean-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Suppose \\(\\sin(\\theta)=0.6\\). This means that the opposite side is \\(0.6\\) times the length of the hypotenuse.",
            id: "what-ratios-mean-paragraph-2"
          },
          {
            type: "paragraph",
            text: "If the hypotenuse were \\(10\\,\\text{cm}\\), the opposite side would be \\(6\\,\\text{cm}\\). If the hypotenuse were \\(20\\,\\text{cm}\\), the corresponding opposite side would be \\(12\\,\\text{cm}\\).",
            id: "what-ratios-mean-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The ratio remains \\(0.6\\) because the triangle has the same shape.",
            id: "what-ratios-mean-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Thinking of trigonometric ratios as comparisons helps make the formulas meaningful rather than treating them as formulas that must simply be memorised.",
            id: "what-ratios-mean-paragraph-5"
          }
        ]
      },
      {
        id: "choosing-the-ratio",
        title: "How to Choose the Correct Ratio",
        content: [
          {
            type: "paragraph",
            text: "One of the most important skills in beginner trigonometry is choosing the correct ratio.",
            id: "choosing-the-ratio-paragraph-1"
          },
          {
            type: "paragraph",
            text: "First identify the angle you are working with. Then identify the opposite, adjacent and hypotenuse sides relative to that angle.",
            id: "choosing-the-ratio-paragraph-2"
          },
          {
            type: "paragraph",
            text: "If the two relevant sides are opposite and hypotenuse, use sine.",
            id: "choosing-the-ratio-paragraph-3"
          },
          {
            type: "paragraph",
            text: "If the two relevant sides are adjacent and hypotenuse, use cosine.",
            id: "choosing-the-ratio-paragraph-4"
          },
          {
            type: "paragraph",
            text: "If the two relevant sides are opposite and adjacent, use tangent.",
            id: "choosing-the-ratio-paragraph-5"
          },
          {
            type: "paragraph",
            text: "A reliable process is: identify the angle, label the three sides, identify the known and unknown sides, and then choose the ratio containing those sides.",
            id: "choosing-the-ratio-paragraph-6"
          }
        ]
      },
      {
        id: "calculating-ratios",
        title: "Calculating Trigonometric Ratios",
        content: [
          {
            type: "paragraph",
            text: "When the relevant side lengths are known, calculating a trigonometric ratio is simply a matter of substituting the side lengths into the correct definition.",
            id: "calculating-ratios-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Suppose a right triangle has an opposite side of \\(6\\,\\text{cm}\\) and a hypotenuse of \\(10\\,\\text{cm}\\).",
            id: "calculating-ratios-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Because the problem involves opposite and hypotenuse, we use sine:",
            id: "calculating-ratios-paragraph-3"
          },
          {
            type: "paragraph",
            text: "\\[\\sin(\\theta)=\\frac{6}{10}=\\frac{3}{5}\\]",
            id: "calculating-ratios-paragraph-4"
          },
          {
            type: "paragraph",
            text: "The units cancel because we are dividing one length by another length measured in the same unit. Therefore, trigonometric ratios do not have units such as centimetres or metres.",
            id: "calculating-ratios-paragraph-5"
          }
        ]
      },
      {
        id: "finding-unknown-sides",
        title: "Finding an Unknown Side",
        content: [
          {
            type: "paragraph",
            text: "Trigonometric ratios are especially useful when a side of a right triangle is unknown.",
            id: "finding-unknown-sides-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Suppose we know an acute angle and one side of the triangle. We can choose a ratio that contains the known side and the unknown side.",
            id: "finding-unknown-sides-paragraph-2"
          },
          {
            type: "paragraph",
            text: "For example, suppose \\(\\theta=60^\\circ\\), the adjacent side is \\(5\\,\\text{cm}\\), and the hypotenuse is \\(h\\).",
            id: "finding-unknown-sides-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The relevant sides are adjacent and hypotenuse, so we use cosine:",
            id: "finding-unknown-sides-paragraph-4"
          },
          {
            type: "paragraph",
            text: "\\[\\cos(60^\\circ)=\\frac{5}{h}\\]",
            id: "finding-unknown-sides-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Since \\(\\cos(60^\\circ)=\\frac{1}{2}\\), we obtain:",
            id: "finding-unknown-sides-paragraph-6"
          },
          {
            type: "paragraph",
            text: "\\[\\frac{1}{2}=\\frac{5}{h}\\]",
            id: "finding-unknown-sides-paragraph-7"
          },
          {
            type: "paragraph",
            text: "Multiplying both sides by \\(h\\) gives \\(\\frac{h}{2}=5\\). Multiplying by \\(2\\) gives \\(h=10\\,\\text{cm}\\).",
            id: "finding-unknown-sides-paragraph-8"
          },
          {
            type: "paragraph",
            text: "Notice that the trigonometric part gave us the relationship, while ordinary algebra allowed us to solve for the unknown side.",
            id: "finding-unknown-sides-paragraph-9"
          }
        ]
      },
      {
        id: "rearranging-equations",
        title: "Rearranging Trigonometric Equations",
        content: [
          {
            type: "paragraph",
            text: "Once you write a trigonometric ratio as an equation, solving for an unknown side is ordinary algebra.",
            id: "rearranging-equations-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Suppose:",
            id: "rearranging-equations-paragraph-2"
          },
          {
            type: "paragraph",
            text: "\\[\\sin(\\theta)=\\frac{x}{12}\\]",
            id: "rearranging-equations-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Multiply both sides by \\(12\\):",
            id: "rearranging-equations-paragraph-4"
          },
          {
            type: "paragraph",
            text: "\\[x=12\\sin(\\theta)\\]",
            id: "rearranging-equations-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Similarly, if:",
            id: "rearranging-equations-paragraph-6"
          },
          {
            type: "paragraph",
            text: "\\[\\cos(\\theta)=\\frac{7}{x}\\]",
            id: "rearranging-equations-paragraph-7"
          },
          {
            type: "paragraph",
            text: "then multiplying by \\(x\\) and dividing by \\(\\cos(\\theta)\\) gives:",
            id: "rearranging-equations-paragraph-8"
          },
          {
            type: "paragraph",
            text: "\\[x=\\frac{7}{\\cos(\\theta)}\\]",
            id: "rearranging-equations-paragraph-9"
          },
          {
            type: "paragraph",
            text: "You do not need to memorise every possible rearrangement. Write the original ratio first and then use algebra to isolate the unknown.",
            id: "rearranging-equations-paragraph-10"
          }
        ]
      },
      {
        id: "pythagorean-theorem-connection",
        title: "Trigonometry and the Pythagorean Theorem",
        content: [
          {
            type: "paragraph",
            text: "The Pythagorean theorem and trigonometric ratios are two different tools for working with right triangles.",
            id: "pythagorean-theorem-connection-paragraph-1"
          },
          {
            type: "paragraph",
            text: "If \\(a\\) and \\(b\\) are the legs of a right triangle and \\(c\\) is the hypotenuse, the Pythagorean theorem states:",
            id: "pythagorean-theorem-connection-paragraph-2"
          },
          {
            type: "paragraph",
            text: "\\[a^2+b^2=c^2\\]",
            id: "pythagorean-theorem-connection-paragraph-3"
          },
          {
            type: "paragraph",
            text: "If two side lengths are known, the Pythagorean theorem can often be used to find the third.",
            id: "pythagorean-theorem-connection-paragraph-4"
          },
          {
            type: "paragraph",
            text: "If an acute angle and one side are known, a trigonometric ratio can often be used to find another side.",
            id: "pythagorean-theorem-connection-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Learning to recognise which information you have helps you decide which mathematical tool is most appropriate.",
            id: "pythagorean-theorem-connection-paragraph-6"
          }
        ]
      },
      {
        id: "solving-right-triangles",
        title: "Solving Right-Triangle Problems Step by Step",
        content: [
          {
            type: "paragraph",
            text: "A good solution starts by understanding the diagram rather than immediately pressing buttons on a calculator.",
            id: "solving-right-triangles-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Step 1: Identify the angle you are using.",
            id: "solving-right-triangles-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Step 2: Identify the hypotenuse. It is opposite the \\(90^\\circ\\) angle.",
            id: "solving-right-triangles-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Step 3: Identify the opposite and adjacent sides relative to your chosen angle.",
            id: "solving-right-triangles-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Step 4: Determine which sides are known and which side is unknown.",
            id: "solving-right-triangles-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Step 5: Choose sine, cosine or tangent.",
            id: "solving-right-triangles-paragraph-6"
          },
          {
            type: "paragraph",
            text: "Step 6: Write the equation before substituting numbers.",
            id: "solving-right-triangles-paragraph-7"
          },
          {
            type: "paragraph",
            text: "Step 7: Rearrange the equation using algebra.",
            id: "solving-right-triangles-paragraph-8"
          },
          {
            type: "paragraph",
            text: "Step 8: Calculate the answer and include the correct unit if you are finding a length.",
            id: "solving-right-triangles-paragraph-9"
          },
          {
            type: "paragraph",
            text: "Step 9: Check whether the answer makes sense geometrically.",
            id: "solving-right-triangles-paragraph-10"
          }
        ]
      },
      {
        id: "complementary-angles",
        title: "The Two Acute Angles Are Complementary",
        content: [
          {
            type: "paragraph",
            text: "The angles inside every triangle add to \\(180^\\circ\\). A right triangle already contains one \\(90^\\circ\\) angle.",
            id: "complementary-angles-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Therefore, the two remaining acute angles must add to \\(90^\\circ\\). Such angles are called complementary angles.",
            id: "complementary-angles-paragraph-2"
          },
          {
            type: "paragraph",
            text: "If one acute angle is \\(\\theta\\), the other acute angle is:",
            id: "complementary-angles-paragraph-3"
          },
          {
            type: "paragraph",
            text: "\\[90^\\circ-\\theta\\]",
            id: "complementary-angles-paragraph-4"
          },
          {
            type: "paragraph",
            text: "When we switch from one acute angle to the other, the opposite and adjacent sides exchange roles.",
            id: "complementary-angles-paragraph-5"
          },
          {
            type: "paragraph",
            text: "This explains the relationships:",
            id: "complementary-angles-paragraph-6"
          },
          {
            type: "paragraph",
            text: "\\[\\sin(\\theta)=\\cos(90^\\circ-\\theta)\\]",
            id: "complementary-angles-paragraph-7"
          },
          {
            type: "paragraph",
            text: "\\[\\cos(\\theta)=\\sin(90^\\circ-\\theta)\\]",
            id: "complementary-angles-paragraph-8"
          }
        ]
      },
      {
        id: "why-tangent-is-sin-over-cos",
        title: "Why Is Tangent Sine Divided by Cosine?",
        content: [
          {
            type: "paragraph",
            text: "The relationship between tangent, sine and cosine is not another rule that we have to accept without explanation. It follows directly from their definitions.",
            id: "why-tangent-is-sin-over-cos-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Start with sine and cosine:",
            id: "why-tangent-is-sin-over-cos-paragraph-2"
          },
          {
            type: "paragraph",
            text: "\\[\\sin(\\theta)=\\frac{O}{H},\\qquad \\cos(\\theta)=\\frac{A}{H}\\]",
            id: "why-tangent-is-sin-over-cos-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Now divide sine by cosine:",
            id: "why-tangent-is-sin-over-cos-paragraph-4"
          },
          {
            type: "paragraph",
            text: "\\[\\frac{\\sin(\\theta)}{\\cos(\\theta)}=\\frac{O/H}{A/H}\\]",
            id: "why-tangent-is-sin-over-cos-paragraph-5"
          },
          {
            type: "paragraph",
            text: "The two occurrences of the hypotenuse cancel:",
            id: "why-tangent-is-sin-over-cos-paragraph-6"
          },
          {
            type: "paragraph",
            text: "\\[\\frac{O/H}{A/H}=\\frac{O}{A}\\]",
            id: "why-tangent-is-sin-over-cos-paragraph-7"
          },
          {
            type: "paragraph",
            text: "But \\(\\frac{O}{A}\\) is exactly the definition of tangent. Therefore:",
            id: "why-tangent-is-sin-over-cos-paragraph-8"
          },
          {
            type: "paragraph",
            text: "\\[\\tan(\\theta)=\\frac{\\sin(\\theta)}{\\cos(\\theta)}\\]",
            id: "why-tangent-is-sin-over-cos-paragraph-9"
          }
        ]
      },
      {
        id: "why-ratios-stay-constant",
        title: "Why Do the Ratios Stay Constant?",
        content: [
          {
            type: "paragraph",
            text: "Suppose we enlarge a right triangle by a scale factor \\(k\\). Every side becomes \\(k\\) times its original length.",
            id: "why-ratios-stay-constant-paragraph-1"
          },
          {
            type: "paragraph",
            text: "For sine, the new ratio would be:",
            id: "why-ratios-stay-constant-paragraph-2"
          },
          {
            type: "paragraph",
            text: "\\[\\frac{kO}{kH}\\]",
            id: "why-ratios-stay-constant-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The common factor \\(k\\) cancels:",
            id: "why-ratios-stay-constant-paragraph-4"
          },
          {
            type: "paragraph",
            text: "\\[\\frac{kO}{kH}=\\frac{O}{H}\\]",
            id: "why-ratios-stay-constant-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Therefore the sine ratio has not changed.",
            id: "why-ratios-stay-constant-paragraph-6"
          },
          {
            type: "paragraph",
            text: "Exactly the same reasoning works for cosine and tangent. This is why a trigonometric ratio is associated with the angle rather than with the size of one particular triangle.",
            id: "why-ratios-stay-constant-paragraph-7"
          }
        ]
      },
      {
        id: "calculator-degree-mode",
        title: "Using a Calculator Correctly",
        content: [
          {
            type: "paragraph",
            text: "A calculator can evaluate trigonometric functions, but it must interpret the angle using the correct angle unit.",
            id: "calculator-degree-mode-paragraph-1"
          },
          {
            type: "paragraph",
            text: "In this lesson, angles are commonly given in degrees. Therefore, when calculating values such as \\(\\sin(30^\\circ)\\), your calculator should be in degree mode.",
            id: "calculator-degree-mode-paragraph-2"
          },
          {
            type: "paragraph",
            text: "If the calculator is accidentally set to radian mode, it will interpret \\(30\\) differently and give a completely different result.",
            id: "calculator-degree-mode-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Before beginning a problem involving degree measures, check that the calculator displays DEG or otherwise indicates degree mode.",
            id: "calculator-degree-mode-paragraph-4"
          },
          {
            type: "paragraph",
            text: "The calculator should perform the numerical calculation, not replace the mathematical reasoning. First identify the sides and choose the correct ratio; calculate only after the equation has been set up.",
            id: "calculator-degree-mode-paragraph-5"
          }
        ]
      },
      {
        id: "exact-and-decimal-values",
        title: "Exact Values and Decimal Values",
        content: [
          {
            type: "paragraph",
            text: "A trigonometric ratio can sometimes be written exactly as a fraction or radical, and sometimes as a decimal approximation.",
            id: "exact-and-decimal-values-paragraph-1"
          },
          {
            type: "paragraph",
            text: "For example:",
            id: "exact-and-decimal-values-paragraph-2"
          },
          {
            type: "paragraph",
            text: "\\[\\sin(30^\\circ)=\\frac{1}{2}=0.5\\]",
            id: "exact-and-decimal-values-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Both forms represent the same value.",
            id: "exact-and-decimal-values-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Exact values are useful because they preserve the mathematical value without rounding. Decimal values are often convenient when a numerical approximation is required.",
            id: "exact-and-decimal-values-paragraph-5"
          },
          {
            type: "paragraph",
            text: "When a problem asks for a specific number of decimal places, keep extra precision during intermediate calculations and round only the final answer.",
            id: "exact-and-decimal-values-paragraph-6"
          }
        ]
      },
      {
        id: "reasonableness-checks",
        title: "Checking Whether Your Answer Makes Sense",
        content: [
          {
            type: "paragraph",
            text: "A calculator can produce a precise number even when you have chosen the wrong ratio. Therefore, checking your answer is an important part of solving a problem.",
            id: "reasonableness-checks-paragraph-1"
          },
          {
            type: "paragraph",
            text: "For an acute angle, sine and cosine are both greater than \\(0\\) and less than \\(1\\).",
            id: "reasonableness-checks-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Tangent is positive for an acute angle and can be greater than \\(1\\).",
            id: "reasonableness-checks-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The hypotenuse must be longer than either leg. If a calculation gives a hypotenuse that is shorter than one of the legs, the setup or calculation needs to be checked.",
            id: "reasonableness-checks-paragraph-4"
          },
          {
            type: "paragraph",
            text: "The size of the angle can also give you a rough expectation. For a small acute angle, the opposite side should generally be relatively small compared with the hypotenuse. For a larger acute angle, the opposite side should be relatively larger.",
            id: "reasonableness-checks-paragraph-5"
          }
        ]
      },
      {
        id: "common-problem-types",
        title: "The Main Types of Beginner Problems",
        content: [
          {
            type: "paragraph",
            text: "Most beginner problems involving trigonometric ratios fall into a few common patterns.",
            id: "common-problem-types-paragraph-1"
          },
          {
            type: "paragraph",
            text: "In the first type, the side lengths are known and you are asked to calculate a trigonometric ratio. You simply identify the relevant sides and substitute them into the correct formula.",
            id: "common-problem-types-paragraph-2"
          },
          {
            type: "paragraph",
            text: "In the second type, an angle and one side are known and another side is unknown. You select the ratio containing the known and unknown sides and solve the resulting equation.",
            id: "common-problem-types-paragraph-3"
          },
          {
            type: "paragraph",
            text: "In the third type, several sides are missing. You may combine trigonometric ratios with the Pythagorean theorem to solve the triangle step by step.",
            id: "common-problem-types-paragraph-4"
          },
          {
            type: "paragraph",
            text: "In every case, the main skill is translating the geometry of the triangle into the correct mathematical relationship.",
            id: "common-problem-types-paragraph-5"
          }
        ]
      },
      {
        id: "three-ratios-together",
        title: "Seeing Sine, Cosine and Tangent Together",
        content: [
          {
            type: "paragraph",
            text: "The three fundamental ratios describe three different relationships inside the same right triangle.",
            id: "three-ratios-together-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Sine compares opposite with hypotenuse:",
            id: "three-ratios-together-paragraph-2"
          },
          {
            type: "paragraph",
            text: "\\[\\sin(\\theta)=\\frac{O}{H}\\]",
            id: "three-ratios-together-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Cosine compares adjacent with hypotenuse:",
            id: "three-ratios-together-paragraph-4"
          },
          {
            type: "paragraph",
            text: "\\[\\cos(\\theta)=\\frac{A}{H}\\]",
            id: "three-ratios-together-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Tangent compares opposite with adjacent:",
            id: "three-ratios-together-paragraph-6"
          },
          {
            type: "paragraph",
            text: "\\[\\tan(\\theta)=\\frac{O}{A}\\]",
            id: "three-ratios-together-paragraph-7"
          },
          {
            type: "paragraph",
            text: "All three ratios describe the same triangle, but each focuses on a different pair of sides.",
            id: "three-ratios-together-paragraph-8"
          }
        ]
      },
      {
        id: "geometric-meaning",
        title: "The Geometric Meaning of the Ratios",
        content: [
          {
            type: "paragraph",
            text: "Sine, cosine and tangent are not just symbols to enter into a calculator. Each one describes a geometric relationship.",
            id: "geometric-meaning-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Sine measures how large the vertical or opposite component is compared with the hypotenuse.",
            id: "geometric-meaning-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Cosine measures how large the adjacent component is compared with the hypotenuse.",
            id: "geometric-meaning-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Tangent compares the opposite and adjacent sides directly. It is closely connected to the steepness of a line or slope of a right triangle.",
            id: "geometric-meaning-paragraph-4"
          },
          {
            type: "paragraph",
            text: "This geometric interpretation becomes increasingly important as trigonometry develops beyond simple triangle calculations.",
            id: "geometric-meaning-paragraph-5"
          }
        ]
      },
      {
        id: "from-ratios-to-functions",
        title: "The Bigger Idea: Ratios Become Functions",
        content: [
          {
            type: "paragraph",
            text: "At this stage, sine, cosine and tangent have been introduced as ratios in right triangles.",
            id: "from-ratios-to-functions-paragraph-1"
          },
          {
            type: "paragraph",
            text: "There is a deeper way to think about them: each ratio can be viewed as a function whose input is an angle and whose output is a number.",
            id: "from-ratios-to-functions-paragraph-2"
          },
          {
            type: "paragraph",
            text: "For example:",
            id: "from-ratios-to-functions-paragraph-3"
          },
          {
            type: "paragraph",
            text: "\\[\\sin(30^\\circ)=\\frac{1}{2}\\]",
            id: "from-ratios-to-functions-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Here, the angle \\(30^\\circ\\) is the input and \\(\\frac{1}{2}\\) is the output.",
            id: "from-ratios-to-functions-paragraph-5"
          },
          {
            type: "paragraph",
            text: "This viewpoint will become much more powerful later when we study trigonometric functions, graphs, periodic behaviour and angles beyond the acute-angle setting.",
            id: "from-ratios-to-functions-paragraph-6"
          }
        ]
      }
    ]
  },
  formulas: [
    {
      id: "sine-ratio",
      name: "Sine Ratio",
      expression: "\\(\\sin(\\theta)=\\frac{O}{H}\\)",
      explanation: "Sine compares the opposite side with the hypotenuse."
    },
    {
      id: "cosine-ratio",
      name: "Cosine Ratio",
      expression: "\\(\\cos(\\theta)=\\frac{A}{H}\\)",
      explanation: "Cosine compares the adjacent side with the hypotenuse."
    },
    {
      id: "tangent-ratio",
      name: "Tangent Ratio",
      expression: "\\(\\tan(\\theta)=\\frac{O}{A}\\)",
      explanation: "Tangent compares the opposite side with the adjacent side."
    },
    {
      id: "tangent-sine-cosine",
      name: "Tangent Relationship",
      expression: "\\(\\tan(\\theta)=\\frac{\\sin(\\theta)}{\\cos(\\theta)}\\)",
      explanation: "Dividing the sine ratio by the cosine ratio causes the hypotenuse to cancel."
    },
    {
      id: "sine-complementary",
      name: "Complementary-Angle Relationship",
      expression: "\\(\\sin(\\theta)=\\cos(90^\\circ-\\theta)\\)",
      explanation: "The opposite side for one acute angle becomes the adjacent side for its complementary angle."
    },
    {
      id: "cosine-complementary",
      name: "Complementary-Angle Relationship",
      expression: "\\(\\cos(\\theta)=\\sin(90^\\circ-\\theta)\\)",
      explanation: "The adjacent side for one acute angle becomes the opposite side for its complementary angle."
    },
    {
      id: "pythagorean-theorem",
      name: "Pythagorean Theorem",
      expression: "\\(a^2+b^2=c^2\\)",
      explanation: "For a right triangle, the squares of the two legs add to the square of the hypotenuse."
    }
  ],
  examples: [
    {
      id: "trig-ratio-example-1",
      question: "A right triangle has an opposite side of \\(6\\,\\text{cm}\\) and a hypotenuse of \\(10\\,\\text{cm}\\). Find \\(\\sin(\\theta)\\).",
      solution: "The relevant sides are opposite and hypotenuse, so use sine. \\[\\sin(\\theta)=\\frac{6}{10}=\\frac{3}{5}=0.6\\]"
    },
    {
      id: "trig-ratio-example-2",
      question: "A right triangle has an adjacent side of \\(8\\,\\text{cm}\\) and a hypotenuse of \\(10\\,\\text{cm}\\). Find \\(\\cos(\\theta)\\).",
      solution: "The relevant sides are adjacent and hypotenuse, so use cosine. \\[\\cos(\\theta)=\\frac{8}{10}=\\frac{4}{5}=0.8\\]"
    },
    {
      id: "trig-ratio-example-3",
      question: "A right triangle has an opposite side of \\(9\\,\\text{cm}\\) and an adjacent side of \\(12\\,\\text{cm}\\). Find \\(\\tan(\\theta)\\).",
      solution: "The relevant sides are opposite and adjacent, so use tangent. \\[\\tan(\\theta)=\\frac{9}{12}=\\frac{3}{4}=0.75\\]"
    },
    {
      id: "trig-ratio-example-4",
      question: "A right triangle has an angle of \\(30^\\circ\\) and a hypotenuse of \\(12\\,\\text{cm}\\). Find the opposite side.",
      solution: "The unknown side is opposite and the known side is the hypotenuse, so use sine. \\[\\sin(30^\\circ)=\\frac{x}{12}\\] Since \\(\\sin(30^\\circ)=\\frac{1}{2}\\), we get \\(\\frac{1}{2}=\\frac{x}{12}\\). Therefore \\(x=6\\,\\text{cm}\\)."
    },
    {
      id: "trig-ratio-example-5",
      question: "A right triangle has an angle of \\(60^\\circ\\) and an adjacent side of \\(5\\,\\text{cm}\\). Find the hypotenuse.",
      solution: "Use cosine because the known side is adjacent and the unknown side is the hypotenuse. \\[\\cos(60^\\circ)=\\frac{5}{h}\\] Since \\(\\cos(60^\\circ)=\\frac{1}{2}\\), \\(\\frac{1}{2}=\\frac{5}{h}\\). Therefore \\(h=10\\,\\text{cm}\\)."
    },
    {
      id: "trig-ratio-example-6",
      question: "A right triangle has an angle of \\(45^\\circ\\) and an adjacent side of \\(7\\,\\text{cm}\\). Find the opposite side.",
      solution: "Use tangent because the relevant sides are opposite and adjacent. \\[\\tan(45^\\circ)=\\frac{x}{7}\\] Since \\(\\tan(45^\\circ)=1\\), \\(1=\\frac{x}{7}\\), so \\(x=7\\,\\text{cm}\\)."
    },
    {
      id: "trig-ratio-example-7",
      question: "A right triangle has an angle of \\(30^\\circ\\) and an adjacent side of \\(8\\,\\text{cm}\\). Find the hypotenuse.",
      solution: "Use cosine: \\[\\cos(30^\\circ)=\\frac{8}{h}\\] Therefore \\(h=\\frac{8}{\\cos(30^\\circ)}\\). Since \\(\\cos(30^\\circ)=\\frac{\\sqrt{3}}{2}\\), \\(h=\\frac{16}{\\sqrt{3}}=\\frac{16\\sqrt{3}}{3}\\,\\text{cm}\\approx9.24\\,\\text{cm}\\)."
    },
    {
      id: "trig-ratio-example-8",
      question: "A right triangle has an angle of \\(45^\\circ\\) and a hypotenuse of \\(10\\,\\text{cm}\\). Find the adjacent side.",
      solution: "Use cosine: \\[\\cos(45^\\circ)=\\frac{x}{10}\\] Since \\(\\cos(45^\\circ)=\\frac{\\sqrt{2}}{2}\\), \\(x=10\\cdot\\frac{\\sqrt{2}}{2}=5\\sqrt{2}\\,\\text{cm}\\approx7.07\\,\\text{cm}\\)."
    },
    {
      id: "trig-ratio-example-9",
      question: "A right triangle has legs of \\(6\\,\\text{cm}\\) and \\(8\\,\\text{cm}\\). Find the hypotenuse and the three basic ratios for the angle opposite the \\(6\\,\\text{cm}\\) side.",
      solution: "First use the Pythagorean theorem: \\[h^2=6^2+8^2=36+64=100\\] Therefore \\(h=10\\,\\text{cm}\\). For the chosen angle, opposite = \\(6\\), adjacent = \\(8\\), and hypotenuse = \\(10\\). Thus \\[\\sin(\\theta)=\\frac{3}{5},\\qquad\\cos(\\theta)=\\frac{4}{5},\\qquad\\tan(\\theta)=\\frac{3}{4}.\\]"
    },
    {
      id: "trig-ratio-example-10",
      question: "Two similar right triangles have the same acute angle. In the first triangle, the opposite side is \\(4\\,\\text{cm}\\) and the hypotenuse is \\(10\\,\\text{cm}\\). In the second triangle, the hypotenuse is \\(15\\,\\text{cm}\\). Find the corresponding opposite side.",
      solution: "Because the triangles are similar, the sine ratio remains constant. \\[\\frac{4}{10}=\\frac{x}{15}\\] Therefore \\(x=15\\cdot\\frac{4}{10}=6\\,\\text{cm}\\)."
    },
    {
      id: "trig-ratio-example-11",
      question: "A right triangle has an opposite side of \\(5\\,\\text{cm}\\) and a hypotenuse of \\(13\\,\\text{cm}\\). Find the sine ratio and explain what the answer means.",
      solution: "Use sine: \\[\\sin(\\theta)=\\frac{5}{13}\\approx0.3846\\] This means that the opposite side is approximately \\(38.46\\%\\) of the hypotenuse."
    },
    {
      id: "trig-ratio-example-12",
      question: "For an acute angle \\(\\theta\\), \\(\\sin(\\theta)=\\frac{3}{5}\\) and \\(\\cos(\\theta)=\\frac{4}{5}\\). Find \\(\\tan(\\theta)\\).",
      solution: "Use the relationship between tangent, sine and cosine: \\[\\tan(\\theta)=\\frac{\\sin(\\theta)}{\\cos(\\theta)}=\\frac{3/5}{4/5}=\\frac{3}{4}.\\]"
    }
  ],
  key_ideas: [
    "Trigonometry studies relationships between angles and sides of triangles.",
    "A right triangle contains one \\(90^\\circ\\) angle.",
    "The hypotenuse is opposite the \\(90^\\circ\\) angle and is always the longest side.",
    "Opposite and adjacent are defined relative to the chosen angle.",
    "Similar right triangles with the same acute angle have the same corresponding side ratios.",
    "Sine compares opposite with hypotenuse.",
    "Cosine compares adjacent with hypotenuse.",
    "Tangent compares opposite with adjacent.",
    "SOH-CAH-TOA is a mnemonic for the three fundamental ratios.",
    "Trigonometric ratios describe relationships, not physical lengths.",
    "A trigonometric equation can be rearranged using ordinary algebra to find an unknown side.",
    "The Pythagorean theorem and trigonometric ratios can be used together.",
    "The two acute angles of a right triangle are complementary.",
    "For degree problems, the calculator should be in degree mode.",
    "Always check whether the final answer makes geometric sense."
  ],
  misconceptions: [
    "Opposite and adjacent are not permanent labels; they depend on the angle being studied.",
    "The hypotenuse is identified by the right angle, not simply because it looks like the longest side.",
    "Tangent does not use the hypotenuse.",
    "Sine, cosine and tangent are ratios, not lengths.",
    "Trigonometric ratios do not have units when equal length units are divided.",
    "Changing the size of a similar triangle does not change the corresponding trigonometric ratios.",
    "SOH-CAH-TOA is a mnemonic, not a separate mathematical law.",
    "You must identify the reference angle before labelling opposite and adjacent.",
    "A calculator can give a precise number even when the wrong ratio has been selected.",
    "The hypotenuse cannot be shorter than either leg.",
    "For an acute angle, sine and cosine are between \\(0\\) and \\(1\\), but tangent can be greater than \\(1\\).",
    "Rounding intermediate calculations too early can reduce the accuracy of the final answer."
  ],
  explorations: [
    {
      id: "why-fixed-angle-ratio",
      type: "why"
    },
    {
      id: "visualize-opposite-adjacent-hypotenuse",
      type: "visualization"
    },
    {
      id: "visualize-sine-ratio",
      type: "visualization"
    },
    {
      id: "visualize-cosine-ratio",
      type: "visualization"
    },
    {
      id: "visualize-tangent-ratio",
      type: "visualization"
    },
    {
      id: "explore-triangle-scale",
      type: "experiment"
    },
    {
      id: "explore-angle-and-ratio",
      type: "experiment"
    },
    {
      id: "deeper-similarity-to-trigonometry",
      type: "go-deeper"
    }
  ],
  sources: [
    "khan-academy-trigonometry",
    "openstax-precalculus"
  ]
};

// ../content/concepts/trigonometric-ratios/02_reciprocal-trigonometric-ratios.json
var reciprocal_trigonometric_ratios_default = {
  id: "reciprocal-trigonometric-ratios",
  title: "Reciprocal Trigonometric Ratios",
  subject: "mathematics",
  topic: "trigonometry",
  section: "intro-trigono",
  difficulty: 2,
  connections: {
    prerequisites: [
      "trigonometric-ratios"
    ],
    leads_to: [
      "trigonometric-ratios-any-angle",
      "trigonometric-functions"
    ],
    related: [
      "trigonometric-ratios"
    ]
  },
  theory: {
    introduction: "Once sine, cosine and tangent are understood, we can build three more trigonometric ratios by taking their reciprocals. These are cosecant, secant and cotangent. The reciprocal ratios do not introduce completely new ideas; they describe the same right triangle relationships from another direction. Understanding how these six ratios are connected makes trigonometry more organized and helps us recognize formulas instead of memorising them separately.",
    sections: [
      {
        id: "what-is-a-reciprocal",
        title: "What Does Reciprocal Mean?",
        content: [
          {
            type: "paragraph",
            text: "Before learning the new trigonometric ratios, we need to understand the word reciprocal.",
            id: "what-is-a-reciprocal-paragraph-1"
          },
          {
            type: "paragraph",
            text: "The reciprocal of a non-zero number is the number that gives \\(1\\) when multiplied by the original number.",
            id: "what-is-a-reciprocal-paragraph-2"
          },
          {
            type: "paragraph",
            text: "For example, the reciprocal of \\(5\\) is \\(\\frac{1}{5}\\), because \\(5\\times\\frac{1}{5}=1\\).",
            id: "what-is-a-reciprocal-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The reciprocal of \\(\\frac{3}{7}\\) is \\(\\frac{7}{3}\\), because \\(\\frac{3}{7}\\times\\frac{7}{3}=1\\).",
            id: "what-is-a-reciprocal-paragraph-4"
          },
          {
            type: "paragraph",
            text: "For a fraction, taking the reciprocal means switching the numerator and denominator.",
            id: "what-is-a-reciprocal-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Therefore, if \\(\\sin(\\theta)=\\frac{O}{H}\\), its reciprocal is \\(\\frac{H}{O}\\). This reciprocal ratio is called cosecant.",
            id: "what-is-a-reciprocal-paragraph-6"
          }
        ]
      },
      {
        id: "why-reciprocal-ratios",
        title: "Why Do Reciprocal Trigonometric Ratios Exist?",
        content: [
          {
            type: "paragraph",
            text: "Sine, cosine and tangent already describe important relationships between the sides of a right triangle. So why introduce three more ratios?",
            id: "why-reciprocal-ratios-paragraph-1"
          },
          {
            type: "paragraph",
            text: "The reciprocal ratios are useful because sometimes the reversed relationship between two sides is more natural or convenient.",
            id: "why-reciprocal-ratios-paragraph-2"
          },
          {
            type: "paragraph",
            text: "For example, sine compares opposite with hypotenuse. Its reciprocal, cosecant, compares hypotenuse with opposite.",
            id: "why-reciprocal-ratios-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Similarly, cosine compares adjacent with hypotenuse, while secant compares hypotenuse with adjacent.",
            id: "why-reciprocal-ratios-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Tangent compares opposite with adjacent, while cotangent compares adjacent with opposite.",
            id: "why-reciprocal-ratios-paragraph-5"
          },
          {
            type: "paragraph",
            text: "The important idea is that reciprocal ratios are not unrelated formulas. Each one is directly connected to one of the three basic ratios.",
            id: "why-reciprocal-ratios-paragraph-6"
          }
        ]
      },
      {
        id: "cosecant",
        title: "Cosecant: The Reciprocal of Sine",
        content: [
          {
            type: "paragraph",
            text: "The first reciprocal trigonometric ratio is cosecant, written as \\(\\csc(\\theta)\\).",
            id: "cosecant-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Cosecant is defined as the reciprocal of sine.",
            id: "cosecant-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Since sine is:",
            id: "cosecant-paragraph-3"
          },
          {
            type: "paragraph",
            text: "\\[\\sin(\\theta)=\\frac{O}{H}\\]",
            id: "cosecant-paragraph-4"
          },
          {
            type: "paragraph",
            text: "taking the reciprocal gives:",
            id: "cosecant-paragraph-5"
          },
          {
            type: "paragraph",
            text: "\\[\\csc(\\theta)=\\frac{H}{O}\\]",
            id: "cosecant-paragraph-6"
          },
          {
            type: "paragraph",
            text: "Therefore, cosecant compares the hypotenuse with the opposite side.",
            id: "cosecant-paragraph-7"
          },
          {
            type: "paragraph",
            text: "For example, if the opposite side is \\(6\\) and the hypotenuse is \\(10\\), then:",
            id: "cosecant-paragraph-8"
          },
          {
            type: "paragraph",
            text: "\\[\\sin(\\theta)=\\frac{6}{10}=\\frac{3}{5}\\]",
            id: "cosecant-paragraph-9"
          },
          {
            type: "paragraph",
            text: "Therefore:",
            id: "cosecant-paragraph-10"
          },
          {
            type: "paragraph",
            text: "\\[\\csc(\\theta)=\\frac{10}{6}=\\frac{5}{3}\\]",
            id: "cosecant-paragraph-11"
          },
          {
            type: "paragraph",
            text: "The two values are reciprocals of each other.",
            id: "cosecant-paragraph-12"
          }
        ]
      },
      {
        id: "understanding-cosecant",
        title: "Understanding What Cosecant Compares",
        content: [
          {
            type: "paragraph",
            text: "It is easy to think of cosecant as just a strange new function to memorise. A better approach is to look at the side relationship.",
            id: "understanding-cosecant-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Sine asks: how large is the opposite side compared with the hypotenuse?",
            id: "understanding-cosecant-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Cosecant reverses that question: how large is the hypotenuse compared with the opposite side?",
            id: "understanding-cosecant-paragraph-3"
          },
          {
            type: "paragraph",
            text: "So if the opposite side is half the hypotenuse, the hypotenuse is twice the opposite side. The corresponding sine and cosecant values are therefore reciprocals.",
            id: "understanding-cosecant-paragraph-4"
          },
          {
            type: "paragraph",
            text: "For an acute angle in a right triangle, the hypotenuse is longer than the opposite side. Therefore, \\(\\csc(\\theta)\\) is greater than \\(1\\).",
            id: "understanding-cosecant-paragraph-5"
          }
        ]
      },
      {
        id: "secant",
        title: "Secant: The Reciprocal of Cosine",
        content: [
          {
            type: "paragraph",
            text: "The second reciprocal trigonometric ratio is secant, written as \\(\\sec(\\theta)\\).",
            id: "secant-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Secant is defined as the reciprocal of cosine.",
            id: "secant-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Since cosine is:",
            id: "secant-paragraph-3"
          },
          {
            type: "paragraph",
            text: "\\[\\cos(\\theta)=\\frac{A}{H}\\]",
            id: "secant-paragraph-4"
          },
          {
            type: "paragraph",
            text: "taking the reciprocal gives:",
            id: "secant-paragraph-5"
          },
          {
            type: "paragraph",
            text: "\\[\\sec(\\theta)=\\frac{H}{A}\\]",
            id: "secant-paragraph-6"
          },
          {
            type: "paragraph",
            text: "Therefore, secant compares the hypotenuse with the adjacent side.",
            id: "secant-paragraph-7"
          },
          {
            type: "paragraph",
            text: "For example, if the adjacent side is \\(8\\) and the hypotenuse is \\(10\\), then:",
            id: "secant-paragraph-8"
          },
          {
            type: "paragraph",
            text: "\\[\\cos(\\theta)=\\frac{8}{10}=\\frac{4}{5}\\]",
            id: "secant-paragraph-9"
          },
          {
            type: "paragraph",
            text: "Therefore:",
            id: "secant-paragraph-10"
          },
          {
            type: "paragraph",
            text: "\\[\\sec(\\theta)=\\frac{10}{8}=\\frac{5}{4}\\]",
            id: "secant-paragraph-11"
          }
        ]
      },
      {
        id: "understanding-secant",
        title: "Understanding What Secant Compares",
        content: [
          {
            type: "paragraph",
            text: "Cosine compares the adjacent side with the hypotenuse.",
            id: "understanding-secant-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Secant reverses that comparison and asks how large the hypotenuse is compared with the adjacent side.",
            id: "understanding-secant-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Because the hypotenuse is always longer than either leg of a right triangle, the hypotenuse-to-adjacent ratio is greater than \\(1\\) for an acute angle.",
            id: "understanding-secant-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Therefore, for an acute angle, \\(\\sec(\\theta)>1\\).",
            id: "understanding-secant-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Secant is not a completely new geometric relationship. It is simply the reversed form of the cosine relationship.",
            id: "understanding-secant-paragraph-5"
          }
        ]
      },
      {
        id: "cotangent",
        title: "Cotangent: The Reciprocal of Tangent",
        content: [
          {
            type: "paragraph",
            text: "The third reciprocal trigonometric ratio is cotangent, written as \\(\\cot(\\theta)\\).",
            id: "cotangent-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Cotangent is defined as the reciprocal of tangent.",
            id: "cotangent-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Since tangent is:",
            id: "cotangent-paragraph-3"
          },
          {
            type: "paragraph",
            text: "\\[\\tan(\\theta)=\\frac{O}{A}\\]",
            id: "cotangent-paragraph-4"
          },
          {
            type: "paragraph",
            text: "taking the reciprocal gives:",
            id: "cotangent-paragraph-5"
          },
          {
            type: "paragraph",
            text: "\\[\\cot(\\theta)=\\frac{A}{O}\\]",
            id: "cotangent-paragraph-6"
          },
          {
            type: "paragraph",
            text: "Therefore, cotangent compares the adjacent side with the opposite side.",
            id: "cotangent-paragraph-7"
          },
          {
            type: "paragraph",
            text: "For example, if the opposite side is \\(9\\) and the adjacent side is \\(12\\), then:",
            id: "cotangent-paragraph-8"
          },
          {
            type: "paragraph",
            text: "\\[\\tan(\\theta)=\\frac{9}{12}=\\frac{3}{4}\\]",
            id: "cotangent-paragraph-9"
          },
          {
            type: "paragraph",
            text: "Therefore:",
            id: "cotangent-paragraph-10"
          },
          {
            type: "paragraph",
            text: "\\[\\cot(\\theta)=\\frac{12}{9}=\\frac{4}{3}\\]",
            id: "cotangent-paragraph-11"
          }
        ]
      },
      {
        id: "understanding-cotangent",
        title: "Understanding What Cotangent Compares",
        content: [
          {
            type: "paragraph",
            text: "Tangent compares opposite with adjacent.",
            id: "understanding-cotangent-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Cotangent reverses that relationship and compares adjacent with opposite.",
            id: "understanding-cotangent-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Unlike cosecant and secant, cotangent is not necessarily greater than \\(1\\) for an acute angle.",
            id: "understanding-cotangent-paragraph-3"
          },
          {
            type: "paragraph",
            text: "If the opposite side is shorter than the adjacent side, cotangent is greater than \\(1\\). If the opposite and adjacent sides are equal, cotangent is \\(1\\). If the opposite side is longer, cotangent is less than \\(1\\).",
            id: "understanding-cotangent-paragraph-4"
          },
          {
            type: "paragraph",
            text: "So the value of cotangent depends on the relative lengths of the two legs.",
            id: "understanding-cotangent-paragraph-5"
          }
        ]
      },
      {
        id: "three-reciprocal-ratios",
        title: "The Three Reciprocal Ratios Together",
        content: [
          {
            type: "paragraph",
            text: "The three reciprocal ratios can now be placed alongside the original three ratios.",
            id: "three-reciprocal-ratios-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Sine and cosecant form a reciprocal pair:",
            id: "three-reciprocal-ratios-paragraph-2"
          },
          {
            type: "paragraph",
            text: "\\[\\sin(\\theta)=\\frac{O}{H},\\qquad\\csc(\\theta)=\\frac{H}{O}\\]",
            id: "three-reciprocal-ratios-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Cosine and secant form a reciprocal pair:",
            id: "three-reciprocal-ratios-paragraph-4"
          },
          {
            type: "paragraph",
            text: "\\[\\cos(\\theta)=\\frac{A}{H},\\qquad\\sec(\\theta)=\\frac{H}{A}\\]",
            id: "three-reciprocal-ratios-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Tangent and cotangent form a reciprocal pair:",
            id: "three-reciprocal-ratios-paragraph-6"
          },
          {
            type: "paragraph",
            text: "\\[\\tan(\\theta)=\\frac{O}{A},\\qquad\\cot(\\theta)=\\frac{A}{O}\\]",
            id: "three-reciprocal-ratios-paragraph-7"
          },
          {
            type: "paragraph",
            text: "The easiest way to remember the relationships is to notice that the numerator and denominator are simply switched.",
            id: "three-reciprocal-ratios-paragraph-8"
          }
        ]
      },
      {
        id: "reciprocal-identities",
        title: "The Reciprocal Identities",
        content: [
          {
            type: "paragraph",
            text: "When two quantities are reciprocals, their product is \\(1\\).",
            id: "reciprocal-identities-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Therefore, sine and cosecant satisfy:",
            id: "reciprocal-identities-paragraph-2"
          },
          {
            type: "paragraph",
            text: "\\[\\sin(\\theta)\\cdot\\csc(\\theta)=1\\]",
            id: "reciprocal-identities-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Cosine and secant satisfy:",
            id: "reciprocal-identities-paragraph-4"
          },
          {
            type: "paragraph",
            text: "\\[\\cos(\\theta)\\cdot\\sec(\\theta)=1\\]",
            id: "reciprocal-identities-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Tangent and cotangent satisfy:",
            id: "reciprocal-identities-paragraph-6"
          },
          {
            type: "paragraph",
            text: "\\[\\tan(\\theta)\\cdot\\cot(\\theta)=1\\]",
            id: "reciprocal-identities-paragraph-7"
          },
          {
            type: "paragraph",
            text: "These are called reciprocal identities. They follow directly from the definitions rather than being separate facts that must be memorised without explanation.",
            id: "reciprocal-identities-paragraph-8"
          }
        ]
      },
      {
        id: "why-products-equal-one",
        title: "Why Do the Products Equal One?",
        content: [
          {
            type: "paragraph",
            text: "Consider sine and cosecant.",
            id: "why-products-equal-one-paragraph-1"
          },
          {
            type: "paragraph",
            text: "We know:",
            id: "why-products-equal-one-paragraph-2"
          },
          {
            type: "paragraph",
            text: "\\[\\sin(\\theta)=\\frac{O}{H}\\]",
            id: "why-products-equal-one-paragraph-3"
          },
          {
            type: "paragraph",
            text: "and:",
            id: "why-products-equal-one-paragraph-4"
          },
          {
            type: "paragraph",
            text: "\\[\\csc(\\theta)=\\frac{H}{O}\\]",
            id: "why-products-equal-one-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Multiplying them gives:",
            id: "why-products-equal-one-paragraph-6"
          },
          {
            type: "paragraph",
            text: "\\[\\sin(\\theta)\\cdot\\csc(\\theta)=\\frac{O}{H}\\cdot\\frac{H}{O}\\]",
            id: "why-products-equal-one-paragraph-7"
          },
          {
            type: "paragraph",
            text: "The common factors cancel:",
            id: "why-products-equal-one-paragraph-8"
          },
          {
            type: "paragraph",
            text: "\\[\\frac{O}{H}\\cdot\\frac{H}{O}=1\\]",
            id: "why-products-equal-one-paragraph-9"
          },
          {
            type: "paragraph",
            text: "Exactly the same reasoning works for cosine and secant, and for tangent and cotangent.",
            id: "why-products-equal-one-paragraph-10"
          }
        ]
      },
      {
        id: "finding-a-reciprocal",
        title: "Finding a Reciprocal Ratio From a Known Ratio",
        content: [
          {
            type: "paragraph",
            text: "If you know one trigonometric ratio, you can immediately find its reciprocal by taking the reciprocal of the value.",
            id: "finding-a-reciprocal-paragraph-1"
          },
          {
            type: "paragraph",
            text: "For example, suppose:",
            id: "finding-a-reciprocal-paragraph-2"
          },
          {
            type: "paragraph",
            text: "\\[\\sin(\\theta)=\\frac{3}{5}\\]",
            id: "finding-a-reciprocal-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The reciprocal is:",
            id: "finding-a-reciprocal-paragraph-4"
          },
          {
            type: "paragraph",
            text: "\\[\\csc(\\theta)=\\frac{5}{3}\\]",
            id: "finding-a-reciprocal-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Similarly, if:",
            id: "finding-a-reciprocal-paragraph-6"
          },
          {
            type: "paragraph",
            text: "\\[\\cos(\\theta)=\\frac{4}{5}\\]",
            id: "finding-a-reciprocal-paragraph-7"
          },
          {
            type: "paragraph",
            text: "then:",
            id: "finding-a-reciprocal-paragraph-8"
          },
          {
            type: "paragraph",
            text: "\\[\\sec(\\theta)=\\frac{5}{4}\\]",
            id: "finding-a-reciprocal-paragraph-9"
          },
          {
            type: "paragraph",
            text: "And if:",
            id: "finding-a-reciprocal-paragraph-10"
          },
          {
            type: "paragraph",
            text: "\\[\\tan(\\theta)=\\frac{2}{3}\\]",
            id: "finding-a-reciprocal-paragraph-11"
          },
          {
            type: "paragraph",
            text: "then:",
            id: "finding-a-reciprocal-paragraph-12"
          },
          {
            type: "paragraph",
            text: "\\[\\cot(\\theta)=\\frac{3}{2}\\]",
            id: "finding-a-reciprocal-paragraph-13"
          }
        ]
      },
      {
        id: "finding-basic-ratio",
        title: "Finding a Basic Ratio From a Reciprocal",
        content: [
          {
            type: "paragraph",
            text: "The process also works in the opposite direction.",
            id: "finding-basic-ratio-paragraph-1"
          },
          {
            type: "paragraph",
            text: "If you know a reciprocal ratio, take its reciprocal again to recover the original ratio.",
            id: "finding-basic-ratio-paragraph-2"
          },
          {
            type: "paragraph",
            text: "For example, if:",
            id: "finding-basic-ratio-paragraph-3"
          },
          {
            type: "paragraph",
            text: "\\[\\csc(\\theta)=\\frac{7}{3}\\]",
            id: "finding-basic-ratio-paragraph-4"
          },
          {
            type: "paragraph",
            text: "then:",
            id: "finding-basic-ratio-paragraph-5"
          },
          {
            type: "paragraph",
            text: "\\[\\sin(\\theta)=\\frac{3}{7}\\]",
            id: "finding-basic-ratio-paragraph-6"
          },
          {
            type: "paragraph",
            text: "Likewise, if:",
            id: "finding-basic-ratio-paragraph-7"
          },
          {
            type: "paragraph",
            text: "\\[\\sec(\\theta)=\\frac{9}{4}\\]",
            id: "finding-basic-ratio-paragraph-8"
          },
          {
            type: "paragraph",
            text: "then:",
            id: "finding-basic-ratio-paragraph-9"
          },
          {
            type: "paragraph",
            text: "\\[\\cos(\\theta)=\\frac{4}{9}\\]",
            id: "finding-basic-ratio-paragraph-10"
          },
          {
            type: "paragraph",
            text: "Taking the reciprocal twice returns you to the original value.",
            id: "finding-basic-ratio-paragraph-11"
          }
        ]
      },
      {
        id: "reciprocal-ratios-from-sides",
        title: "Finding Reciprocal Ratios From Triangle Sides",
        content: [
          {
            type: "paragraph",
            text: "You can also calculate the reciprocal ratios directly from a right triangle.",
            id: "reciprocal-ratios-from-sides-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Suppose a right triangle has opposite side \\(6\\), adjacent side \\(8\\), and hypotenuse \\(10\\).",
            id: "reciprocal-ratios-from-sides-paragraph-2"
          },
          {
            type: "paragraph",
            text: "For the chosen angle:",
            id: "reciprocal-ratios-from-sides-paragraph-3"
          },
          {
            type: "paragraph",
            text: "\\[O=6,\\qquad A=8,\\qquad H=10\\]",
            id: "reciprocal-ratios-from-sides-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Cosecant is hypotenuse divided by opposite:",
            id: "reciprocal-ratios-from-sides-paragraph-5"
          },
          {
            type: "paragraph",
            text: "\\[\\csc(\\theta)=\\frac{10}{6}=\\frac{5}{3}\\]",
            id: "reciprocal-ratios-from-sides-paragraph-6"
          },
          {
            type: "paragraph",
            text: "Secant is hypotenuse divided by adjacent:",
            id: "reciprocal-ratios-from-sides-paragraph-7"
          },
          {
            type: "paragraph",
            text: "\\[\\sec(\\theta)=\\frac{10}{8}=\\frac{5}{4}\\]",
            id: "reciprocal-ratios-from-sides-paragraph-8"
          },
          {
            type: "paragraph",
            text: "Cotangent is adjacent divided by opposite:",
            id: "reciprocal-ratios-from-sides-paragraph-9"
          },
          {
            type: "paragraph",
            text: "\\[\\cot(\\theta)=\\frac{8}{6}=\\frac{4}{3}\\]",
            id: "reciprocal-ratios-from-sides-paragraph-10"
          }
        ]
      },
      {
        id: "six-ratios-table",
        title: "All Six Ratios in One Picture",
        content: [
          {
            type: "paragraph",
            text: "For a chosen acute angle in a right triangle, the six trigonometric ratios can be organised into three reciprocal pairs.",
            id: "six-ratios-table-paragraph-1"
          },
          {
            type: "paragraph",
            text: "The first pair is sine and cosecant:",
            id: "six-ratios-table-paragraph-2"
          },
          {
            type: "paragraph",
            text: "\\[\\sin(\\theta)=\\frac{O}{H},\\qquad\\csc(\\theta)=\\frac{H}{O}\\]",
            id: "six-ratios-table-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The second pair is cosine and secant:",
            id: "six-ratios-table-paragraph-4"
          },
          {
            type: "paragraph",
            text: "\\[\\cos(\\theta)=\\frac{A}{H},\\qquad\\sec(\\theta)=\\frac{H}{A}\\]",
            id: "six-ratios-table-paragraph-5"
          },
          {
            type: "paragraph",
            text: "The third pair is tangent and cotangent:",
            id: "six-ratios-table-paragraph-6"
          },
          {
            type: "paragraph",
            text: "\\[\\tan(\\theta)=\\frac{O}{A},\\qquad\\cot(\\theta)=\\frac{A}{O}\\]",
            id: "six-ratios-table-paragraph-7"
          },
          {
            type: "paragraph",
            text: "This arrangement is useful because it shows that the six ratios are built from only three side comparisons and their reciprocals.",
            id: "six-ratios-table-paragraph-8"
          }
        ]
      },
      {
        id: "reciprocal-ratios-and-soh-cahtoa",
        title: "Connecting the Six Ratios to SOH-CAH-TOA",
        content: [
          {
            type: "paragraph",
            text: "SOH-CAH-TOA gives the three original ratios:",
            id: "reciprocal-ratios-and-soh-cahtoa-paragraph-1"
          },
          {
            type: "paragraph",
            text: "\\[\\sin(\\theta)=\\frac{O}{H},\\qquad\\cos(\\theta)=\\frac{A}{H},\\qquad\\tan(\\theta)=\\frac{O}{A}\\]",
            id: "reciprocal-ratios-and-soh-cahtoa-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The reciprocal ratios are obtained simply by reversing each fraction.",
            id: "reciprocal-ratios-and-soh-cahtoa-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Therefore:",
            id: "reciprocal-ratios-and-soh-cahtoa-paragraph-4"
          },
          {
            type: "paragraph",
            text: "\\[\\csc(\\theta)=\\frac{H}{O},\\qquad\\sec(\\theta)=\\frac{H}{A},\\qquad\\cot(\\theta)=\\frac{A}{O}\\]",
            id: "reciprocal-ratios-and-soh-cahtoa-paragraph-5"
          },
          {
            type: "paragraph",
            text: "There is no need to create a completely separate memory system for the reciprocal ratios. Start with SOH-CAH-TOA and reverse the appropriate fraction.",
            id: "reciprocal-ratios-and-soh-cahtoa-paragraph-6"
          }
        ]
      },
      {
        id: "reciprocal-vs-inverse",
        title: "Reciprocal Does Not Mean Inverse Function",
        content: [
          {
            type: "paragraph",
            text: "The word inverse can cause confusion in trigonometry because it can refer to different ideas.",
            id: "reciprocal-vs-inverse-paragraph-1"
          },
          {
            type: "paragraph",
            text: "A reciprocal means taking \\(\\frac{1}{x}\\). For example, the reciprocal of \\(\\sin(\\theta)\\) is \\(\\frac{1}{\\sin(\\theta)}\\), which is \\(\\csc(\\theta)\\).",
            id: "reciprocal-vs-inverse-paragraph-2"
          },
          {
            type: "paragraph",
            text: "This is different from an inverse function. Reciprocal ratios are the topic here; inverse trigonometric functions are a different concept and are not needed to understand cosecant, secant and cotangent.",
            id: "reciprocal-vs-inverse-paragraph-3"
          },
          {
            type: "paragraph",
            text: "For now, focus on the simple rule: reciprocal means flip the fraction.",
            id: "reciprocal-vs-inverse-paragraph-4"
          }
        ]
      },
      {
        id: "why-cosecant-and-secant-greater-than-one",
        title: "Why Are Cosecant and Secant Greater Than One?",
        content: [
          {
            type: "paragraph",
            text: "For an acute angle in a right triangle, the hypotenuse is always longer than either leg.",
            id: "why-cosecant-and-secant-greater-than-one-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Cosecant compares hypotenuse with opposite:",
            id: "why-cosecant-and-secant-greater-than-one-paragraph-2"
          },
          {
            type: "paragraph",
            text: "\\[\\csc(\\theta)=\\frac{H}{O}\\]",
            id: "why-cosecant-and-secant-greater-than-one-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Since \\(H>O\\), this ratio must be greater than \\(1\\).",
            id: "why-cosecant-and-secant-greater-than-one-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Secant compares hypotenuse with adjacent:",
            id: "why-cosecant-and-secant-greater-than-one-paragraph-5"
          },
          {
            type: "paragraph",
            text: "\\[\\sec(\\theta)=\\frac{H}{A}\\]",
            id: "why-cosecant-and-secant-greater-than-one-paragraph-6"
          },
          {
            type: "paragraph",
            text: "Since \\(H>A\\), this ratio is also greater than \\(1\\).",
            id: "why-cosecant-and-secant-greater-than-one-paragraph-7"
          },
          {
            type: "paragraph",
            text: "This also makes sense from the reciprocal relationships. For an acute angle, sine and cosine are between \\(0\\) and \\(1\\), so their reciprocals are greater than \\(1\\).",
            id: "why-cosecant-and-secant-greater-than-one-paragraph-8"
          }
        ]
      },
      {
        id: "cotangent-size",
        title: "Why Cotangent Can Be Less Than, Equal To, or Greater Than One",
        content: [
          {
            type: "paragraph",
            text: "Cotangent behaves differently from cosecant and secant because it compares the two legs of the right triangle.",
            id: "cotangent-size-paragraph-1"
          },
          {
            type: "paragraph",
            text: "\\[\\cot(\\theta)=\\frac{A}{O}\\]",
            id: "cotangent-size-paragraph-2"
          },
          {
            type: "paragraph",
            text: "If the adjacent side is longer than the opposite side, then \\(\\cot(\\theta)>1\\).",
            id: "cotangent-size-paragraph-3"
          },
          {
            type: "paragraph",
            text: "If the adjacent and opposite sides are equal, then \\(\\cot(\\theta)=1\\).",
            id: "cotangent-size-paragraph-4"
          },
          {
            type: "paragraph",
            text: "If the adjacent side is shorter than the opposite side, then \\(\\cot(\\theta)<1\\).",
            id: "cotangent-size-paragraph-5"
          },
          {
            type: "paragraph",
            text: "For example, in a right triangle with equal legs, the two acute angles are each \\(45^\\circ\\). For either acute angle:",
            id: "cotangent-size-paragraph-6"
          },
          {
            type: "paragraph",
            text: "\\[\\tan(45^\\circ)=1,\\qquad\\cot(45^\\circ)=1\\]",
            id: "cotangent-size-paragraph-7"
          }
        ]
      },
      {
        id: "relationships-between-tan-and-cot",
        title: "Tangent and Cotangent as Opposite Ratios",
        content: [
          {
            type: "paragraph",
            text: "Tangent and cotangent are especially easy to connect because they use exactly the same two sides.",
            id: "relationships-between-tan-and-cot-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Tangent uses:",
            id: "relationships-between-tan-and-cot-paragraph-2"
          },
          {
            type: "paragraph",
            text: "\\[\\tan(\\theta)=\\frac{O}{A}\\]",
            id: "relationships-between-tan-and-cot-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Cotangent reverses it:",
            id: "relationships-between-tan-and-cot-paragraph-4"
          },
          {
            type: "paragraph",
            text: "\\[\\cot(\\theta)=\\frac{A}{O}\\]",
            id: "relationships-between-tan-and-cot-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Therefore:",
            id: "relationships-between-tan-and-cot-paragraph-6"
          },
          {
            type: "paragraph",
            text: "\\[\\cot(\\theta)=\\frac{1}{\\tan(\\theta)}\\]",
            id: "relationships-between-tan-and-cot-paragraph-7"
          },
          {
            type: "paragraph",
            text: "and:",
            id: "relationships-between-tan-and-cot-paragraph-8"
          },
          {
            type: "paragraph",
            text: "\\[\\tan(\\theta)\\cdot\\cot(\\theta)=1\\]",
            id: "relationships-between-tan-and-cot-paragraph-9"
          },
          {
            type: "paragraph",
            text: "The same reciprocal idea connects sine with cosecant and cosine with secant.",
            id: "relationships-between-tan-and-cot-paragraph-10"
          }
        ]
      },
      {
        id: "using-reciprocal-ratios",
        title: "When Might We Use Reciprocal Ratios?",
        content: [
          {
            type: "paragraph",
            text: "The reciprocal ratios are useful when a problem naturally involves hypotenuse divided by a leg, or one leg divided by the other.",
            id: "using-reciprocal-ratios-paragraph-1"
          },
          {
            type: "paragraph",
            text: "For example, if a problem gives the hypotenuse and opposite side and asks for their ratio in that order, cosecant matches the relationship directly.",
            id: "using-reciprocal-ratios-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Similarly, if the hypotenuse is divided by the adjacent side, secant gives that ratio directly.",
            id: "using-reciprocal-ratios-paragraph-3"
          },
          {
            type: "paragraph",
            text: "If adjacent is divided by opposite, cotangent gives that relationship directly.",
            id: "using-reciprocal-ratios-paragraph-4"
          },
          {
            type: "paragraph",
            text: "However, you should not feel forced to use a reciprocal ratio just because it exists. If sine, cosine or tangent makes the problem clearer, the original ratios can still be used.",
            id: "using-reciprocal-ratios-paragraph-5"
          }
        ]
      },
      {
        id: "checking-reciprocal-calculations",
        title: "Checking Your Reciprocal Calculations",
        content: [
          {
            type: "paragraph",
            text: "Because reciprocal ratios are created by flipping fractions, a quick check is possible.",
            id: "checking-reciprocal-calculations-paragraph-1"
          },
          {
            type: "paragraph",
            text: "If you calculate both sine and cosecant for the same angle, multiplying them should give \\(1\\):",
            id: "checking-reciprocal-calculations-paragraph-2"
          },
          {
            type: "paragraph",
            text: "\\[\\sin(\\theta)\\cdot\\csc(\\theta)=1\\]",
            id: "checking-reciprocal-calculations-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The same check works for cosine and secant:",
            id: "checking-reciprocal-calculations-paragraph-4"
          },
          {
            type: "paragraph",
            text: "\\[\\cos(\\theta)\\cdot\\sec(\\theta)=1\\]",
            id: "checking-reciprocal-calculations-paragraph-5"
          },
          {
            type: "paragraph",
            text: "And for tangent and cotangent:",
            id: "checking-reciprocal-calculations-paragraph-6"
          },
          {
            type: "paragraph",
            text: "\\[\\tan(\\theta)\\cdot\\cot(\\theta)=1\\]",
            id: "checking-reciprocal-calculations-paragraph-7"
          },
          {
            type: "paragraph",
            text: "If the product is not \\(1\\), check whether you reversed the fraction correctly or made an arithmetic error.",
            id: "checking-reciprocal-calculations-paragraph-8"
          }
        ]
      },
      {
        id: "big-picture-six-ratios",
        title: "The Big Picture: Six Ratios, Three Core Relationships",
        content: [
          {
            type: "paragraph",
            text: "At first, six trigonometric ratios can seem like six separate formulas. They are much more connected than they appear.",
            id: "big-picture-six-ratios-paragraph-1"
          },
          {
            type: "paragraph",
            text: "There are really three fundamental side relationships:",
            id: "big-picture-six-ratios-paragraph-2"
          },
          {
            type: "paragraph",
            text: "\\[\\frac{O}{H},\\qquad\\frac{A}{H},\\qquad\\frac{O}{A}\\]",
            id: "big-picture-six-ratios-paragraph-3"
          },
          {
            type: "paragraph",
            text: "These produce sine, cosine and tangent.",
            id: "big-picture-six-ratios-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Reversing each relationship produces:",
            id: "big-picture-six-ratios-paragraph-5"
          },
          {
            type: "paragraph",
            text: "\\[\\frac{H}{O},\\qquad\\frac{H}{A},\\qquad\\frac{A}{O}\\]",
            id: "big-picture-six-ratios-paragraph-6"
          },
          {
            type: "paragraph",
            text: "These produce cosecant, secant and cotangent.",
            id: "big-picture-six-ratios-paragraph-7"
          },
          {
            type: "paragraph",
            text: "So the six ratios are best understood as three relationships and their reciprocals.",
            id: "big-picture-six-ratios-paragraph-8"
          }
        ]
      }
    ]
  },
  formulas: [
    {
      id: "cosecant-ratio",
      name: "Cosecant Ratio",
      expression: "\\(\\csc(\\theta)=\\frac{H}{O}\\)",
      explanation: "Cosecant is the reciprocal of sine and compares the hypotenuse with the opposite side."
    },
    {
      id: "secant-ratio",
      name: "Secant Ratio",
      expression: "\\(\\sec(\\theta)=\\frac{H}{A}\\)",
      explanation: "Secant is the reciprocal of cosine and compares the hypotenuse with the adjacent side."
    },
    {
      id: "cotangent-ratio",
      name: "Cotangent Ratio",
      expression: "\\(\\cot(\\theta)=\\frac{A}{O}\\)",
      explanation: "Cotangent is the reciprocal of tangent and compares the adjacent side with the opposite side."
    },
    {
      id: "cosecant-reciprocal",
      name: "Cosecant and Sine",
      expression: "\\(\\csc(\\theta)=\\frac{1}{\\sin(\\theta)}\\)",
      explanation: "Cosecant is the reciprocal of sine."
    },
    {
      id: "secant-reciprocal",
      name: "Secant and Cosine",
      expression: "\\(\\sec(\\theta)=\\frac{1}{\\cos(\\theta)}\\)",
      explanation: "Secant is the reciprocal of cosine."
    },
    {
      id: "cotangent-reciprocal",
      name: "Cotangent and Tangent",
      expression: "\\(\\cot(\\theta)=\\frac{1}{\\tan(\\theta)}\\)",
      explanation: "Cotangent is the reciprocal of tangent."
    },
    {
      id: "sine-cosecant-identity",
      name: "Sine-Cosecant Identity",
      expression: "\\(\\sin(\\theta)\\cdot\\csc(\\theta)=1\\)",
      explanation: "Sine and cosecant are reciprocals, so their product is one."
    },
    {
      id: "cosine-secant-identity",
      name: "Cosine-Secant Identity",
      expression: "\\(\\cos(\\theta)\\cdot\\sec(\\theta)=1\\)",
      explanation: "Cosine and secant are reciprocals, so their product is one."
    },
    {
      id: "tangent-cotangent-identity",
      name: "Tangent-Cotangent Identity",
      expression: "\\(\\tan(\\theta)\\cdot\\cot(\\theta)=1\\)",
      explanation: "Tangent and cotangent are reciprocals, so their product is one."
    }
  ],
  examples: [
    {
      id: "reciprocal-example-1",
      question: "If \\(\\sin(\\theta)=\\frac{3}{5}\\), find \\(\\csc(\\theta)\\).",
      solution: "Cosecant is the reciprocal of sine. Therefore, flip the fraction: \\[\\csc(\\theta)=\\frac{1}{\\sin(\\theta)}=\\frac{5}{3}.\\]"
    },
    {
      id: "reciprocal-example-2",
      question: "If \\(\\cos(\\theta)=\\frac{4}{7}\\), find \\(\\sec(\\theta)\\).",
      solution: "Secant is the reciprocal of cosine. Therefore: \\[\\sec(\\theta)=\\frac{1}{\\cos(\\theta)}=\\frac{7}{4}.\\]"
    },
    {
      id: "reciprocal-example-3",
      question: "If \\(\\tan(\\theta)=\\frac{2}{5}\\), find \\(\\cot(\\theta)\\).",
      solution: "Cotangent is the reciprocal of tangent. Therefore: \\[\\cot(\\theta)=\\frac{1}{\\tan(\\theta)}=\\frac{5}{2}.\\]"
    },
    {
      id: "reciprocal-example-4",
      question: "If \\(\\csc(\\theta)=\\frac{9}{4}\\), find \\(\\sin(\\theta)\\).",
      solution: "Sine and cosecant are reciprocals. Flip the fraction: \\[\\sin(\\theta)=\\frac{4}{9}.\\]"
    },
    {
      id: "reciprocal-example-5",
      question: "If \\(\\sec(\\theta)=\\frac{11}{6}\\), find \\(\\cos(\\theta)\\).",
      solution: "Cosine is the reciprocal of secant. Therefore: \\[\\cos(\\theta)=\\frac{6}{11}.\\]"
    },
    {
      id: "reciprocal-example-6",
      question: "If \\(\\cot(\\theta)=\\frac{7}{3}\\), find \\(\\tan(\\theta)\\).",
      solution: "Tangent and cotangent are reciprocals. Therefore: \\[\\tan(\\theta)=\\frac{3}{7}.\\]"
    },
    {
      id: "reciprocal-example-7",
      question: "A right triangle has opposite side \\(6\\,\\text{cm}\\), adjacent side \\(8\\,\\text{cm}\\), and hypotenuse \\(10\\,\\text{cm}\\). Find \\(\\csc(\\theta)\\).",
      solution: "Cosecant compares hypotenuse with opposite. Therefore: \\[\\csc(\\theta)=\\frac{H}{O}=\\frac{10}{6}=\\frac{5}{3}.\\]"
    },
    {
      id: "reciprocal-example-8",
      question: "A right triangle has opposite side \\(6\\,\\text{cm}\\), adjacent side \\(8\\,\\text{cm}\\), and hypotenuse \\(10\\,\\text{cm}\\). Find \\(\\sec(\\theta)\\).",
      solution: "Secant compares hypotenuse with adjacent. Therefore: \\[\\sec(\\theta)=\\frac{H}{A}=\\frac{10}{8}=\\frac{5}{4}.\\]"
    },
    {
      id: "reciprocal-example-9",
      question: "A right triangle has opposite side \\(6\\,\\text{cm}\\) and adjacent side \\(8\\,\\text{cm}\\). Find \\(\\cot(\\theta)\\).",
      solution: "Cotangent compares adjacent with opposite. Therefore: \\[\\cot(\\theta)=\\frac{A}{O}=\\frac{8}{6}=\\frac{4}{3}.\\]"
    },
    {
      id: "reciprocal-example-10",
      question: "For an acute angle \\(\\theta\\), \\(\\sin(\\theta)=0.4\\). Find \\(\\csc(\\theta)\\).",
      solution: "Cosecant is the reciprocal of sine: \\[\\csc(\\theta)=\\frac{1}{0.4}=2.5.\\]"
    },
    {
      id: "reciprocal-example-11",
      question: "For an acute angle \\(\\theta\\), \\(\\cos(\\theta)=0.8\\). Find \\(\\sec(\\theta)\\).",
      solution: "Secant is the reciprocal of cosine: \\[\\sec(\\theta)=\\frac{1}{0.8}=1.25.\\]"
    },
    {
      id: "reciprocal-example-12",
      question: "For an acute angle \\(\\theta\\), \\(\\tan(\\theta)=\\frac{3}{4}\\). Find \\(\\cot(\\theta)\\) and verify the reciprocal identity.",
      solution: "Take the reciprocal of tangent: \\[\\cot(\\theta)=\\frac{4}{3}.\\] Now verify: \\[\\tan(\\theta)\\cdot\\cot(\\theta)=\\frac{3}{4}\\cdot\\frac{4}{3}=1.\\]"
    },
    {
      id: "reciprocal-example-13",
      question: "A right triangle has sides \\(5\\), \\(12\\), and \\(13\\). For the angle opposite the side of length \\(5\\), find all six trigonometric ratios.",
      solution: "For the chosen angle, opposite = \\(5\\), adjacent = \\(12\\), and hypotenuse = \\(13\\). Therefore: \\[\\sin(\\theta)=\\frac{5}{13},\\quad\\cos(\\theta)=\\frac{12}{13},\\quad\\tan(\\theta)=\\frac{5}{12}.\\] Taking reciprocals gives: \\[\\csc(\\theta)=\\frac{13}{5},\\quad\\sec(\\theta)=\\frac{13}{12},\\quad\\cot(\\theta)=\\frac{12}{5}.\\]"
    },
    {
      id: "reciprocal-example-14",
      question: "If \\(\\sin(\\theta)=\\frac{5}{13}\\), find \\(\\csc(\\theta)\\) and verify that their product is \\(1\\).",
      solution: "The reciprocal of \\(\\frac{5}{13}\\) is \\(\\frac{13}{5}\\), so \\[\\csc(\\theta)=\\frac{13}{5}.\\] Verification: \\[\\sin(\\theta)\\cdot\\csc(\\theta)=\\frac{5}{13}\\cdot\\frac{13}{5}=1.\\]"
    },
    {
      id: "reciprocal-example-15",
      question: "A right triangle has opposite side \\(9\\,\\text{cm}\\) and adjacent side \\(12\\,\\text{cm}\\). Find tangent and cotangent.",
      solution: "Tangent compares opposite with adjacent: \\[\\tan(\\theta)=\\frac{9}{12}=\\frac{3}{4}.\\] Cotangent reverses the ratio: \\[\\cot(\\theta)=\\frac{12}{9}=\\frac{4}{3}.\\] Their product is \\(1\\)."
    },
    {
      id: "reciprocal-example-16",
      question: "A right triangle has equal legs. Find the tangent and cotangent of either acute angle.",
      solution: "Equal legs mean opposite and adjacent have the same length. Therefore: \\[\\tan(\\theta)=\\frac{O}{A}=1\\] and \\[\\cot(\\theta)=\\frac{A}{O}=1.\\] Thus both ratios are equal to \\(1\\)."
    }
  ],
  key_ideas: [
    "A reciprocal is a number that multiplies with the original number to give \\(1\\).",
    "For a fraction, taking the reciprocal means switching the numerator and denominator.",
    "Cosecant is the reciprocal of sine.",
    "Secant is the reciprocal of cosine.",
    "Cotangent is the reciprocal of tangent.",
    "Cosecant compares hypotenuse with opposite.",
    "Secant compares hypotenuse with adjacent.",
    "Cotangent compares adjacent with opposite.",
    "Sine and cosecant form a reciprocal pair.",
    "Cosine and secant form a reciprocal pair.",
    "Tangent and cotangent form a reciprocal pair.",
    "The product of a trigonometric ratio and its reciprocal is \\(1\\).",
    "For an acute angle, cosecant and secant are greater than \\(1\\).",
    "Cotangent can be less than, equal to, or greater than \\(1\\).",
    "The six trigonometric ratios can be understood as three basic ratios and their reciprocals.",
    "SOH-CAH-TOA remains the foundation for the three original ratios.",
    "You can find a reciprocal ratio directly from the side lengths or by taking the reciprocal of a known ratio.",
    "Reciprocal ratios do not mean inverse trigonometric functions.",
    "Understanding why the ratios are related is more useful than memorising six unrelated formulas."
  ],
  misconceptions: [
    "Cosecant is not the same as cosine; \\(\\csc\\) is the reciprocal of sine.",
    "Secant is not the same as sine; \\(\\sec\\) is the reciprocal of cosine.",
    "Cotangent is not the reciprocal of cosine; it is the reciprocal of tangent.",
    "Taking a reciprocal means flipping the numerator and denominator of a non-zero fraction.",
    "The reciprocal of \\(\\frac{3}{5}\\) is \\(\\frac{5}{3}\\), not \\(-\\frac{3}{5}\\).",
    "Cosecant compares hypotenuse with opposite, not opposite with hypotenuse.",
    "Secant compares hypotenuse with adjacent, not adjacent with hypotenuse.",
    "Cotangent compares adjacent with opposite, not opposite with adjacent.",
    "A reciprocal is not the same thing as an inverse trigonometric function.",
    "The product of a ratio and its reciprocal is \\(1\\), not \\(0\\).",
    "Cosecant and secant are greater than \\(1\\) for acute angles because the hypotenuse is longer than either leg.",
    "Cotangent is not always greater than \\(1\\); its value depends on the relative lengths of the two legs.",
    "You still need to identify the reference angle before deciding which side is opposite or adjacent.",
    "The letters \\(\\csc\\), \\(\\sec\\), and \\(\\cot\\) represent specific trigonometric ratios and should not be treated as arbitrary abbreviations.",
    "Reciprocal ratios are built from sine, cosine and tangent rather than being completely unrelated formulas."
  ],
  explorations: [
    {
      id: "why-reciprocal-means-flip",
      type: "why"
    },
    {
      id: "visualize-six-trig-ratios",
      type: "visualization"
    },
    {
      id: "visualize-cosecant",
      type: "visualization"
    },
    {
      id: "visualize-secant",
      type: "visualization"
    },
    {
      id: "visualize-cotangent",
      type: "visualization"
    },
    {
      id: "explore-reciprocal-pairs",
      type: "experiment"
    },
    {
      id: "explore-six-ratios-from-345",
      type: "experiment"
    },
    {
      id: "deeper-six-ratios-three-relationships",
      type: "go-deeper"
    }
  ],
  sources: [
    "khan-academy-trigonometry",
    "openstax-precalculus"
  ]
};

// ../content/concepts/trigonometric-ratios/03_trigonometric-ratios-any-angle.json
var trigonometric_ratios_any_angle_default = {
  id: "trigonometric-ratios-any-angle",
  title: "Trigonometric Ratios for Any Angle",
  subject: "mathematics",
  topic: "trigonometry",
  section: "intro-trigono",
  difficulty: 2,
  connections: {
    prerequisites: [
      "trigonometric-ratios",
      "reciprocal-trigonometric-ratios"
    ],
    leads_to: [
      "exact-trigonometric-values",
      "trigonometric-functions"
    ],
    related: [
      "trigonometric-ratios",
      "reciprocal-trigonometric-ratios"
    ]
  },
  theory: {
    introduction: "So far, trigonometric ratios have been introduced using right triangles. This works naturally when the angle being studied is acute, meaning \\(0^\\circ<\\theta<90^\\circ\\). But angles can be much larger than \\(90^\\circ\\), and they can also be negative. To make trigonometry useful for every possible angle, we need to extend the definitions of sine, cosine and tangent beyond the right triangle. The coordinate plane gives us a natural way to do this. By placing an angle in standard position and studying a point on its terminal side, we can define trigonometric ratios for angles in all four quadrants. This also explains why trigonometric values can be positive or negative, introduces reference angles, and gives us a systematic way to work with angles such as \\(120^\\circ\\), \\(210^\\circ\\), \\(315^\\circ\\) and \\(-45^\\circ\\).",
    sections: [
      {
        id: "why-right-triangles-are-not-enough",
        title: "Why Right Triangles Are Not Enough",
        content: [
          {
            type: "paragraph",
            text: "When we first learn trigonometry, we use a right triangle and a chosen acute angle. We identify the opposite side, adjacent side and hypotenuse, and then use sine, cosine or tangent to describe relationships between those sides.",
            id: "why-right-triangles-are-not-enough-paragraph-1"
          },
          {
            type: "paragraph",
            text: "This is extremely useful, but it has a limitation. A right triangle naturally contains one right angle and two acute angles. Therefore, the basic right-triangle picture does not directly represent an angle such as \\(120^\\circ\\), \\(200^\\circ\\) or \\(-45^\\circ\\).",
            id: "why-right-triangles-are-not-enough-paragraph-2"
          },
          {
            type: "paragraph",
            text: "However, these angles are perfectly meaningful. We can rotate a line through \\(120^\\circ\\), continue the rotation to \\(200^\\circ\\), or rotate clockwise through \\(-45^\\circ\\). Mathematics needs a way to assign trigonometric values to all of these angles.",
            id: "why-right-triangles-are-not-enough-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The solution is to move from a triangle-only viewpoint to a coordinate-plane viewpoint. A right triangle will still be present in the background, but now the position of a point and the signs of its coordinates will allow us to describe the trigonometric ratios for angles of any size.",
            id: "why-right-triangles-are-not-enough-paragraph-4"
          },
          {
            type: "paragraph",
            text: "This is an important transition in trigonometry: the ratios that we first learned from triangles can now be understood as quantities associated with angles themselves.",
            id: "why-right-triangles-are-not-enough-paragraph-5"
          }
        ]
      },
      {
        id: "angles-in-standard-position",
        title: "Angles in Standard Position",
        content: [
          {
            type: "paragraph",
            text: "To study an angle using the coordinate plane, we need a consistent way to place it. This standard arrangement is called standard position.",
            id: "angles-in-standard-position-paragraph-1"
          },
          {
            type: "paragraph",
            text: "An angle is in standard position when its vertex is placed at the origin of the coordinate plane and its initial side lies along the positive x-axis.",
            id: "angles-in-standard-position-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The side where the angle begins is called the initial side. The side where the rotation ends is called the terminal side.",
            id: "angles-in-standard-position-paragraph-3"
          },
          {
            type: "paragraph",
            text: "For example, imagine a ray starting at the origin and pointing directly to the right along the positive x-axis. If we rotate this ray counterclockwise through \\(60^\\circ\\), the final ray is the terminal side of the \\(60^\\circ\\) angle.",
            id: "angles-in-standard-position-paragraph-4"
          },
          {
            type: "paragraph",
            text: "This setup lets us talk about angles larger than \\(90^\\circ\\) as well. We simply continue rotating the terminal side.",
            id: "angles-in-standard-position-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Counterclockwise rotation represents a positive angle. Clockwise rotation represents a negative angle. This convention allows positive and negative angles to be represented consistently on the same coordinate plane.",
            id: "angles-in-standard-position-paragraph-6"
          }
        ]
      },
      {
        id: "positive-and-negative-angles",
        title: "Positive and Negative Angles",
        content: [
          {
            type: "paragraph",
            text: "The direction in which we rotate determines whether an angle is positive or negative.",
            id: "positive-and-negative-angles-paragraph-1"
          },
          {
            type: "paragraph",
            text: "A positive angle is created by rotating counterclockwise from the positive x-axis. For example, \\(90^\\circ\\) means a counterclockwise quarter-turn.",
            id: "positive-and-negative-angles-paragraph-2"
          },
          {
            type: "paragraph",
            text: "A negative angle is created by rotating clockwise from the positive x-axis. For example, \\(-90^\\circ\\) means a clockwise quarter-turn.",
            id: "positive-and-negative-angles-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The negative sign does not mean that the angle has a negative physical size or that a length has become negative. It tells us the direction of rotation.",
            id: "positive-and-negative-angles-paragraph-4"
          },
          {
            type: "paragraph",
            text: "For example, \\(-30^\\circ\\) means rotate \\(30^\\circ\\) clockwise. Similarly, \\(-120^\\circ\\) means rotate \\(120^\\circ\\) clockwise.",
            id: "positive-and-negative-angles-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Thinking of angles as rotations makes negative angles much easier to understand than treating the minus sign as a purely algebraic symbol.",
            id: "positive-and-negative-angles-paragraph-6"
          }
        ]
      },
      {
        id: "coordinate-plane-basics",
        title: "The Coordinate Plane",
        content: [
          {
            type: "paragraph",
            text: "The coordinate plane consists of two perpendicular number lines. The horizontal line is the x-axis and the vertical line is the y-axis. They meet at the origin, written as \\((0,0)\\).",
            id: "coordinate-plane-basics-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Every point on the plane can be described using an ordered pair \\((x,y)\\). The first number tells us how far the point is horizontally from the y-axis, while the second tells us how far it is vertically from the x-axis.",
            id: "coordinate-plane-basics-paragraph-2"
          },
          {
            type: "paragraph",
            text: "A positive x-coordinate means the point is to the right of the y-axis, while a negative x-coordinate means it is to the left.",
            id: "coordinate-plane-basics-paragraph-3"
          },
          {
            type: "paragraph",
            text: "A positive y-coordinate means the point is above the x-axis, while a negative y-coordinate means it is below.",
            id: "coordinate-plane-basics-paragraph-4"
          },
          {
            type: "paragraph",
            text: "These signs become extremely important when we define trigonometric ratios for angles outside the first quadrant.",
            id: "coordinate-plane-basics-paragraph-5"
          }
        ]
      },
      {
        id: "point-on-terminal-side",
        title: "A Point on the Terminal Side",
        content: [
          {
            type: "paragraph",
            text: "Suppose an angle \\(\\theta\\) is in standard position and its terminal side passes through a point \\(P(x,y)\\) that is not the origin.",
            id: "point-on-terminal-side-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Draw a perpendicular line from \\(P\\) to the x-axis. This creates a right triangle whose horizontal leg is related to \\(x\\), whose vertical leg is related to \\(y\\), and whose hypotenuse is the distance from the origin to \\(P\\).",
            id: "point-on-terminal-side-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Let \\(r\\) represent this distance from the origin to \\(P\\). Since \\(r\\) is a length, it is always positive.",
            id: "point-on-terminal-side-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The important idea is that the familiar right triangle has not disappeared. Instead, it has been placed inside the coordinate-plane picture. The coordinates tell us which directions the horizontal and vertical sides point.",
            id: "point-on-terminal-side-paragraph-4"
          },
          {
            type: "paragraph",
            text: "This allows us to use the familiar ideas of opposite, adjacent and hypotenuse while also keeping track of positive and negative coordinates.",
            id: "point-on-terminal-side-paragraph-5"
          }
        ]
      },
      {
        id: "distance-r",
        title: "Finding the Distance \\(r\\)",
        content: [
          {
            type: "paragraph",
            text: "If the terminal side passes through \\(P(x,y)\\), the distance from the origin to \\(P\\) is called \\(r\\).",
            id: "distance-r-paragraph-1"
          },
          {
            type: "paragraph",
            text: "The horizontal and vertical distances form the two legs of a right triangle, so the Pythagorean theorem can be used to find \\(r\\).",
            id: "distance-r-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The Pythagorean theorem gives the relationship \\(r^2=x^2+y^2\\).",
            id: "distance-r-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Taking the positive square root gives \\(r=\\sqrt{x^2+y^2}\\). We choose the positive root because \\(r\\) represents a distance, and distances are not negative.",
            id: "distance-r-paragraph-4"
          },
          {
            type: "paragraph",
            text: "For example, if \\(P=(3,4)\\), then \\(r=\\sqrt{3^2+4^2}=\\sqrt{25}=5\\).",
            id: "distance-r-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Notice that even if \\(x\\) or \\(y\\) is negative, its square is positive. For example, if \\(P=(-3,4)\\), then \\(r=\\sqrt{(-3)^2+4^2}=5\\).",
            id: "distance-r-paragraph-6"
          }
        ]
      },
      {
        id: "coordinate-definition-of-sine",
        title: "Defining Sine for Any Angle",
        content: [
          {
            type: "paragraph",
            text: "Recall the right-triangle definition of sine: sine compares the opposite side with the hypotenuse.",
            id: "coordinate-definition-of-sine-paragraph-1"
          },
          {
            type: "paragraph",
            text: "In the coordinate-plane picture, the vertical side of the right triangle is associated with the y-coordinate, while the hypotenuse is \\(r\\).",
            id: "coordinate-definition-of-sine-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Therefore, sine can be defined using the coordinates of a point on the terminal side.",
            id: "coordinate-definition-of-sine-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The definition is \\(\\sin(\\theta)=\\frac{y}{r}\\).",
            id: "coordinate-definition-of-sine-paragraph-4"
          },
          {
            type: "paragraph",
            text: "This definition explains something that the basic right-triangle picture could not explain by itself: sine can be negative. If the terminal side lies below the x-axis, then \\(y\\) is negative, so \\(y/r\\) is negative.",
            id: "coordinate-definition-of-sine-paragraph-5"
          },
          {
            type: "paragraph",
            text: "For example, if \\(P=(-3,-4)\\), then \\(r=5\\) and \\(\\sin(\\theta)=-\\frac{4}{5}\\). The negative value comes from the negative y-coordinate.",
            id: "coordinate-definition-of-sine-paragraph-6"
          }
        ]
      },
      {
        id: "coordinate-definition-of-cosine",
        title: "Defining Cosine for Any Angle",
        content: [
          {
            type: "paragraph",
            text: "Recall that cosine compares the adjacent side with the hypotenuse.",
            id: "coordinate-definition-of-cosine-paragraph-1"
          },
          {
            type: "paragraph",
            text: "In the coordinate-plane picture, the horizontal side of the right triangle is associated with the x-coordinate, while the hypotenuse is \\(r\\).",
            id: "coordinate-definition-of-cosine-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Therefore, cosine can be defined using the coordinates of a point on the terminal side.",
            id: "coordinate-definition-of-cosine-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The definition is \\(\\cos(\\theta)=\\frac{x}{r}\\).",
            id: "coordinate-definition-of-cosine-paragraph-4"
          },
          {
            type: "paragraph",
            text: "This explains why cosine can be negative. If the terminal side lies to the left of the y-axis, then \\(x\\) is negative, while \\(r\\) remains positive.",
            id: "coordinate-definition-of-cosine-paragraph-5"
          },
          {
            type: "paragraph",
            text: "For example, if \\(P=(-3,4)\\), then \\(r=5\\) and \\(\\cos(\\theta)=-\\frac{3}{5}\\).",
            id: "coordinate-definition-of-cosine-paragraph-6"
          }
        ]
      },
      {
        id: "coordinate-definition-of-tangent",
        title: "Defining Tangent for Any Angle",
        content: [
          {
            type: "paragraph",
            text: "Recall that tangent compares the opposite side with the adjacent side.",
            id: "coordinate-definition-of-tangent-paragraph-1"
          },
          {
            type: "paragraph",
            text: "In the coordinate-plane picture, these two sides correspond to the y-coordinate and x-coordinate.",
            id: "coordinate-definition-of-tangent-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Therefore, tangent can be defined as \\(\\tan(\\theta)=\\frac{y}{x}\\), provided \\(x\\neq0\\).",
            id: "coordinate-definition-of-tangent-paragraph-3"
          },
          {
            type: "paragraph",
            text: "This definition also explains why tangent can be negative. If \\(x\\) and \\(y\\) have opposite signs, their quotient is negative.",
            id: "coordinate-definition-of-tangent-paragraph-4"
          },
          {
            type: "paragraph",
            text: "For example, if \\(P=(-3,4)\\), then \\(\\tan(\\theta)=\\frac{4}{-3}=-\\frac{4}{3}\\).",
            id: "coordinate-definition-of-tangent-paragraph-5"
          },
          {
            type: "paragraph",
            text: "If \\(x=0\\), the expression \\(y/x\\) would require division by zero. Division by zero is undefined, which explains why tangent is undefined when the terminal side lies on the y-axis.",
            id: "coordinate-definition-of-tangent-paragraph-6"
          }
        ]
      },
      {
        id: "connection-to-soh-cahtoa",
        title: "Connecting the Coordinate Definitions to SOH-CAH-TOA",
        content: [
          {
            type: "paragraph",
            text: "The coordinate definitions are not completely new formulas. They are the familiar SOH-CAH-TOA relationships expressed in a more general setting.",
            id: "connection-to-soh-cahtoa-paragraph-1"
          },
          {
            type: "paragraph",
            text: "SOH tells us that sine compares opposite with hypotenuse. In the coordinate picture, this becomes \\(y/r\\).",
            id: "connection-to-soh-cahtoa-paragraph-2"
          },
          {
            type: "paragraph",
            text: "CAH tells us that cosine compares adjacent with hypotenuse. In the coordinate picture, this becomes \\(x/r\\).",
            id: "connection-to-soh-cahtoa-paragraph-3"
          },
          {
            type: "paragraph",
            text: "TOA tells us that tangent compares opposite with adjacent. In the coordinate picture, this becomes \\(y/x\\).",
            id: "connection-to-soh-cahtoa-paragraph-4"
          },
          {
            type: "paragraph",
            text: "The major new idea is not the ratio itself. The new idea is that \\(x\\) and \\(y\\) can be positive or negative depending on where the terminal side lies.",
            id: "connection-to-soh-cahtoa-paragraph-5"
          },
          {
            type: "paragraph",
            text: "This is what allows the same basic trigonometric relationships to work for angles in every quadrant.",
            id: "connection-to-soh-cahtoa-paragraph-6"
          }
        ]
      },
      {
        id: "four-quadrants",
        title: "The Four Quadrants",
        content: [
          {
            type: "paragraph",
            text: "The x-axis and y-axis divide the coordinate plane into four regions called quadrants.",
            id: "four-quadrants-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Quadrant I is the region above the x-axis and to the right of the y-axis. Both \\(x\\) and \\(y\\) are positive there.",
            id: "four-quadrants-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Quadrant II is above the x-axis and to the left of the y-axis. Here \\(x\\) is negative and \\(y\\) is positive.",
            id: "four-quadrants-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Quadrant III is below the x-axis and to the left of the y-axis. Both \\(x\\) and \\(y\\) are negative.",
            id: "four-quadrants-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Quadrant IV is below the x-axis and to the right of the y-axis. Here \\(x\\) is positive and \\(y\\) is negative.",
            id: "four-quadrants-paragraph-5"
          },
          {
            type: "paragraph",
            text: "When an angle is in standard position, the quadrant containing its terminal side tells us the signs of \\(x\\) and \\(y\\) and therefore the signs of sine, cosine and tangent.",
            id: "four-quadrants-paragraph-6"
          }
        ]
      },
      {
        id: "trigonometric-signs-by-quadrant",
        title: "Why Trigonometric Ratios Change Sign",
        content: [
          {
            type: "paragraph",
            text: "Because \\(r\\) is always positive, the sign of sine depends entirely on the sign of \\(y\\). If \\(y\\) is positive, sine is positive. If \\(y\\) is negative, sine is negative.",
            id: "trigonometric-signs-by-quadrant-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Similarly, the sign of cosine depends on \\(x\\) because \\(\\cos(\\theta)=x/r\\). Positive \\(x\\) gives positive cosine, while negative \\(x\\) gives negative cosine.",
            id: "trigonometric-signs-by-quadrant-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Tangent is different because it uses \\(y/x\\). Its sign depends on whether \\(x\\) and \\(y\\) have the same sign or opposite signs.",
            id: "trigonometric-signs-by-quadrant-paragraph-3"
          },
          {
            type: "paragraph",
            text: "In Quadrant I, \\(x\\) and \\(y\\) are both positive. Therefore sine, cosine and tangent are all positive.",
            id: "trigonometric-signs-by-quadrant-paragraph-4"
          },
          {
            type: "paragraph",
            text: "In Quadrant II, \\(y\\) is positive and \\(x\\) is negative. Therefore sine is positive, cosine is negative and tangent is negative.",
            id: "trigonometric-signs-by-quadrant-paragraph-5"
          },
          {
            type: "paragraph",
            text: "In Quadrant III, \\(x\\) and \\(y\\) are both negative. Therefore sine and cosine are negative, while tangent is positive because a negative divided by a negative is positive.",
            id: "trigonometric-signs-by-quadrant-paragraph-6"
          },
          {
            type: "paragraph",
            text: "In Quadrant IV, \\(x\\) is positive and \\(y\\) is negative. Therefore sine and tangent are negative, while cosine is positive.",
            id: "trigonometric-signs-by-quadrant-paragraph-7"
          }
        ]
      },
      {
        id: "cast-astc-rule",
        title: "CAST / ASTC: A Memory Aid",
        content: [
          {
            type: "paragraph",
            text: "The sign pattern can be remembered using the mnemonic CAST, or equivalently ASTC depending on the order in which it is taught.",
            id: "cast-astc-rule-paragraph-1"
          },
          {
            type: "paragraph",
            text: "CAST can be read as: All, Sine, Tangent, Cosine.",
            id: "cast-astc-rule-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Starting in Quadrant IV and moving counterclockwise, the mnemonic indicates which basic trigonometric ratios are positive. In Quadrant I, All are positive. In Quadrant II, Sine is positive. In Quadrant III, Tangent is positive. In Quadrant IV, Cosine is positive.",
            id: "cast-astc-rule-paragraph-3"
          },
          {
            type: "paragraph",
            text: "This is useful when solving problems because once you identify the quadrant, you can quickly determine the sign of the required ratio.",
            id: "cast-astc-rule-paragraph-4"
          },
          {
            type: "paragraph",
            text: "However, CAST should be treated as a memory shortcut rather than the reason the signs occur. The real reason comes from the signs of \\(x\\) and \\(y\\) in the coordinate definitions.",
            id: "cast-astc-rule-paragraph-5"
          }
        ]
      },
      {
        id: "reference-angle-introduction",
        title: "What Is a Reference Angle?",
        content: [
          {
            type: "paragraph",
            text: "Angles in different quadrants can look very different, but their trigonometric ratios are closely related to ratios from acute angles.",
            id: "reference-angle-introduction-paragraph-1"
          },
          {
            type: "paragraph",
            text: "A reference angle is the positive acute angle between the terminal side of an angle and the x-axis.",
            id: "reference-angle-introduction-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The reference angle is always between \\(0^\\circ\\) and \\(90^\\circ\\) for a non-axis angle.",
            id: "reference-angle-introduction-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The purpose of a reference angle is to reduce a complicated angle to a familiar acute angle. Once we know the reference angle, we can use the corresponding acute-angle trigonometric relationship and then determine the correct sign from the quadrant.",
            id: "reference-angle-introduction-paragraph-4"
          },
          {
            type: "paragraph",
            text: "For example, \\(150^\\circ\\) lies in Quadrant II. Its terminal side is \\(30^\\circ\\) away from the negative x-axis, so its reference angle is \\(30^\\circ\\).",
            id: "reference-angle-introduction-paragraph-5"
          },
          {
            type: "paragraph",
            text: "The reference angle gives us the acute-angle magnitude associated with the ratio. The quadrant tells us whether the final value is positive or negative.",
            id: "reference-angle-introduction-paragraph-6"
          }
        ]
      },
      {
        id: "finding-reference-angle-quadrant-one",
        title: "Reference Angles in Quadrant I",
        content: [
          {
            type: "paragraph",
            text: "In Quadrant I, the angle itself is already acute. Therefore, the reference angle is simply the original angle.",
            id: "finding-reference-angle-quadrant-one-paragraph-1"
          },
          {
            type: "paragraph",
            text: "For example, if \\(\\theta=40^\\circ\\), the angle is already between \\(0^\\circ\\) and \\(90^\\circ\\), so its reference angle is \\(40^\\circ\\).",
            id: "finding-reference-angle-quadrant-one-paragraph-2"
          },
          {
            type: "paragraph",
            text: "There is no subtraction required because the terminal side is already close to the positive x-axis.",
            id: "finding-reference-angle-quadrant-one-paragraph-3"
          },
          {
            type: "paragraph",
            text: "This is the simplest reference-angle case.",
            id: "finding-reference-angle-quadrant-one-paragraph-4"
          }
        ]
      },
      {
        id: "finding-reference-angle-quadrant-two",
        title: "Reference Angles in Quadrant II",
        content: [
          {
            type: "paragraph",
            text: "In Quadrant II, angles lie between \\(90^\\circ\\) and \\(180^\\circ\\). The reference angle is measured from the terminal side to the negative x-axis.",
            id: "finding-reference-angle-quadrant-two-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Since the angle from the positive x-axis to the negative x-axis is \\(180^\\circ\\), we subtract the given angle from \\(180^\\circ\\).",
            id: "finding-reference-angle-quadrant-two-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Therefore, for a Quadrant II angle \\(\\theta\\), the reference angle is \\(180^\\circ-\\theta\\).",
            id: "finding-reference-angle-quadrant-two-paragraph-3"
          },
          {
            type: "paragraph",
            text: "For example, for \\(120^\\circ\\), the reference angle is \\(180^\\circ-120^\\circ=60^\\circ\\).",
            id: "finding-reference-angle-quadrant-two-paragraph-4"
          },
          {
            type: "paragraph",
            text: "For \\(150^\\circ\\), the reference angle is \\(180^\\circ-150^\\circ=30^\\circ\\).",
            id: "finding-reference-angle-quadrant-two-paragraph-5"
          }
        ]
      },
      {
        id: "finding-reference-angle-quadrant-three",
        title: "Reference Angles in Quadrant III",
        content: [
          {
            type: "paragraph",
            text: "In Quadrant III, angles lie between \\(180^\\circ\\) and \\(270^\\circ\\). The reference angle is measured from the terminal side to the negative x-axis.",
            id: "finding-reference-angle-quadrant-three-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Because the angle has already passed \\(180^\\circ\\), we subtract \\(180^\\circ\\) from the given angle.",
            id: "finding-reference-angle-quadrant-three-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Therefore, for a Quadrant III angle \\(\\theta\\), the reference angle is \\(\\theta-180^\\circ\\).",
            id: "finding-reference-angle-quadrant-three-paragraph-3"
          },
          {
            type: "paragraph",
            text: "For example, for \\(210^\\circ\\), the reference angle is \\(210^\\circ-180^\\circ=30^\\circ\\).",
            id: "finding-reference-angle-quadrant-three-paragraph-4"
          },
          {
            type: "paragraph",
            text: "For \\(240^\\circ\\), the reference angle is \\(240^\\circ-180^\\circ=60^\\circ\\).",
            id: "finding-reference-angle-quadrant-three-paragraph-5"
          }
        ]
      },
      {
        id: "finding-reference-angle-quadrant-four",
        title: "Reference Angles in Quadrant IV",
        content: [
          {
            type: "paragraph",
            text: "In Quadrant IV, angles lie between \\(270^\\circ\\) and \\(360^\\circ\\). The reference angle is measured from the terminal side to the positive x-axis.",
            id: "finding-reference-angle-quadrant-four-paragraph-1"
          },
          {
            type: "paragraph",
            text: "A full rotation is \\(360^\\circ\\), so we subtract the given angle from \\(360^\\circ\\).",
            id: "finding-reference-angle-quadrant-four-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Therefore, for a Quadrant IV angle \\(\\theta\\), the reference angle is \\(360^\\circ-\\theta\\).",
            id: "finding-reference-angle-quadrant-four-paragraph-3"
          },
          {
            type: "paragraph",
            text: "For example, for \\(300^\\circ\\), the reference angle is \\(360^\\circ-300^\\circ=60^\\circ\\).",
            id: "finding-reference-angle-quadrant-four-paragraph-4"
          },
          {
            type: "paragraph",
            text: "For \\(315^\\circ\\), the reference angle is \\(360^\\circ-315^\\circ=45^\\circ\\).",
            id: "finding-reference-angle-quadrant-four-paragraph-5"
          }
        ]
      },
      {
        id: "negative-angles-and-reference-angles",
        title: "Reference Angles for Negative Angles",
        content: [
          {
            type: "paragraph",
            text: "Negative angles require one extra step because they represent clockwise rotation.",
            id: "negative-angles-and-reference-angles-paragraph-1"
          },
          {
            type: "paragraph",
            text: "A useful approach is to first find a positive coterminal angle between \\(0^\\circ\\) and \\(360^\\circ\\). Once that positive angle is known, we can identify its quadrant and find the reference angle normally.",
            id: "negative-angles-and-reference-angles-paragraph-2"
          },
          {
            type: "paragraph",
            text: "For example, consider \\(-45^\\circ\\). Add \\(360^\\circ\\) to obtain \\(315^\\circ\\). The angles \\(-45^\\circ\\) and \\(315^\\circ\\) have the same terminal side.",
            id: "negative-angles-and-reference-angles-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Since \\(315^\\circ\\) lies in Quadrant IV, its reference angle is \\(360^\\circ-315^\\circ=45^\\circ\\).",
            id: "negative-angles-and-reference-angles-paragraph-4"
          },
          {
            type: "paragraph",
            text: "This method turns a negative-angle problem into an ordinary positive-angle problem.",
            id: "negative-angles-and-reference-angles-paragraph-5"
          }
        ]
      },
      {
        id: "coterminal-angles",
        title: "Coterminal Angles",
        content: [
          {
            type: "paragraph",
            text: "Two angles are called coterminal when they have the same initial side and the same terminal side.",
            id: "coterminal-angles-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Imagine rotating through an angle and then making one complete additional revolution. The terminal side returns to exactly the same position.",
            id: "coterminal-angles-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Since one complete revolution is \\(360^\\circ\\), adding or subtracting \\(360^\\circ\\) produces another angle with the same terminal side.",
            id: "coterminal-angles-paragraph-3"
          },
          {
            type: "paragraph",
            text: "For example, \\(45^\\circ\\) and \\(405^\\circ\\) are coterminal because \\(405^\\circ=45^\\circ+360^\\circ\\).",
            id: "coterminal-angles-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Similarly, \\(45^\\circ\\) and \\(-315^\\circ\\) are coterminal because \\(-315^\\circ+360^\\circ=45^\\circ\\).",
            id: "coterminal-angles-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Because coterminal angles have the same terminal side, their trigonometric ratios have the same values.",
            id: "coterminal-angles-paragraph-6"
          }
        ]
      },
      {
        id: "using-reference-angle-and-quadrant",
        title: "Reference Angle + Quadrant = Trigonometric Value",
        content: [
          {
            type: "paragraph",
            text: "The most important practical use of reference angles is that they separate a problem into two simpler questions.",
            id: "using-reference-angle-and-quadrant-paragraph-1"
          },
          {
            type: "paragraph",
            text: "First, the reference angle tells us which familiar acute angle is involved. Second, the quadrant tells us whether the trigonometric ratio should be positive or negative.",
            id: "using-reference-angle-and-quadrant-paragraph-2"
          },
          {
            type: "paragraph",
            text: "For example, consider \\(150^\\circ\\). The angle lies in Quadrant II, and its reference angle is \\(30^\\circ\\).",
            id: "using-reference-angle-and-quadrant-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The reference angle tells us to use the \\(30^\\circ\\) trigonometric relationship. The quadrant tells us the sign. Since sine is positive in Quadrant II, the sine of \\(150^\\circ\\) has the same magnitude as the sine associated with \\(30^\\circ\\) but is positive.",
            id: "using-reference-angle-and-quadrant-paragraph-4"
          },
          {
            type: "paragraph",
            text: "For cosine, the same reference angle is used, but cosine is negative in Quadrant II. Therefore, the cosine value has the corresponding \\(30^\\circ\\) magnitude with a negative sign.",
            id: "using-reference-angle-and-quadrant-paragraph-5"
          },
          {
            type: "paragraph",
            text: "This idea will become especially useful when we later study exact trigonometric values.",
            id: "using-reference-angle-and-quadrant-paragraph-6"
          }
        ]
      },
      {
        id: "worked-strategy-for-any-angle",
        title: "A General Strategy for Any-Angle Problems",
        content: [
          {
            type: "paragraph",
            text: "When working with a trigonometric ratio for an angle outside the first quadrant, avoid trying to memorise a separate rule for every possible angle.",
            id: "worked-strategy-for-any-angle-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Step 1: Place the angle in standard position and identify its quadrant.",
            id: "worked-strategy-for-any-angle-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Step 2: Determine whether the angle is positive or negative and, if necessary, find a positive coterminal angle.",
            id: "worked-strategy-for-any-angle-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Step 3: Find the reference angle.",
            id: "worked-strategy-for-any-angle-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Step 4: Determine the sign of the required trigonometric ratio from the quadrant.",
            id: "worked-strategy-for-any-angle-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Step 5: Use the reference angle to determine the corresponding magnitude.",
            id: "worked-strategy-for-any-angle-paragraph-6"
          },
          {
            type: "paragraph",
            text: "This approach turns an unfamiliar angle into a familiar acute-angle problem plus a sign decision.",
            id: "worked-strategy-for-any-angle-paragraph-7"
          }
        ]
      },
      {
        id: "special-axis-angles",
        title: "Angles on the Axes",
        content: [
          {
            type: "paragraph",
            text: "Not every angle lies inside a quadrant. Some angles place the terminal side directly on one of the coordinate axes.",
            id: "special-axis-angles-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Examples include \\(0^\\circ\\), \\(90^\\circ\\), \\(180^\\circ\\), \\(270^\\circ\\) and \\(360^\\circ\\).",
            id: "special-axis-angles-paragraph-2"
          },
          {
            type: "paragraph",
            text: "At these positions, one of the coordinates \\(x\\) or \\(y\\) is zero.",
            id: "special-axis-angles-paragraph-3"
          },
          {
            type: "paragraph",
            text: "For example, on the positive x-axis, \\(y=0\\). Therefore sine is zero.",
            id: "special-axis-angles-paragraph-4"
          },
          {
            type: "paragraph",
            text: "On the positive y-axis, \\(x=0\\). Since tangent involves division by \\(x\\), tangent is undefined there.",
            id: "special-axis-angles-paragraph-5"
          },
          {
            type: "paragraph",
            text: "These axis cases are important because they show that the coordinate definitions naturally explain both zero values and undefined values.",
            id: "special-axis-angles-paragraph-6"
          }
        ]
      },
      {
        id: "big-picture-any-angle",
        title: "The Big Picture",
        content: [
          {
            type: "paragraph",
            text: "The transition from right-triangle trigonometry to any-angle trigonometry is not a completely new subject. It is an extension of the same relationships we already know.",
            id: "big-picture-any-angle-paragraph-1"
          },
          {
            type: "paragraph",
            text: "A right triangle is formed using a point on the terminal side of an angle. The coordinates of that point allow the familiar ratios to be written as \\(\\sin(\\theta)=y/r\\), \\(\\cos(\\theta)=x/r\\) and \\(\\tan(\\theta)=y/x\\).",
            id: "big-picture-any-angle-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Because \\(x\\) and \\(y\\) can be positive or negative, the trigonometric ratios can also be positive or negative.",
            id: "big-picture-any-angle-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The four quadrants provide a simple way to determine these signs. CAST or ASTC can be used as a memory aid, while the coordinate definitions explain why the pattern occurs.",
            id: "big-picture-any-angle-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Reference angles allow angles in other quadrants to be connected to familiar acute angles. Coterminal angles allow us to describe the same terminal side using many different angle measures.",
            id: "big-picture-any-angle-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Together, these ideas give us a complete foundation for working with trigonometric ratios beyond acute right-triangle problems.",
            id: "big-picture-any-angle-paragraph-6"
          }
        ]
      }
    ]
  },
  formulas: [
    {
      id: "coordinate-distance",
      name: "Distance from the Origin",
      expression: "\\[r=\\sqrt{x^2+y^2}\\]",
      explanation: "If a point \\((x,y)\\) lies on the terminal side of an angle, \\(r\\) is the distance from the origin to that point. It is found using the Pythagorean theorem and is always positive."
    },
    {
      id: "sine-coordinate-ratio",
      name: "Sine Using Coordinates",
      expression: "\\[\\sin(\\theta)=\\frac{y}{r}\\]",
      explanation: "The y-coordinate plays the role of the signed opposite side, while \\(r\\) is the positive hypotenuse length."
    },
    {
      id: "cosine-coordinate-ratio",
      name: "Cosine Using Coordinates",
      expression: "\\[\\cos(\\theta)=\\frac{x}{r}\\]",
      explanation: "The x-coordinate plays the role of the signed adjacent side, while \\(r\\) is the positive hypotenuse length."
    },
    {
      id: "tangent-coordinate-ratio",
      name: "Tangent Using Coordinates",
      expression: "\\[\\tan(\\theta)=\\frac{y}{x}\\]",
      explanation: "Tangent compares the vertical coordinate with the horizontal coordinate. It is defined only when \\(x\\neq0\\)."
    },
    {
      id: "quadrant-two-reference-angle",
      name: "Reference Angle in Quadrant II",
      expression: "\\[\\alpha=180^\\circ-\\theta\\]",
      explanation: "For an angle \\(\\theta\\) between \\(90^\\circ\\) and \\(180^\\circ\\), subtract \\(\\theta\\) from \\(180^\\circ\\) to find the acute reference angle."
    },
    {
      id: "quadrant-three-reference-angle",
      name: "Reference Angle in Quadrant III",
      expression: "\\[\\alpha=\\theta-180^\\circ\\]",
      explanation: "For an angle \\(\\theta\\) between \\(180^\\circ\\) and \\(270^\\circ\\), subtract \\(180^\\circ\\) from \\(\\theta\\) to find the acute reference angle."
    },
    {
      id: "quadrant-four-reference-angle",
      name: "Reference Angle in Quadrant IV",
      expression: "\\[\\alpha=360^\\circ-\\theta\\]",
      explanation: "For an angle \\(\\theta\\) between \\(270^\\circ\\) and \\(360^\\circ\\), subtract \\(\\theta\\) from \\(360^\\circ\\) to find the acute reference angle."
    },
    {
      id: "coterminal-angles",
      name: "Coterminal Angles",
      expression: "\\[\\theta_{\\text{coterminal}}=\\theta+360^\\circ k\\]",
      explanation: "Adding or subtracting any whole number of full rotations produces an angle with the same terminal side. Here \\(k\\) is any integer."
    }
  ],
  examples: [
    {
      id: "any-angle-example-1",
      question: "Explain why the right-triangle definitions of trigonometric ratios are not enough to describe every angle.",
      solution: "A right triangle contains one \\(90^\\circ\\) angle and two acute angles. Therefore, the triangle directly represents angles between \\(0^\\circ\\) and \\(90^\\circ\\), but not angles such as \\(120^\\circ\\), \\(210^\\circ\\) or \\(-45^\\circ\\). To extend trigonometry to these angles, we use the coordinate plane and define the ratios using a point on the terminal side."
    },
    {
      id: "any-angle-example-2",
      question: "Describe the angle \\(70^\\circ\\) in standard position.",
      solution: "The initial side lies along the positive x-axis. Since \\(70^\\circ\\) is positive, rotate counterclockwise by \\(70^\\circ\\). The terminal side lies between the positive x-axis and positive y-axis, so the angle lies in Quadrant I."
    },
    {
      id: "any-angle-example-3",
      question: "Describe the angle \\(-60^\\circ\\) in standard position.",
      solution: "The negative sign means clockwise rotation. Starting from the positive x-axis, rotate \\(60^\\circ\\) clockwise. The terminal side lies below the positive x-axis, so it is in Quadrant IV."
    },
    {
      id: "any-angle-example-4",
      question: "A point \\(P(3,4)\\) lies on the terminal side of an angle \\(\\theta\\). Find \\(r\\).",
      solution: "Use the Pythagorean theorem: \\[r=\\sqrt{x^2+y^2}.\\] Substitute \\(x=3\\) and \\(y=4\\): \\[r=\\sqrt{3^2+4^2}=\\sqrt{9+16}=\\sqrt{25}=5.\\] Therefore, \\(r=5\\)."
    },
    {
      id: "any-angle-example-5",
      question: "A point \\(P(3,4)\\) lies on the terminal side of \\(\\theta\\). Find \\(\\sin(\\theta)\\), \\(\\cos(\\theta)\\), and \\(\\tan(\\theta)\\).",
      solution: "First find \\(r=5\\). Then use the coordinate definitions. \\[\\sin(\\theta)=\\frac{y}{r}=\\frac{4}{5}.\\] \\[\\cos(\\theta)=\\frac{x}{r}=\\frac{3}{5}.\\] \\[\\tan(\\theta)=\\frac{y}{x}=\\frac{4}{3}.\\] Therefore, the three ratios are \\(4/5\\), \\(3/5\\) and \\(4/3\\)."
    },
    {
      id: "any-angle-example-6",
      question: "A point \\(P(-3,4)\\) lies on the terminal side of \\(\\theta\\). Find \\(r\\) and determine the signs of sine, cosine, and tangent.",
      solution: "First find \\(r\\): \\[r=\\sqrt{(-3)^2+4^2}=\\sqrt{9+16}=5.\\] The point has \\(x<0\\) and \\(y>0\\), so it lies in Quadrant II. Therefore sine is positive, cosine is negative, and tangent is negative."
    },
    {
      id: "any-angle-example-7",
      question: "A point \\(P(-5,-12)\\) lies on the terminal side of \\(\\theta\\). Find \\(r\\) and the signs of the three basic trigonometric ratios.",
      solution: "Calculate \\(r\\): \\[r=\\sqrt{(-5)^2+(-12)^2}=\\sqrt{25+144}=13.\\] Both \\(x\\) and \\(y\\) are negative, so the point lies in Quadrant III. Therefore sine is negative, cosine is negative, and tangent is positive."
    },
    {
      id: "any-angle-example-8",
      question: "In which quadrant does \\(120^\\circ\\) lie? What are the signs of sine, cosine, and tangent?",
      solution: "\\(120^\\circ\\) lies between \\(90^\\circ\\) and \\(180^\\circ\\), so it is in Quadrant II. In Quadrant II, sine is positive, while cosine and tangent are negative."
    },
    {
      id: "any-angle-example-9",
      question: "In which quadrant does \\(240^\\circ\\) lie? What are the signs of sine, cosine, and tangent?",
      solution: "\\(240^\\circ\\) lies between \\(180^\\circ\\) and \\(270^\\circ\\), so it is in Quadrant III. In Quadrant III, both \\(x\\) and \\(y\\) are negative. Therefore sine and cosine are negative, while tangent is positive."
    },
    {
      id: "any-angle-example-10",
      question: "In which quadrant does \\(315^\\circ\\) lie? What are the signs of sine, cosine, and tangent?",
      solution: "\\(315^\\circ\\) lies between \\(270^\\circ\\) and \\(360^\\circ\\), so it is in Quadrant IV. Here \\(x\\) is positive and \\(y\\) is negative. Therefore cosine is positive, while sine and tangent are negative."
    },
    {
      id: "any-angle-example-11",
      question: "Find the reference angle of \\(40^\\circ\\).",
      solution: "\\(40^\\circ\\) lies in Quadrant I and is already acute. Therefore, the reference angle is simply \\(40^\\circ\\)."
    },
    {
      id: "any-angle-example-12",
      question: "Find the reference angle of \\(120^\\circ\\).",
      solution: "\\(120^\\circ\\) lies in Quadrant II. For Quadrant II, subtract the angle from \\(180^\\circ\\): \\[180^\\circ-120^\\circ=60^\\circ.\\] Therefore, the reference angle is \\(60^\\circ\\)."
    },
    {
      id: "any-angle-example-13",
      question: "Find the reference angle of \\(150^\\circ\\).",
      solution: "\\(150^\\circ\\) is in Quadrant II. Therefore: \\[180^\\circ-150^\\circ=30^\\circ.\\] The reference angle is \\(30^\\circ\\)."
    },
    {
      id: "any-angle-example-14",
      question: "Find the reference angle of \\(210^\\circ\\).",
      solution: "\\(210^\\circ\\) lies in Quadrant III. Subtract \\(180^\\circ\\): \\[210^\\circ-180^\\circ=30^\\circ.\\] Therefore, the reference angle is \\(30^\\circ\\)."
    },
    {
      id: "any-angle-example-15",
      question: "Find the reference angle of \\(240^\\circ\\).",
      solution: "\\(240^\\circ\\) lies in Quadrant III. Therefore: \\[240^\\circ-180^\\circ=60^\\circ.\\] The reference angle is \\(60^\\circ\\)."
    },
    {
      id: "any-angle-example-16",
      question: "Find the reference angle of \\(300^\\circ\\).",
      solution: "\\(300^\\circ\\) lies in Quadrant IV. Therefore subtract it from \\(360^\\circ\\): \\[360^\\circ-300^\\circ=60^\\circ.\\] The reference angle is \\(60^\\circ\\)."
    },
    {
      id: "any-angle-example-17",
      question: "Find the reference angle of \\(315^\\circ\\).",
      solution: "\\(315^\\circ\\) lies in Quadrant IV. Therefore: \\[360^\\circ-315^\\circ=45^\\circ.\\] The reference angle is \\(45^\\circ\\)."
    },
    {
      id: "any-angle-example-18",
      question: "Find a positive coterminal angle for \\(-45^\\circ\\) and then find its reference angle.",
      solution: "Add \\(360^\\circ\\) to \\(-45^\\circ\\): \\[-45^\\circ+360^\\circ=315^\\circ.\\] Therefore, \\(315^\\circ\\) is a positive coterminal angle. Since \\(315^\\circ\\) lies in Quadrant IV, its reference angle is \\[360^\\circ-315^\\circ=45^\\circ.\\]"
    },
    {
      id: "any-angle-example-19",
      question: "Give two angles coterminal with \\(45^\\circ\\).",
      solution: "Add and subtract \\(360^\\circ\\). \\[45^\\circ+360^\\circ=405^\\circ\\] and \\[45^\\circ-360^\\circ=-315^\\circ.\\] Therefore, \\(405^\\circ\\) and \\(-315^\\circ\\) are both coterminal with \\(45^\\circ\\)."
    },
    {
      id: "any-angle-example-20",
      question: "A point \\(P(-3,4)\\) lies on the terminal side of \\(\\theta\\). Find all three basic trigonometric ratios.",
      solution: "First find \\(r\\): \\[r=\\sqrt{(-3)^2+4^2}=5.\\] Then: \\[\\sin(\\theta)=\\frac{4}{5},\\qquad\\cos(\\theta)=-\\frac{3}{5},\\qquad\\tan(\\theta)=-\\frac{4}{3}.\\] Therefore sine is positive, cosine is negative, and tangent is negative."
    },
    {
      id: "any-angle-example-21",
      question: "A point \\(P(4,-3)\\) lies on the terminal side of \\(\\theta\\). Find all three basic trigonometric ratios.",
      solution: "First calculate \\(r\\): \\[r=\\sqrt{4^2+(-3)^2}=5.\\] Then: \\[\\sin(\\theta)=-\\frac{3}{5},\\qquad\\cos(\\theta)=\\frac{4}{5},\\qquad\\tan(\\theta)=-\\frac{3}{4}.\\] The point is in Quadrant IV, which agrees with the signs: sine and tangent are negative, while cosine is positive."
    },
    {
      id: "any-angle-example-22",
      question: "Explain why tangent is undefined when the terminal side lies on the y-axis.",
      solution: "If the terminal side lies on the y-axis, then \\(x=0\\). Since \\[\\tan(\\theta)=\\frac{y}{x},\\] the denominator becomes zero. Division by zero is undefined. Therefore tangent is undefined for these angles."
    },
    {
      id: "any-angle-example-23",
      question: "Explain why sine is zero when the terminal side lies on the x-axis.",
      solution: "When the terminal side lies on the x-axis, \\(y=0\\). Since \\[\\sin(\\theta)=\\frac{y}{r},\\] we get \\[\\sin(\\theta)=\\frac{0}{r}=0.\\] Therefore sine is zero."
    },
    {
      id: "any-angle-example-24",
      question: "For an angle of \\(150^\\circ\\), explain how the reference angle and quadrant work together.",
      solution: "First find the reference angle: \\[180^\\circ-150^\\circ=30^\\circ.\\] Therefore, \\(30^\\circ\\) gives the corresponding acute-angle magnitude. Next, identify the quadrant. \\(150^\\circ\\) lies in Quadrant II. In Quadrant II, sine is positive while cosine and tangent are negative. Thus the reference angle determines the magnitude pattern and the quadrant determines the sign."
    }
  ],
  key_ideas: [
    "Right-triangle definitions naturally describe acute angles, but trigonometry must also handle larger and negative angles.",
    "Standard position places the vertex at the origin and the initial side along the positive x-axis.",
    "Positive angles represent counterclockwise rotation.",
    "Negative angles represent clockwise rotation.",
    "A point on the terminal side can be written as \\((x,y)\\).",
    "The distance from the origin to \\((x,y)\\) is \\(r=\\sqrt{x^2+y^2}\\).",
    "The value of \\(r\\) is always positive because it represents a distance.",
    "For any angle, sine can be defined as \\(\\sin(\\theta)=y/r\\).",
    "For any angle, cosine can be defined as \\(\\cos(\\theta)=x/r\\).",
    "For any angle where \\(x\\neq0\\), tangent can be defined as \\(\\tan(\\theta)=y/x\\).",
    "The coordinate definitions are extensions of SOH-CAH-TOA.",
    "Sine depends on the sign of \\(y\\).",
    "Cosine depends on the sign of \\(x\\).",
    "Tangent depends on the relative signs of \\(x\\) and \\(y\\).",
    "All three basic ratios are positive in Quadrant I.",
    "Only sine is positive in Quadrant II.",
    "Only tangent is positive in Quadrant III.",
    "Only cosine is positive in Quadrant IV.",
    "CAST or ASTC can be used as a memory aid for the sign pattern.",
    "The coordinate signs provide the reason behind the CAST pattern.",
    "A reference angle is the positive acute angle between the terminal side and the x-axis.",
    "The reference angle provides the corresponding acute-angle magnitude.",
    "The quadrant determines the sign of the trigonometric ratio.",
    "Angles that differ by multiples of \\(360^\\circ\\) are coterminal.",
    "Coterminal angles have the same terminal side.",
    "Negative angles can be converted to positive coterminal angles by adding \\(360^\\circ\\) when appropriate.",
    "Tangent is undefined when \\(x=0\\).",
    "Sine is zero when \\(y=0\\).",
    "Cosine is zero when \\(x=0\\).",
    "Any-angle trigonometry extends the same fundamental side relationships rather than replacing them."
  ],
  misconceptions: [
    "Trigonometric ratios are not restricted to angles between \\(0^\\circ\\) and \\(90^\\circ\\).",
    "A negative angle represents clockwise rotation; it does not mean that an angle has a negative physical length.",
    "The negative signs of \\(x\\) and \\(y\\) are coordinate signs, not negative triangle side lengths.",
    "The value of \\(r\\) is always positive because \\(r\\) represents a distance.",
    "Sine is not always positive.",
    "Cosine is not always positive.",
    "Tangent can be positive in Quadrant III because both \\(x\\) and \\(y\\) are negative.",
    "CAST or ASTC is a memory aid and not the fundamental reason for the signs.",
    "The reference angle is always acute for a non-axis angle.",
    "The reference angle is not the same as the original angle in most quadrants.",
    "The quadrant determines the sign; the reference angle does not determine the sign by itself.",
    "A reference angle is not found by simply taking the absolute value of the original angle.",
    "Angles greater than \\(360^\\circ\\) are valid angles; they represent more than one complete rotation.",
    "Negative angles can be coterminal with positive angles.",
    "Coterminal angles are different angle measures but share the same terminal side.",
    "Tangent is not defined when \\(x=0\\) because division by zero is undefined.",
    "Sine is zero on the x-axis because \\(y=0\\).",
    "Cosine is zero on the y-axis because \\(x=0\\).",
    "The coordinate-plane definitions do not contradict SOH-CAH-TOA; they extend it.",
    "A point with negative coordinates does not mean the associated triangle has negative side lengths.",
    "The terminal side, not the initial side, determines the quadrant of an angle.",
    "A negative angle should not automatically be treated as being in Quadrant IV without considering its actual rotation.",
    "When using a reference angle, the original quadrant must still be identified before assigning a sign."
  ],
  explorations: [
    {
      id: "visualize-standard-position",
      type: "visualization"
    },
    {
      id: "visualize-four-quadrants",
      type: "visualization"
    },
    {
      id: "visualize-trig-signs-by-quadrant",
      type: "visualization"
    },
    {
      id: "visualize-positive-negative-angles",
      type: "visualization"
    },
    {
      id: "visualize-reference-angles",
      type: "visualization"
    },
    {
      id: "explore-coordinate-trig-ratios",
      type: "experiment"
    },
    {
      id: "explore-coterminal-angles",
      type: "experiment"
    },
    {
      id: "explore-reference-angle-and-sign",
      type: "experiment"
    },
    {
      id: "why-trig-values-change-sign",
      type: "why"
    },
    {
      id: "why-reference-angles-work",
      type: "why"
    },
    {
      id: "deeper-coordinate-definition-of-trig",
      type: "go-deeper"
    }
  ],
  sources: [
    "khan-academy-trigonometry",
    "openstax-precalculus"
  ]
};

// ../content/concepts/trigonometric-ratios/04_exact-trigonometric-values.json
var exact_trigonometric_values_default = {
  id: "exact-trigonometric-values",
  title: "Exact Trigonometric Values",
  subject: "mathematics",
  topic: "trigonometry",
  section: "intro-trigono",
  difficulty: 2,
  connections: {
    prerequisites: [
      "trigonometric-ratios",
      "trigonometric-ratios-any-angle"
    ],
    leads_to: [
      "trigonometric-functions"
    ],
    related: [
      "reciprocal-trigonometric-ratios",
      "trigonometric-ratios-any-angle"
    ]
  },
  theory: {
    introduction: "When working with trigonometry, we often need the values of sine, cosine and tangent for certain important angles. A calculator can give decimal approximations, but sometimes we want the exact value instead. Exact trigonometric values are values written using fractions and radicals rather than rounded decimals. The most important angles are \\(0^\\circ\\), \\(30^\\circ\\), \\(45^\\circ\\), \\(60^\\circ\\) and \\(90^\\circ\\). These values are not random numbers to memorize. They can be derived from simple geometric shapes such as an equilateral triangle and an isosceles right triangle. Once these values are understood, reference angles and quadrant signs allow us to find exact trigonometric values for many other angles.",
    sections: [
      {
        id: "what-is-an-exact-value",
        title: "What Does Exact Value Mean?",
        content: [
          {
            type: "paragraph",
            text: "An exact value represents a quantity without rounding or approximation. For example, \\(\\frac{1}{2}\\) is an exact number, while \\(0.5\\) is its decimal representation.",
            id: "what-is-an-exact-value-paragraph-1"
          },
          {
            type: "paragraph",
            text: "In trigonometry, a calculator might tell us that \\(\\sin(30^\\circ)=0.5\\). Instead of writing the decimal, we can write the exact value \\(\\frac{1}{2}\\).",
            id: "what-is-an-exact-value-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Some trigonometric values contain square roots. For example, \\(\\sin(45^\\circ)=\\frac{\\sqrt{2}}{2}\\). This is an exact value even though its decimal representation is approximately \\(0.7071\\).",
            id: "what-is-an-exact-value-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The important difference is that an exact value does not involve rounding. A decimal such as \\(0.7071\\) is only an approximation of \\(\\frac{\\sqrt{2}}{2}\\).",
            id: "what-is-an-exact-value-paragraph-4"
          }
        ]
      },
      {
        id: "why-exact-values-matter",
        title: "Why Exact Values Matter",
        content: [
          {
            type: "paragraph",
            text: "Exact values are useful because they preserve complete mathematical information. If we round a value too early, small errors can appear in later calculations.",
            id: "why-exact-values-matter-paragraph-1"
          },
          {
            type: "paragraph",
            text: "For example, \\(\\frac{\\sqrt{2}}{2}\\) contains the complete value of \\(\\sin(45^\\circ)\\), while \\(0.707\\) is only an approximation.",
            id: "why-exact-values-matter-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Exact values are especially important in algebra, geometry and trigonometric equations because they allow expressions to be simplified symbolically.",
            id: "why-exact-values-matter-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The goal is therefore not simply to memorize a table. We want to understand where the values come from so that the table becomes logical rather than mysterious.",
            id: "why-exact-values-matter-paragraph-4"
          }
        ]
      },
      {
        id: "important-angles",
        title: "The Five Important Angles",
        content: [
          {
            type: "paragraph",
            text: "The most commonly used exact trigonometric angles are \\(0^\\circ\\), \\(30^\\circ\\), \\(45^\\circ\\), \\(60^\\circ\\) and \\(90^\\circ\\).",
            id: "important-angles-paragraph-1"
          },
          {
            type: "paragraph",
            text: "These angles are important because they occur naturally from simple geometric constructions and appear repeatedly in trigonometry.",
            id: "important-angles-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The angles \\(30^\\circ\\) and \\(60^\\circ\\) come from splitting an equilateral triangle into two right triangles.",
            id: "important-angles-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The angle \\(45^\\circ\\) comes from an isosceles right triangle, where the two acute angles must both be \\(45^\\circ\\).",
            id: "important-angles-paragraph-4"
          },
          {
            type: "paragraph",
            text: "The angles \\(0^\\circ\\) and \\(90^\\circ\\) can be understood naturally using the coordinate-plane definition of trigonometric ratios.",
            id: "important-angles-paragraph-5"
          }
        ]
      },
      {
        id: "derive-45-degree-triangle",
        title: "Deriving the \\(45^\\circ\\) Values",
        content: [
          {
            type: "paragraph",
            text: "To find the exact values for \\(45^\\circ\\), consider an isosceles right triangle. An isosceles triangle has two equal sides, and a right triangle has one angle of \\(90^\\circ\\).",
            id: "derive-45-degree-triangle-paragraph-1"
          },
          {
            type: "paragraph",
            text: "The two remaining angles must have equal measures because the triangle has two equal sides. Since the angles in a triangle add to \\(180^\\circ\\), the two acute angles must satisfy \\(\\theta+\\theta+90^\\circ=180^\\circ\\).",
            id: "derive-45-degree-triangle-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Therefore, \\(2\\theta=90^\\circ\\), so \\(\\theta=45^\\circ\\).",
            id: "derive-45-degree-triangle-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Let each of the equal legs have length \\(1\\). We now need to find the hypotenuse.",
            id: "derive-45-degree-triangle-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Using the Pythagorean theorem: \\[1^2+1^2=h^2\\]",
            id: "derive-45-degree-triangle-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Therefore, \\(2=h^2\\), giving \\(h=\\sqrt{2}\\).",
            id: "derive-45-degree-triangle-paragraph-6"
          },
          {
            type: "paragraph",
            text: "We now have a \\(45^\\circ-45^\\circ-90^\\circ\\) triangle with side lengths \\(1\\), \\(1\\) and \\(\\sqrt{2}\\).",
            id: "derive-45-degree-triangle-paragraph-7"
          }
        ]
      },
      {
        id: "sine-45",
        title: "Finding \\(\\sin(45^\\circ)\\)",
        content: [
          {
            type: "paragraph",
            text: "Using SOH-CAH-TOA, sine is opposite divided by hypotenuse.",
            id: "sine-45-paragraph-1"
          },
          {
            type: "paragraph",
            text: "In the \\(45^\\circ-45^\\circ-90^\\circ\\) triangle, the opposite side has length \\(1\\) and the hypotenuse has length \\(\\sqrt{2}\\).",
            id: "sine-45-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Therefore: \\[\\sin(45^\\circ)=\\frac{1}{\\sqrt{2}}\\]",
            id: "sine-45-paragraph-3"
          },
          {
            type: "paragraph",
            text: "We usually rationalize the denominator. Multiply the numerator and denominator by \\(\\sqrt{2}\\): \\[\\frac{1}{\\sqrt{2}}\\times\\frac{\\sqrt{2}}{\\sqrt{2}}=\\frac{\\sqrt{2}}{2}\\]",
            id: "sine-45-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Therefore, \\(\\sin(45^\\circ)=\\frac{\\sqrt{2}}{2}\\).",
            id: "sine-45-paragraph-5"
          }
        ]
      },
      {
        id: "cosine-45",
        title: "Finding \\(\\cos(45^\\circ)\\)",
        content: [
          {
            type: "paragraph",
            text: "Cosine is adjacent divided by hypotenuse.",
            id: "cosine-45-paragraph-1"
          },
          {
            type: "paragraph",
            text: "For a \\(45^\\circ-45^\\circ-90^\\circ\\) triangle, the adjacent leg has length \\(1\\), while the hypotenuse has length \\(\\sqrt{2}\\).",
            id: "cosine-45-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Therefore: \\[\\cos(45^\\circ)=\\frac{1}{\\sqrt{2}}=\\frac{\\sqrt{2}}{2}\\]",
            id: "cosine-45-paragraph-3"
          },
          {
            type: "paragraph",
            text: "This is the same as the sine value because the two legs of the triangle are equal.",
            id: "cosine-45-paragraph-4"
          }
        ]
      },
      {
        id: "tangent-45",
        title: "Finding \\(\\tan(45^\\circ)\\)",
        content: [
          {
            type: "paragraph",
            text: "Tangent is opposite divided by adjacent.",
            id: "tangent-45-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Both legs of the \\(45^\\circ-45^\\circ-90^\\circ\\) triangle have length \\(1\\).",
            id: "tangent-45-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Therefore: \\[\\tan(45^\\circ)=\\frac{1}{1}=1\\]",
            id: "tangent-45-paragraph-3"
          },
          {
            type: "paragraph",
            text: "So the three basic exact values at \\(45^\\circ\\) are \\(\\sin(45^\\circ)=\\frac{\\sqrt{2}}{2}\\), \\(\\cos(45^\\circ)=\\frac{\\sqrt{2}}{2}\\), and \\(\\tan(45^\\circ)=1\\).",
            id: "tangent-45-paragraph-4"
          }
        ]
      },
      {
        id: "derive-30-60-triangle",
        title: "Deriving the \\(30^\\circ\\) and \\(60^\\circ\\) Values",
        content: [
          {
            type: "paragraph",
            text: "The exact values for \\(30^\\circ\\) and \\(60^\\circ\\) come from an equilateral triangle.",
            id: "derive-30-60-triangle-paragraph-1"
          },
          {
            type: "paragraph",
            text: "An equilateral triangle has three equal sides and three equal angles. Since the angles of a triangle add to \\(180^\\circ\\), each angle is \\(60^\\circ\\).",
            id: "derive-30-60-triangle-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Take an equilateral triangle whose side length is \\(2\\). Draw a perpendicular line from the top vertex to the midpoint of the opposite side.",
            id: "derive-30-60-triangle-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The perpendicular line divides the equilateral triangle into two congruent right triangles.",
            id: "derive-30-60-triangle-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Each right triangle has angles \\(30^\\circ\\), \\(60^\\circ\\) and \\(90^\\circ\\).",
            id: "derive-30-60-triangle-paragraph-5"
          },
          {
            type: "paragraph",
            text: "The hypotenuse is the original side of the equilateral triangle, so its length is \\(2\\). The bottom half of the original side has length \\(1\\).",
            id: "derive-30-60-triangle-paragraph-6"
          },
          {
            type: "paragraph",
            text: "Let the remaining side have length \\(h\\). Using the Pythagorean theorem: \\[1^2+h^2=2^2\\]",
            id: "derive-30-60-triangle-paragraph-7"
          },
          {
            type: "paragraph",
            text: "Therefore: \\[1+h^2=4\\]",
            id: "derive-30-60-triangle-paragraph-8"
          },
          {
            type: "paragraph",
            text: "So \\(h^2=3\\), giving \\(h=\\sqrt{3}\\).",
            id: "derive-30-60-triangle-paragraph-9"
          },
          {
            type: "paragraph",
            text: "The resulting \\(30^\\circ-60^\\circ-90^\\circ\\) triangle therefore has side lengths \\(1\\), \\(\\sqrt{3}\\), and \\(2\\).",
            id: "derive-30-60-triangle-paragraph-10"
          }
        ]
      },
      {
        id: "side-roles-30-60",
        title: "Understanding the Side Roles",
        content: [
          {
            type: "paragraph",
            text: "In the \\(30^\\circ-60^\\circ-90^\\circ\\) triangle, the side opposite \\(30^\\circ\\) has length \\(1\\).",
            id: "side-roles-30-60-paragraph-1"
          },
          {
            type: "paragraph",
            text: "The side opposite \\(60^\\circ\\) has length \\(\\sqrt{3}\\).",
            id: "side-roles-30-60-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The hypotenuse, which is opposite the \\(90^\\circ\\) angle, has length \\(2\\).",
            id: "side-roles-30-60-paragraph-3"
          },
          {
            type: "paragraph",
            text: "This distinction is extremely important. The same triangle can be used to find values for both \\(30^\\circ\\) and \\(60^\\circ\\), but the opposite and adjacent sides change depending on which angle we are considering.",
            id: "side-roles-30-60-paragraph-4"
          },
          {
            type: "paragraph",
            text: "For \\(30^\\circ\\), the opposite side is \\(1\\) and the adjacent side is \\(\\sqrt{3}\\).",
            id: "side-roles-30-60-paragraph-5"
          },
          {
            type: "paragraph",
            text: "For \\(60^\\circ\\), the opposite side is \\(\\sqrt{3}\\) and the adjacent side is \\(1\\).",
            id: "side-roles-30-60-paragraph-6"
          }
        ]
      },
      {
        id: "sine-30",
        title: "Finding \\(\\sin(30^\\circ)\\)",
        content: [
          {
            type: "paragraph",
            text: "For the \\(30^\\circ\\) angle, the opposite side is \\(1\\) and the hypotenuse is \\(2\\).",
            id: "sine-30-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Using the sine definition: \\[\\sin(30^\\circ)=\\frac{\\text{opposite}}{\\text{hypotenuse}}=\\frac{1}{2}\\]",
            id: "sine-30-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Therefore, \\(\\sin(30^\\circ)=\\frac{1}{2}\\).",
            id: "sine-30-paragraph-3"
          }
        ]
      },
      {
        id: "cosine-30",
        title: "Finding \\(\\cos(30^\\circ)\\)",
        content: [
          {
            type: "paragraph",
            text: "For the \\(30^\\circ\\) angle, the adjacent side is \\(\\sqrt{3}\\) and the hypotenuse is \\(2\\).",
            id: "cosine-30-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Therefore: \\[\\cos(30^\\circ)=\\frac{\\sqrt{3}}{2}\\]",
            id: "cosine-30-paragraph-2"
          },
          {
            type: "paragraph",
            text: "So the exact value is \\(\\cos(30^\\circ)=\\frac{\\sqrt{3}}{2}\\).",
            id: "cosine-30-paragraph-3"
          }
        ]
      },
      {
        id: "tangent-30",
        title: "Finding \\(\\tan(30^\\circ)\\)",
        content: [
          {
            type: "paragraph",
            text: "For the \\(30^\\circ\\) angle, the opposite side is \\(1\\) and the adjacent side is \\(\\sqrt{3}\\).",
            id: "tangent-30-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Therefore: \\[\\tan(30^\\circ)=\\frac{1}{\\sqrt{3}}\\]",
            id: "tangent-30-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Rationalizing the denominator gives: \\[\\frac{1}{\\sqrt{3}}\\times\\frac{\\sqrt{3}}{\\sqrt{3}}=\\frac{\\sqrt{3}}{3}\\]",
            id: "tangent-30-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Therefore, \\(\\tan(30^\\circ)=\\frac{\\sqrt{3}}{3}\\).",
            id: "tangent-30-paragraph-4"
          }
        ]
      },
      {
        id: "sine-60",
        title: "Finding \\(\\sin(60^\\circ)\\)",
        content: [
          {
            type: "paragraph",
            text: "For the \\(60^\\circ\\) angle, the opposite side is \\(\\sqrt{3}\\) and the hypotenuse is \\(2\\).",
            id: "sine-60-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Therefore: \\[\\sin(60^\\circ)=\\frac{\\sqrt{3}}{2}\\]",
            id: "sine-60-paragraph-2"
          },
          {
            type: "paragraph",
            text: "So the exact value is \\(\\sin(60^\\circ)=\\frac{\\sqrt{3}}{2}\\).",
            id: "sine-60-paragraph-3"
          }
        ]
      },
      {
        id: "cosine-60",
        title: "Finding \\(\\cos(60^\\circ)\\)",
        content: [
          {
            type: "paragraph",
            text: "For the \\(60^\\circ\\) angle, the adjacent side is \\(1\\) and the hypotenuse is \\(2\\).",
            id: "cosine-60-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Therefore: \\[\\cos(60^\\circ)=\\frac{1}{2}\\]",
            id: "cosine-60-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Therefore, \\(\\cos(60^\\circ)=\\frac{1}{2}\\).",
            id: "cosine-60-paragraph-3"
          }
        ]
      },
      {
        id: "tangent-60",
        title: "Finding \\(\\tan(60^\\circ)\\)",
        content: [
          {
            type: "paragraph",
            text: "For the \\(60^\\circ\\) angle, the opposite side is \\(\\sqrt{3}\\) and the adjacent side is \\(1\\).",
            id: "tangent-60-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Therefore: \\[\\tan(60^\\circ)=\\frac{\\sqrt{3}}{1}=\\sqrt{3}\\]",
            id: "tangent-60-paragraph-2"
          },
          {
            type: "paragraph",
            text: "So the exact value is \\(\\tan(60^\\circ)=\\sqrt{3}\\).",
            id: "tangent-60-paragraph-3"
          }
        ]
      },
      {
        id: "zero-degree-values",
        title: "Understanding the Values at \\(0^\\circ\\)",
        content: [
          {
            type: "paragraph",
            text: "An angle of \\(0^\\circ\\) means that the terminal side has not rotated away from the positive x-axis.",
            id: "zero-degree-values-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Using the coordinate definition, imagine a point \\((r,0)\\) on the positive x-axis. Since the y-coordinate is \\(0\\), sine is \\(0\\).",
            id: "zero-degree-values-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Cosine uses \\(x/r\\). Since \\(x=r\\), cosine is \\(1\\).",
            id: "zero-degree-values-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Tangent uses \\(y/x\\). Since \\(y=0\\), tangent is \\(0\\).",
            id: "zero-degree-values-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Therefore: \\[\\sin(0^\\circ)=0,\\qquad\\cos(0^\\circ)=1,\\qquad\\tan(0^\\circ)=0\\]",
            id: "zero-degree-values-paragraph-5"
          }
        ]
      },
      {
        id: "ninety-degree-values",
        title: "Understanding the Values at \\(90^\\circ\\)",
        content: [
          {
            type: "paragraph",
            text: "An angle of \\(90^\\circ\\) means the terminal side has rotated counterclockwise from the positive x-axis to the positive y-axis.",
            id: "ninety-degree-values-paragraph-1"
          },
          {
            type: "paragraph",
            text: "A point on the terminal side can be written as \\((0,r)\\).",
            id: "ninety-degree-values-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Since \\(y=r\\), sine is \\(1\\): \\[\\sin(90^\\circ)=\\frac{r}{r}=1\\]",
            id: "ninety-degree-values-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Since \\(x=0\\), cosine is \\(0\\): \\[\\cos(90^\\circ)=\\frac{0}{r}=0\\]",
            id: "ninety-degree-values-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Tangent would require dividing by \\(x=0\\): \\[\\tan(90^\\circ)=\\frac{r}{0}\\]",
            id: "ninety-degree-values-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Division by zero is undefined. Therefore, \\(\\tan(90^\\circ)\\) is undefined.",
            id: "ninety-degree-values-paragraph-6"
          }
        ]
      },
      {
        id: "complete-exact-value-table",
        title: "The Complete Exact-Value Table",
        content: [
          {
            type: "paragraph",
            text: "We can now combine the values we derived for the five important angles.",
            id: "complete-exact-value-table-paragraph-1"
          },
          {
            type: "paragraph",
            text: "The sine values are: \\(0,\\frac{1}{2},\\frac{\\sqrt{2}}{2},\\frac{\\sqrt{3}}{2},1\\).",
            id: "complete-exact-value-table-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The cosine values are: \\(1,\\frac{\\sqrt{3}}{2},\\frac{\\sqrt{2}}{2},\\frac{1}{2},0\\).",
            id: "complete-exact-value-table-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The tangent values are: \\(0,\\frac{\\sqrt{3}}{3},1,\\sqrt{3}\\), followed by an undefined value at \\(90^\\circ\\).",
            id: "complete-exact-value-table-paragraph-4"
          },
          {
            type: "paragraph",
            text: "The table should not be treated as a collection of unrelated numbers. Each value comes from the geometry of the two special right triangles or from the coordinate definitions at the axes.",
            id: "complete-exact-value-table-paragraph-5"
          }
        ]
      },
      {
        id: "patterns-in-exact-values",
        title: "Patterns in the Exact-Value Table",
        content: [
          {
            type: "paragraph",
            text: "The exact-value table contains useful patterns that can make it easier to remember.",
            id: "patterns-in-exact-values-paragraph-1"
          },
          {
            type: "paragraph",
            text: "From \\(0^\\circ\\) to \\(90^\\circ\\), sine increases from \\(0\\) to \\(1\\).",
            id: "patterns-in-exact-values-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Over the same interval, cosine decreases from \\(1\\) to \\(0\\).",
            id: "patterns-in-exact-values-paragraph-3"
          },
          {
            type: "paragraph",
            text: "At \\(45^\\circ\\), sine and cosine are equal because the two legs of the right triangle are equal.",
            id: "patterns-in-exact-values-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Tangent starts at \\(0\\) and increases as the angle approaches \\(90^\\circ\\), becoming undefined exactly at \\(90^\\circ\\).",
            id: "patterns-in-exact-values-paragraph-5"
          },
          {
            type: "paragraph",
            text: "These patterns are useful for checking whether a remembered value makes sense.",
            id: "patterns-in-exact-values-paragraph-6"
          }
        ]
      },
      {
        id: "using-reference-angles",
        title: "Using Reference Angles with Exact Values",
        content: [
          {
            type: "paragraph",
            text: "The exact values we derived apply directly to the first-quadrant angles \\(30^\\circ\\), \\(45^\\circ\\) and \\(60^\\circ\\). But reference angles allow us to use the same values for angles in other quadrants.",
            id: "using-reference-angles-paragraph-1"
          },
          {
            type: "paragraph",
            text: "For example, \\(150^\\circ\\) has reference angle \\(30^\\circ\\). Therefore, its trigonometric magnitude is based on the exact values for \\(30^\\circ\\).",
            id: "using-reference-angles-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Because \\(150^\\circ\\) is in Quadrant II, sine is positive and cosine is negative.",
            id: "using-reference-angles-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Therefore: \\[\\sin(150^\\circ)=\\frac{1}{2}\\]",
            id: "using-reference-angles-paragraph-4"
          },
          {
            type: "paragraph",
            text: "and \\[\\cos(150^\\circ)=-\\frac{\\sqrt{3}}{2}\\]",
            id: "using-reference-angles-paragraph-5"
          },
          {
            type: "paragraph",
            text: "The important idea is that the reference angle supplies the familiar exact value, while the quadrant supplies the sign.",
            id: "using-reference-angles-paragraph-6"
          }
        ]
      },
      {
        id: "quadrant-two-exact-values",
        title: "Exact Values in Quadrant II",
        content: [
          {
            type: "paragraph",
            text: "In Quadrant II, sine is positive, while cosine and tangent are negative.",
            id: "quadrant-two-exact-values-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Consider \\(120^\\circ\\). Its reference angle is \\(60^\\circ\\).",
            id: "quadrant-two-exact-values-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The exact values for \\(60^\\circ\\) are \\(\\sin(60^\\circ)=\\frac{\\sqrt{3}}{2}\\), \\(\\cos(60^\\circ)=\\frac{1}{2}\\), and \\(\\tan(60^\\circ)=\\sqrt{3}\\).",
            id: "quadrant-two-exact-values-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Since \\(120^\\circ\\) is in Quadrant II, we keep the sine value positive and make cosine and tangent negative.",
            id: "quadrant-two-exact-values-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Therefore: \\[\\sin(120^\\circ)=\\frac{\\sqrt{3}}{2},\\qquad\\cos(120^\\circ)=-\\frac{1}{2},\\qquad\\tan(120^\\circ)=-\\sqrt{3}\\]",
            id: "quadrant-two-exact-values-paragraph-5"
          }
        ]
      },
      {
        id: "quadrant-three-exact-values",
        title: "Exact Values in Quadrant III",
        content: [
          {
            type: "paragraph",
            text: "In Quadrant III, both sine and cosine are negative, while tangent is positive.",
            id: "quadrant-three-exact-values-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Consider \\(225^\\circ\\). Its reference angle is \\(45^\\circ\\).",
            id: "quadrant-three-exact-values-paragraph-2"
          },
          {
            type: "paragraph",
            text: "At \\(45^\\circ\\), sine and cosine both have magnitude \\(\\frac{\\sqrt{2}}{2}\\), while tangent has magnitude \\(1\\).",
            id: "quadrant-three-exact-values-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Because \\(225^\\circ\\) lies in Quadrant III, sine and cosine become negative while tangent remains positive.",
            id: "quadrant-three-exact-values-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Therefore: \\[\\sin(225^\\circ)=-\\frac{\\sqrt{2}}{2},\\qquad\\cos(225^\\circ)=-\\frac{\\sqrt{2}}{2},\\qquad\\tan(225^\\circ)=1\\]",
            id: "quadrant-three-exact-values-paragraph-5"
          }
        ]
      },
      {
        id: "quadrant-four-exact-values",
        title: "Exact Values in Quadrant IV",
        content: [
          {
            type: "paragraph",
            text: "In Quadrant IV, sine and tangent are negative while cosine is positive.",
            id: "quadrant-four-exact-values-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Consider \\(315^\\circ\\). Its reference angle is \\(45^\\circ\\).",
            id: "quadrant-four-exact-values-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The magnitude of sine and cosine for the reference angle is \\(\\frac{\\sqrt{2}}{2}\\), and the magnitude of tangent is \\(1\\).",
            id: "quadrant-four-exact-values-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Because \\(315^\\circ\\) is in Quadrant IV, sine and tangent are negative while cosine is positive.",
            id: "quadrant-four-exact-values-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Therefore: \\[\\sin(315^\\circ)=-\\frac{\\sqrt{2}}{2},\\qquad\\cos(315^\\circ)=\\frac{\\sqrt{2}}{2},\\qquad\\tan(315^\\circ)=-1\\]",
            id: "quadrant-four-exact-values-paragraph-5"
          }
        ]
      },
      {
        id: "systematic-method-exact-values",
        title: "A Systematic Method for Exact Values",
        content: [
          {
            type: "paragraph",
            text: "When asked to find the exact trigonometric value of an angle, use a consistent procedure rather than guessing.",
            id: "systematic-method-exact-values-paragraph-1"
          },
          {
            type: "paragraph",
            text: "First, determine the quadrant of the angle.",
            id: "systematic-method-exact-values-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Second, find the reference angle.",
            id: "systematic-method-exact-values-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Third, identify the exact value associated with the reference angle.",
            id: "systematic-method-exact-values-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Fourth, determine the sign using the quadrant.",
            id: "systematic-method-exact-values-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Finally, write the exact value without converting it to a decimal.",
            id: "systematic-method-exact-values-paragraph-6"
          },
          {
            type: "paragraph",
            text: "For example, for \\(300^\\circ\\), the reference angle is \\(60^\\circ\\). The exact value of \\(\\sin(60^\\circ)\\) is \\(\\frac{\\sqrt{3}}{2}\\). Since \\(300^\\circ\\) lies in Quadrant IV, sine is negative. Therefore \\(\\sin(300^\\circ)=-\\frac{\\sqrt{3}}{2}\\).",
            id: "systematic-method-exact-values-paragraph-7"
          }
        ]
      },
      {
        id: "exact-values-without-calculator",
        title: "Why You Can Solve These Without a Calculator",
        content: [
          {
            type: "paragraph",
            text: "The special-angle values do not need to be discovered using a calculator. They come directly from geometry.",
            id: "exact-values-without-calculator-paragraph-1"
          },
          {
            type: "paragraph",
            text: "The \\(45^\\circ\\) values come from the side lengths \\(1\\), \\(1\\), and \\(\\sqrt{2}\\).",
            id: "exact-values-without-calculator-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The \\(30^\\circ\\) and \\(60^\\circ\\) values come from the side lengths \\(1\\), \\(\\sqrt{3}\\), and \\(2\\).",
            id: "exact-values-without-calculator-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The \\(0^\\circ\\) and \\(90^\\circ\\) values come naturally from the coordinate definitions.",
            id: "exact-values-without-calculator-paragraph-4"
          },
          {
            type: "paragraph",
            text: "This is why these values can be known exactly even when their decimal representations are irrational.",
            id: "exact-values-without-calculator-paragraph-5"
          }
        ]
      },
      {
        id: "big-picture-exact-values",
        title: "The Big Picture",
        content: [
          {
            type: "paragraph",
            text: "Exact trigonometric values are a direct continuation of the ideas already learned. We use right triangles to derive the values for \\(30^\\circ\\), \\(45^\\circ\\) and \\(60^\\circ\\), and coordinate-plane ideas to understand \\(0^\\circ\\) and \\(90^\\circ\\).",
            id: "big-picture-exact-values-paragraph-1"
          },
          {
            type: "paragraph",
            text: "The \\(45^\\circ-45^\\circ-90^\\circ\\) triangle produces the values involving \\(\\sqrt{2}\\).",
            id: "big-picture-exact-values-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The \\(30^\\circ-60^\\circ-90^\\circ\\) triangle produces the values involving \\(\\sqrt{3}\\).",
            id: "big-picture-exact-values-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Reference angles then allow these exact values to be used for angles in other quadrants.",
            id: "big-picture-exact-values-paragraph-4"
          },
          {
            type: "paragraph",
            text: "The final strategy is therefore simple: find the reference angle, use the exact value for that familiar angle, and then apply the correct sign from the quadrant.",
            id: "big-picture-exact-values-paragraph-5"
          }
        ]
      }
    ]
  },
  formulas: [
    {
      id: "forty-five-triangle-hypotenuse",
      name: "Hypotenuse of a 45\xB0-45\xB0-90\xB0 Triangle",
      expression: "\\[h=\\sqrt{2}\\]",
      explanation: "If both legs of an isosceles right triangle have length 1, the Pythagorean theorem gives a hypotenuse of \\(\\sqrt{2}\\)."
    },
    {
      id: "thirty-sixty-ninety-side-ratio",
      name: "30\xB0-60\xB0-90\xB0 Side Ratio",
      expression: "\\[1:\\sqrt{3}:2\\]",
      explanation: "In a 30\xB0-60\xB0-90\xB0 triangle, the side opposite 30\xB0 has relative length 1, the side opposite 60\xB0 has relative length \\(\\sqrt{3}\\), and the hypotenuse has relative length 2."
    },
    {
      id: "sine-zero",
      name: "Sine of 0\xB0",
      expression: "\\[\\sin(0^\\circ)=0\\]",
      explanation: "At 0\xB0, the terminal side lies on the positive x-axis, so the y-coordinate is zero."
    },
    {
      id: "cosine-zero",
      name: "Cosine of 0\xB0",
      expression: "\\[\\cos(0^\\circ)=1\\]",
      explanation: "At 0\xB0, the terminal side lies on the positive x-axis, so the x-coordinate equals r."
    },
    {
      id: "tangent-zero",
      name: "Tangent of 0\xB0",
      expression: "\\[\\tan(0^\\circ)=0\\]",
      explanation: "At 0\xB0, the y-coordinate is zero, so \\(y/x=0\\)."
    },
    {
      id: "sine-ninety",
      name: "Sine of 90\xB0",
      expression: "\\[\\sin(90^\\circ)=1\\]",
      explanation: "At 90\xB0, the terminal side lies on the positive y-axis, so \\(y=r\\)."
    },
    {
      id: "cosine-ninety",
      name: "Cosine of 90\xB0",
      expression: "\\[\\cos(90^\\circ)=0\\]",
      explanation: "At 90\xB0, the terminal side lies on the y-axis, so \\(x=0\\)."
    },
    {
      id: "tangent-ninety",
      name: "Tangent of 90\xB0",
      expression: "\\[\\tan(90^\\circ)\\text{ is undefined}\\]",
      explanation: "Tangent is \\(y/x\\), and at 90\xB0 the x-coordinate is zero, so the expression requires division by zero."
    },
    {
      id: "exact-value-table",
      name: "Basic Exact Trigonometric Values",
      expression: "\\[\\begin{array}{c|ccccc}\\theta&0^\\circ&30^\\circ&45^\\circ&60^\\circ&90^\\circ\\\\\\hline\\sin\\theta&0&\\frac12&\\frac{\\sqrt2}{2}&\\frac{\\sqrt3}{2}&1\\\\\\cos\\theta&1&\\frac{\\sqrt3}{2}&\\frac{\\sqrt2}{2}&\\frac12&0\\\\\\tan\\theta&0&\\frac{\\sqrt3}{3}&1&\\sqrt3&\\text{undefined}\\end{array}\\]",
      explanation: "This table collects the exact values derived from the special right triangles and coordinate-plane definitions."
    }
  ],
  examples: [
    {
      id: "exact-example-1",
      question: "What is meant by an exact trigonometric value?",
      solution: "An exact trigonometric value is a value written without rounding. For example, \\(\\sin(45^\\circ)=\\frac{\\sqrt{2}}{2}\\) is exact, while \\(0.7071\\) is only an approximation."
    },
    {
      id: "exact-example-2",
      question: "Find \\(\\sin(45^\\circ)\\).",
      solution: "Use a 45\xB0-45\xB0-90\xB0 triangle with legs 1 and hypotenuse \\(\\sqrt{2}\\). Then \\[\\sin(45^\\circ)=\\frac{1}{\\sqrt{2}}=\\frac{\\sqrt{2}}{2}.\\]"
    },
    {
      id: "exact-example-3",
      question: "Find \\(\\cos(45^\\circ)\\).",
      solution: "In a 45\xB0-45\xB0-90\xB0 triangle, the adjacent leg is 1 and the hypotenuse is \\(\\sqrt{2}\\). Therefore \\[\\cos(45^\\circ)=\\frac{1}{\\sqrt{2}}=\\frac{\\sqrt{2}}{2}.\\]"
    },
    {
      id: "exact-example-4",
      question: "Find \\(\\tan(45^\\circ)\\).",
      solution: "Both legs of a 45\xB0-45\xB0-90\xB0 triangle are equal. Therefore \\[\\tan(45^\\circ)=\\frac{1}{1}=1.\\]"
    },
    {
      id: "exact-example-5",
      question: "Find \\(\\sin(30^\\circ)\\).",
      solution: "In a 30\xB0-60\xB0-90\xB0 triangle, the side opposite 30\xB0 has length 1 and the hypotenuse has length 2. Therefore \\[\\sin(30^\\circ)=\\frac{1}{2}.\\]"
    },
    {
      id: "exact-example-6",
      question: "Find \\(\\cos(30^\\circ)\\).",
      solution: "The adjacent side to 30\xB0 has length \\(\\sqrt{3}\\), and the hypotenuse has length 2. Therefore \\[\\cos(30^\\circ)=\\frac{\\sqrt{3}}{2}.\\]"
    },
    {
      id: "exact-example-7",
      question: "Find \\(\\tan(30^\\circ)\\).",
      solution: "The opposite side is 1 and the adjacent side is \\(\\sqrt{3}\\). Therefore \\[\\tan(30^\\circ)=\\frac{1}{\\sqrt{3}}=\\frac{\\sqrt{3}}{3}.\\]"
    },
    {
      id: "exact-example-8",
      question: "Find \\(\\sin(60^\\circ)\\).",
      solution: "The side opposite 60\xB0 has length \\(\\sqrt{3}\\), while the hypotenuse has length 2. Therefore \\[\\sin(60^\\circ)=\\frac{\\sqrt{3}}{2}.\\]"
    },
    {
      id: "exact-example-9",
      question: "Find \\(\\cos(60^\\circ)\\).",
      solution: "The adjacent side is 1 and the hypotenuse is 2. Therefore \\[\\cos(60^\\circ)=\\frac{1}{2}.\\]"
    },
    {
      id: "exact-example-10",
      question: "Find \\(\\tan(60^\\circ)\\).",
      solution: "The opposite side is \\(\\sqrt{3}\\) and the adjacent side is 1. Therefore \\[\\tan(60^\\circ)=\\sqrt{3}.\\]"
    },
    {
      id: "exact-example-11",
      question: "Find \\(\\sin(0^\\circ)\\), \\(\\cos(0^\\circ)\\), and \\(\\tan(0^\\circ)\\).",
      solution: "At 0\xB0, the terminal side lies on the positive x-axis. Therefore \\(y=0\\) and \\(x=r\\). Hence \\[\\sin(0^\\circ)=0,\\qquad\\cos(0^\\circ)=1,\\qquad\\tan(0^\\circ)=0.\\]"
    },
    {
      id: "exact-example-12",
      question: "Find \\(\\sin(90^\\circ)\\), \\(\\cos(90^\\circ)\\), and \\(\\tan(90^\\circ)\\).",
      solution: "At 90\xB0, the terminal side lies on the positive y-axis, so \\(x=0\\) and \\(y=r\\). Thus \\[\\sin(90^\\circ)=1,\\qquad\\cos(90^\\circ)=0.\\] Tangent is \\(y/x=r/0\\), which is undefined."
    },
    {
      id: "exact-example-13",
      question: "Find \\(\\sin(150^\\circ)\\).",
      solution: "First find the reference angle: \\[180^\\circ-150^\\circ=30^\\circ.\\] The exact value of \\(\\sin(30^\\circ)\\) is \\(\\frac12\\). Since 150\xB0 is in Quadrant II and sine is positive there, \\[\\sin(150^\\circ)=\\frac12.\\]"
    },
    {
      id: "exact-example-14",
      question: "Find \\(\\cos(150^\\circ)\\).",
      solution: "The reference angle is 30\xB0. Since \\(\\cos(30^\\circ)=\\frac{\\sqrt3}{2}\\) and cosine is negative in Quadrant II, \\[\\cos(150^\\circ)=-\\frac{\\sqrt3}{2}.\\]"
    },
    {
      id: "exact-example-15",
      question: "Find \\(\\tan(150^\\circ)\\).",
      solution: "The reference angle is 30\xB0. Since \\(\\tan(30^\\circ)=\\frac{\\sqrt3}{3}\\) and tangent is negative in Quadrant II, \\[\\tan(150^\\circ)=-\\frac{\\sqrt3}{3}.\\]"
    },
    {
      id: "exact-example-16",
      question: "Find \\(\\sin(210^\\circ)\\).",
      solution: "The reference angle is \\(210^\\circ-180^\\circ=30^\\circ\\). Since sine is negative in Quadrant III, \\[\\sin(210^\\circ)=-\\frac12.\\]"
    },
    {
      id: "exact-example-17",
      question: "Find \\(\\cos(225^\\circ)\\).",
      solution: "The reference angle is \\(225^\\circ-180^\\circ=45^\\circ\\). Since \\(\\cos(45^\\circ)=\\frac{\\sqrt2}{2}\\) and cosine is negative in Quadrant III, \\[\\cos(225^\\circ)=-\\frac{\\sqrt2}{2}.\\]"
    },
    {
      id: "exact-example-18",
      question: "Find \\(\\tan(240^\\circ)\\).",
      solution: "The reference angle is \\(240^\\circ-180^\\circ=60^\\circ\\). Since \\(\\tan(60^\\circ)=\\sqrt3\\) and tangent is positive in Quadrant III, \\[\\tan(240^\\circ)=\\sqrt3.\\]"
    },
    {
      id: "exact-example-19",
      question: "Find \\(\\sin(300^\\circ)\\).",
      solution: "The reference angle is \\(360^\\circ-300^\\circ=60^\\circ\\). Since \\(\\sin(60^\\circ)=\\frac{\\sqrt3}{2}\\) and sine is negative in Quadrant IV, \\[\\sin(300^\\circ)=-\\frac{\\sqrt3}{2}.\\]"
    },
    {
      id: "exact-example-20",
      question: "Find \\(\\cos(315^\\circ)\\).",
      solution: "The reference angle is \\(360^\\circ-315^\\circ=45^\\circ\\). Since \\(\\cos(45^\\circ)=\\frac{\\sqrt2}{2}\\) and cosine is positive in Quadrant IV, \\[\\cos(315^\\circ)=\\frac{\\sqrt2}{2}.\\]"
    },
    {
      id: "exact-example-21",
      question: "Find \\(\\tan(315^\\circ)\\).",
      solution: "The reference angle is 45\xB0. Since \\(\\tan(45^\\circ)=1\\) and tangent is negative in Quadrant IV, \\[\\tan(315^\\circ)=-1.\\]"
    },
    {
      id: "exact-example-22",
      question: "Find the exact value of \\(\\sin(120^\\circ)\\).",
      solution: "The angle is in Quadrant II. Its reference angle is \\(180^\\circ-120^\\circ=60^\\circ\\). Since \\(\\sin(60^\\circ)=\\frac{\\sqrt3}{2}\\) and sine is positive in Quadrant II, \\[\\sin(120^\\circ)=\\frac{\\sqrt3}{2}.\\]"
    },
    {
      id: "exact-example-23",
      question: "Find the exact value of \\(\\cos(240^\\circ)\\).",
      solution: "The angle is in Quadrant III. Its reference angle is \\(240^\\circ-180^\\circ=60^\\circ\\). Since \\(\\cos(60^\\circ)=\\frac12\\) and cosine is negative in Quadrant III, \\[\\cos(240^\\circ)=-\\frac12.\\]"
    },
    {
      id: "exact-example-24",
      question: "Find the exact value of \\(\\sin(315^\\circ)\\).",
      solution: "The angle is in Quadrant IV. Its reference angle is \\(360^\\circ-315^\\circ=45^\\circ\\). Since \\(\\sin(45^\\circ)=\\frac{\\sqrt2}{2}\\) and sine is negative in Quadrant IV, \\[\\sin(315^\\circ)=-\\frac{\\sqrt2}{2}.\\]"
    },
    {
      id: "exact-example-25",
      question: "Without using a calculator, find \\(\\sin(330^\\circ)\\).",
      solution: "First find the reference angle: \\(360^\\circ-330^\\circ=30^\\circ\\). The exact value of \\(\\sin(30^\\circ)\\) is \\(\\frac12\\). Since 330\xB0 lies in Quadrant IV, sine is negative. Therefore \\[\\sin(330^\\circ)=-\\frac12.\\]"
    },
    {
      id: "exact-example-26",
      question: "Without using a calculator, find \\(\\cos(135^\\circ)\\).",
      solution: "The reference angle is \\(180^\\circ-135^\\circ=45^\\circ\\). The exact value of \\(\\cos(45^\\circ)\\) is \\(\\frac{\\sqrt2}{2}\\). Since 135\xB0 is in Quadrant II, cosine is negative. Therefore \\[\\cos(135^\\circ)=-\\frac{\\sqrt2}{2}.\\]"
    },
    {
      id: "exact-example-27",
      question: "Without using a calculator, find \\(\\tan(225^\\circ)\\).",
      solution: "The reference angle is \\(225^\\circ-180^\\circ=45^\\circ\\). Since \\(\\tan(45^\\circ)=1\\) and tangent is positive in Quadrant III, \\[\\tan(225^\\circ)=1.\\]"
    },
    {
      id: "exact-example-28",
      question: "Why is \\(\\sin(45^\\circ)=\\cos(45^\\circ)\\)?",
      solution: "A 45\xB0-45\xB0-90\xB0 triangle has two equal legs. For either 45\xB0 angle, the opposite and adjacent sides therefore have equal lengths. Since sine is opposite over hypotenuse and cosine is adjacent over hypotenuse, the two ratios are equal. Hence \\[\\sin(45^\\circ)=\\cos(45^\\circ)=\\frac{\\sqrt2}{2}.\\]"
    },
    {
      id: "exact-example-29",
      question: "Why is \\(\\tan(60^\\circ)\\) larger than \\(\\tan(30^\\circ)\\)?",
      solution: "In the 30\xB0-60\xB0-90\xB0 triangle, for 30\xB0 the opposite side is 1 and the adjacent side is \\(\\sqrt3\\), giving \\(\\tan(30^\\circ)=\\frac{\\sqrt3}{3}\\). For 60\xB0, the opposite and adjacent sides switch roles, giving \\(\\tan(60^\\circ)=\\sqrt3\\). Thus the tangent value is larger for 60\xB0."
    },
    {
      id: "exact-example-30",
      question: "Explain why \\(\\tan(90^\\circ)\\) is undefined rather than equal to a very large number.",
      solution: "Tangent is defined as \\(y/x\\). At 90\xB0, \\(x=0\\), so the expression becomes division by zero. Division by zero is undefined. Although tangent values can become extremely large as an angle approaches 90\xB0, the value at exactly 90\xB0 is not a finite number and is undefined."
    }
  ],
  key_ideas: [
    "An exact value is not rounded or approximated.",
    "The most important special angles are \\(0^\\circ\\), \\(30^\\circ\\), \\(45^\\circ\\), \\(60^\\circ\\) and \\(90^\\circ\\).",
    "The \\(45^\\circ\\) values come from a 45\xB0-45\xB0-90\xB0 triangle.",
    "A 45\xB0-45\xB0-90\xB0 triangle with legs 1 and 1 has hypotenuse \\(\\sqrt2\\).",
    "\\(\\sin(45^\\circ)=\\frac{\\sqrt2}{2}\\).",
    "\\(\\cos(45^\\circ)=\\frac{\\sqrt2}{2}\\).",
    "\\(\\tan(45^\\circ)=1\\).",
    "The \\(30^\\circ\\) and \\(60^\\circ\\) values come from a 30\xB0-60\xB0-90\xB0 triangle.",
    "A 30\xB0-60\xB0-90\xB0 triangle has side ratio \\(1:\\sqrt3:2\\).",
    "\\(\\sin(30^\\circ)=\\frac12\\).",
    "\\(\\cos(30^\\circ)=\\frac{\\sqrt3}{2}\\).",
    "\\(\\tan(30^\\circ)=\\frac{\\sqrt3}{3}\\).",
    "\\(\\sin(60^\\circ)=\\frac{\\sqrt3}{2}\\).",
    "\\(\\cos(60^\\circ)=\\frac12\\).",
    "\\(\\tan(60^\\circ)=\\sqrt3\\).",
    "\\(\\sin(0^\\circ)=0\\).",
    "\\(\\cos(0^\\circ)=1\\).",
    "\\(\\tan(0^\\circ)=0\\).",
    "\\(\\sin(90^\\circ)=1\\).",
    "\\(\\cos(90^\\circ)=0\\).",
    "\\(\\tan(90^\\circ)\\) is undefined.",
    "The exact-value table can be derived instead of memorized blindly.",
    "Reference angles connect angles in other quadrants to the special acute angles.",
    "The reference angle determines the magnitude of the exact value.",
    "The quadrant determines the sign.",
    "Sine is positive in Quadrants I and II.",
    "Cosine is positive in Quadrants I and IV.",
    "Tangent is positive in Quadrants I and III.",
    "Exact values should normally be left in radical or fractional form instead of decimal form.",
    "Rationalizing denominators is commonly used to write exact values in standard form."
  ],
  misconceptions: [
    "An exact value is not the same as a rounded decimal approximation.",
    "The exact-value table is not a list of unrelated numbers; the values come from geometry.",
    "The hypotenuse of a 45\xB0-45\xB0-90\xB0 triangle with legs 1 is \\(\\sqrt2\\), not 2.",
    "In a 30\xB0-60\xB0-90\xB0 triangle, the side opposite 30\xB0 is the shortest side.",
    "The side opposite 60\xB0 is \\(\\sqrt3\\) times the shortest side when the shortest side is 1.",
    "The hypotenuse is always opposite the 90\xB0 angle.",
    "Opposite and adjacent depend on which angle is being considered.",
    "\\(\\sin(30^\\circ)\\) and \\(\\cos(60^\\circ)\\) are equal because both are \\(\\frac12\\).",
    "\\(\\cos(30^\\circ)\\) and \\(\\sin(60^\\circ)\\) are equal because both are \\(\\frac{\\sqrt3}{2}\\).",
    "\\(\\tan(30^\\circ)\\) is not \\(\\sqrt3\\); it is \\(\\frac{\\sqrt3}{3}\\).",
    "\\(\\tan(60^\\circ)\\) is \\(\\sqrt3\\), not \\(\\frac{\\sqrt3}{3}\\).",
    "\\(\\tan(90^\\circ)\\) is undefined, not zero.",
    "\\(\\cos(90^\\circ)=0\\), while \\(\\sin(90^\\circ)=1\\).",
    "A reference angle does not determine the sign of a trigonometric value.",
    "The quadrant must still be considered after finding the reference angle.",
    "An angle in Quadrant III does not make every trigonometric ratio negative; tangent is positive there.",
    "Exact values should not be unnecessarily converted to decimals.",
    "A radical such as \\(\\sqrt2\\) is an exact value even though its decimal representation is irrational.",
    "Rationalizing a denominator does not change the value of an expression.",
    "The special-angle values can be derived without using a calculator."
  ],
  explorations: [
    {
      id: "visualize-45-degree-triangle",
      type: "visualization"
    },
    {
      id: "visualize-30-60-90-triangle",
      type: "visualization"
    },
    {
      id: "visualize-exact-value-table",
      type: "visualization"
    },
    {
      id: "visualize-reference-angle-exact-values",
      type: "visualization"
    },
    {
      id: "explore-changing-triangle-scale",
      type: "experiment"
    },
    {
      id: "explore-special-angle-ratios",
      type: "experiment"
    },
    {
      id: "explore-quadrant-signs",
      type: "experiment"
    },
    {
      id: "why-45-values-are-equal",
      type: "why"
    },
    {
      id: "why-30-60-values-are-related",
      type: "why"
    },
    {
      id: "why-tangent-90-undefined",
      type: "why"
    },
    {
      id: "deeper-exact-values-from-geometry",
      type: "go-deeper"
    }
  ],
  sources: [
    "khan-academy-trigonometry",
    "openstax-precalculus"
  ]
};

// ../content/concepts/trigonometric-ratios/05_tangent-function.json
var tangent_function_default = {
  id: "tangent-function",
  title: "Tangent Function",
  subject: "mathematics",
  topic: "trigonometry",
  section: "intro-trigono",
  difficulty: 2,
  connections: {
    prerequisites: [
      "trigonometric-functions",
      "trigonometric-ratios-any-angle",
      "exact-trigonometric-values"
    ],
    leads_to: [
      "reciprocal-trigonometric-functions"
    ],
    related: [
      "sine-function",
      "cosine-function",
      "trigonometric-functions"
    ]
  },
  theory: {
    introduction: "The tangent function is the third fundamental trigonometric function. We first encountered tangent as the ratio of the opposite side to the adjacent side of a right triangle. When tangent is viewed as a function, an angle becomes the input and the tangent value becomes the output. Unlike sine and cosine, tangent is not bounded between -1 and 1. It can become arbitrarily large in magnitude and is undefined at certain angles. Its graph therefore has a distinctive repeating pattern separated by vertical asymptotes. Understanding why these asymptotes occur and how the graph is connected to sine and cosine is essential for understanding tangent as a function.",
    sections: [
      {
        id: "what-is-tangent",
        title: "What Is the Tangent Function?",
        content: [
          {
            type: "paragraph",
            text: "The tangent function takes an angle as its input and produces a numerical value as its output. The basic tangent function is written as \\(y=\\tan x\\).",
            id: "what-is-tangent-paragraph-1"
          },
          {
            type: "paragraph",
            text: "In a right triangle, tangent is defined as the ratio of the side opposite the angle to the side adjacent to the angle: \\(\\tan\\theta=\\frac{\\text{opposite}}{\\text{adjacent}}\\).",
            id: "what-is-tangent-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Unlike the sine and cosine ratios, the hypotenuse does not appear in the tangent ratio. This means tangent directly compares the vertical and horizontal legs of a right triangle.",
            id: "what-is-tangent-paragraph-3"
          },
          {
            type: "paragraph",
            text: "For an acute angle, tangent is positive because both the opposite and adjacent side lengths are positive. Once we extend tangent to arbitrary angles using the coordinate plane, tangent can also be negative or undefined.",
            id: "what-is-tangent-paragraph-4"
          },
          {
            type: "paragraph",
            text: "The function viewpoint allows us to study tangent for every angle for which it is defined, rather than restricting ourselves to angles inside one right triangle.",
            id: "what-is-tangent-paragraph-5"
          }
        ]
      },
      {
        id: "tangent-sine-cosine",
        title: "Tangent as Sine Divided by Cosine",
        content: [
          {
            type: "paragraph",
            text: "One of the most important relationships in trigonometry is \\(\\tan x=\\frac{\\sin x}{\\cos x}\\), whenever \\(\\cos x\\neq0\\).",
            id: "tangent-sine-cosine-paragraph-1"
          },
          {
            type: "paragraph",
            text: "This relationship can be derived directly from the right-triangle definitions. We have \\(\\sin\\theta=\\frac{\\text{opposite}}{\\text{hypotenuse}}\\) and \\(\\cos\\theta=\\frac{\\text{adjacent}}{\\text{hypotenuse}}\\).",
            id: "tangent-sine-cosine-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Dividing sine by cosine gives \\(\\frac{\\sin\\theta}{\\cos\\theta}=\\frac{\\text{opposite}/\\text{hypotenuse}}{\\text{adjacent}/\\text{hypotenuse}}\\). The two occurrences of the hypotenuse cancel, leaving \\(\\frac{\\text{opposite}}{\\text{adjacent}}\\), which is exactly tangent.",
            id: "tangent-sine-cosine-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The coordinate-plane definition leads to the same relationship. If a point on the terminal side of an angle has coordinates \\((x,y)\\) and distance \\(r\\) from the origin, then \\(\\sin\\theta=\\frac{y}{r}\\) and \\(\\cos\\theta=\\frac{x}{r}\\). Therefore, \\(\\tan\\theta=\\frac{y/r}{x/r}=\\frac{y}{x}\\), provided \\(x\\neq0\\).",
            id: "tangent-sine-cosine-paragraph-4"
          },
          {
            type: "paragraph",
            text: "This formula is also the key to understanding why tangent is undefined at certain angles.",
            id: "tangent-sine-cosine-paragraph-5"
          }
        ]
      },
      {
        id: "tangent-unit-circle",
        title: "Tangent on the Unit Circle",
        content: [
          {
            type: "paragraph",
            text: "For an angle \\(x\\), let the corresponding point on the unit circle be \\((\\cos x,\\sin x)\\). Since tangent is sine divided by cosine, we have \\(\\tan x=\\frac{\\sin x}{\\cos x}\\).",
            id: "tangent-unit-circle-paragraph-1"
          },
          {
            type: "paragraph",
            text: "This means tangent compares the vertical coordinate of the point with its horizontal coordinate.",
            id: "tangent-unit-circle-paragraph-2"
          },
          {
            type: "paragraph",
            text: "If the point lies in a quadrant where the vertical and horizontal coordinates have the same sign, tangent is positive. If they have opposite signs, tangent is negative.",
            id: "tangent-unit-circle-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Therefore, tangent is positive in the first and third quadrants and negative in the second and fourth quadrants.",
            id: "tangent-unit-circle-paragraph-4"
          },
          {
            type: "paragraph",
            text: "This gives a geometric explanation for the sign of tangent rather than requiring us to memorize isolated values.",
            id: "tangent-unit-circle-paragraph-5"
          }
        ]
      },
      {
        id: "key-values",
        title: "Important Tangent Values",
        content: [
          {
            type: "paragraph",
            text: "Several standard-angle tangent values can be obtained from the exact sine and cosine values.",
            id: "key-values-paragraph-1"
          },
          {
            type: "paragraph",
            text: "At \\(0^\\circ\\), \\(\\sin0^\\circ=0\\) and \\(\\cos0^\\circ=1\\), so \\(\\tan0^\\circ=0\\).",
            id: "key-values-paragraph-2"
          },
          {
            type: "paragraph",
            text: "At \\(30^\\circ\\), \\(\\sin30^\\circ=\\frac{1}{2}\\) and \\(\\cos30^\\circ=\\frac{\\sqrt{3}}{2}\\), giving \\(\\tan30^\\circ=\\frac{\\sqrt{3}}{3}\\).",
            id: "key-values-paragraph-3"
          },
          {
            type: "paragraph",
            text: "At \\(45^\\circ\\), sine and cosine are equal, so \\(\\tan45^\\circ=1\\).",
            id: "key-values-paragraph-4"
          },
          {
            type: "paragraph",
            text: "At \\(60^\\circ\\), \\(\\sin60^\\circ=\\frac{\\sqrt{3}}{2}\\) and \\(\\cos60^\\circ=\\frac{1}{2}\\), so \\(\\tan60^\\circ=\\sqrt{3}\\).",
            id: "key-values-paragraph-5"
          },
          {
            type: "paragraph",
            text: "At \\(90^\\circ\\), cosine is zero. Therefore, tangent is undefined.",
            id: "key-values-paragraph-6"
          }
        ]
      },
      {
        id: "zeros",
        title: "Zeros of the Tangent Function",
        content: [
          {
            type: "paragraph",
            text: "A zero is an input for which a function's output is zero. For tangent, we can use \\(\\tan x=\\frac{\\sin x}{\\cos x}\\).",
            id: "zeros-paragraph-1"
          },
          {
            type: "paragraph",
            text: "As long as cosine is not zero, tangent equals zero precisely when sine equals zero.",
            id: "zeros-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Sine is zero at integer multiples of \\(\\pi\\). Therefore, tangent is also zero at \\(x=k\\pi\\), where \\(k\\in\\mathbb{Z}\\).",
            id: "zeros-paragraph-3"
          },
          {
            type: "paragraph",
            text: "In degrees, these values are \\(0^\\circ\\), \\(180^\\circ\\), \\(360^\\circ\\), \\(-180^\\circ\\), and so on.",
            id: "zeros-paragraph-4"
          },
          {
            type: "paragraph",
            text: "On the tangent graph, these are the points where the curve crosses the x-axis.",
            id: "zeros-paragraph-5"
          }
        ]
      },
      {
        id: "undefined-values",
        title: "Why Is Tangent Undefined at Certain Angles?",
        content: [
          {
            type: "paragraph",
            text: "The most important restriction of the tangent function comes from its relationship with cosine: \\(\\tan x=\\frac{\\sin x}{\\cos x}\\).",
            id: "undefined-values-paragraph-1"
          },
          {
            type: "paragraph",
            text: "A fraction is undefined when its denominator is zero. Therefore, tangent is undefined whenever \\(\\cos x=0\\).",
            id: "undefined-values-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Cosine is zero at \\(90^\\circ\\), \\(270^\\circ\\), and every angle separated from these by \\(180^\\circ\\). In radians, these angles have the form \\(x=\\frac{\\pi}{2}+k\\pi\\), where \\(k\\in\\mathbb{Z}\\).",
            id: "undefined-values-paragraph-3"
          },
          {
            type: "paragraph",
            text: "For example, \\(\\tan90^\\circ=\\frac{1}{0}\\), which is undefined. Similarly, \\(\\tan270^\\circ\\) is undefined because \\(\\cos270^\\circ=0\\).",
            id: "undefined-values-paragraph-4"
          },
          {
            type: "paragraph",
            text: "It is incorrect to say that tangent equals infinity at these angles. The function simply has no defined real value there.",
            id: "undefined-values-paragraph-5"
          }
        ]
      },
      {
        id: "vertical-asymptotes",
        title: "Vertical Asymptotes",
        content: [
          {
            type: "paragraph",
            text: "The points where tangent is undefined create a special feature in its graph called a vertical asymptote.",
            id: "vertical-asymptotes-paragraph-1"
          },
          {
            type: "paragraph",
            text: "A vertical asymptote is a vertical line that the graph approaches as the input gets closer and closer to a particular value, while the function itself is not defined at that value.",
            id: "vertical-asymptotes-paragraph-2"
          },
          {
            type: "paragraph",
            text: "For tangent, the vertical asymptotes occur at \\(x=\\frac{\\pi}{2}+k\\pi\\), where \\(k\\in\\mathbb{Z}\\).",
            id: "vertical-asymptotes-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Consider what happens near \\(90^\\circ\\). As the angle approaches \\(90^\\circ\\) from the left, cosine becomes a very small positive number while sine remains close to \\(1\\). Therefore, \\(\\frac{\\sin x}{\\cos x}\\) becomes a very large positive number.",
            id: "vertical-asymptotes-paragraph-4"
          },
          {
            type: "paragraph",
            text: "As the angle approaches \\(90^\\circ\\) from the right, cosine becomes a very small negative number while sine remains close to \\(1\\). The quotient therefore becomes a very large negative number.",
            id: "vertical-asymptotes-paragraph-5"
          },
          {
            type: "paragraph",
            text: "This is why the two sides of the tangent graph move toward opposite infinities near the vertical asymptote.",
            id: "vertical-asymptotes-paragraph-6"
          },
          {
            type: "paragraph",
            text: "The important distinction is that the graph approaches the asymptote but never includes the asymptote as a point of the function.",
            id: "vertical-asymptotes-paragraph-7"
          }
        ]
      },
      {
        id: "period",
        title: "The Period of Tangent",
        content: [
          {
            type: "paragraph",
            text: "The tangent function repeats its pattern after \\(\\pi\\) radians, or \\(180^\\circ\\). This is different from sine and cosine, whose basic period is \\(2\\pi\\).",
            id: "period-paragraph-1"
          },
          {
            type: "paragraph",
            text: "The periodic relationship is \\(\\tan(x+\\pi)=\\tan x\\). In degrees, this becomes \\(\\tan(x+180^\\circ)=\\tan x\\).",
            id: "period-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The reason for the shorter period comes from the fact that both sine and cosine change sign after a half-turn. If both numerator and denominator change sign, their ratio remains unchanged.",
            id: "period-paragraph-3"
          },
          {
            type: "paragraph",
            text: "For example, \\(\\tan30^\\circ=\\frac{\\sqrt{3}}{3}\\). Adding \\(180^\\circ\\) gives \\(210^\\circ\\), and \\(\\tan210^\\circ=\\frac{\\sqrt{3}}{3}\\).",
            id: "period-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Thus, one tangent cycle extends from one vertical asymptote to the next, a distance of \\(\\pi\\) radians.",
            id: "period-paragraph-5"
          }
        ]
      },
      {
        id: "unbounded",
        title: "Why Tangent Is Unbounded",
        content: [
          {
            type: "paragraph",
            text: "Unlike sine and cosine, tangent has no maximum or minimum value. It can become arbitrarily large in the positive or negative direction.",
            id: "unbounded-paragraph-1"
          },
          {
            type: "paragraph",
            text: "The reason comes from division. Near an angle where cosine is zero, the denominator in \\(\\tan x=\\frac{\\sin x}{\\cos x}\\) becomes extremely small.",
            id: "unbounded-paragraph-2"
          },
          {
            type: "paragraph",
            text: "For example, suppose the numerator is approximately \\(1\\) while the denominator is \\(0.001\\). Their quotient is approximately \\(1000\\). If the denominator becomes \\(0.0001\\), the quotient becomes approximately \\(10000\\).",
            id: "unbounded-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The same behavior occurs with negative denominators, producing very large negative values.",
            id: "unbounded-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Therefore, tangent can produce every real number. Its range is \\(\\mathbb{R}\\).",
            id: "unbounded-paragraph-5"
          }
        ]
      },
      {
        id: "building-graph",
        title: "Building the Basic Tangent Graph",
        content: [
          {
            type: "paragraph",
            text: "To sketch the basic tangent graph \\(y=\\tan x\\), begin by identifying the vertical asymptotes. One convenient interval is \\(-\\frac{\\pi}{2}<x<\\frac{\\pi}{2}\\).",
            id: "building-graph-paragraph-1"
          },
          {
            type: "paragraph",
            text: "The vertical boundaries are \\(x=-\\frac{\\pi}{2}\\) and \\(x=\\frac{\\pi}{2}\\). Tangent is undefined at both of these values.",
            id: "building-graph-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The central point is \\((0,0)\\), because \\(\\tan0=0\\).",
            id: "building-graph-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Two useful additional points are \\(\\left(-\\frac{\\pi}{4},-1\\right)\\) and \\(\\left(\\frac{\\pi}{4},1\\right)\\), because \\(\\tan\\left(-\\frac{\\pi}{4}\\right)=-1\\) and \\(\\tan\\frac{\\pi}{4}=1\\).",
            id: "building-graph-paragraph-4"
          },
          {
            type: "paragraph",
            text: "The curve rises continuously from very large negative values near \\(-\\frac{\\pi}{2}\\), passes through the origin, and continues upward toward very large positive values near \\(\\frac{\\pi}{2}\\).",
            id: "building-graph-paragraph-5"
          },
          {
            type: "paragraph",
            text: "After reaching the next asymptote, the same shape repeats because tangent has period \\(\\pi\\).",
            id: "building-graph-paragraph-6"
          }
        ]
      },
      {
        id: "signs",
        title: "Where Is Tangent Positive or Negative?",
        content: [
          {
            type: "paragraph",
            text: "The sign of tangent can be understood from \\(\\tan x=\\frac{\\sin x}{\\cos x}\\).",
            id: "signs-paragraph-1"
          },
          {
            type: "paragraph",
            text: "In the first quadrant, sine and cosine are both positive. A positive number divided by a positive number is positive, so tangent is positive.",
            id: "signs-paragraph-2"
          },
          {
            type: "paragraph",
            text: "In the second quadrant, sine is positive but cosine is negative. Therefore, tangent is negative.",
            id: "signs-paragraph-3"
          },
          {
            type: "paragraph",
            text: "In the third quadrant, sine and cosine are both negative. Their quotient is positive, so tangent is positive.",
            id: "signs-paragraph-4"
          },
          {
            type: "paragraph",
            text: "In the fourth quadrant, sine is negative and cosine is positive. Therefore, tangent is negative.",
            id: "signs-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Thus, tangent is positive in quadrants I and III and negative in quadrants II and IV.",
            id: "signs-paragraph-6"
          }
        ]
      },
      {
        id: "negative-angles",
        title: "Tangent of Negative Angles",
        content: [
          {
            type: "paragraph",
            text: "Negative angles represent clockwise rotations, and tangent is defined for negative angles whenever the corresponding cosine value is nonzero.",
            id: "negative-angles-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Tangent has the symmetry property \\(\\tan(-x)=-\\tan x\\). This means tangent is an odd function.",
            id: "negative-angles-paragraph-2"
          },
          {
            type: "paragraph",
            text: "For example, since \\(\\tan45^\\circ=1\\), we have \\(\\tan(-45^\\circ)=-1\\).",
            id: "negative-angles-paragraph-3"
          },
          {
            type: "paragraph",
            text: "This property can be derived from sine and cosine. Since \\(\\sin(-x)=-\\sin x\\) and \\(\\cos(-x)=\\cos x\\), we get \\(\\tan(-x)=\\frac{-\\sin x}{\\cos x}=-\\tan x\\).",
            id: "negative-angles-paragraph-4"
          },
          {
            type: "paragraph",
            text: "On the graph, this produces symmetry about the origin.",
            id: "negative-angles-paragraph-5"
          }
        ]
      },
      {
        id: "tangent-cycle",
        title: "One Complete Cycle of Tangent",
        content: [
          {
            type: "paragraph",
            text: "One basic tangent cycle can be studied between the vertical asymptotes \\(x=-\\frac{\\pi}{2}\\) and \\(x=\\frac{\\pi}{2}\\).",
            id: "tangent-cycle-paragraph-1"
          },
          {
            type: "paragraph",
            text: "As \\(x\\) approaches \\(-\\frac{\\pi}{2}\\) from the right, tangent becomes very large and negative.",
            id: "tangent-cycle-paragraph-2"
          },
          {
            type: "paragraph",
            text: "At \\(x=-\\frac{\\pi}{4}\\), tangent equals \\(-1\\). At \\(x=0\\), tangent equals \\(0\\). At \\(x=\\frac{\\pi}{4}\\), tangent equals \\(1\\).",
            id: "tangent-cycle-paragraph-3"
          },
          {
            type: "paragraph",
            text: "As \\(x\\) approaches \\(\\frac{\\pi}{2}\\) from the left, tangent becomes very large and positive.",
            id: "tangent-cycle-paragraph-4"
          },
          {
            type: "paragraph",
            text: "This increasing branch between two consecutive asymptotes represents one complete tangent cycle. The next branch begins after \\(x=\\frac{\\pi}{2}\\) and has the same shape.",
            id: "tangent-cycle-paragraph-5"
          }
        ]
      },
      {
        id: "worked-examples",
        title: "Worked Examples",
        content: [
          {
            type: "paragraph",
            text: "Example 1: Evaluate \\(\\tan45^\\circ\\). Since \\(\\sin45^\\circ=\\frac{\\sqrt{2}}{2}\\) and \\(\\cos45^\\circ=\\frac{\\sqrt{2}}{2}\\), we get \\(\\tan45^\\circ=\\frac{\\sqrt{2}/2}{\\sqrt{2}/2}=1\\).",
            id: "worked-examples-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Example 2: Evaluate \\(\\tan60^\\circ\\). Using the exact values, \\(\\tan60^\\circ=\\frac{\\sqrt{3}/2}{1/2}=\\sqrt{3}\\).",
            id: "worked-examples-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Example 3: Explain why \\(\\tan90^\\circ\\) is undefined. Since \\(\\cos90^\\circ=0\\), we have \\(\\tan90^\\circ=\\frac{1}{0}\\), which is undefined.",
            id: "worked-examples-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Example 4: Find the zeros of tangent. Tangent equals zero when sine equals zero while cosine is nonzero. Therefore, \\(x=k\\pi\\), where \\(k\\in\\mathbb{Z}\\).",
            id: "worked-examples-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Example 5: Find the period of tangent. Tangent repeats after \\(\\pi\\) radians, so its period is \\(\\pi\\).",
            id: "worked-examples-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Example 6: Determine whether \\(\\tan120^\\circ\\) is positive or negative. The angle lies in quadrant II, where sine is positive and cosine is negative. Their quotient is negative, so \\(\\tan120^\\circ<0\\).",
            id: "worked-examples-paragraph-6"
          },
          {
            type: "paragraph",
            text: "Example 7: Determine whether \\(\\tan240^\\circ\\) is positive or negative. The angle lies in quadrant III, where both sine and cosine are negative. Their quotient is positive, so \\(\\tan240^\\circ>0\\).",
            id: "worked-examples-paragraph-7"
          },
          {
            type: "paragraph",
            text: "Example 8: Evaluate \\(\\tan210^\\circ\\). Since \\(210^\\circ=180^\\circ+30^\\circ\\) and tangent has period \\(180^\\circ\\), \\(\\tan210^\\circ=\\tan30^\\circ=\\frac{\\sqrt{3}}{3}\\).",
            id: "worked-examples-paragraph-8"
          },
          {
            type: "paragraph",
            text: "Example 9: Evaluate \\(\\tan(-45^\\circ)\\). Since tangent is an odd function, \\(\\tan(-45^\\circ)=-\\tan45^\\circ=-1\\).",
            id: "worked-examples-paragraph-9"
          },
          {
            type: "paragraph",
            text: "Example 10: Find the vertical asymptotes of \\(y=\\tan x\\). Tangent is undefined when cosine is zero. Therefore, the vertical asymptotes occur at \\(x=\\frac{\\pi}{2}+k\\pi\\), where \\(k\\in\\mathbb{Z}\\).",
            id: "worked-examples-paragraph-10"
          },
          {
            type: "paragraph",
            text: "Example 11: Explain why tangent can be greater than 1. Tangent is a ratio of opposite to adjacent, and there is no requirement that the opposite side be shorter than the adjacent side. Therefore, ratios such as \\(\\sqrt{3}\\) are possible.",
            id: "worked-examples-paragraph-11"
          },
          {
            type: "paragraph",
            text: "Example 12: Determine the range of \\(y=\\tan x\\). Tangent can take arbitrarily large positive and negative values and can produce every real number. Therefore, its range is \\(\\mathbb{R}\\).",
            id: "worked-examples-paragraph-12"
          }
        ]
      },
      {
        id: "visual-exploration",
        title: "Visual Exploration: Unit Circle to Tangent Graph",
        content: [
          {
            type: "paragraph",
            text: "A useful visualization is to show a point rotating around the unit circle while simultaneously displaying the tangent value.",
            id: "visual-exploration-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Because tangent is the ratio of the vertical coordinate to the horizontal coordinate, the value grows in magnitude whenever the horizontal coordinate becomes very small.",
            id: "visual-exploration-paragraph-2"
          },
          {
            type: "paragraph",
            text: "As the rotating point approaches the top of the circle, its x-coordinate approaches zero. This causes tangent to become extremely large in magnitude, creating the vertical asymptote in the graph.",
            id: "visual-exploration-paragraph-3"
          },
          {
            type: "paragraph",
            text: "When the point crosses the vertical axis, cosine changes sign. Consequently, tangent changes from very large positive values to very large negative values, while the exact point on the axis remains undefined.",
            id: "visual-exploration-paragraph-4"
          },
          {
            type: "paragraph",
            text: "A Lumina visualization could connect three panels: the rotating unit-circle point, the values of sine/cosine/tangent, and the growing tangent graph. This would make the asymptotes and periodic branches visually meaningful.",
            id: "visual-exploration-paragraph-5"
          }
        ]
      },
      {
        id: "common-mistakes",
        title: "Common Mistakes to Avoid",
        content: [
          {
            type: "paragraph",
            text: "Mistake 1: Assuming tangent must lie between \\(-1\\) and \\(1\\). Unlike sine and cosine, tangent is unbounded.",
            id: "common-mistakes-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Mistake 2: Saying \\(\\tan90^\\circ=\\infty\\). Tangent is undefined at \\(90^\\circ\\). It can become arbitrarily large near that angle, but infinity is not the function value.",
            id: "common-mistakes-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Mistake 3: Thinking the period of tangent is \\(2\\pi\\). The basic tangent function has period \\(\\pi\\).",
            id: "common-mistakes-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Mistake 4: Forgetting that tangent can be negative. Its sign depends on the signs of sine and cosine.",
            id: "common-mistakes-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Mistake 5: Thinking tangent is undefined whenever sine is zero. In fact, tangent is zero when sine is zero, provided cosine is nonzero.",
            id: "common-mistakes-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Mistake 6: Thinking tangent is undefined whenever cosine is negative. A negative denominator is perfectly valid; tangent simply becomes negative when sine and cosine have opposite signs.",
            id: "common-mistakes-paragraph-6"
          },
          {
            type: "paragraph",
            text: "Mistake 7: Treating a vertical asymptote as part of the graph. The asymptote indicates a value the function approaches but does not include.",
            id: "common-mistakes-paragraph-7"
          },
          {
            type: "paragraph",
            text: "Mistake 8: Confusing tangent's reciprocal with its inverse. The reciprocal is \\(\\cot x=\\frac{1}{\\tan x}\\), while an inverse function is a different concept.",
            id: "common-mistakes-paragraph-8"
          },
          {
            type: "paragraph",
            text: "Mistake 9: Assuming tangent always represents a physical slope. Although tangent is closely related to slope in coordinate geometry, its primary trigonometric definition is the ratio of sine to cosine.",
            id: "common-mistakes-paragraph-9"
          }
        ]
      },
      {
        id: "big-picture",
        title: "The Big Picture",
        content: [
          {
            type: "paragraph",
            text: "The basic tangent function is \\(y=\\tan x\\). It takes an angle as input and produces a real-number output whenever the function is defined.",
            id: "big-picture-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Tangent can be defined as \\(\\frac{\\text{opposite}}{\\text{adjacent}}\\) in a right triangle and as \\(\\frac{\\sin x}{\\cos x}\\) for arbitrary angles where cosine is nonzero.",
            id: "big-picture-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The relationship \\(\\tan x=\\frac{\\sin x}{\\cos x}\\) explains almost all of the important behavior of tangent. Tangent is zero when sine is zero and undefined when cosine is zero.",
            id: "big-picture-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The tangent function has period \\(\\pi\\), unlike sine and cosine, which have period \\(2\\pi\\). Its range is all real numbers because tangent is unbounded.",
            id: "big-picture-paragraph-4"
          },
          {
            type: "paragraph",
            text: "The angles \\(x=\\frac{\\pi}{2}+k\\pi\\) produce vertical asymptotes because cosine becomes zero there.",
            id: "big-picture-paragraph-5"
          },
          {
            type: "paragraph",
            text: "The tangent graph consists of repeating increasing branches separated by vertical asymptotes. Each branch crosses the x-axis at an integer multiple of \\(\\pi\\).",
            id: "big-picture-paragraph-6"
          },
          {
            type: "paragraph",
            text: "The central idea is that tangent's unusual graph is not arbitrary. Its zeros, signs, asymptotes, period, and unbounded behavior all follow naturally from the relationship between sine and cosine.",
            id: "big-picture-paragraph-7"
          }
        ]
      }
    ]
  },
  formulas: [
    {
      id: "basic-tangent-function",
      name: "Basic Tangent Function",
      expression: "\\(y=\\tan x\\)",
      explanation: "The basic tangent function takes an angle x as input and returns its tangent value whenever tangent is defined."
    },
    {
      id: "tangent-right-triangle",
      name: "Tangent in a Right Triangle",
      expression: "\\(\\tan\\theta=\\frac{\\text{opposite}}{\\text{adjacent}}\\)",
      explanation: "For an acute angle in a right triangle, tangent is the ratio of the opposite side to the adjacent side."
    },
    {
      id: "tangent-sine-cosine",
      name: "Tangent Identity",
      expression: "\\(\\tan x=\\frac{\\sin x}{\\cos x}\\)",
      explanation: "Tangent is sine divided by cosine whenever cosine is nonzero."
    },
    {
      id: "tangent-unit-circle",
      name: "Tangent Using Coordinates",
      expression: "\\(\\tan x=\\frac{y}{x}\\)",
      explanation: "For a point (x,y) on the terminal side of an angle, tangent equals the vertical coordinate divided by the horizontal coordinate, provided x is nonzero."
    },
    {
      id: "tangent-zeros",
      name: "Zeros of Tangent",
      expression: "\\(x=k\\pi,\\quad k\\in\\mathbb{Z}\\)",
      explanation: "Tangent is zero whenever sine is zero and cosine is nonzero."
    },
    {
      id: "tangent-domain",
      name: "Domain Restriction of Tangent",
      expression: "\\(x\\neq\\frac{\\pi}{2}+k\\pi,\\quad k\\in\\mathbb{Z}\\)",
      explanation: "Tangent is undefined whenever cosine is zero."
    },
    {
      id: "tangent-period",
      name: "Period of Tangent",
      expression: "\\(\\tan(x+\\pi)=\\tan x\\)",
      explanation: "Adding \u03C0 radians, or 180 degrees, produces the same tangent value."
    },
    {
      id: "tangent-degree-period",
      name: "Tangent Period in Degrees",
      expression: "\\(\\tan(x+180^\\circ)=\\tan x\\)",
      explanation: "The tangent function repeats after 180 degrees."
    },
    {
      id: "tangent-range",
      name: "Range of Tangent",
      expression: "\\(\\operatorname{Range}(\\tan x)=\\mathbb{R}\\)",
      explanation: "Tangent can produce every real number and has no maximum or minimum."
    },
    {
      id: "tangent-asymptotes",
      name: "Vertical Asymptotes",
      expression: "\\(x=\\frac{\\pi}{2}+k\\pi,\\quad k\\in\\mathbb{Z}\\)",
      explanation: "These are the vertical lines approached by the tangent graph where the function itself is undefined."
    },
    {
      id: "tangent-odd",
      name: "Odd Symmetry",
      expression: "\\(\\tan(-x)=-\\tan x\\)",
      explanation: "Tangent is an odd function, so reversing the sign of the angle reverses the sign of the tangent value."
    }
  ],
  examples: [
    {
      id: "example-tan-45",
      question: "Evaluate \\(\\tan45^\\circ\\).",
      solution: "Using \\(\\tan\\theta=\\frac{\\sin\\theta}{\\cos\\theta}\\), we get \\(\\tan45^\\circ=\\frac{\\sqrt{2}/2}{\\sqrt{2}/2}=1\\)."
    },
    {
      id: "example-tan-60",
      question: "Evaluate \\(\\tan60^\\circ\\).",
      solution: "Since \\(\\sin60^\\circ=\\frac{\\sqrt{3}}{2}\\) and \\(\\cos60^\\circ=\\frac{1}{2}\\), \\(\\tan60^\\circ=\\frac{\\sqrt{3}/2}{1/2}=\\sqrt{3}\\)."
    },
    {
      id: "example-undefined",
      question: "Explain why \\(\\tan90^\\circ\\) is undefined.",
      solution: "We have \\(\\cos90^\\circ=0\\). Therefore, \\(\\tan90^\\circ=\\frac{\\sin90^\\circ}{\\cos90^\\circ}=\\frac{1}{0}\\), which is undefined."
    },
    {
      id: "example-zeros",
      question: "Find the zeros of \\(\\tan x\\).",
      solution: "Tangent is zero when sine is zero and cosine is nonzero. Sine equals zero at integer multiples of \\(\\pi\\). Therefore, \\(x=k\\pi\\), where \\(k\\in\\mathbb{Z}\\)."
    },
    {
      id: "example-period",
      question: "Find the period of \\(y=\\tan x\\).",
      solution: "Tangent repeats after \\(\\pi\\) radians because \\(\\tan(x+\\pi)=\\tan x\\). Therefore, the period is \\(\\pi\\)."
    },
    {
      id: "example-sign-quadrant-2",
      question: "Is \\(\\tan120^\\circ\\) positive or negative?",
      solution: "\\(120^\\circ\\) lies in quadrant II. Sine is positive and cosine is negative there, so their quotient is negative. Therefore, \\(\\tan120^\\circ<0\\)."
    },
    {
      id: "example-sign-quadrant-3",
      question: "Is \\(\\tan240^\\circ\\) positive or negative?",
      solution: "\\(240^\\circ\\) lies in quadrant III. Both sine and cosine are negative, so their quotient is positive. Therefore, \\(\\tan240^\\circ>0\\)."
    },
    {
      id: "example-periodic",
      question: "Evaluate \\(\\tan210^\\circ\\).",
      solution: "Since \\(210^\\circ=180^\\circ+30^\\circ\\) and tangent has period \\(180^\\circ\\), \\(\\tan210^\\circ=\\tan30^\\circ=\\frac{\\sqrt{3}}{3}\\)."
    },
    {
      id: "example-negative",
      question: "Evaluate \\(\\tan(-45^\\circ)\\).",
      solution: "Tangent is an odd function, so \\(\\tan(-45^\\circ)=-\\tan45^\\circ=-1\\)."
    },
    {
      id: "example-asymptotes",
      question: "Find the vertical asymptotes of \\(y=\\tan x\\).",
      solution: "Tangent is undefined whenever cosine is zero. Therefore, the vertical asymptotes occur at \\(x=\\frac{\\pi}{2}+k\\pi\\), where \\(k\\in\\mathbb{Z}\\)."
    },
    {
      id: "example-unbounded",
      question: "Why can tangent become much larger than 1?",
      solution: "Tangent is a quotient \\(\\frac{\\sin x}{\\cos x}\\). When cosine becomes very small while sine remains nonzero, the quotient can become very large. Therefore, tangent is not restricted to values between -1 and 1."
    },
    {
      id: "example-range",
      question: "What is the range of \\(y=\\tan x\\)?",
      solution: "Tangent can produce arbitrarily large positive and negative values and every real number in between. Therefore, its range is \\(\\mathbb{R}\\)."
    }
  ],
  key_ideas: [
    "The basic tangent function is written as \\(y=\\tan x\\).",
    "Tangent takes an angle as input and produces a numerical output.",
    "In a right triangle, tangent is opposite divided by adjacent.",
    "Tangent can be written as sine divided by cosine.",
    "Tangent is defined whenever cosine is nonzero.",
    "Tangent is undefined whenever cosine is zero.",
    "The zeros of tangent occur at integer multiples of \\(\\pi\\).",
    "The basic tangent function has period \\(\\pi\\).",
    "The period is \\(180^\\circ\\) when degrees are used.",
    "Tangent has no maximum or minimum value.",
    "The range of tangent is all real numbers.",
    "Tangent is positive in quadrants I and III.",
    "Tangent is negative in quadrants II and IV.",
    "Tangent has vertical asymptotes at odd multiples of \\(\\frac{\\pi}{2}\\).",
    "An asymptote is approached by the graph but is not part of the function.",
    "Tangent can become arbitrarily large when cosine approaches zero.",
    "The basic tangent graph consists of repeating increasing branches.",
    "Each tangent branch lies between two consecutive vertical asymptotes.",
    "Tangent is an odd function.",
    "The identity \\(\\tan(-x)=-\\tan x\\) describes tangent's symmetry.",
    "The unit circle gives a coordinate interpretation of tangent.",
    "Tangent compares the vertical and horizontal coordinates of the terminal point.",
    "Tangent can be greater than 1 or less than -1.",
    "Tangent is not equal to infinity at an undefined angle.",
    "The period of tangent is half the period of sine and cosine.",
    "Tangent's unusual graph follows naturally from its relationship with sine and cosine."
  ],
  misconceptions: [
    "Tangent must always lie between -1 and 1.",
    "Tangent at 90 degrees is infinity.",
    "Undefined and infinite mean the same thing.",
    "The period of tangent is \\(2\\pi\\).",
    "Tangent is undefined whenever sine is zero.",
    "Tangent is undefined whenever cosine is negative.",
    "A negative tangent means the angle itself must be negative.",
    "Tangent is always positive.",
    "Tangent is always a side length.",
    "The vertical asymptote is part of the tangent graph.",
    "Tangent has a maximum value.",
    "Tangent has a minimum value.",
    "The tangent graph stops after one branch.",
    "Tangent cannot be evaluated for angles greater than \\(360^\\circ\\).",
    "The reciprocal of tangent is the inverse of tangent.",
    "A very large tangent value means tangent is equal to infinity.",
    "The zeros of tangent occur at odd multiples of \\(\\frac{\\pi}{2}\\)."
  ],
  explorations: [
    {
      id: "explore-unit-circle-tangent",
      type: "visualization"
    },
    {
      id: "explore-tangent-asymptotes",
      type: "visualization"
    },
    {
      id: "explore-tangent-period",
      type: "why"
    },
    {
      id: "explore-tangent-unbounded",
      type: "why"
    },
    {
      id: "explore-tangent-signs",
      type: "visualization"
    },
    {
      id: "explore-tangent-graph",
      type: "visualization"
    }
  ],
  sources: [
    "khan-academy-trigonometry",
    "openstax-precalculus"
  ]
};

// ../content/concepts/trigonometric-ratios/06_sine-function.json
var sine_function_default = {
  id: "sine-function",
  title: "Sine Function",
  subject: "mathematics",
  topic: "trigonometry",
  section: "intro-trigono",
  difficulty: 2,
  connections: {
    prerequisites: [
      "trigonometric-functions",
      "trigonometric-ratios-any-angle",
      "exact-trigonometric-values"
    ],
    leads_to: [
      "cosine-function"
    ],
    related: [
      "trigonometric-functions",
      "exact-trigonometric-values",
      "trigonometric-ratios-any-angle"
    ]
  },
  theory: {
    introduction: "The sine function is one of the most important functions in mathematics. We first encountered sine as a ratio of two sides in a right triangle, but the function becomes much more powerful when we view it as a rule that assigns a value to every real angle. The graph of y = sin(x) gives us a visual representation of how this value changes as an angle rotates. By connecting the graph to the unit circle, we can understand where the sine function reaches zero, where it reaches its maximum and minimum values, why it repeats, and how amplitude and period describe its behavior.",
    sections: [
      {
        id: "what-is-sine-function",
        title: "What Is the Sine Function?",
        content: [
          {
            type: "paragraph",
            text: "The sine function takes an angle as its input and returns a number as its output. We write the function as \\(y = \\sin x\\). Here, \\(x\\) represents the input angle and \\(y\\) represents the resulting sine value.",
            id: "what-is-sine-function-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Earlier, sine was introduced through a right triangle using \\(\\sin\\theta = \\frac{\\text{opposite}}{\\text{hypotenuse}}\\). That definition gives us excellent intuition for acute angles. However, a function such as \\(y = \\sin x\\) needs to work for every real input, including angles greater than \\(90^\\circ\\), negative angles, and angles involving multiple rotations.",
            id: "what-is-sine-function-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The unit circle provides a natural way to extend the definition. For an angle \\(x\\), imagine a radius rotating from the positive x-axis. The point where the radius meets the unit circle has coordinates \\((\\cos x, \\sin x)\\). Therefore, the sine of the angle is the vertical coordinate of that point.",
            id: "what-is-sine-function-paragraph-3"
          },
          {
            type: "paragraph",
            text: "This interpretation is extremely useful because the vertical coordinate of a point on the unit circle can never be greater than \\(1\\) or less than \\(-1\\). This immediately explains why the sine function always has values between \\(-1\\) and \\(1\\).",
            id: "what-is-sine-function-paragraph-4"
          }
        ]
      },
      {
        id: "unit-circle-to-graph",
        title: "From the Unit Circle to the Sine Graph",
        content: [
          {
            type: "paragraph",
            text: "The graph of \\(y = \\sin x\\) can be constructed directly from the unit circle. As the angle increases, imagine a point moving counterclockwise around the circle. At every angle, record the point's vertical coordinate. That vertical coordinate is \\(\\sin x\\).",
            id: "unit-circle-to-graph-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Start at \\(0^\\circ\\). The point on the unit circle is \\((1,0)\\), so the sine value is \\(0\\). Therefore, the graph begins at \\((0,0)\\).",
            id: "unit-circle-to-graph-paragraph-2"
          },
          {
            type: "paragraph",
            text: "At \\(90^\\circ\\), the point reaches \\((0,1)\\). Therefore, \\(\\sin90^\\circ = 1\\), giving the point \\((90^\\circ,1)\\).",
            id: "unit-circle-to-graph-paragraph-3"
          },
          {
            type: "paragraph",
            text: "At \\(180^\\circ\\), the point reaches \\((-1,0)\\), so \\(\\sin180^\\circ = 0\\).",
            id: "unit-circle-to-graph-paragraph-4"
          },
          {
            type: "paragraph",
            text: "At \\(270^\\circ\\), the point reaches \\((0,-1)\\), so \\(\\sin270^\\circ = -1\\).",
            id: "unit-circle-to-graph-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Finally, at \\(360^\\circ\\), the point returns to \\((1,0)\\), so \\(\\sin360^\\circ = 0\\).",
            id: "unit-circle-to-graph-paragraph-6"
          },
          {
            type: "paragraph",
            text: "These five points describe one complete cycle of the basic sine function. Connecting them smoothly produces the familiar wave-shaped sine curve.",
            id: "unit-circle-to-graph-paragraph-7"
          },
          {
            type: "paragraph",
            text: "A useful visualization for Lumina would show the unit-circle point moving while a second coordinate system records its vertical coordinate. As the point moves upward, downward, and back to its starting position, the corresponding sine graph is drawn simultaneously.",
            id: "unit-circle-to-graph-paragraph-8"
          }
        ]
      },
      {
        id: "key-points",
        title: "The Five Key Points of One Cycle",
        content: [
          {
            type: "paragraph",
            text: "The basic sine graph can be understood using five important points over one complete revolution. These occur at quarter-turn intervals.",
            id: "key-points-paragraph-1"
          },
          {
            type: "paragraph",
            text: "At \\(0^\\circ\\), \\(\\sin0^\\circ = 0\\). The graph is at the middle level.",
            id: "key-points-paragraph-2"
          },
          {
            type: "paragraph",
            text: "At \\(90^\\circ\\), \\(\\sin90^\\circ = 1\\). The graph reaches its highest point.",
            id: "key-points-paragraph-3"
          },
          {
            type: "paragraph",
            text: "At \\(180^\\circ\\), \\(\\sin180^\\circ = 0\\). The graph returns to the middle level.",
            id: "key-points-paragraph-4"
          },
          {
            type: "paragraph",
            text: "At \\(270^\\circ\\), \\(\\sin270^\\circ = -1\\). The graph reaches its lowest point.",
            id: "key-points-paragraph-5"
          },
          {
            type: "paragraph",
            text: "At \\(360^\\circ\\), \\(\\sin360^\\circ = 0\\). The graph returns to the middle level and completes one cycle.",
            id: "key-points-paragraph-6"
          },
          {
            type: "paragraph",
            text: "The corresponding points are \\((0,0)\\), \\((90^\\circ,1)\\), \\((180^\\circ,0)\\), \\((270^\\circ,-1)\\), and \\((360^\\circ,0)\\). When radians are used, the same points occur at \\(0\\), \\(\\frac{\\pi}{2}\\), \\(\\pi\\), \\(\\frac{3\\pi}{2}\\), and \\(2\\pi\\).",
            id: "key-points-paragraph-7"
          },
          {
            type: "paragraph",
            text: "These points are enough to establish the overall shape of the basic sine curve when they are connected smoothly.",
            id: "key-points-paragraph-8"
          }
        ]
      },
      {
        id: "one-complete-cycle",
        title: "Understanding One Complete Cycle",
        content: [
          {
            type: "paragraph",
            text: "A cycle is one complete repetition of a function's pattern. For the basic sine function, one cycle occurs during one complete revolution of the corresponding unit-circle point.",
            id: "one-complete-cycle-paragraph-1"
          },
          {
            type: "paragraph",
            text: "One complete revolution is \\(360^\\circ\\), or \\(2\\pi\\) radians. Therefore, the sine function repeats its pattern every \\(360^\\circ\\), or \\(2\\pi\\) radians.",
            id: "one-complete-cycle-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Starting at \\(0^\\circ\\), sine begins at zero, rises to \\(1\\), falls back to zero, continues down to \\(-1\\), and finally rises back to zero at \\(360^\\circ\\).",
            id: "one-complete-cycle-paragraph-3"
          },
          {
            type: "paragraph",
            text: "After reaching \\(360^\\circ\\), the same pattern begins again. At \\(450^\\circ\\), which is \\(360^\\circ + 90^\\circ\\), the sine value is again \\(1\\). At \\(540^\\circ\\), which is \\(360^\\circ + 180^\\circ\\), the sine value is again \\(0\\).",
            id: "one-complete-cycle-paragraph-4"
          },
          {
            type: "paragraph",
            text: "This repeating behavior is called periodicity. The length of the smallest repeating interval is called the period.",
            id: "one-complete-cycle-paragraph-5"
          }
        ]
      },
      {
        id: "period",
        title: "The Period of the Sine Function",
        content: [
          {
            type: "paragraph",
            text: "The period of a function tells us how far we must move along the input axis before the function begins repeating its values in the same pattern.",
            id: "period-paragraph-1"
          },
          {
            type: "paragraph",
            text: "For the basic sine function \\(y = \\sin x\\), the period is \\(2\\pi\\) radians, or \\(360^\\circ\\). This means that increasing an angle by one complete revolution does not change its sine value.",
            id: "period-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The repeating relationship can be written as \\(\\sin(x + 2\\pi) = \\sin x\\). In degree measure, the same idea is \\(\\sin(x + 360^\\circ) = \\sin x\\).",
            id: "period-paragraph-3"
          },
          {
            type: "paragraph",
            text: "For example, \\(\\sin30^\\circ = \\frac{1}{2}\\). If we add one complete revolution, we obtain \\(390^\\circ\\). Therefore, \\(\\sin390^\\circ = \\frac{1}{2}\\) as well.",
            id: "period-paragraph-4"
          },
          {
            type: "paragraph",
            text: "The period does not mean that the function has only one cycle. The sine function continues repeating indefinitely in both directions.",
            id: "period-paragraph-5"
          }
        ]
      },
      {
        id: "maximum-and-minimum",
        title: "Maximum and Minimum Values",
        content: [
          {
            type: "paragraph",
            text: "The maximum value of a function is its greatest possible output, while the minimum value is its smallest possible output.",
            id: "maximum-and-minimum-paragraph-1"
          },
          {
            type: "paragraph",
            text: "For the basic sine function, the maximum value is \\(1\\). It occurs whenever the point on the unit circle reaches the highest point, corresponding to angles such as \\(90^\\circ\\), \\(450^\\circ\\), and so on.",
            id: "maximum-and-minimum-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The minimum value is \\(-1\\). It occurs whenever the point on the unit circle reaches the lowest point, corresponding to angles such as \\(270^\\circ\\), \\(630^\\circ\\), and so on.",
            id: "maximum-and-minimum-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Therefore, the sine function satisfies \\(-1 \\leq \\sin x \\leq 1\\) for every real value of \\(x\\).",
            id: "maximum-and-minimum-paragraph-4"
          },
          {
            type: "paragraph",
            text: "The maximum and minimum values are directly connected to the geometry of the unit circle. The vertical coordinate cannot rise above \\(1\\) or fall below \\(-1\\).",
            id: "maximum-and-minimum-paragraph-5"
          }
        ]
      },
      {
        id: "amplitude",
        title: "Amplitude of the Sine Function",
        content: [
          {
            type: "paragraph",
            text: "Amplitude describes the maximum distance of a periodic function from its central or midline value. For the basic sine function, the midline is \\(y=0\\).",
            id: "amplitude-paragraph-1"
          },
          {
            type: "paragraph",
            text: "The sine function reaches \\(1\\) above the midline and \\(-1\\) below the midline. Therefore, its maximum distance from the midline is \\(1\\). The amplitude of \\(y=\\sin x\\) is therefore \\(1\\).",
            id: "amplitude-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Amplitude is not the same thing as the total vertical distance from the maximum to the minimum. For the basic sine function, the maximum is \\(1\\) and the minimum is \\(-1\\), so the total height is \\(2\\), while the amplitude is \\(1\\).",
            id: "amplitude-paragraph-3"
          },
          {
            type: "paragraph",
            text: "For a function of the form \\(y=A\\sin x\\), the amplitude is \\(|A|\\). The absolute value is used because amplitude describes a distance and therefore is nonnegative.",
            id: "amplitude-paragraph-4"
          },
          {
            type: "paragraph",
            text: "For example, the amplitude of \\(y=3\\sin x\\) is \\(3\\). The function can reach a maximum of \\(3\\) and a minimum of \\(-3\\).",
            id: "amplitude-paragraph-5"
          }
        ]
      },
      {
        id: "zeros-of-sine",
        title: "Where Does Sine Equal Zero?",
        content: [
          {
            type: "paragraph",
            text: "A zero of a function is an input value for which the output is zero. On the graph, zeros are the points where the curve crosses or touches the x-axis.",
            id: "zeros-of-sine-paragraph-1"
          },
          {
            type: "paragraph",
            text: "For sine, the value is zero whenever the corresponding point on the unit circle lies on the horizontal axis. This happens at \\(0^\\circ\\), \\(180^\\circ\\), \\(360^\\circ\\), and every additional half-turn.",
            id: "zeros-of-sine-paragraph-2"
          },
          {
            type: "paragraph",
            text: "In radians, the zeros occur at integer multiples of \\(\\pi\\). This can be written as \\(x=k\\pi\\), where \\(k\\in\\mathbb{Z}\\).",
            id: "zeros-of-sine-paragraph-3"
          },
          {
            type: "paragraph",
            text: "For example, \\(\\sin0=0\\), \\(\\sin\\pi=0\\), \\(\\sin2\\pi=0\\), and \\(\\sin(-\\pi)=0\\).",
            id: "zeros-of-sine-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Understanding the zeros from the unit circle is more useful than simply memorizing them because it explains why they occur.",
            id: "zeros-of-sine-paragraph-5"
          }
        ]
      },
      {
        id: "sign-of-sine",
        title: "Why Sine Changes Sign",
        content: [
          {
            type: "paragraph",
            text: "The sine function can be positive, zero, or negative. This follows directly from its interpretation as the y-coordinate of a point on the unit circle.",
            id: "sign-of-sine-paragraph-1"
          },
          {
            type: "paragraph",
            text: "In the first and second quadrants, points on the unit circle have positive y-coordinates. Therefore, sine is positive in these quadrants.",
            id: "sign-of-sine-paragraph-2"
          },
          {
            type: "paragraph",
            text: "In the third and fourth quadrants, points have negative y-coordinates. Therefore, sine is negative in these quadrants.",
            id: "sign-of-sine-paragraph-3"
          },
          {
            type: "paragraph",
            text: "On the horizontal axis, the y-coordinate is zero. Therefore, sine is zero at the angles where the terminal side lies on the horizontal axis.",
            id: "sign-of-sine-paragraph-4"
          },
          {
            type: "paragraph",
            text: "For example, \\(\\sin120^\\circ\\) is positive because \\(120^\\circ\\) lies in the second quadrant, while \\(\\sin240^\\circ\\) is negative because \\(240^\\circ\\) lies in the third quadrant.",
            id: "sign-of-sine-paragraph-5"
          }
        ]
      },
      {
        id: "graph-shape",
        title: "Understanding the Shape of the Sine Curve",
        content: [
          {
            type: "paragraph",
            text: "The sine graph is a smooth wave. Its shape is not arbitrary; it comes from the continuous movement of a point around the unit circle.",
            id: "graph-shape-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Starting at \\((0,0)\\), the graph rises because the y-coordinate of the rotating point becomes positive. It reaches its highest point at \\(90^\\circ\\), where the y-coordinate is \\(1\\).",
            id: "graph-shape-paragraph-2"
          },
          {
            type: "paragraph",
            text: "After \\(90^\\circ\\), the y-coordinate begins decreasing. At \\(180^\\circ\\), it reaches zero. The graph then continues downward because the point has entered the lower half of the circle.",
            id: "graph-shape-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The graph reaches its minimum at \\(270^\\circ\\), where the y-coordinate is \\(-1\\). It then rises again and returns to zero at \\(360^\\circ\\).",
            id: "graph-shape-paragraph-4"
          },
          {
            type: "paragraph",
            text: "The smoothness of the graph reflects the continuous movement around the circle. There are no sudden jumps between the key points.",
            id: "graph-shape-paragraph-5"
          }
        ]
      },
      {
        id: "radians-on-graph",
        title: "The Sine Graph in Radians",
        content: [
          {
            type: "paragraph",
            text: "Graphs of trigonometric functions are commonly drawn using radians on the horizontal axis. This is especially important in more advanced mathematics because radians provide a natural connection between angles and circular geometry.",
            id: "radians-on-graph-paragraph-1"
          },
          {
            type: "paragraph",
            text: "The five key points of one sine cycle become \\((0,0)\\), \\(\\left(\\frac{\\pi}{2},1\\right)\\), \\((\\pi,0)\\), \\(\\left(\\frac{3\\pi}{2},-1\\right)\\), and \\((2\\pi,0)\\).",
            id: "radians-on-graph-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The distance from \\(0\\) to \\(2\\pi\\) represents one complete cycle. Thus, the period of the basic sine function is naturally written as \\(2\\pi\\) when the input is measured in radians.",
            id: "radians-on-graph-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The degree and radian graphs represent the same mathematical behavior. Only the numerical labels on the horizontal axis change.",
            id: "radians-on-graph-paragraph-4"
          }
        ]
      },
      {
        id: "negative-inputs",
        title: "What Happens for Negative Angles?",
        content: [
          {
            type: "paragraph",
            text: "The sine function is defined for negative angles as well. A negative angle represents rotation in the clockwise direction.",
            id: "negative-inputs-paragraph-1"
          },
          {
            type: "paragraph",
            text: "For example, \\(-90^\\circ\\) means a clockwise quarter-turn. The corresponding point on the unit circle is \\((0,-1)\\), so \\(\\sin(-90^\\circ)=-1\\).",
            id: "negative-inputs-paragraph-2"
          },
          {
            type: "paragraph",
            text: "There is an important symmetry property: \\(\\sin(-x)=-\\sin x\\). This means that sine is an odd function.",
            id: "negative-inputs-paragraph-3"
          },
          {
            type: "paragraph",
            text: "For example, since \\(\\sin30^\\circ=\\frac{1}{2}\\), we have \\(\\sin(-30^\\circ)=-\\frac{1}{2}\\).",
            id: "negative-inputs-paragraph-4"
          },
          {
            type: "paragraph",
            text: "On the graph, this property means the sine curve has rotational symmetry about the origin.",
            id: "negative-inputs-paragraph-5"
          }
        ]
      },
      {
        id: "periodicity-examples",
        title: "Using the Period to Find Sine Values",
        content: [
          {
            type: "paragraph",
            text: "Because sine has period \\(2\\pi\\), angles that differ by a whole number of complete revolutions have the same sine value.",
            id: "periodicity-examples-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Suppose we want to find \\(\\sin\\left(\\frac{13\\pi}{6}\\right)\\). Subtract one complete revolution, \\(2\\pi=\\frac{12\\pi}{6}\\). This gives \\(\\frac{13\\pi}{6}-\\frac{12\\pi}{6}=\\frac{\\pi}{6}\\). Therefore, \\(\\sin\\left(\\frac{13\\pi}{6}\\right)=\\sin\\left(\\frac{\\pi}{6}\\right)=\\frac{1}{2}\\).",
            id: "periodicity-examples-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The same idea works with degrees. For example, \\(\\sin420^\\circ=\\sin60^\\circ=\\frac{\\sqrt{3}}{2}\\), because \\(420^\\circ-360^\\circ=60^\\circ\\).",
            id: "periodicity-examples-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Periodicity allows us to reduce large angles to simpler coterminal angles without changing the sine value.",
            id: "periodicity-examples-paragraph-4"
          }
        ]
      },
      {
        id: "building-graph-step-by-step",
        title: "How to Draw the Basic Sine Graph",
        content: [
          {
            type: "paragraph",
            text: "To draw \\(y=\\sin x\\), begin by choosing one complete interval such as \\(0\\leq x\\leq2\\pi\\).",
            id: "building-graph-step-by-step-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Step 1: Mark the five important x-values: \\(0\\), \\(\\frac{\\pi}{2}\\), \\(\\pi\\), \\(\\frac{3\\pi}{2}\\), and \\(2\\pi\\).",
            id: "building-graph-step-by-step-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Step 2: Determine the corresponding sine values: \\(0\\), \\(1\\), \\(0\\), \\(-1\\), and \\(0\\).",
            id: "building-graph-step-by-step-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Step 3: Plot the points \\((0,0)\\), \\(\\frac{\\pi}{2},1\\), \\((\\pi,0)\\), \\(\\frac{3\\pi}{2},-1\\), and \\((2\\pi,0)\\).",
            id: "building-graph-step-by-step-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Step 4: Connect the points using a smooth curve. The curve should rise from zero to one, fall through zero to negative one, and rise back to zero.",
            id: "building-graph-step-by-step-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Step 5: Extend the pattern to the left and right because sine continues indefinitely and repeats every \\(2\\pi\\).",
            id: "building-graph-step-by-step-paragraph-6"
          }
        ]
      },
      {
        id: "worked-graph-examples",
        title: "Worked Examples",
        content: [
          {
            type: "paragraph",
            text: "Example 1: Find the maximum value of \\(y=\\sin x\\). Since the range of sine is \\([-1,1]\\), the maximum value is \\(1\\).",
            id: "worked-graph-examples-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Example 2: Find the minimum value of \\(y=\\sin x\\). The minimum possible sine value is \\(-1\\). Therefore, the minimum is \\(-1\\).",
            id: "worked-graph-examples-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Example 3: Find the period of \\(y=\\sin x\\). One complete cycle corresponds to one complete revolution, which is \\(2\\pi\\) radians. Therefore, the period is \\(2\\pi\\).",
            id: "worked-graph-examples-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Example 4: Evaluate \\(\\sin\\left(\\frac{5\\pi}{2}\\right)\\). Since \\(\\frac{5\\pi}{2}=2\\pi+\\frac{\\pi}{2}\\), periodicity gives \\(\\sin\\left(\\frac{5\\pi}{2}\\right)=\\sin\\left(\\frac{\\pi}{2}\\right)=1\\).",
            id: "worked-graph-examples-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Example 5: Evaluate \\(\\sin\\left(-\\frac{\\pi}{2}\\right)\\). A clockwise quarter-turn reaches the point \\((0,-1)\\). Therefore, \\(\\sin\\left(-\\frac{\\pi}{2}\\right)=-1\\).",
            id: "worked-graph-examples-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Example 6: Determine whether \\(\\sin300^\\circ\\) is positive or negative. Since \\(300^\\circ\\) lies in the fourth quadrant, its y-coordinate is negative. Therefore, \\(\\sin300^\\circ<0\\).",
            id: "worked-graph-examples-paragraph-6"
          },
          {
            type: "paragraph",
            text: "Example 7: Evaluate \\(\\sin390^\\circ\\). Subtract one complete revolution: \\(390^\\circ-360^\\circ=30^\\circ\\). Therefore, \\(\\sin390^\\circ=\\sin30^\\circ=\\frac{1}{2}\\).",
            id: "worked-graph-examples-paragraph-7"
          },
          {
            type: "paragraph",
            text: "Example 8: Determine the amplitude of \\(y=4\\sin x\\). The amplitude is the absolute value of the coefficient of sine: \\(|4|=4\\). Therefore, the graph reaches a maximum of \\(4\\) and a minimum of \\(-4\\).",
            id: "worked-graph-examples-paragraph-8"
          },
          {
            type: "paragraph",
            text: "Example 9: Determine the five key points of \\(y=\\sin x\\) over \\([0,2\\pi]\\). The x-values are \\(0,\\frac{\\pi}{2},\\pi,\\frac{3\\pi}{2},2\\pi\\), and the corresponding y-values are \\(0,1,0,-1,0\\).",
            id: "worked-graph-examples-paragraph-9"
          },
          {
            type: "paragraph",
            text: "Example 10: Explain why \\(\\sin x\\) can never equal \\(2\\). On the unit circle, sine is the y-coordinate of a point whose distance from the origin is \\(1\\). No point on that circle has a y-coordinate of \\(2\\). Therefore, \\(\\sin x=2\\) has no real solution.",
            id: "worked-graph-examples-paragraph-10"
          }
        ]
      },
      {
        id: "visual-unit-circle-graph",
        title: "Visual Exploration: Circle and Graph Together",
        content: [
          {
            type: "paragraph",
            text: "One of the most effective ways to understand the sine graph is to connect it directly to the unit circle. Imagine a point moving counterclockwise around the circle while a graph is drawn beside it.",
            id: "visual-unit-circle-graph-paragraph-1"
          },
          {
            type: "paragraph",
            text: "At every moment, take the point's vertical coordinate and use it as the y-coordinate of a new point on the graph. The angle used to locate the point on the circle becomes the x-coordinate on the graph.",
            id: "visual-unit-circle-graph-paragraph-2"
          },
          {
            type: "paragraph",
            text: "When the circle point is at the top, the graph reaches \\(1\\). When the point crosses the horizontal axis, the graph is at \\(0\\). When the point reaches the bottom, the graph reaches \\(-1\\).",
            id: "visual-unit-circle-graph-paragraph-3"
          },
          {
            type: "paragraph",
            text: "This visualization turns the sine graph from a curve to memorize into a consequence of circular motion.",
            id: "visual-unit-circle-graph-paragraph-4"
          }
        ]
      },
      {
        id: "big-picture",
        title: "The Big Picture",
        content: [
          {
            type: "paragraph",
            text: "The basic sine function is \\(y=\\sin x\\). Its input is an angle and its output is the corresponding sine value.",
            id: "big-picture-paragraph-1"
          },
          {
            type: "paragraph",
            text: "The unit circle provides the geometric meaning of sine: for an angle \\(x\\), the sine value is the y-coordinate of the corresponding point on the unit circle.",
            id: "big-picture-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Because the unit-circle y-coordinate always lies between \\(-1\\) and \\(1\\), the sine function has range \\([-1,1]\\). Its maximum is \\(1\\), and its minimum is \\(-1\\).",
            id: "big-picture-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The sine pattern repeats after one complete revolution, so its period is \\(2\\pi\\) radians or \\(360^\\circ\\). Its five key points over one cycle are \\((0,0)\\), \\(\\left(\\frac{\\pi}{2},1\\right)\\), \\((\\pi,0)\\), \\(\\left(\\frac{3\\pi}{2},-1\\right)\\), and \\((2\\pi,0)\\).",
            id: "big-picture-paragraph-4"
          },
          {
            type: "paragraph",
            text: "The amplitude of the basic sine function is \\(1\\). Together, amplitude and period describe two of the most important features of the sine wave.",
            id: "big-picture-paragraph-5"
          },
          {
            type: "paragraph",
            text: "The key conceptual idea is that the sine graph is not an isolated picture. It is a visual record of the vertical coordinate of a point moving around the unit circle.",
            id: "big-picture-paragraph-6"
          }
        ]
      }
    ]
  },
  formulas: [
    {
      id: "basic-sine-function",
      name: "Basic Sine Function",
      expression: "\\(y=\\sin x\\)",
      explanation: "The basic sine function takes an angle x as input and returns its sine value."
    },
    {
      id: "unit-circle-sine",
      name: "Unit-Circle Definition of Sine",
      expression: "\\((\\cos x,\\sin x)\\)",
      explanation: "For an angle x on the unit circle, the corresponding point has x-coordinate cos x and y-coordinate sin x."
    },
    {
      id: "sine-range",
      name: "Range of Sine",
      expression: "\\(-1\\leq\\sin x\\leq1\\)",
      explanation: "The sine value is the vertical coordinate of a point on the unit circle, so it can never be outside the interval from -1 to 1."
    },
    {
      id: "sine-period",
      name: "Period of Sine",
      expression: "\\(\\sin(x+2\\pi)=\\sin x\\)",
      explanation: "Adding one complete revolution, 2\u03C0 radians, does not change the sine value. Therefore, the basic sine function has period 2\u03C0."
    },
    {
      id: "sine-degree-period",
      name: "Sine Period in Degrees",
      expression: "\\(\\sin(x+360^\\circ)=\\sin x\\)",
      explanation: "The same periodic behavior can be expressed using degrees. One complete revolution is 360 degrees."
    },
    {
      id: "sine-amplitude",
      name: "Amplitude of Basic Sine",
      expression: "\\(A=1\\)",
      explanation: "The basic sine function moves one unit above and one unit below its midline y = 0."
    },
    {
      id: "general-sine-amplitude",
      name: "Amplitude of A Sine Function",
      expression: "\\(\\text{Amplitude}=|A|\\)",
      explanation: "For a function of the form y = A sin x, the amplitude is the absolute value of A."
    },
    {
      id: "sine-zeros",
      name: "Zeros of Sine",
      expression: "\\(x=k\\pi,\\quad k\\in\\mathbb{Z}\\)",
      explanation: "Sine equals zero at every integer multiple of \u03C0 radians."
    },
    {
      id: "odd-symmetry",
      name: "Odd Symmetry of Sine",
      expression: "\\(\\sin(-x)=-\\sin x\\)",
      explanation: "Sine is an odd function, meaning changing the sign of the input changes the sign of the output."
    }
  ],
  examples: [
    {
      id: "example-maximum",
      question: "What is the maximum value of \\(y=\\sin x\\)?",
      solution: "The sine function has range \\([-1,1]\\). Therefore, its greatest possible value is \\(1\\)."
    },
    {
      id: "example-minimum",
      question: "What is the minimum value of \\(y=\\sin x\\)?",
      solution: "The sine function has range \\([-1,1]\\). Therefore, its smallest possible value is \\(-1\\)."
    },
    {
      id: "example-period",
      question: "What is the period of \\(y=\\sin x\\)?",
      solution: "One complete cycle corresponds to one complete revolution around the unit circle, which is \\(2\\pi\\) radians. Therefore, the period is \\(2\\pi\\)."
    },
    {
      id: "example-five-key-points",
      question: "Find the five key points of \\(y=\\sin x\\) on \\([0,2\\pi]\\).",
      solution: "Use the quarter-turn angles \\(0,\\frac{\\pi}{2},\\pi,\\frac{3\\pi}{2},2\\pi\\). Their sine values are \\(0,1,0,-1,0\\). Therefore, the points are \\((0,0)\\), \\(\\left(\\frac{\\pi}{2},1\\right)\\), \\((\\pi,0)\\), \\(\\left(\\frac{3\\pi}{2},-1\\right)\\), and \\((2\\pi,0)\\)."
    },
    {
      id: "example-periodic-angle",
      question: "Evaluate \\(\\sin\\left(\\frac{5\\pi}{2}\\right)\\).",
      solution: "Subtract one complete revolution: \\(\\frac{5\\pi}{2}-2\\pi=\\frac{\\pi}{2}\\). Therefore, \\(\\sin\\left(\\frac{5\\pi}{2}\\right)=\\sin\\left(\\frac{\\pi}{2}\\right)=1\\)."
    },
    {
      id: "example-degree-periodic",
      question: "Evaluate \\(\\sin390^\\circ\\).",
      solution: "Subtract one complete revolution: \\(390^\\circ-360^\\circ=30^\\circ\\). Therefore, \\(\\sin390^\\circ=\\sin30^\\circ=\\frac{1}{2}\\)."
    },
    {
      id: "example-negative-angle",
      question: "Evaluate \\(\\sin\\left(-\\frac{\\pi}{2}\\right)\\).",
      solution: "A negative quarter-turn is a clockwise rotation of \\(90^\\circ\\). The corresponding unit-circle point is \\((0,-1)\\), so \\(\\sin\\left(-\\frac{\\pi}{2}\\right)=-1\\)."
    },
    {
      id: "example-sign",
      question: "Is \\(\\sin300^\\circ\\) positive or negative?",
      solution: "\\(300^\\circ\\) lies in the fourth quadrant. Points in the fourth quadrant have negative y-coordinates. Since sine is the y-coordinate, \\(\\sin300^\\circ\\) is negative."
    },
    {
      id: "example-amplitude",
      question: "Find the amplitude of \\(y=4\\sin x\\).",
      solution: "For \\(y=A\\sin x\\), amplitude is \\(|A|\\). Here \\(A=4\\), so the amplitude is \\(|4|=4\\)."
    },
    {
      id: "example-impossible-sine",
      question: "Can \\(\\sin x=2\\) for a real angle x?",
      solution: "No. The range of sine is \\([-1,1]\\), so 2 is outside the possible output range. Therefore, there is no real angle whose sine is 2."
    }
  ],
  key_ideas: [
    "The basic sine function is written as \\(y=\\sin x\\).",
    "The input of sine is an angle.",
    "The output of sine is a real number between -1 and 1.",
    "The unit circle provides a geometric interpretation of sine.",
    "For a unit-circle point corresponding to angle x, the y-coordinate is \\(\\sin x\\).",
    "The basic sine function has maximum value 1.",
    "The basic sine function has minimum value -1.",
    "The range of sine is \\([-1,1]\\).",
    "The basic sine function has period \\(2\\pi\\) radians.",
    "The period is \\(360^\\circ\\) when degrees are used.",
    "One complete sine cycle corresponds to one complete revolution around the unit circle.",
    "The five key points of one cycle are obtained at quarter-turn intervals.",
    "The basic sine function has amplitude 1.",
    "Amplitude measures the maximum distance from the midline.",
    "The total vertical distance from maximum to minimum is twice the amplitude.",
    "Sine equals zero at integer multiples of \\(\\pi\\).",
    "Sine is positive in the first and second quadrants.",
    "Sine is negative in the third and fourth quadrants.",
    "Negative angles represent clockwise rotations.",
    "Sine satisfies \\(\\sin(-x)=-\\sin x\\).",
    "The sine graph is periodic.",
    "The wave shape of the sine graph comes from continuous circular motion.",
    "Degrees and radians describe the same angles using different numerical units.",
    "Large angles can be reduced by adding or subtracting complete revolutions.",
    "The sine graph can be constructed from unit-circle values.",
    "The graph of sine extends indefinitely in both directions.",
    "The sine function is bounded above by 1 and below by -1.",
    "The sine graph is a visual representation of changing vertical coordinates on the unit circle."
  ],
  misconceptions: [
    "The sine graph is simply a curve that must be memorized without a geometric explanation.",
    "Sine can produce values greater than 1 because triangle side lengths can be large.",
    "The amplitude of the basic sine function is 2 because the maximum and minimum differ by 2.",
    "The period of sine is \\(\\pi\\) instead of \\(2\\pi\\).",
    "Sine becomes undefined at some angles in the same way tangent does.",
    "The sine function is only defined between 0 and 360 degrees.",
    "Negative angles cannot be used as inputs to sine.",
    "A negative sine value means the angle itself is negative.",
    "The maximum value of sine occurs at 180 degrees.",
    "The minimum value of sine occurs at 180 degrees.",
    "The five key points are unrelated to the unit circle.",
    "A complete sine cycle ends permanently at 360 degrees.",
    "The sine function has different mathematical behavior in degrees and radians.",
    "Amplitude is the same thing as the total height of the wave.",
    "If an angle is larger than 360 degrees, sine cannot be evaluated.",
    "If sine is negative, the angle must be negative.",
    "The graph of sine has abrupt corners at its key points.",
    "The equation \\(\\sin x=2\\) has a real solution because sine is a ratio of side lengths."
  ],
  explorations: [
    {
      id: "explore-unit-circle-sine",
      type: "visualization"
    },
    {
      id: "explore-five-key-points",
      type: "visualization"
    },
    {
      id: "explore-periodicity",
      type: "why"
    },
    {
      id: "explore-amplitude",
      type: "visualization"
    },
    {
      id: "explore-negative-angles",
      type: "visualization"
    },
    {
      id: "explore-sine-range",
      type: "why"
    }
  ],
  sources: [
    "khan-academy-trigonometry",
    "openstax-precalculus"
  ]
};

// ../content/concepts/trigonometric-ratios/07_cosine-function.json
var cosine_function_default = {
  id: "cosine-function",
  title: "Cosine Function",
  subject: "mathematics",
  topic: "trigonometry",
  section: "intro-trigono",
  difficulty: 2,
  connections: {
    prerequisites: [
      "trigonometric-functions",
      "trigonometric-ratios-any-angle",
      "exact-trigonometric-values"
    ],
    leads_to: [
      "tangent-function"
    ],
    related: [
      "sine-function",
      "trigonometric-functions",
      "exact-trigonometric-values"
    ]
  },
  theory: {
    introduction: "The cosine function is one of the three fundamental trigonometric functions. It begins as a ratio in a right triangle, where cosine compares the adjacent side with the hypotenuse. When we extend this idea to the unit circle, cosine becomes the horizontal coordinate of a rotating point. This gives us a powerful way to understand the cosine function for every real angle. Its graph is a smooth repeating wave with a maximum value of 1, a minimum value of -1, an amplitude of 1, and a period of 2\u03C0 radians. Understanding how the unit circle produces the cosine graph provides the foundation for studying more advanced trigonometric functions and transformations.",
    sections: [
      {
        id: "what-is-cosine-function",
        title: "What Is the Cosine Function?",
        content: [
          {
            type: "paragraph",
            text: "The cosine function takes an angle as its input and produces a numerical value as its output. We write the basic cosine function as \\(y=\\cos x\\), where \\(x\\) is the input angle and \\(y\\) is the resulting cosine value.",
            id: "what-is-cosine-function-paragraph-1"
          },
          {
            type: "paragraph",
            text: "In right-triangle trigonometry, cosine is defined as the ratio of the adjacent side to the hypotenuse: \\(\\cos\\theta=\\frac{\\text{adjacent}}{\\text{hypotenuse}}\\). This tells us how strongly the adjacent side compares with the hypotenuse for a particular angle.",
            id: "what-is-cosine-function-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Because similar triangles preserve side ratios, the cosine value depends on the angle rather than the size of the triangle. A small triangle and a large triangle with the same angle will have the same cosine.",
            id: "what-is-cosine-function-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The right-triangle definition is especially useful for acute angles, but it does not by itself provide a complete definition for every possible real angle. The unit circle extends the idea naturally.",
            id: "what-is-cosine-function-paragraph-4"
          },
          {
            type: "paragraph",
            text: "For an angle \\(x\\), the corresponding point on the unit circle has coordinates \\((\\cos x,\\sin x)\\). Therefore, cosine can be understood as the horizontal coordinate of the rotating point.",
            id: "what-is-cosine-function-paragraph-5"
          }
        ]
      },
      {
        id: "unit-circle-cosine",
        title: "Cosine on the Unit Circle",
        content: [
          {
            type: "paragraph",
            text: "The unit circle is a circle centered at the origin with radius \\(1\\). It provides a geometric interpretation of the trigonometric functions for arbitrary angles.",
            id: "unit-circle-cosine-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Imagine a radius starting on the positive x-axis and rotating counterclockwise through an angle \\(x\\). The endpoint of the radius lies on the unit circle.",
            id: "unit-circle-cosine-paragraph-2"
          },
          {
            type: "paragraph",
            text: "If the endpoint has coordinates \\((X,Y)\\), then the distance from the origin is \\(1\\). The coordinates of the point are precisely \\((\\cos x,\\sin x)\\). Thus, the horizontal coordinate is \\(\\cos x\\).",
            id: "unit-circle-cosine-paragraph-3"
          },
          {
            type: "paragraph",
            text: "At \\(0^\\circ\\), the point is \\((1,0)\\), so \\(\\cos0^\\circ=1\\). At \\(90^\\circ\\), the point is \\((0,1)\\), so \\(\\cos90^\\circ=0\\).",
            id: "unit-circle-cosine-paragraph-4"
          },
          {
            type: "paragraph",
            text: "At \\(180^\\circ\\), the point is \\((-1,0)\\), so \\(\\cos180^\\circ=-1\\). At \\(270^\\circ\\), the point is \\((0,-1)\\), so \\(\\cos270^\\circ=0\\). Finally, at \\(360^\\circ\\), the point returns to \\((1,0)\\), so \\(\\cos360^\\circ=1\\).",
            id: "unit-circle-cosine-paragraph-5"
          },
          {
            type: "paragraph",
            text: "These values form the foundation of one complete cycle of the cosine graph.",
            id: "unit-circle-cosine-paragraph-6"
          }
        ]
      },
      {
        id: "cosine-key-points",
        title: "The Five Key Points of One Cycle",
        content: [
          {
            type: "paragraph",
            text: "The basic cosine graph can be constructed using five important points over one complete revolution.",
            id: "cosine-key-points-paragraph-1"
          },
          {
            type: "paragraph",
            text: "At \\(0^\\circ\\), cosine is \\(1\\). This is the starting point and also the maximum value of the basic cosine function.",
            id: "cosine-key-points-paragraph-2"
          },
          {
            type: "paragraph",
            text: "At \\(90^\\circ\\), cosine is \\(0\\). The graph crosses its middle level.",
            id: "cosine-key-points-paragraph-3"
          },
          {
            type: "paragraph",
            text: "At \\(180^\\circ\\), cosine is \\(-1\\). The graph reaches its minimum value.",
            id: "cosine-key-points-paragraph-4"
          },
          {
            type: "paragraph",
            text: "At \\(270^\\circ\\), cosine is \\(0\\). The graph returns to its middle level.",
            id: "cosine-key-points-paragraph-5"
          },
          {
            type: "paragraph",
            text: "At \\(360^\\circ\\), cosine is \\(1\\). The graph returns to its starting value and completes one cycle.",
            id: "cosine-key-points-paragraph-6"
          },
          {
            type: "paragraph",
            text: "The five key points are therefore \\((0,1)\\), \\((90^\\circ,0)\\), \\((180^\\circ,-1)\\), \\((270^\\circ,0)\\), and \\((360^\\circ,1)\\).",
            id: "cosine-key-points-paragraph-7"
          },
          {
            type: "paragraph",
            text: "In radians, the same points are \\((0,1)\\), \\(\\left(\\frac{\\pi}{2},0\\right)\\), \\((\\pi,-1)\\), \\(\\left(\\frac{3\\pi}{2},0\\right)\\), and \\((2\\pi,1)\\).",
            id: "cosine-key-points-paragraph-8"
          }
        ]
      },
      {
        id: "why-cosine-starts-at-one",
        title: "Why Does Cosine Start at 1?",
        content: [
          {
            type: "paragraph",
            text: "A common question is why the cosine graph begins at \\(1\\), while the sine graph begins at \\(0\\). The answer comes directly from the unit circle.",
            id: "why-cosine-starts-at-one-paragraph-1"
          },
          {
            type: "paragraph",
            text: "At angle \\(0\\), the radius points directly along the positive x-axis. The endpoint of the radius is therefore \\((1,0)\\).",
            id: "why-cosine-starts-at-one-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Cosine represents the horizontal coordinate, so the cosine value is the x-coordinate \\(1\\). Therefore, \\(\\cos0=1\\).",
            id: "why-cosine-starts-at-one-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Sine represents the vertical coordinate. At the same point, the y-coordinate is \\(0\\), which explains \\(\\sin0=0\\).",
            id: "why-cosine-starts-at-one-paragraph-4"
          },
          {
            type: "paragraph",
            text: "This difference in starting position is one of the simplest and most important ways to distinguish the basic sine and cosine graphs.",
            id: "why-cosine-starts-at-one-paragraph-5"
          }
        ]
      },
      {
        id: "one-complete-cycle",
        title: "Understanding One Complete Cosine Cycle",
        content: [
          {
            type: "paragraph",
            text: "A cycle is one complete repetition of a periodic pattern. For the basic cosine function, one cycle corresponds to one complete revolution around the unit circle.",
            id: "one-complete-cycle-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Starting at \\(0^\\circ\\), cosine begins at its maximum value \\(1\\). As the point rotates toward \\(90^\\circ\\), its x-coordinate decreases from \\(1\\) to \\(0\\).",
            id: "one-complete-cycle-paragraph-2"
          },
          {
            type: "paragraph",
            text: "From \\(90^\\circ\\) to \\(180^\\circ\\), the x-coordinate becomes negative and reaches \\(-1\\) at \\(180^\\circ\\). The cosine graph therefore reaches its minimum.",
            id: "one-complete-cycle-paragraph-3"
          },
          {
            type: "paragraph",
            text: "From \\(180^\\circ\\) to \\(270^\\circ\\), the x-coordinate increases from \\(-1\\) to \\(0\\). From \\(270^\\circ\\) to \\(360^\\circ\\), it continues increasing until it reaches \\(1\\).",
            id: "one-complete-cycle-paragraph-4"
          },
          {
            type: "paragraph",
            text: "After \\(360^\\circ\\), the same pattern repeats. This repeating behavior means cosine is periodic.",
            id: "one-complete-cycle-paragraph-5"
          }
        ]
      },
      {
        id: "period",
        title: "The Period of the Cosine Function",
        content: [
          {
            type: "paragraph",
            text: "The period of a function is the length of the smallest positive interval after which its values repeat in exactly the same pattern.",
            id: "period-paragraph-1"
          },
          {
            type: "paragraph",
            text: "For the basic cosine function, one complete pattern requires one complete revolution. Therefore, the period is \\(360^\\circ\\), or \\(2\\pi\\) radians.",
            id: "period-paragraph-2"
          },
          {
            type: "paragraph",
            text: "This periodicity can be written as \\(\\cos(x+2\\pi)=\\cos x\\). In degrees, it becomes \\(\\cos(x+360^\\circ)=\\cos x\\).",
            id: "period-paragraph-3"
          },
          {
            type: "paragraph",
            text: "For example, \\(\\cos60^\\circ=\\frac{1}{2}\\). Adding a complete revolution gives \\(420^\\circ\\), and \\(\\cos420^\\circ=\\frac{1}{2}\\).",
            id: "period-paragraph-4"
          },
          {
            type: "paragraph",
            text: "The function does not stop after one cycle. It continues indefinitely in both directions, producing the same pattern again and again.",
            id: "period-paragraph-5"
          }
        ]
      },
      {
        id: "maximum-and-minimum",
        title: "Maximum and Minimum Values",
        content: [
          {
            type: "paragraph",
            text: "The maximum value of a function is its greatest possible output, while the minimum value is its smallest possible output.",
            id: "maximum-and-minimum-paragraph-1"
          },
          {
            type: "paragraph",
            text: "For the basic cosine function, the maximum value is \\(1\\). It occurs whenever the rotating point reaches the far right side of the unit circle.",
            id: "maximum-and-minimum-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The minimum value is \\(-1\\). It occurs whenever the rotating point reaches the far left side of the unit circle.",
            id: "maximum-and-minimum-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Therefore, for every real angle \\(x\\), we have \\(-1\\leq\\cos x\\leq1\\).",
            id: "maximum-and-minimum-paragraph-4"
          },
          {
            type: "paragraph",
            text: "The maximum occurs at angles such as \\(0^\\circ\\), \\(360^\\circ\\), and \\(720^\\circ\\). The minimum occurs at angles such as \\(180^\\circ\\), \\(540^\\circ\\), and \\(-180^\\circ\\).",
            id: "maximum-and-minimum-paragraph-5"
          }
        ]
      },
      {
        id: "amplitude",
        title: "Amplitude of the Cosine Function",
        content: [
          {
            type: "paragraph",
            text: "Amplitude describes the maximum distance between the graph and its midline. For the basic cosine function, the midline is \\(y=0\\).",
            id: "amplitude-paragraph-1"
          },
          {
            type: "paragraph",
            text: "The cosine graph rises to \\(1\\) and falls to \\(-1\\). Therefore, its greatest distance from the midline is \\(1\\). The amplitude of \\(y=\\cos x\\) is therefore \\(1\\).",
            id: "amplitude-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The total vertical distance between the maximum and minimum is \\(2\\), but this is not the amplitude. Amplitude is only the distance from the midline to either extreme.",
            id: "amplitude-paragraph-3"
          },
          {
            type: "paragraph",
            text: "For a function of the form \\(y=A\\cos x\\), the amplitude is \\(|A|\\). For example, \\(y=5\\cos x\\) has amplitude \\(5\\), maximum value \\(5\\), and minimum value \\(-5\\).",
            id: "amplitude-paragraph-4"
          }
        ]
      },
      {
        id: "zeros",
        title: "Where Does Cosine Equal Zero?",
        content: [
          {
            type: "paragraph",
            text: "A zero is an input for which the function's output is zero. On the graph, zeros occur where the curve meets the x-axis.",
            id: "zeros-paragraph-1"
          },
          {
            type: "paragraph",
            text: "On the unit circle, cosine is the horizontal coordinate. Therefore, cosine equals zero whenever the point lies on the vertical axis.",
            id: "zeros-paragraph-2"
          },
          {
            type: "paragraph",
            text: "This occurs at \\(90^\\circ\\), \\(270^\\circ\\), \\(450^\\circ\\), and so on. In radians, the zeros occur at \\(\\frac{\\pi}{2}\\), \\(\\frac{3\\pi}{2}\\), \\(\\frac{5\\pi}{2}\\), and so forth.",
            id: "zeros-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The general form is \\(x=\\frac{\\pi}{2}+k\\pi\\), where \\(k\\in\\mathbb{Z}\\).",
            id: "zeros-paragraph-4"
          },
          {
            type: "paragraph",
            text: "For example, \\(\\cos\\frac{\\pi}{2}=0\\), \\(\\cos\\frac{3\\pi}{2}=0\\), and \\(\\cos\\left(-\\frac{\\pi}{2}\\right)=0\\).",
            id: "zeros-paragraph-5"
          }
        ]
      },
      {
        id: "sign-of-cosine",
        title: "Why Does Cosine Change Sign?",
        content: [
          {
            type: "paragraph",
            text: "Cosine can be positive, zero, or negative because the x-coordinate of a point on the unit circle can have all three possibilities.",
            id: "sign-of-cosine-paragraph-1"
          },
          {
            type: "paragraph",
            text: "In the first and fourth quadrants, points have positive x-coordinates. Therefore, cosine is positive in these quadrants.",
            id: "sign-of-cosine-paragraph-2"
          },
          {
            type: "paragraph",
            text: "In the second and third quadrants, points have negative x-coordinates. Therefore, cosine is negative in these quadrants.",
            id: "sign-of-cosine-paragraph-3"
          },
          {
            type: "paragraph",
            text: "On the vertical axis, the x-coordinate is zero. Therefore, cosine is zero at the corresponding angles.",
            id: "sign-of-cosine-paragraph-4"
          },
          {
            type: "paragraph",
            text: "For example, \\(\\cos120^\\circ<0\\) because \\(120^\\circ\\) lies in the second quadrant. On the other hand, \\(\\cos300^\\circ>0\\) because \\(300^\\circ\\) lies in the fourth quadrant.",
            id: "sign-of-cosine-paragraph-5"
          }
        ]
      },
      {
        id: "graph-shape",
        title: "Understanding the Shape of the Cosine Curve",
        content: [
          {
            type: "paragraph",
            text: "The cosine graph is a smooth repeating wave. Its shape comes from the continuous change of the horizontal coordinate as a point moves around the unit circle.",
            id: "graph-shape-paragraph-1"
          },
          {
            type: "paragraph",
            text: "The graph starts at its highest point, \\(1\\), because the point begins at the far right of the unit circle. It then falls smoothly toward zero as the point moves upward.",
            id: "graph-shape-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The graph continues downward into negative values as the point moves into the left half of the circle. It reaches its minimum of \\(-1\\) at \\(180^\\circ\\).",
            id: "graph-shape-paragraph-3"
          },
          {
            type: "paragraph",
            text: "After \\(180^\\circ\\), the horizontal coordinate begins increasing again. The graph rises through zero at \\(270^\\circ\\) and returns to \\(1\\) at \\(360^\\circ\\).",
            id: "graph-shape-paragraph-4"
          },
          {
            type: "paragraph",
            text: "The graph is smooth because the rotating point moves continuously around the circle.",
            id: "graph-shape-paragraph-5"
          }
        ]
      },
      {
        id: "radians",
        title: "The Cosine Graph in Radians",
        content: [
          {
            type: "paragraph",
            text: "Although degrees are useful for introductory trigonometry, radians are commonly used when studying trigonometric functions and their graphs.",
            id: "radians-paragraph-1"
          },
          {
            type: "paragraph",
            text: "The five key points for one cycle of \\(y=\\cos x\\) in radians are \\((0,1)\\), \\(\\left(\\frac{\\pi}{2},0\\right)\\), \\((\\pi,-1)\\), \\(\\left(\\frac{3\\pi}{2},0\\right)\\), and \\((2\\pi,1)\\).",
            id: "radians-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The distance from \\(0\\) to \\(2\\pi\\) on the horizontal axis represents one complete cycle. This is why the period of the basic cosine function is written as \\(2\\pi\\).",
            id: "radians-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The degree and radian versions describe the same curve behavior. The only difference is the numerical scale used for the angle.",
            id: "radians-paragraph-4"
          }
        ]
      },
      {
        id: "negative-inputs",
        title: "Cosine of Negative Angles",
        content: [
          {
            type: "paragraph",
            text: "Negative angles represent clockwise rotations. The cosine function is defined for negative angles just as it is for positive angles.",
            id: "negative-inputs-paragraph-1"
          },
          {
            type: "paragraph",
            text: "For example, \\(-60^\\circ\\) represents a clockwise rotation of \\(60^\\circ\\). The corresponding point on the unit circle has the same horizontal coordinate as the point at \\(60^\\circ\\). Therefore, \\(\\cos(-60^\\circ)=\\cos60^\\circ=\\frac{1}{2}\\).",
            id: "negative-inputs-paragraph-2"
          },
          {
            type: "paragraph",
            text: "This leads to the identity \\(\\cos(-x)=\\cos x\\). The cosine function is therefore called an even function.",
            id: "negative-inputs-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Geometrically, this happens because reflecting an angle across the x-axis changes the sign of the y-coordinate but leaves the x-coordinate unchanged. Since cosine is the x-coordinate, its value remains the same.",
            id: "negative-inputs-paragraph-4"
          },
          {
            type: "paragraph",
            text: "On the graph, this property means the cosine curve has symmetry about the y-axis.",
            id: "negative-inputs-paragraph-5"
          }
        ]
      },
      {
        id: "periodicity",
        title: "Using Periodicity to Simplify Angles",
        content: [
          {
            type: "paragraph",
            text: "Since cosine has period \\(2\\pi\\), adding or subtracting complete revolutions does not change its value.",
            id: "periodicity-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Suppose we want to evaluate \\(\\cos\\left(\\frac{13\\pi}{6}\\right)\\). One complete revolution is \\(2\\pi=\\frac{12\\pi}{6}\\). Subtracting it gives \\(\\frac{13\\pi}{6}-\\frac{12\\pi}{6}=\\frac{\\pi}{6}\\). Therefore, \\(\\cos\\left(\\frac{13\\pi}{6}\\right)=\\cos\\frac{\\pi}{6}=\\frac{\\sqrt{3}}{2}\\).",
            id: "periodicity-paragraph-2"
          },
          {
            type: "paragraph",
            text: "In degrees, \\(\\cos420^\\circ=\\cos60^\\circ=\\frac{1}{2}\\), because \\(420^\\circ-360^\\circ=60^\\circ\\).",
            id: "periodicity-paragraph-3"
          },
          {
            type: "paragraph",
            text: "This method is especially useful for angles larger than one complete revolution.",
            id: "periodicity-paragraph-4"
          }
        ]
      },
      {
        id: "building-graph",
        title: "How to Draw the Basic Cosine Graph",
        content: [
          {
            type: "paragraph",
            text: "To draw \\(y=\\cos x\\), begin by choosing one complete cycle, such as \\(0\\leq x\\leq2\\pi\\).",
            id: "building-graph-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Step 1: Mark the five important x-values: \\(0\\), \\(\\frac{\\pi}{2}\\), \\(\\pi\\), \\(\\frac{3\\pi}{2}\\), and \\(2\\pi\\).",
            id: "building-graph-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Step 2: Find their cosine values: \\(1\\), \\(0\\), \\(-1\\), \\(0\\), and \\(1\\).",
            id: "building-graph-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Step 3: Plot the points \\((0,1)\\), \\(\\left(\\frac{\\pi}{2},0\\right)\\), \\((\\pi,-1)\\), \\(\\left(\\frac{3\\pi}{2},0\\right)\\), and \\((2\\pi,1)\\).",
            id: "building-graph-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Step 4: Connect the points using a smooth curve. The curve starts at its maximum, falls through the midline, reaches its minimum, rises through the midline, and returns to its maximum.",
            id: "building-graph-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Step 5: Continue the same pattern to the left and right because cosine is periodic.",
            id: "building-graph-paragraph-6"
          }
        ]
      },
      {
        id: "sine-and-cosine-relationship",
        title: "Relationship Between Sine and Cosine",
        content: [
          {
            type: "paragraph",
            text: "Sine and cosine are closely connected because they come from the same point on the unit circle. For an angle \\(x\\), the point has coordinates \\((\\cos x,\\sin x)\\).",
            id: "sine-and-cosine-relationship-paragraph-1"
          },
          {
            type: "paragraph",
            text: "This means cosine records the horizontal movement of the point while sine records the vertical movement.",
            id: "sine-and-cosine-relationship-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Their basic graphs have the same amplitude and period. Both have range \\([-1,1]\\), and both repeat every \\(2\\pi\\). Their main difference is where each cycle begins.",
            id: "sine-and-cosine-relationship-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The sine graph begins at zero and initially rises, while the cosine graph begins at its maximum value of one and initially falls.",
            id: "sine-and-cosine-relationship-paragraph-4"
          },
          {
            type: "paragraph",
            text: "A deeper relationship between the two functions will become important when studying transformations and identities. At this stage, the key idea is that both functions describe different coordinates of the same rotating point.",
            id: "sine-and-cosine-relationship-paragraph-5"
          }
        ]
      },
      {
        id: "worked-examples",
        title: "Worked Examples",
        content: [
          {
            type: "paragraph",
            text: "Example 1: Find \\(\\cos0^\\circ\\). At \\(0^\\circ\\), the unit-circle point is \\((1,0)\\). Cosine is the x-coordinate, so \\(\\cos0^\\circ=1\\).",
            id: "worked-examples-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Example 2: Find \\(\\cos180^\\circ\\). At \\(180^\\circ\\), the unit-circle point is \\((-1,0)\\). Therefore, \\(\\cos180^\\circ=-1\\).",
            id: "worked-examples-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Example 3: Find the maximum value of \\(y=\\cos x\\). Since cosine has range \\([-1,1]\\), the maximum value is \\(1\\).",
            id: "worked-examples-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Example 4: Find the minimum value of \\(y=\\cos x\\). The smallest possible cosine value is \\(-1\\). Therefore, the minimum is \\(-1\\).",
            id: "worked-examples-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Example 5: Find the period of \\(y=\\cos x\\). One complete cycle corresponds to one complete revolution, which is \\(2\\pi\\) radians. Therefore, the period is \\(2\\pi\\).",
            id: "worked-examples-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Example 6: Evaluate \\(\\cos420^\\circ\\). Subtract one complete revolution: \\(420^\\circ-360^\\circ=60^\\circ\\). Therefore, \\(\\cos420^\\circ=\\cos60^\\circ=\\frac{1}{2}\\).",
            id: "worked-examples-paragraph-6"
          },
          {
            type: "paragraph",
            text: "Example 7: Evaluate \\(\\cos(-60^\\circ)\\). Cosine is an even function, so \\(\\cos(-60^\\circ)=\\cos60^\\circ=\\frac{1}{2}\\).",
            id: "worked-examples-paragraph-7"
          },
          {
            type: "paragraph",
            text: "Example 8: Determine whether \\(\\cos240^\\circ\\) is positive or negative. Since \\(240^\\circ\\) lies in the third quadrant, the x-coordinate is negative. Therefore, \\(\\cos240^\\circ<0\\).",
            id: "worked-examples-paragraph-8"
          },
          {
            type: "paragraph",
            text: "Example 9: Find the amplitude of \\(y=3\\cos x\\). The amplitude is \\(|3|=3\\). Therefore, the graph reaches a maximum of \\(3\\) and a minimum of \\(-3\\).",
            id: "worked-examples-paragraph-9"
          },
          {
            type: "paragraph",
            text: "Example 10: Find the zeros of \\(\\cos x\\). Cosine is zero whenever the point lies on the vertical axis. Therefore, \\(x=\\frac{\\pi}{2}+k\\pi\\), where \\(k\\in\\mathbb{Z}\\).",
            id: "worked-examples-paragraph-10"
          }
        ]
      },
      {
        id: "visual-exploration",
        title: "Visual Exploration: The Rotating Point and Cosine Graph",
        content: [
          {
            type: "paragraph",
            text: "A powerful visualization is to place a unit circle next to a coordinate graph. Let a point rotate around the circle while simultaneously plotting its horizontal coordinate against the angle.",
            id: "visual-exploration-paragraph-1"
          },
          {
            type: "paragraph",
            text: "At \\(0^\\circ\\), the point is at the far right, so the graph begins at \\(1\\). As the point moves upward, its horizontal coordinate decreases and the graph moves downward.",
            id: "visual-exploration-paragraph-2"
          },
          {
            type: "paragraph",
            text: "When the point reaches the top of the circle at \\(90^\\circ\\), its horizontal coordinate is zero and the graph crosses the x-axis.",
            id: "visual-exploration-paragraph-3"
          },
          {
            type: "paragraph",
            text: "When the point reaches the far left at \\(180^\\circ\\), the horizontal coordinate is \\(-1\\), producing the minimum of the cosine graph.",
            id: "visual-exploration-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Continuing the rotation causes the horizontal coordinate to increase again, producing the upward portion of the graph.",
            id: "visual-exploration-paragraph-5"
          },
          {
            type: "paragraph",
            text: "This visualization makes the cosine graph a direct consequence of circular motion rather than a curve that must simply be memorized.",
            id: "visual-exploration-paragraph-6"
          }
        ]
      },
      {
        id: "common-mistakes",
        title: "Common Mistakes to Avoid",
        content: [
          {
            type: "paragraph",
            text: "Mistake 1: Thinking the cosine graph starts at zero. The basic cosine graph starts at \\(1\\), because \\(\\cos0=1\\).",
            id: "common-mistakes-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Mistake 2: Thinking cosine can be greater than 1 or less than -1. For real angles, cosine always lies between \\(-1\\) and \\(1\\).",
            id: "common-mistakes-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Mistake 3: Confusing amplitude with total height. The basic cosine graph has amplitude \\(1\\), even though its maximum-to-minimum height is \\(2\\).",
            id: "common-mistakes-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Mistake 4: Thinking the period of cosine is \\(\\pi\\). The basic cosine function repeats every \\(2\\pi\\).",
            id: "common-mistakes-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Mistake 5: Assuming cosine is negative in the fourth quadrant. Cosine represents the x-coordinate, which is positive in the fourth quadrant.",
            id: "common-mistakes-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Mistake 6: Thinking negative angles cannot be used. Cosine is defined for negative angles and satisfies \\(\\cos(-x)=\\cos x\\).",
            id: "common-mistakes-paragraph-6"
          },
          {
            type: "paragraph",
            text: "Mistake 7: Treating degrees and radians as different mathematical functions. They are simply different units for measuring the same angle.",
            id: "common-mistakes-paragraph-7"
          },
          {
            type: "paragraph",
            text: "Mistake 8: Memorizing the five graph points without understanding their connection to the unit circle. The points are much easier to remember when they are derived from the rotating point.",
            id: "common-mistakes-paragraph-8"
          }
        ]
      },
      {
        id: "big-picture",
        title: "The Big Picture",
        content: [
          {
            type: "paragraph",
            text: "The basic cosine function is \\(y=\\cos x\\). Its input is an angle and its output is a real number between \\(-1\\) and \\(1\\).",
            id: "big-picture-paragraph-1"
          },
          {
            type: "paragraph",
            text: "The unit circle gives cosine a clear geometric meaning. For an angle \\(x\\), the corresponding point on the unit circle is \\((\\cos x,\\sin x)\\), so cosine is the horizontal coordinate.",
            id: "big-picture-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The cosine function has maximum value \\(1\\), minimum value \\(-1\\), amplitude \\(1\\), and period \\(2\\pi\\) radians.",
            id: "big-picture-paragraph-3"
          },
          {
            type: "paragraph",
            text: "One complete cycle is represented by the five key points \\((0,1)\\), \\(\\left(\\frac{\\pi}{2},0\\right)\\), \\((\\pi,-1)\\), \\(\\left(\\frac{3\\pi}{2},0\\right)\\), and \\((2\\pi,1)\\).",
            id: "big-picture-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Cosine is positive when the rotating point is on the right half of the unit circle and negative when it is on the left half.",
            id: "big-picture-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Cosine is also an even function, meaning \\(\\cos(-x)=\\cos x\\). Geometrically, this happens because reflecting a point across the x-axis changes its vertical coordinate but leaves its horizontal coordinate unchanged.",
            id: "big-picture-paragraph-6"
          },
          {
            type: "paragraph",
            text: "The most important idea is that the cosine graph is a record of the horizontal coordinate of a point moving around the unit circle. Once this connection is understood, its key points, range, amplitude, period, signs, and repeating behavior all become consequences of the same geometric picture.",
            id: "big-picture-paragraph-7"
          }
        ]
      }
    ]
  },
  formulas: [
    {
      id: "basic-cosine-function",
      name: "Basic Cosine Function",
      expression: "\\(y=\\cos x\\)",
      explanation: "The basic cosine function takes an angle x as input and returns its cosine value."
    },
    {
      id: "unit-circle-cosine",
      name: "Unit-Circle Definition of Cosine",
      expression: "\\((\\cos x,\\sin x)\\)",
      explanation: "For an angle x on the unit circle, cosine is the x-coordinate of the corresponding point."
    },
    {
      id: "cosine-range",
      name: "Range of Cosine",
      expression: "\\(-1\\leq\\cos x\\leq1\\)",
      explanation: "The cosine value is the horizontal coordinate of a point on the unit circle, so it cannot be outside the interval from -1 to 1."
    },
    {
      id: "cosine-period",
      name: "Period of Cosine",
      expression: "\\(\\cos(x+2\\pi)=\\cos x\\)",
      explanation: "Adding one complete revolution does not change the cosine value, so the basic cosine function has period 2\u03C0."
    },
    {
      id: "cosine-degree-period",
      name: "Cosine Period in Degrees",
      expression: "\\(\\cos(x+360^\\circ)=\\cos x\\)",
      explanation: "The same periodic behavior can be expressed using degrees."
    },
    {
      id: "cosine-amplitude",
      name: "Amplitude of Basic Cosine",
      expression: "\\(A=1\\)",
      explanation: "The basic cosine function moves one unit above and one unit below its midline."
    },
    {
      id: "general-cosine-amplitude",
      name: "Amplitude of A Cosine Function",
      expression: "\\(\\text{Amplitude}=|A|\\)",
      explanation: "For a function of the form y = A cos x, the amplitude is the absolute value of A."
    },
    {
      id: "cosine-zeros",
      name: "Zeros of Cosine",
      expression: "\\(x=\\frac{\\pi}{2}+k\\pi,\\quad k\\in\\mathbb{Z}\\)",
      explanation: "Cosine equals zero whenever the corresponding point on the unit circle lies on the vertical axis."
    },
    {
      id: "even-symmetry",
      name: "Even Symmetry of Cosine",
      expression: "\\(\\cos(-x)=\\cos x\\)",
      explanation: "Cosine is an even function, so opposite inputs produce the same output."
    }
  ],
  examples: [
    {
      id: "example-cos-zero",
      question: "Find \\(\\cos0^\\circ\\).",
      solution: "At \\(0^\\circ\\), the unit-circle point is \\((1,0)\\). Cosine is the x-coordinate, so \\(\\cos0^\\circ=1\\)."
    },
    {
      id: "example-cos-180",
      question: "Find \\(\\cos180^\\circ\\).",
      solution: "At \\(180^\\circ\\), the unit-circle point is \\((-1,0)\\). Therefore, \\(\\cos180^\\circ=-1\\)."
    },
    {
      id: "example-maximum",
      question: "What is the maximum value of \\(y=\\cos x\\)?",
      solution: "The range of cosine is \\([-1,1]\\). Therefore, its maximum value is \\(1\\)."
    },
    {
      id: "example-minimum",
      question: "What is the minimum value of \\(y=\\cos x\\)?",
      solution: "The range of cosine is \\([-1,1]\\). Therefore, its minimum value is \\(-1\\)."
    },
    {
      id: "example-period",
      question: "What is the period of \\(y=\\cos x\\)?",
      solution: "One complete cycle corresponds to one complete revolution, which is \\(2\\pi\\) radians. Therefore, the period is \\(2\\pi\\)."
    },
    {
      id: "example-periodic-value",
      question: "Evaluate \\(\\cos420^\\circ\\).",
      solution: "Subtract one complete revolution: \\(420^\\circ-360^\\circ=60^\\circ\\). Therefore, \\(\\cos420^\\circ=\\cos60^\\circ=\\frac{1}{2}\\)."
    },
    {
      id: "example-negative-angle",
      question: "Evaluate \\(\\cos(-60^\\circ)\\).",
      solution: "Cosine is an even function, so \\(\\cos(-60^\\circ)=\\cos60^\\circ=\\frac{1}{2}\\)."
    },
    {
      id: "example-sign",
      question: "Is \\(\\cos240^\\circ\\) positive or negative?",
      solution: "\\(240^\\circ\\) lies in the third quadrant, where x-coordinates are negative. Since cosine is the x-coordinate, \\(\\cos240^\\circ\\) is negative."
    },
    {
      id: "example-amplitude",
      question: "Find the amplitude of \\(y=3\\cos x\\).",
      solution: "For \\(y=A\\cos x\\), the amplitude is \\(|A|\\). Here \\(A=3\\), so the amplitude is \\(3\\)."
    },
    {
      id: "example-zeros",
      question: "Find the zeros of \\(\\cos x\\).",
      solution: "Cosine is zero whenever the corresponding unit-circle point lies on the vertical axis. Therefore, \\(x=\\frac{\\pi}{2}+k\\pi\\), where \\(k\\in\\mathbb{Z}\\)."
    },
    {
      id: "example-large-radian",
      question: "Evaluate \\(\\cos\\left(\\frac{13\\pi}{6}\\right)\\).",
      solution: "Subtract one complete revolution: \\(\\frac{13\\pi}{6}-2\\pi=\\frac{\\pi}{6}\\). Therefore, \\(\\cos\\left(\\frac{13\\pi}{6}\\right)=\\cos\\frac{\\pi}{6}=\\frac{\\sqrt{3}}{2}\\)."
    }
  ],
  key_ideas: [
    "The basic cosine function is written as \\(y=\\cos x\\).",
    "The input of cosine is an angle.",
    "The output of cosine is a real number between -1 and 1.",
    "The unit circle provides the geometric interpretation of cosine.",
    "For a unit-circle point corresponding to angle x, the x-coordinate is \\(\\cos x\\).",
    "The basic cosine function starts at 1 when x = 0.",
    "The maximum value of the basic cosine function is 1.",
    "The minimum value of the basic cosine function is -1.",
    "The range of cosine is \\([-1,1]\\).",
    "The basic cosine function has amplitude 1.",
    "The basic cosine function has period \\(2\\pi\\) radians.",
    "The period is \\(360^\\circ\\) when degrees are used.",
    "One complete cosine cycle corresponds to one complete revolution around the unit circle.",
    "The five key points of one cycle occur at quarter-turn intervals.",
    "Cosine equals zero whenever the corresponding point lies on the vertical axis.",
    "The zeros of cosine are \\(x=\\frac{\\pi}{2}+k\\pi\\).",
    "Cosine is positive in the first and fourth quadrants.",
    "Cosine is negative in the second and third quadrants.",
    "Negative angles represent clockwise rotations.",
    "Cosine satisfies \\(\\cos(-x)=\\cos x\\).",
    "Cosine is an even function.",
    "The cosine graph is periodic.",
    "The cosine graph is a visual record of horizontal coordinates on the unit circle.",
    "The amplitude is the distance from the midline to a maximum or minimum.",
    "The total vertical height of the basic cosine wave is 2, not its amplitude.",
    "Degrees and radians represent the same geometric angles using different numerical units.",
    "Large angles can be reduced by adding or subtracting complete revolutions.",
    "Sine and cosine describe different coordinates of the same rotating point."
  ],
  misconceptions: [
    "The cosine graph starts at zero.",
    "Cosine can have values greater than 1.",
    "Cosine can have values less than -1.",
    "The amplitude of the basic cosine graph is 2.",
    "The period of cosine is \\(\\pi\\).",
    "Cosine is negative in the fourth quadrant.",
    "Cosine is undefined at some angles like tangent.",
    "Negative angles cannot be used as inputs.",
    "A negative angle must always produce a negative cosine value.",
    "The cosine graph stops after one complete cycle.",
    "Degrees and radians describe different geometric angles.",
    "The five key points of the cosine graph must simply be memorized.",
    "The maximum value occurs at \\(180^\\circ\\).",
    "The minimum value occurs at \\(90^\\circ\\).",
    "The zeros of cosine occur at integer multiples of \\(\\pi\\).",
    "Amplitude and total vertical height are the same quantity.",
    "Cosine represents the vertical coordinate of the unit-circle point.",
    "Cosine and sine are unrelated functions."
  ],
  explorations: [
    {
      id: "explore-unit-circle-cosine",
      type: "visualization"
    },
    {
      id: "explore-five-key-points",
      type: "visualization"
    },
    {
      id: "explore-cosine-periodicity",
      type: "why"
    },
    {
      id: "explore-cosine-amplitude",
      type: "visualization"
    },
    {
      id: "explore-negative-angles",
      type: "visualization"
    },
    {
      id: "explore-sine-cosine-coordinates",
      type: "visualization"
    }
  ],
  sources: [
    "khan-academy-trigonometry",
    "openstax-precalculus"
  ]
};

// ../content/concepts/trigonometric-ratios/08_trigonometric-functions.json
var trigonometric_functions_default = {
  id: "trigonometric-functions",
  title: "Trigonometric Functions",
  subject: "mathematics",
  topic: "trigonometry",
  section: "intro-trigono",
  difficulty: 2,
  connections: {
    prerequisites: [
      "trigonometric-ratios",
      "trigonometric-ratios-any-angle",
      "exact-trigonometric-values"
    ],
    leads_to: [
      "sine-function",
      "cosine-function",
      "tangent-function"
    ],
    related: [
      "reciprocal-trigonometric-ratios",
      "exact-trigonometric-values"
    ]
  },
  theory: {
    introduction: "A trigonometric ratio such as sine, cosine, or tangent begins as a relationship between the sides of a right triangle. But trigonometry becomes much more powerful when we stop thinking of these ratios only as triangle calculations and recognize them as functions. A trigonometric function takes an angle as its input and produces a number as its output. This viewpoint allows us to study trigonometric quantities for every real angle, understand their domain and range, and eventually study their graphs, periodic behavior, and applications.",
    sections: [
      {
        id: "ratios-become-functions",
        title: "From Trigonometric Ratios to Functions",
        content: [
          {
            type: "paragraph",
            text: "In a right triangle, we learned that an angle can determine ratios between the sides. For example, for an angle \\(\\theta\\), sine is defined by \\(\\sin\\theta = \\frac{\\text{opposite}}{\\text{hypotenuse}}\\), cosine by \\(\\cos\\theta = \\frac{\\text{adjacent}}{\\text{hypotenuse}}\\), and tangent by \\(\\tan\\theta = \\frac{\\text{opposite}}{\\text{adjacent}}\\).",
            id: "ratios-become-functions-paragraph-1"
          },
          {
            type: "paragraph",
            text: "The important observation is that these ratios depend on the angle, not on the particular size of the triangle. If two right triangles contain the same acute angle, they are similar, so their corresponding side lengths have the same proportions. Therefore, a particular angle is associated with a particular trigonometric value.",
            id: "ratios-become-functions-paragraph-2"
          },
          {
            type: "paragraph",
            text: "This gives us the idea of a function. A function is a rule that assigns an output to an input. In a trigonometric function, the input is an angle and the output is the corresponding trigonometric value.",
            id: "ratios-become-functions-paragraph-3"
          },
          {
            type: "paragraph",
            text: "For example, when we write \\(\\sin 30^\\circ = \\frac{1}{2}\\), we can interpret this as saying that the sine function takes the angle \\(30^\\circ\\) as its input and produces \\(\\frac{1}{2}\\) as its output.",
            id: "ratios-become-functions-paragraph-4"
          },
          {
            type: "paragraph",
            text: "The function viewpoint is more general than simply calculating a side of a triangle. Instead of asking only for the missing side of one triangle, we can ask what value the function produces for any angle.",
            id: "ratios-become-functions-paragraph-5"
          }
        ]
      },
      {
        id: "input-output-idea",
        title: "Angle as Input and Ratio as Output",
        content: [
          {
            type: "paragraph",
            text: "A useful way to understand a trigonometric function is to imagine a machine. You give the machine an angle, and the function produces a number. For sine, the machine is called the sine function. For cosine, it is the cosine function. For tangent, it is the tangent function.",
            id: "input-output-idea-paragraph-1"
          },
          {
            type: "paragraph",
            text: "For example, the sine function gives \\(\\sin 30^\\circ = \\frac{1}{2}\\), \\(\\sin 45^\\circ = \\frac{\\sqrt{2}}{2}\\), and \\(\\sin 90^\\circ = 1\\). The angle is the input and the resulting number is the output.",
            id: "input-output-idea-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The output is not necessarily a side length. It is a dimensionless ratio. This is important because the same angle can occur in triangles of many different sizes, but the corresponding trigonometric ratio remains the same.",
            id: "input-output-idea-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Once trigonometric ratios are treated as functions, we can also consider angles outside the range of a single right triangle. Using the coordinate-plane definition of trigonometric functions, sine, cosine, and tangent can be associated with positive, negative, and larger angles.",
            id: "input-output-idea-paragraph-4"
          },
          {
            type: "paragraph",
            text: "This is the bridge between elementary right-triangle trigonometry and the broader study of trigonometric functions.",
            id: "input-output-idea-paragraph-5"
          }
        ]
      },
      {
        id: "function-notation",
        title: "Understanding Function Notation",
        content: [
          {
            type: "paragraph",
            text: "Function notation tells us explicitly which input is being given to a function. For ordinary functions, we might write \\(f(x)\\). In trigonometry, we commonly use \\(\\sin(x)\\), \\(\\cos(x)\\), and \\(\\tan(x)\\).",
            id: "function-notation-paragraph-1"
          },
          {
            type: "paragraph",
            text: "The expression \\(\\sin(x)\\) means the value produced by the sine function when the input is \\(x\\). Similarly, \\(\\cos(x)\\) means the value produced by cosine for input \\(x\\), and \\(\\tan(x)\\) means the value produced by tangent for input \\(x\\).",
            id: "function-notation-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The parentheses do not mean multiplication. In \\(\\sin(x)\\), the \\(x\\) is the input of the sine function.",
            id: "function-notation-paragraph-3"
          },
          {
            type: "paragraph",
            text: "For example, \\(\\sin(30^\\circ)\\) and \\(\\sin 30^\\circ\\) mean the same thing. Both represent the sine of an angle measuring \\(30^\\circ\\).",
            id: "function-notation-paragraph-4"
          },
          {
            type: "paragraph",
            text: "It is also important to distinguish the function from its value. \\(\\sin(x)\\) refers to the sine function applied to an input \\(x\\), while \\(\\sin(30^\\circ) = \\frac{1}{2}\\) is a particular output of that function.",
            id: "function-notation-paragraph-5"
          }
        ]
      },
      {
        id: "sine-function",
        title: "The Sine Function",
        content: [
          {
            type: "paragraph",
            text: "The sine function associates every allowed angle with a numerical value. In the right-triangle setting, sine is the ratio of the opposite side to the hypotenuse. For an angle \\(\\theta\\), this is written as \\(\\sin\\theta = \\frac{\\text{opposite}}{\\text{hypotenuse}}\\).",
            id: "sine-function-paragraph-1"
          },
          {
            type: "paragraph",
            text: "For angles between \\(0^\\circ\\) and \\(90^\\circ\\), the right-triangle definition gives an intuitive interpretation of sine. For example, \\(\\sin 30^\\circ = \\frac{1}{2}\\), because in a \\(30^\\circ\\)-\\(60^\\circ\\)-\\(90^\\circ\\) triangle, the side opposite \\(30^\\circ\\) is half the hypotenuse.",
            id: "sine-function-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The coordinate-plane definition extends sine beyond acute angles. If an angle in standard position has a terminal point \\((x,y)\\) at distance \\(r\\) from the origin, then \\(\\sin\\theta = \\frac{y}{r}\\). Since \\(r\\) is nonnegative, the sign of sine is determined by the sign of the y-coordinate.",
            id: "sine-function-paragraph-3"
          },
          {
            type: "paragraph",
            text: "This explains why sine can be positive or negative when we consider angles in different quadrants. The sine function is therefore not restricted to values between \\(0\\) and \\(1\\); its values range from \\(-1\\) to \\(1\\).",
            id: "sine-function-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Some important values are \\(\\sin 0^\\circ = 0\\), \\(\\sin 30^\\circ = \\frac{1}{2}\\), \\(\\sin 45^\\circ = \\frac{\\sqrt{2}}{2}\\), \\(\\sin 60^\\circ = \\frac{\\sqrt{3}}{2}\\), and \\(\\sin 90^\\circ = 1\\).",
            id: "sine-function-paragraph-5"
          }
        ]
      },
      {
        id: "cosine-function",
        title: "The Cosine Function",
        content: [
          {
            type: "paragraph",
            text: "The cosine function also associates an angle with a numerical value. In a right triangle, cosine is the ratio of the adjacent side to the hypotenuse: \\(\\cos\\theta = \\frac{\\text{adjacent}}{\\text{hypotenuse}}\\).",
            id: "cosine-function-paragraph-1"
          },
          {
            type: "paragraph",
            text: "For example, \\(\\cos 60^\\circ = \\frac{1}{2}\\). In a \\(30^\\circ\\)-\\(60^\\circ\\)-\\(90^\\circ\\) triangle, the side adjacent to \\(60^\\circ\\) has length \\(1\\) when the hypotenuse has length \\(2\\).",
            id: "cosine-function-paragraph-2"
          },
          {
            type: "paragraph",
            text: "For an angle in standard position with terminal point \\((x,y)\\) and distance \\(r\\) from the origin, cosine is defined by \\(\\cos\\theta = \\frac{x}{r}\\). The x-coordinate therefore determines the sign of cosine.",
            id: "cosine-function-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Because the x-coordinate can be positive or negative, cosine can also be positive or negative. Its possible outputs range from \\(-1\\) to \\(1\\).",
            id: "cosine-function-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Important values include \\(\\cos 0^\\circ = 1\\), \\(\\cos 30^\\circ = \\frac{\\sqrt{3}}{2}\\), \\(\\cos 45^\\circ = \\frac{\\sqrt{2}}{2}\\), \\(\\cos 60^\\circ = \\frac{1}{2}\\), and \\(\\cos 90^\\circ = 0\\).",
            id: "cosine-function-paragraph-5"
          }
        ]
      },
      {
        id: "tangent-function",
        title: "The Tangent Function",
        content: [
          {
            type: "paragraph",
            text: "The tangent function is defined in a right triangle as the ratio of the opposite side to the adjacent side: \\(\\tan\\theta = \\frac{\\text{opposite}}{\\text{adjacent}}\\).",
            id: "tangent-function-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Unlike sine and cosine, tangent is not restricted to values between \\(-1\\) and \\(1\\). For example, \\(\\tan 45^\\circ = 1\\), but \\(\\tan 60^\\circ = \\sqrt{3}\\), which is greater than \\(1\\). Tangent can become even larger as the angle approaches certain angles.",
            id: "tangent-function-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Tangent can also be expressed using sine and cosine. Whenever cosine is defined and nonzero, \\(\\tan\\theta = \\frac{\\sin\\theta}{\\cos\\theta}\\). This relationship follows directly from the coordinate definitions because \\(\\sin\\theta = \\frac{y}{r}\\) and \\(\\cos\\theta = \\frac{x}{r}\\), giving \\(\\frac{y/r}{x/r} = \\frac{y}{x}\\).",
            id: "tangent-function-paragraph-3"
          },
          {
            type: "paragraph",
            text: "This also explains why tangent becomes undefined when cosine is zero. Division by zero is not defined, so tangent cannot have a finite value at those angles.",
            id: "tangent-function-paragraph-4"
          },
          {
            type: "paragraph",
            text: "For example, \\(\\tan 90^\\circ\\) is undefined because \\(\\cos 90^\\circ = 0\\). Similarly, tangent is undefined at angles such as \\(270^\\circ\\).",
            id: "tangent-function-paragraph-5"
          }
        ]
      },
      {
        id: "three-functions-together",
        title: "Sine, Cosine and Tangent Together",
        content: [
          {
            type: "paragraph",
            text: "The three basic trigonometric functions are closely connected. In a right triangle, sine compares opposite to hypotenuse, cosine compares adjacent to hypotenuse, and tangent compares opposite to adjacent.",
            id: "three-functions-together-paragraph-1"
          },
          {
            type: "paragraph",
            text: "The mnemonic SOH-CAH-TOA summarizes these three definitions: Sine = Opposite/Hypotenuse, Cosine = Adjacent/Hypotenuse, and Tangent = Opposite/Adjacent.",
            id: "three-functions-together-paragraph-2"
          },
          {
            type: "paragraph",
            text: "There is also an algebraic relationship between the functions: \\(\\tan\\theta = \\frac{\\sin\\theta}{\\cos\\theta}\\), whenever \\(\\cos\\theta \\neq 0\\).",
            id: "three-functions-together-paragraph-3"
          },
          {
            type: "paragraph",
            text: "These functions should not be thought of as three unrelated rules. They describe different relationships associated with the same angle. Knowing one ratio and additional information about the angle can often help determine another.",
            id: "three-functions-together-paragraph-4"
          },
          {
            type: "paragraph",
            text: "For example, at \\(45^\\circ\\), we know \\(\\sin45^\\circ = \\frac{\\sqrt{2}}{2}\\) and \\(\\cos45^\\circ = \\frac{\\sqrt{2}}{2}\\). Therefore, \\(\\tan45^\\circ = \\frac{\\sin45^\\circ}{\\cos45^\\circ} = 1\\).",
            id: "three-functions-together-paragraph-5"
          }
        ]
      },
      {
        id: "domain-and-range-introduction",
        title: "Understanding Domain and Range",
        content: [
          {
            type: "paragraph",
            text: "When we study a function, two important questions are: What inputs are allowed? And what outputs can the function produce? The set of allowed inputs is called the domain. The set of possible outputs is called the range.",
            id: "domain-and-range-introduction-paragraph-1"
          },
          {
            type: "paragraph",
            text: "For a trigonometric function, the domain consists of the angles for which the function has a defined value. The range consists of all numerical values that the function can produce.",
            id: "domain-and-range-introduction-paragraph-2"
          },
          {
            type: "paragraph",
            text: "For example, sine is defined for every real angle, and its values always lie between \\(-1\\) and \\(1\\). Therefore, the domain of sine is all real numbers and its range is \\([-1,1]\\).",
            id: "domain-and-range-introduction-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Cosine has the same domain and range: every real angle is allowed, and its output is always between \\(-1\\) and \\(1\\).",
            id: "domain-and-range-introduction-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Tangent is different. Because \\(\\tan\\theta = \\frac{\\sin\\theta}{\\cos\\theta}\\), tangent is undefined whenever \\(\\cos\\theta = 0\\). This happens at angles such as \\(90^\\circ\\), \\(270^\\circ\\), and more generally at odd multiples of \\(90^\\circ\\).",
            id: "domain-and-range-introduction-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Tangent can produce every real number. It has no maximum or minimum output. Its range is therefore all real numbers.",
            id: "domain-and-range-introduction-paragraph-6"
          }
        ]
      },
      {
        id: "sine-domain-range",
        title: "Domain and Range of Sine",
        content: [
          {
            type: "paragraph",
            text: "The sine function is defined for every real-number angle. An angle can represent any amount of rotation, including positive rotations, negative rotations, and rotations greater than one complete revolution.",
            id: "sine-domain-range-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Therefore, the domain of sine is all real numbers: \\(\\mathbb{R}\\).",
            id: "sine-domain-range-paragraph-2"
          },
          {
            type: "paragraph",
            text: "To understand the range, use the coordinate-plane or unit-circle interpretation. Sine corresponds to the vertical coordinate of a point on the unit circle. A point on the unit circle can never have a y-coordinate greater than \\(1\\) or less than \\(-1\\).",
            id: "sine-domain-range-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Therefore, the output of sine can never exceed \\(1\\) or fall below \\(-1\\). Both endpoints are actually reached: \\(\\sin90^\\circ = 1\\) and \\(\\sin270^\\circ = -1\\).",
            id: "sine-domain-range-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Thus, the range of sine is \\([-1,1]\\).",
            id: "sine-domain-range-paragraph-5"
          },
          {
            type: "paragraph",
            text: "The fact that sine always remains within this interval will become especially important when we later study the graph and behavior of the sine function.",
            id: "sine-domain-range-paragraph-6"
          }
        ]
      },
      {
        id: "cosine-domain-range",
        title: "Domain and Range of Cosine",
        content: [
          {
            type: "paragraph",
            text: "Like sine, cosine is defined for every real-number angle. There is no real angle for which the coordinate definition of cosine breaks down. Therefore, the domain of cosine is all real numbers: \\(\\mathbb{R}\\).",
            id: "cosine-domain-range-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Cosine represents the horizontal coordinate of a point on the unit circle. Since the x-coordinate of any point on the unit circle lies between \\(-1\\) and \\(1\\), cosine can never produce a value outside that interval.",
            id: "cosine-domain-range-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The endpoints are reached. At \\(0^\\circ\\), the point on the unit circle is \\((1,0)\\), so \\(\\cos0^\\circ = 1\\). At \\(180^\\circ\\), the point is \\((-1,0)\\), so \\(\\cos180^\\circ = -1\\).",
            id: "cosine-domain-range-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Therefore, the range of cosine is also \\([-1,1]\\).",
            id: "cosine-domain-range-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Sine and cosine have the same domain and range, but they assign different values to most angles because they represent different coordinates of the rotating point.",
            id: "cosine-domain-range-paragraph-5"
          }
        ]
      },
      {
        id: "tangent-domain-range",
        title: "Domain and Range of Tangent",
        content: [
          {
            type: "paragraph",
            text: "Tangent requires more care because it involves division. We have \\(\\tan\\theta = \\frac{\\sin\\theta}{\\cos\\theta}\\). A fraction cannot have zero as its denominator, so tangent is undefined whenever \\(\\cos\\theta = 0\\).",
            id: "tangent-domain-range-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Cosine is zero at \\(90^\\circ\\), \\(270^\\circ\\), and every angle obtained by adding or subtracting another multiple of \\(180^\\circ\\). In radians, these angles are represented by \\(\\frac{\\pi}{2} + k\\pi\\), where \\(k\\) is any integer.",
            id: "tangent-domain-range-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Therefore, the domain of tangent is all real numbers except angles of the form \\(\\frac{\\pi}{2} + k\\pi\\), where \\(k\\in\\mathbb{Z}\\).",
            id: "tangent-domain-range-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Unlike sine and cosine, tangent has no upper or lower bound. It can produce values such as \\(0\\), \\(1\\), \\(-1\\), \\(\\sqrt{3}\\), \\(-\\sqrt{3}\\), and arbitrarily large positive or negative values.",
            id: "tangent-domain-range-paragraph-4"
          },
          {
            type: "paragraph",
            text: "For example, \\(\\tan45^\\circ = 1\\), while \\(\\tan60^\\circ = \\sqrt{3}\\). As an angle approaches \\(90^\\circ\\) from one side, the magnitude of tangent becomes extremely large, even though tangent is not defined exactly at \\(90^\\circ\\).",
            id: "tangent-domain-range-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Therefore, the range of tangent is all real numbers: \\(\\mathbb{R}\\).",
            id: "tangent-domain-range-paragraph-6"
          }
        ]
      },
      {
        id: "why-tangent-undefined",
        title: "Why Is Tangent Undefined at Certain Angles?",
        content: [
          {
            type: "paragraph",
            text: "The simplest reason tangent is undefined at certain angles is that its definition requires division by cosine: \\(\\tan\\theta = \\frac{\\sin\\theta}{\\cos\\theta}\\). If cosine equals zero, the denominator becomes zero.",
            id: "why-tangent-undefined-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Consider \\(90^\\circ\\). We know \\(\\sin90^\\circ = 1\\) and \\(\\cos90^\\circ = 0\\). Therefore, \\(\\tan90^\\circ = \\frac{1}{0}\\), which is undefined.",
            id: "why-tangent-undefined-paragraph-2"
          },
          {
            type: "paragraph",
            text: "It is important not to say that tangent is equal to infinity at \\(90^\\circ\\). Infinity is not a normal real-number output of the function. The correct statement is that tangent is undefined at \\(90^\\circ\\).",
            id: "why-tangent-undefined-paragraph-3"
          },
          {
            type: "paragraph",
            text: "We can also see this from the right-triangle definition. Tangent is opposite divided by adjacent. At the corresponding axis position, the horizontal component that plays the role of the adjacent quantity becomes zero, so the division cannot be performed.",
            id: "why-tangent-undefined-paragraph-4"
          },
          {
            type: "paragraph",
            text: "The same problem occurs every \\(180^\\circ\\). Thus, tangent is undefined at \\(90^\\circ + 180^\\circ k\\), where \\(k\\) is any integer.",
            id: "why-tangent-undefined-paragraph-5"
          }
        ]
      },
      {
        id: "reciprocal-functions-domain-range",
        title: "Domain and Range of Secant, Cosecant and Cotangent",
        content: [
          {
            type: "paragraph",
            text: "The reciprocal trigonometric functions are secant, cosecant, and cotangent. They are defined through the reciprocals of cosine, sine, and tangent respectively: \\(\\sec\\theta = \\frac{1}{\\cos\\theta}\\), \\(\\csc\\theta = \\frac{1}{\\sin\\theta}\\), and \\(\\cot\\theta = \\frac{1}{\\tan\\theta}\\).",
            id: "reciprocal-functions-domain-range-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Because these definitions involve division, we must identify where their denominators are zero.",
            id: "reciprocal-functions-domain-range-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Secant is undefined whenever cosine is zero. Therefore, its domain excludes angles \\(\\frac{\\pi}{2}+k\\pi\\). Since cosine lies between \\(-1\\) and \\(1\\), its reciprocal can never lie strictly between \\(-1\\) and \\(1\\). Therefore, the range of secant is \\((-\u221E,-1]\\cup[1,\u221E)\\).",
            id: "reciprocal-functions-domain-range-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Cosecant is undefined whenever sine is zero. Sine equals zero at integer multiples of \\(\\pi\\), so the domain of cosecant excludes \\(k\\pi\\). Its range is \\((-\u221E,-1]\\cup[1,\u221E)\\).",
            id: "reciprocal-functions-domain-range-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Cotangent can be written as \\(\\cot\\theta = \\frac{\\cos\\theta}{\\sin\\theta}\\). Therefore, cotangent is undefined whenever sine is zero. Its domain excludes integer multiples of \\(\\pi\\). Cotangent can produce every real number, so its range is \\(\\mathbb{R}\\).",
            id: "reciprocal-functions-domain-range-paragraph-5"
          },
          {
            type: "paragraph",
            text: "These domain and range restrictions follow naturally from the reciprocal relationships rather than being arbitrary rules to memorize.",
            id: "reciprocal-functions-domain-range-paragraph-6"
          }
        ]
      },
      {
        id: "degrees-and-radians",
        title: "Angles as Inputs: Degrees and Radians",
        content: [
          {
            type: "paragraph",
            text: "An angle can be measured using degrees or radians. Both units describe the same geometric angle, but they use different numerical measurements.",
            id: "degrees-and-radians-paragraph-1"
          },
          {
            type: "paragraph",
            text: "A complete revolution is \\(360^\\circ\\), which is equivalent to \\(2\\pi\\) radians. A half revolution is \\(180^\\circ = \\pi\\) radians, and a quarter revolution is \\(90^\\circ = \\frac{\\pi}{2}\\) radians.",
            id: "degrees-and-radians-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The trigonometric functions themselves do not fundamentally change when we switch units. Only the numerical representation of the input angle changes.",
            id: "degrees-and-radians-paragraph-3"
          },
          {
            type: "paragraph",
            text: "For example, \\(\\sin90^\\circ = 1\\) and \\(\\sin\\left(\\frac{\\pi}{2}\\right) = 1\\). These are the same angle expressed in different units.",
            id: "degrees-and-radians-paragraph-4"
          },
          {
            type: "paragraph",
            text: "When working with a calculator, the angle mode matters. If the calculator is set to degree mode, entering \\(\\sin(30)\\) means the sine of \\(30^\\circ\\). In radian mode, it means the sine of \\(30\\) radians. These are completely different angles.",
            id: "degrees-and-radians-paragraph-5"
          }
        ]
      },
      {
        id: "worked-examples",
        title: "Worked Examples",
        content: [
          {
            type: "paragraph",
            text: "Example 1: Evaluate \\(\\sin30^\\circ\\). From the exact-value results, \\(\\sin30^\\circ = \\frac{1}{2}\\). The input is \\(30^\\circ\\), and the output is \\(\\frac{1}{2}\\).",
            id: "worked-examples-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Example 2: Evaluate \\(\\cos60^\\circ\\). From the exact-value table, \\(\\cos60^\\circ = \\frac{1}{2}\\).",
            id: "worked-examples-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Example 3: Evaluate \\(\\tan45^\\circ\\). Since \\(\\sin45^\\circ = \\frac{\\sqrt{2}}{2}\\) and \\(\\cos45^\\circ = \\frac{\\sqrt{2}}{2}\\), we get \\(\\tan45^\\circ = \\frac{\\sin45^\\circ}{\\cos45^\\circ} = 1\\).",
            id: "worked-examples-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Example 4: Determine whether \\(\\tan90^\\circ\\) is defined. We know \\(\\cos90^\\circ = 0\\). Therefore, \\(\\tan90^\\circ = \\frac{\\sin90^\\circ}{\\cos90^\\circ} = \\frac{1}{0}\\), which is undefined.",
            id: "worked-examples-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Example 5: Determine the domain of \\(\\tan x\\). Tangent is undefined whenever \\(\\cos x = 0\\). This occurs at \\(x = \\frac{\\pi}{2}+k\\pi\\), where \\(k\\in\\mathbb{Z}\\). Therefore, every real number is allowed except these angles.",
            id: "worked-examples-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Example 6: Determine the range of \\(\\sin x\\). Since sine represents the vertical coordinate of a point on the unit circle, its value cannot be less than \\(-1\\) or greater than \\(1\\). Both endpoints occur, so the range is \\([-1,1]\\).",
            id: "worked-examples-paragraph-6"
          },
          {
            type: "paragraph",
            text: "Example 7: Determine the range of \\(\\tan x\\). Tangent is not bounded above or below. It can take any real value. Therefore, its range is \\(\\mathbb{R}\\).",
            id: "worked-examples-paragraph-7"
          },
          {
            type: "paragraph",
            text: "Example 8: Find \\(\\tan60^\\circ\\) using sine and cosine. We know \\(\\sin60^\\circ = \\frac{\\sqrt{3}}{2}\\) and \\(\\cos60^\\circ = \\frac{1}{2}\\). Therefore, \\(\\tan60^\\circ = \\frac{\\sin60^\\circ}{\\cos60^\\circ} = \\frac{\\sqrt{3}/2}{1/2} = \\sqrt{3}\\).",
            id: "worked-examples-paragraph-8"
          },
          {
            type: "paragraph",
            text: "Example 9: Find \\(\\sec60^\\circ\\). Since \\(\\sec\\theta = \\frac{1}{\\cos\\theta}\\) and \\(\\cos60^\\circ = \\frac{1}{2}\\), we obtain \\(\\sec60^\\circ = 2\\).",
            id: "worked-examples-paragraph-9"
          },
          {
            type: "paragraph",
            text: "Example 10: Find \\(\\csc30^\\circ\\). Since \\(\\csc\\theta = \\frac{1}{\\sin\\theta}\\) and \\(\\sin30^\\circ = \\frac{1}{2}\\), we obtain \\(\\csc30^\\circ = 2\\).",
            id: "worked-examples-paragraph-10"
          },
          {
            type: "paragraph",
            text: "Example 11: Find \\(\\cot45^\\circ\\). Since \\(\\cot\\theta = \\frac{1}{\\tan\\theta}\\) and \\(\\tan45^\\circ = 1\\), we obtain \\(\\cot45^\\circ = 1\\).",
            id: "worked-examples-paragraph-11"
          },
          {
            type: "paragraph",
            text: "Example 12: Explain why \\(\\sec90^\\circ\\) is undefined. Since \\(\\sec\\theta = \\frac{1}{\\cos\\theta}\\) and \\(\\cos90^\\circ = 0\\), we would have \\(\\sec90^\\circ = \\frac{1}{0}\\). Division by zero is undefined, so \\(\\sec90^\\circ\\) is undefined.",
            id: "worked-examples-paragraph-12"
          }
        ]
      },
      {
        id: "visualizing-functions",
        title: "A Visual Way to Think About Trigonometric Functions",
        content: [
          {
            type: "paragraph",
            text: "Imagine a point moving around a circle centered at the origin. As the point rotates, its horizontal and vertical coordinates continuously change.",
            id: "visualizing-functions-paragraph-1"
          },
          {
            type: "paragraph",
            text: "On a unit circle, the point corresponding to an angle \\(\\theta\\) has coordinates \\((\\cos\\theta,\\sin\\theta)\\). Therefore, cosine tells us the horizontal position of the point and sine tells us the vertical position.",
            id: "visualizing-functions-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Tangent can then be understood as the ratio of the vertical coordinate to the horizontal coordinate: \\(\\tan\\theta = \\frac{\\sin\\theta}{\\cos\\theta}\\), whenever the horizontal coordinate is not zero.",
            id: "visualizing-functions-paragraph-3"
          },
          {
            type: "paragraph",
            text: "This moving-point picture explains several properties at once. Sine and cosine stay between \\(-1\\) and \\(1\\) because the coordinates of a point on the unit circle cannot leave that interval. Tangent becomes undefined when the horizontal coordinate becomes zero.",
            id: "visualizing-functions-paragraph-4"
          },
          {
            type: "paragraph",
            text: "A useful visualization for the learning interface would show a rotating radius on a unit circle, display the current angle, and dynamically show the values of \\(\\sin\\theta\\), \\(\\cos\\theta\\), and \\(\\tan\\theta\\).",
            id: "visualizing-functions-paragraph-5"
          }
        ]
      },
      {
        id: "connecting-previous-topics",
        title: "Connecting This Topic to Earlier Ideas",
        content: [
          {
            type: "paragraph",
            text: "Trigonometric functions are not a completely new subject. They are a broader interpretation of the trigonometric ratios already studied.",
            id: "connecting-previous-topics-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Similar triangles explained why a fixed angle produces a fixed ratio. Right-triangle trigonometry gave us the definitions of sine, cosine, and tangent. Trigonometric ratios for any angle extended these ideas beyond acute angles using the coordinate plane. Exact values gave us important outputs for standard angles.",
            id: "connecting-previous-topics-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The function viewpoint now combines these ideas. An angle becomes the input, and the corresponding trigonometric ratio becomes the output.",
            id: "connecting-previous-topics-paragraph-3"
          },
          {
            type: "paragraph",
            text: "This viewpoint prepares us for the next stage of the curriculum, where sine, cosine, and tangent will be studied individually as functions. Their graphs, periods, amplitudes, zeros, extrema, and other properties can then be understood systematically.",
            id: "connecting-previous-topics-paragraph-4"
          }
        ]
      },
      {
        id: "common-mistakes",
        title: "Common Mistakes to Avoid",
        content: [
          {
            type: "paragraph",
            text: "Mistake 1: Thinking that sine and cosine are side lengths. They are ratios or function outputs, not physical lengths. Their values do not have units.",
            id: "common-mistakes-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Mistake 2: Thinking that sine and cosine can be greater than \\(1\\). For real angles, their values are always between \\(-1\\) and \\(1\\).",
            id: "common-mistakes-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Mistake 3: Thinking that tangent must also lie between \\(-1\\) and \\(1\\). This is false. Tangent can take any real value.",
            id: "common-mistakes-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Mistake 4: Writing \\(\\tan90^\\circ = \\infty\\). The correct statement is that tangent is undefined at \\(90^\\circ\\). It may grow without bound as the angle approaches \\(90^\\circ\\), but the function does not have an infinity output.",
            id: "common-mistakes-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Mistake 5: Forgetting the calculator angle mode. The calculator must be in degree mode for degree inputs and radian mode for radian inputs.",
            id: "common-mistakes-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Mistake 6: Confusing the reciprocal of a function with an inverse function. For example, \\(\\sec x = \\frac{1}{\\cos x}\\) is a reciprocal relationship. It is not the same idea as an inverse trigonometric function.",
            id: "common-mistakes-paragraph-6"
          },
          {
            type: "paragraph",
            text: "Mistake 7: Assuming that every angle must come from a right triangle. Right triangles provide the original intuition, but the coordinate-plane definition allows trigonometric functions to handle arbitrary real angles.",
            id: "common-mistakes-paragraph-7"
          }
        ]
      },
      {
        id: "big-picture",
        title: "The Big Picture",
        content: [
          {
            type: "paragraph",
            text: "The central idea of this chapter is that trigonometric ratios can be viewed as functions. Instead of thinking only about a particular triangle, we can think of an angle as an input and a trigonometric value as an output.",
            id: "big-picture-paragraph-1"
          },
          {
            type: "paragraph",
            text: "The three fundamental functions are \\(\\sin x\\), \\(\\cos x\\), and \\(\\tan x\\). Sine and cosine are defined for every real input and have range \\([-1,1]\\). Tangent is undefined when cosine is zero and has range \\(\\mathbb{R}\\).",
            id: "big-picture-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The reciprocal functions extend the same structure: \\(\\sec x = \\frac{1}{\\cos x}\\), \\(\\csc x = \\frac{1}{\\sin x}\\), and \\(\\cot x = \\frac{1}{\\tan x}\\). Their domain restrictions arise naturally from division by zero.",
            id: "big-picture-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The most important conceptual transition is from 'a ratio in a triangle' to 'a function whose input is an angle.' Once this transition is understood, trigonometry becomes a study of functions with predictable values, restrictions, symmetries, and eventually graphs.",
            id: "big-picture-paragraph-4"
          }
        ]
      }
    ]
  },
  formulas: [
    {
      id: "sine-definition",
      name: "Sine",
      expression: "\\(\\sin\\theta = \\frac{\\text{opposite}}{\\text{hypotenuse}}\\)",
      explanation: "For an acute angle in a right triangle, sine is the ratio of the side opposite the angle to the hypotenuse."
    },
    {
      id: "cosine-definition",
      name: "Cosine",
      expression: "\\(\\cos\\theta = \\frac{\\text{adjacent}}{\\text{hypotenuse}}\\)",
      explanation: "For an acute angle in a right triangle, cosine is the ratio of the side adjacent to the angle to the hypotenuse."
    },
    {
      id: "tangent-definition",
      name: "Tangent",
      expression: "\\(\\tan\\theta = \\frac{\\text{opposite}}{\\text{adjacent}}\\)",
      explanation: "For an acute angle in a right triangle, tangent is the ratio of the side opposite the angle to the side adjacent to it."
    },
    {
      id: "tangent-sine-cosine",
      name: "Tangent in Terms of Sine and Cosine",
      expression: "\\(\\tan\\theta = \\frac{\\sin\\theta}{\\cos\\theta}\\)",
      explanation: "Tangent can be expressed as sine divided by cosine whenever cosine is nonzero."
    },
    {
      id: "sine-domain-range",
      name: "Sine Domain and Range",
      expression: "\\(\\operatorname{Domain}(\\sin x)=\\mathbb{R},\\qquad \\operatorname{Range}(\\sin x)=[-1,1]\\)",
      explanation: "Sine is defined for every real angle, and its output always lies between -1 and 1."
    },
    {
      id: "cosine-domain-range",
      name: "Cosine Domain and Range",
      expression: "\\(\\operatorname{Domain}(\\cos x)=\\mathbb{R},\\qquad \\operatorname{Range}(\\cos x)=[-1,1]\\)",
      explanation: "Cosine is defined for every real angle, and its output always lies between -1 and 1."
    },
    {
      id: "tangent-domain",
      name: "Tangent Domain",
      expression: "\\(x\\neq\\frac{\\pi}{2}+k\\pi,\\qquad k\\in\\mathbb{Z}\\)",
      explanation: "Tangent is undefined whenever cosine is zero, which occurs at odd multiples of \\(\\frac{\\pi}{2}\\)."
    },
    {
      id: "tangent-range",
      name: "Tangent Range",
      expression: "\\(\\operatorname{Range}(\\tan x)=\\mathbb{R}\\)",
      explanation: "Tangent can produce every real number, so it has no upper or lower bound."
    },
    {
      id: "secant-definition",
      name: "Secant",
      expression: "\\(\\sec\\theta=\\frac{1}{\\cos\\theta}\\)",
      explanation: "Secant is the reciprocal of cosine and is undefined wherever cosine is zero."
    },
    {
      id: "cosecant-definition",
      name: "Cosecant",
      expression: "\\(\\csc\\theta=\\frac{1}{\\sin\\theta}\\)",
      explanation: "Cosecant is the reciprocal of sine and is undefined wherever sine is zero."
    },
    {
      id: "cotangent-definition",
      name: "Cotangent",
      expression: "\\(\\cot\\theta=\\frac{1}{\\tan\\theta}=\\frac{\\cos\\theta}{\\sin\\theta}\\)",
      explanation: "Cotangent is the reciprocal of tangent and can also be written as cosine divided by sine."
    },
    {
      id: "degree-radian",
      name: "Degrees and Radians",
      expression: "\\(180^\\circ=\\pi\\text{ radians}\\)",
      explanation: "This is the fundamental conversion relationship between degree and radian measures."
    }
  ],
  examples: [
    {
      id: "example-sine-function",
      question: "Evaluate \\(\\sin30^\\circ\\).",
      solution: "From the exact trigonometric values, \\(\\sin30^\\circ=\\frac{1}{2}\\). Therefore, the sine function takes \\(30^\\circ\\) as its input and produces \\(\\frac{1}{2}\\) as its output."
    },
    {
      id: "example-cosine-function",
      question: "Evaluate \\(\\cos60^\\circ\\).",
      solution: "Using the exact value for \\(60^\\circ\\), \\(\\cos60^\\circ=\\frac{1}{2}\\)."
    },
    {
      id: "example-tangent-function",
      question: "Evaluate \\(\\tan45^\\circ\\).",
      solution: "We know \\(\\sin45^\\circ=\\frac{\\sqrt{2}}{2}\\) and \\(\\cos45^\\circ=\\frac{\\sqrt{2}}{2}\\). Therefore, \\(\\tan45^\\circ=\\frac{\\sin45^\\circ}{\\cos45^\\circ}=\\frac{\\sqrt{2}/2}{\\sqrt{2}/2}=1\\)."
    },
    {
      id: "example-tangent-undefined",
      question: "Is \\(\\tan90^\\circ\\) defined?",
      solution: "No. Since \\(\\cos90^\\circ=0\\), we have \\(\\tan90^\\circ=\\frac{\\sin90^\\circ}{\\cos90^\\circ}=\\frac{1}{0}\\). Division by zero is undefined, so \\(\\tan90^\\circ\\) is undefined."
    },
    {
      id: "example-sine-range",
      question: "What is the range of \\(\\sin x\\)?",
      solution: "On the unit circle, sine represents the vertical coordinate of a point. A point on the unit circle cannot have a vertical coordinate below \\(-1\\) or above \\(1\\). Both values occur, so the range is \\([-1,1]\\)."
    },
    {
      id: "example-cosine-range",
      question: "What is the range of \\(\\cos x\\)?",
      solution: "Cosine represents the horizontal coordinate of a point on the unit circle. That coordinate always lies between \\(-1\\) and \\(1\\), and both endpoints occur. Therefore, the range is \\([-1,1]\\)."
    },
    {
      id: "example-tangent-range",
      question: "What is the range of \\(\\tan x\\)?",
      solution: "Tangent is not bounded above or below. It can produce any real number. Therefore, the range is \\(\\mathbb{R}\\)."
    },
    {
      id: "example-tangent-from-sine-cosine",
      question: "Find \\(\\tan60^\\circ\\) using sine and cosine.",
      solution: "Use \\(\\tan\\theta=\\frac{\\sin\\theta}{\\cos\\theta}\\). Since \\(\\sin60^\\circ=\\frac{\\sqrt{3}}{2}\\) and \\(\\cos60^\\circ=\\frac{1}{2}\\), we get \\(\\tan60^\\circ=\\frac{\\sqrt{3}/2}{1/2}=\\sqrt{3}\\)."
    },
    {
      id: "example-sec-function",
      question: "Evaluate \\(\\sec60^\\circ\\).",
      solution: "Secant is the reciprocal of cosine. Since \\(\\cos60^\\circ=\\frac{1}{2}\\), \\(\\sec60^\\circ=\\frac{1}{1/2}=2\\)."
    },
    {
      id: "example-csc-function",
      question: "Evaluate \\(\\csc30^\\circ\\).",
      solution: "Cosecant is the reciprocal of sine. Since \\(\\sin30^\\circ=\\frac{1}{2}\\), \\(\\csc30^\\circ=\\frac{1}{1/2}=2\\)."
    },
    {
      id: "example-cot-function",
      question: "Evaluate \\(\\cot45^\\circ\\).",
      solution: "Cotangent is the reciprocal of tangent. Since \\(\\tan45^\\circ=1\\), \\(\\cot45^\\circ=\\frac{1}{1}=1\\)."
    },
    {
      id: "example-sec-undefined",
      question: "Explain why \\(\\sec90^\\circ\\) is undefined.",
      solution: "Since \\(\\sec\\theta=\\frac{1}{\\cos\\theta}\\) and \\(\\cos90^\\circ=0\\), we get \\(\\sec90^\\circ=\\frac{1}{0}\\). Division by zero is undefined, so \\(\\sec90^\\circ\\) is undefined."
    }
  ],
  key_ideas: [
    "A function assigns an output to an input.",
    "A trigonometric function takes an angle as its input and produces a numerical value as its output.",
    "Sine, cosine, and tangent originate from ratios of sides in right triangles.",
    "Similar triangles explain why a fixed angle produces a fixed trigonometric ratio.",
    "The notation \\(\\sin(x)\\), \\(\\cos(x)\\), and \\(\\tan(x)\\) describes functions applied to an input.",
    "Sine and cosine can be defined for every real angle.",
    "The range of sine is \\([-1,1]\\).",
    "The range of cosine is \\([-1,1]\\).",
    "Tangent is defined using sine divided by cosine.",
    "Tangent is undefined whenever cosine is zero.",
    "The range of tangent is all real numbers.",
    "A trigonometric function can use degrees or radians as the unit for its angle input.",
    "On the unit circle, cosine corresponds to the x-coordinate.",
    "On the unit circle, sine corresponds to the y-coordinate.",
    "Tangent can be viewed as the ratio of the vertical coordinate to the horizontal coordinate.",
    "The reciprocal functions are secant, cosecant, and cotangent.",
    "Secant is the reciprocal of cosine.",
    "Cosecant is the reciprocal of sine.",
    "Cotangent is the reciprocal of tangent.",
    "Division by zero creates domain restrictions for reciprocal trigonometric functions.",
    "Sine and cosine are bounded, while tangent is unbounded.",
    "An undefined trigonometric value is not the same thing as an infinitely large value.",
    "The function viewpoint is the bridge from triangle-based trigonometry to the study of trigonometric graphs.",
    "Domain describes the allowed inputs of a function.",
    "Range describes the possible outputs of a function.",
    "The exact values learned earlier become specific input-output examples of trigonometric functions."
  ],
  misconceptions: [
    "A trigonometric function output is a side length.",
    "Sine and cosine can be larger than 1.",
    "Tangent must also lie between -1 and 1.",
    "Tangent at 90 degrees is infinity.",
    "An undefined value and infinity mean the same thing.",
    "The domain of every trigonometric function is all real numbers.",
    "Secant, cosecant, and cotangent have the same domains as their original functions.",
    "Changing from degrees to radians changes the actual geometric angle rather than only its numerical representation.",
    "The parentheses in \\(\\sin(x)\\) mean multiplication.",
    "The reciprocal of a trigonometric function is the same thing as an inverse trigonometric function.",
    "Right-triangle definitions alone are sufficient for every possible angle.",
    "A function can have only positive outputs.",
    "If two triangles have different side lengths, their trigonometric ratios must be different even when the angle is the same."
  ],
  explorations: [
    {
      id: "explore-function-machine",
      type: "visualization"
    },
    {
      id: "explore-unit-circle-functions",
      type: "visualization"
    },
    {
      id: "explore-domain-range",
      type: "why"
    },
    {
      id: "explore-tangent-undefined",
      type: "why"
    },
    {
      id: "explore-degree-radian-input",
      type: "visualization"
    }
  ],
  sources: [
    "khan-academy-trigonometry",
    "openstax-precalculus"
  ]
};

// ../content/concepts/trigonometric-ratios/09_reciprocal-trigonometric-functions.json
var reciprocal_trigonometric_functions_default = {
  id: "reciprocal-trigonometric-functions",
  title: "Reciprocal Trigonometric Functions",
  subject: "mathematics",
  topic: "trigonometry",
  section: "intro-trigono",
  difficulty: 2,
  connections: {
    prerequisites: [
      "trigonometric-functions",
      "trigonometric-ratios-any-angle",
      "sine-function",
      "cosine-function",
      "tangent-function",
      "reciprocal-trigonometric-ratios"
    ],
    leads_to: [],
    related: [
      "trigonometric-functions",
      "sine-function",
      "cosine-function",
      "tangent-function",
      "reciprocal-trigonometric-ratios"
    ]
  },
  theory: {
    introduction: "The reciprocal trigonometric functions are cosecant, secant, and cotangent. They are defined as the reciprocals of sine, cosine, and tangent respectively. Their graphs have an important connection with the graphs of the original trigonometric functions: they are undefined wherever the corresponding original function is zero, and their graphs develop vertical asymptotes at those locations. Understanding these functions through reciprocals, domains, ranges, zeros, periods, and graph behavior provides a natural extension of the six basic trigonometric functions.",
    sections: [
      {
        id: "what-are-reciprocal-functions",
        title: "What Does Reciprocal Mean?",
        content: [
          {
            type: "paragraph",
            text: "Before studying the reciprocal trigonometric functions, recall what a reciprocal is. The reciprocal of a nonzero number is the number that gives 1 when multiplied by the original number.",
            id: "what-are-reciprocal-functions-paragraph-1"
          },
          {
            type: "paragraph",
            text: "For example, the reciprocal of 5 is \\(\\frac{1}{5}\\), because \\(5\\times\\frac{1}{5}=1\\). The reciprocal of \\(\\frac{2}{3}\\) is \\(\\frac{3}{2}\\), because \\(\\frac{2}{3}\\times\\frac{3}{2}=1\\).",
            id: "what-are-reciprocal-functions-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The reciprocal of a function is formed by taking 1 divided by the function, wherever that function is nonzero.",
            id: "what-are-reciprocal-functions-paragraph-3"
          },
          {
            type: "paragraph",
            text: "In trigonometry, this creates three additional functions: cosecant, secant, and cotangent.",
            id: "what-are-reciprocal-functions-paragraph-4"
          }
        ]
      },
      {
        id: "three-reciprocal-functions",
        title: "The Three Reciprocal Trigonometric Functions",
        content: [
          {
            type: "paragraph",
            text: "The reciprocal of sine is called cosecant and is written \\(\\csc x\\). The reciprocal of cosine is called secant and is written \\(\\sec x\\). The reciprocal of tangent is called cotangent and is written \\(\\cot x\\).",
            id: "three-reciprocal-functions-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Their definitions are \\(\\csc x=\\frac{1}{\\sin x}\\), \\(\\sec x=\\frac{1}{\\cos x}\\), and \\(\\cot x=\\frac{1}{\\tan x}\\).",
            id: "three-reciprocal-functions-paragraph-2"
          },
          {
            type: "paragraph",
            text: "These are not completely new ideas. Each function is directly connected to one of the three functions already studied.",
            id: "three-reciprocal-functions-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Because taking a reciprocal requires division, the original function cannot be zero at an input where its reciprocal is defined.",
            id: "three-reciprocal-functions-paragraph-4"
          }
        ]
      },
      {
        id: "cosecant-function",
        title: "The Cosecant Function",
        content: [
          {
            type: "paragraph",
            text: "Cosecant is the reciprocal of sine. It is written as \\(\\csc x\\).",
            id: "cosecant-function-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Its definition is \\(\\csc x=\\frac{1}{\\sin x}\\).",
            id: "cosecant-function-paragraph-2"
          },
          {
            type: "paragraph",
            text: "If sine has a value of \\(\\frac{1}{2}\\), then cosecant has a value of 2. If sine has a value of \\(-1\\), then cosecant has a value of \\(-1\\).",
            id: "cosecant-function-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Cosecant cannot be defined when sine is zero because that would require division by zero.",
            id: "cosecant-function-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Since sine is zero at integer multiples of \\(\\pi\\), cosecant is undefined at \\(x=k\\pi\\), where \\(k\\in\\mathbb{Z}\\).",
            id: "cosecant-function-paragraph-5"
          }
        ]
      },
      {
        id: "secant-function",
        title: "The Secant Function",
        content: [
          {
            type: "paragraph",
            text: "Secant is the reciprocal of cosine. It is written as \\(\\sec x\\).",
            id: "secant-function-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Its definition is \\(\\sec x=\\frac{1}{\\cos x}\\).",
            id: "secant-function-paragraph-2"
          },
          {
            type: "paragraph",
            text: "For example, since \\(\\cos60^\\circ=\\frac{1}{2}\\), we have \\(\\sec60^\\circ=2\\).",
            id: "secant-function-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Secant is undefined whenever cosine is zero because its denominator would become zero.",
            id: "secant-function-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Cosine is zero at \\(x=\\frac{\\pi}{2}+k\\pi\\). Therefore, secant has vertical asymptotes at these same x-values.",
            id: "secant-function-paragraph-5"
          }
        ]
      },
      {
        id: "cotangent-function",
        title: "The Cotangent Function",
        content: [
          {
            type: "paragraph",
            text: "Cotangent is the reciprocal of tangent. It is written as \\(\\cot x\\).",
            id: "cotangent-function-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Its definition is \\(\\cot x=\\frac{1}{\\tan x}\\).",
            id: "cotangent-function-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Since \\(\\tan x=\\frac{\\sin x}{\\cos x}\\), taking its reciprocal gives \\(\\cot x=\\frac{\\cos x}{\\sin x}\\), whenever sine is nonzero.",
            id: "cotangent-function-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Cotangent is therefore undefined whenever sine is zero.",
            id: "cotangent-function-paragraph-4"
          },
          {
            type: "paragraph",
            text: "For example, \\(\\cot45^\\circ=1\\) because \\(\\tan45^\\circ=1\\).",
            id: "cotangent-function-paragraph-5"
          }
        ]
      },
      {
        id: "reciprocal-identities",
        title: "The Reciprocal Identities",
        content: [
          {
            type: "paragraph",
            text: "The three reciprocal relationships can be written as identities. An identity is an equation that is true for every input for which both sides are defined.",
            id: "reciprocal-identities-paragraph-1"
          },
          {
            type: "paragraph",
            text: "The first identity is \\(\\csc x=\\frac{1}{\\sin x}\\).",
            id: "reciprocal-identities-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The second identity is \\(\\sec x=\\frac{1}{\\cos x}\\).",
            id: "reciprocal-identities-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The third identity is \\(\\cot x=\\frac{1}{\\tan x}\\).",
            id: "reciprocal-identities-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Using \\(\\tan x=\\frac{\\sin x}{\\cos x}\\), the cotangent identity can also be written as \\(\\cot x=\\frac{\\cos x}{\\sin x}\\).",
            id: "reciprocal-identities-paragraph-5"
          },
          {
            type: "paragraph",
            text: "These identities allow us to move between the original three trigonometric functions and their reciprocal functions.",
            id: "reciprocal-identities-paragraph-6"
          }
        ]
      },
      {
        id: "product-identities",
        title: "Why Their Products Equal 1",
        content: [
          {
            type: "paragraph",
            text: "A number multiplied by its reciprocal equals 1. The same idea works for trigonometric functions.",
            id: "product-identities-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Since \\(\\csc x=\\frac{1}{\\sin x}\\), multiplying gives \\(\\sin x\\cdot\\csc x=\\sin x\\cdot\\frac{1}{\\sin x}=1\\), whenever sine is nonzero.",
            id: "product-identities-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Similarly, \\(\\cos x\\cdot\\sec x=1\\) whenever cosine is nonzero.",
            id: "product-identities-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Finally, \\(\\tan x\\cdot\\cot x=1\\) whenever tangent is nonzero.",
            id: "product-identities-paragraph-4"
          },
          {
            type: "paragraph",
            text: "These identities are simply the familiar reciprocal property expressed using trigonometric functions.",
            id: "product-identities-paragraph-5"
          }
        ]
      },
      {
        id: "domain-cosecant",
        title: "Domain of Cosecant",
        content: [
          {
            type: "paragraph",
            text: "The domain of a function is the set of input values for which the function is defined.",
            id: "domain-cosecant-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Cosecant is defined by \\(\\csc x=\\frac{1}{\\sin x}\\). Therefore, sine cannot equal zero.",
            id: "domain-cosecant-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Since \\(\\sin x=0\\) at \\(x=k\\pi\\), the domain of cosecant excludes every integer multiple of \\(\\pi\\).",
            id: "domain-cosecant-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The excluded values create vertical asymptotes in the cosecant graph.",
            id: "domain-cosecant-paragraph-4"
          }
        ]
      },
      {
        id: "domain-secant",
        title: "Domain of Secant",
        content: [
          {
            type: "paragraph",
            text: "Secant is defined by \\(\\sec x=\\frac{1}{\\cos x}\\). Therefore, cosine cannot equal zero.",
            id: "domain-secant-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Cosine equals zero at \\(x=\\frac{\\pi}{2}+k\\pi\\). These values are excluded from the domain of secant.",
            id: "domain-secant-paragraph-2"
          },
          {
            type: "paragraph",
            text: "At each excluded value, the secant graph has a vertical asymptote.",
            id: "domain-secant-paragraph-3"
          }
        ]
      },
      {
        id: "domain-cotangent",
        title: "Domain of Cotangent",
        content: [
          {
            type: "paragraph",
            text: "Cotangent can be written as \\(\\cot x=\\frac{\\cos x}{\\sin x}\\). Therefore, sine cannot equal zero.",
            id: "domain-cotangent-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Sine is zero at \\(x=k\\pi\\), so these values are excluded from the domain of cotangent.",
            id: "domain-cotangent-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The cotangent graph has vertical asymptotes at these excluded values.",
            id: "domain-cotangent-paragraph-3"
          }
        ]
      },
      {
        id: "ranges",
        title: "Ranges of the Reciprocal Functions",
        content: [
          {
            type: "paragraph",
            text: "The reciprocal relationship also explains the ranges of cosecant and secant.",
            id: "ranges-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Since sine always lies between \\(-1\\) and \\(1\\), its nonzero values have absolute value at most 1. Taking their reciprocals produces values whose absolute value is at least 1.",
            id: "ranges-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Therefore, the range of cosecant is \\(y\\leq-1\\) or \\(y\\geq1\\).",
            id: "ranges-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The same reasoning applies to cosine, so the range of secant is also \\(y\\leq-1\\) or \\(y\\geq1\\).",
            id: "ranges-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Cotangent is different. Because tangent can take every real value, its reciprocal can also take every nonzero real value. Therefore, the range of cotangent is all real numbers except zero.",
            id: "ranges-paragraph-5"
          }
        ]
      },
      {
        id: "zeros",
        title: "Do Reciprocal Functions Have Zeros?",
        content: [
          {
            type: "paragraph",
            text: "A reciprocal function cannot equal zero when its original function is defined and finite.",
            id: "zeros-paragraph-1"
          },
          {
            type: "paragraph",
            text: "For example, \\(\\csc x=\\frac{1}{\\sin x}\\). The numerator is always 1, so this fraction can never equal zero.",
            id: "zeros-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The same reasoning shows that secant and cotangent have no zeros.",
            id: "zeros-paragraph-3"
          },
          {
            type: "paragraph",
            text: "This is an important contrast with sine, cosine, and tangent, which all have zeros.",
            id: "zeros-paragraph-4"
          }
        ]
      },
      {
        id: "periods",
        title: "Periods of Reciprocal Functions",
        content: [
          {
            type: "paragraph",
            text: "Taking a reciprocal does not change the basic repeating interval of sine or cosine. Therefore, cosecant has period \\(2\\pi\\), just like sine.",
            id: "periods-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Secant has period \\(2\\pi\\), just like cosine.",
            id: "periods-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Cotangent has period \\(\\pi\\), just like tangent.",
            id: "periods-paragraph-3"
          },
          {
            type: "paragraph",
            text: "For example, \\(\\csc(x+2\\pi)=\\csc x\\), \\(\\sec(x+2\\pi)=\\sec x\\), and \\(\\cot(x+\\pi)=\\cot x\\).",
            id: "periods-paragraph-4"
          },
          {
            type: "paragraph",
            text: "The period can therefore be inherited directly from the corresponding original function.",
            id: "periods-paragraph-5"
          }
        ]
      },
      {
        id: "cosecant-graph",
        title: "Building the Cosecant Graph",
        content: [
          {
            type: "paragraph",
            text: "The cosecant graph can be understood by starting with the sine graph and taking the reciprocal of every nonzero sine value.",
            id: "cosecant-graph-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Because sine is zero at integer multiples of \\(\\pi\\), cosecant is undefined at those points. These locations become vertical asymptotes.",
            id: "cosecant-graph-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Between two consecutive asymptotes, the sine graph stays either positive or negative. The corresponding cosecant branch therefore stays entirely above or entirely below the x-axis.",
            id: "cosecant-graph-paragraph-3"
          },
          {
            type: "paragraph",
            text: "When sine reaches its maximum value \\(1\\), cosecant reaches \\(1\\). When sine reaches its minimum value \\(-1\\), cosecant reaches \\(-1\\).",
            id: "cosecant-graph-paragraph-4"
          },
          {
            type: "paragraph",
            text: "As sine approaches zero, its reciprocal becomes very large in magnitude. This causes the cosecant graph to move toward its vertical asymptotes.",
            id: "cosecant-graph-paragraph-5"
          }
        ]
      },
      {
        id: "secant-graph",
        title: "Building the Secant Graph",
        content: [
          {
            type: "paragraph",
            text: "The secant graph can be understood by starting with the cosine graph and taking the reciprocal of every nonzero cosine value.",
            id: "secant-graph-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Cosine is zero at odd multiples of \\(\\frac{\\pi}{2}\\), so secant is undefined at those points. These locations become vertical asymptotes.",
            id: "secant-graph-paragraph-2"
          },
          {
            type: "paragraph",
            text: "When cosine equals \\(1\\), secant equals \\(1\\). When cosine equals \\(-1\\), secant equals \\(-1\\).",
            id: "secant-graph-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Because cosine stays positive or negative between consecutive zeros, each secant branch stays on one side of the x-axis.",
            id: "secant-graph-paragraph-4"
          },
          {
            type: "paragraph",
            text: "As cosine approaches zero, secant becomes very large in magnitude, producing the characteristic branches around the asymptotes.",
            id: "secant-graph-paragraph-5"
          }
        ]
      },
      {
        id: "cotangent-graph",
        title: "Building the Cotangent Graph",
        content: [
          {
            type: "paragraph",
            text: "Cotangent is the reciprocal of tangent, so its graph can be understood from the tangent graph.",
            id: "cotangent-graph-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Tangent is zero at integer multiples of \\(\\pi\\). Therefore, cotangent is undefined at these values and has vertical asymptotes there.",
            id: "cotangent-graph-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Unlike tangent, whose basic graph increases from left to right between asymptotes, cotangent decreases from very large positive values to very large negative values.",
            id: "cotangent-graph-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Cotangent has no zeros because the reciprocal of a nonzero finite number cannot be zero.",
            id: "cotangent-graph-paragraph-4"
          },
          {
            type: "paragraph",
            text: "The graph repeats every \\(\\pi\\) radians.",
            id: "cotangent-graph-paragraph-5"
          }
        ]
      },
      {
        id: "graph-comparison",
        title: "Comparing the Three Reciprocal Graphs",
        content: [
          {
            type: "paragraph",
            text: "The three reciprocal functions can be paired directly with the original functions.",
            id: "graph-comparison-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Cosecant corresponds to sine. Wherever sine is zero, cosecant has a vertical asymptote. Wherever sine reaches \\(1\\) or \\(-1\\), cosecant reaches the same value.",
            id: "graph-comparison-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Secant corresponds to cosine. Wherever cosine is zero, secant has a vertical asymptote. Wherever cosine reaches \\(1\\) or \\(-1\\), secant reaches the same value.",
            id: "graph-comparison-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Cotangent corresponds to tangent. Wherever tangent is zero, cotangent has a vertical asymptote. Because tangent itself already has vertical asymptotes, cotangent has a different set of excluded values.",
            id: "graph-comparison-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Thinking in pairs makes the reciprocal graphs much easier to understand than memorizing each graph independently.",
            id: "graph-comparison-paragraph-5"
          }
        ]
      },
      {
        id: "worked-examples",
        title: "Worked Examples",
        content: [
          {
            type: "paragraph",
            text: "Example 1: Find \\(\\csc30^\\circ\\). Since \\(\\sin30^\\circ=\\frac{1}{2}\\), take the reciprocal: \\(\\csc30^\\circ=2\\).",
            id: "worked-examples-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Example 2: Find \\(\\sec60^\\circ\\). Since \\(\\cos60^\\circ=\\frac{1}{2}\\), \\(\\sec60^\\circ=2\\).",
            id: "worked-examples-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Example 3: Find \\(\\cot45^\\circ\\). Since \\(\\tan45^\\circ=1\\), its reciprocal is also 1. Therefore, \\(\\cot45^\\circ=1\\).",
            id: "worked-examples-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Example 4: Find \\(\\cot30^\\circ\\). Since \\(\\tan30^\\circ=\\frac{\\sqrt{3}}{3}\\), \\(\\cot30^\\circ=\\frac{1}{\\sqrt{3}/3}=\\sqrt{3}\\).",
            id: "worked-examples-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Example 5: Determine whether \\(\\sec90^\\circ\\) is defined. Since \\(\\cos90^\\circ=0\\), \\(\\sec90^\\circ=\\frac{1}{0}\\), so it is undefined.",
            id: "worked-examples-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Example 6: Determine whether \\(\\csc180^\\circ\\) is defined. Since \\(\\sin180^\\circ=0\\), \\(\\csc180^\\circ\\) is undefined.",
            id: "worked-examples-paragraph-6"
          },
          {
            type: "paragraph",
            text: "Example 7: Determine the vertical asymptotes of \\(y=\\csc x\\). Cosecant is undefined where sine is zero. Therefore, the asymptotes occur at \\(x=k\\pi\\), where \\(k\\in\\mathbb{Z}\\).",
            id: "worked-examples-paragraph-7"
          },
          {
            type: "paragraph",
            text: "Example 8: Determine the vertical asymptotes of \\(y=\\sec x\\). Secant is undefined where cosine is zero. Therefore, the asymptotes occur at \\(x=\\frac{\\pi}{2}+k\\pi\\), where \\(k\\in\\mathbb{Z}\\).",
            id: "worked-examples-paragraph-8"
          },
          {
            type: "paragraph",
            text: "Example 9: Determine the vertical asymptotes of \\(y=\\cot x\\). Cotangent is \\(\\frac{\\cos x}{\\sin x}\\), so it is undefined when sine is zero. Therefore, the asymptotes occur at \\(x=k\\pi\\).",
            id: "worked-examples-paragraph-9"
          },
          {
            type: "paragraph",
            text: "Example 10: Find the range of \\(\\csc x\\). Since \\(-1\\leq\\sin x\\leq1\\) and sine cannot be zero for cosecant, its reciprocal has magnitude at least 1. Therefore, the range is \\(y\\leq-1\\) or \\(y\\geq1\\).",
            id: "worked-examples-paragraph-10"
          },
          {
            type: "paragraph",
            text: "Example 11: Find the period of \\(\\sec x\\). Secant is the reciprocal of cosine, and cosine has period \\(2\\pi\\). Therefore, secant also has period \\(2\\pi\\).",
            id: "worked-examples-paragraph-11"
          },
          {
            type: "paragraph",
            text: "Example 12: Find the period of \\(\\cot x\\). Cotangent is the reciprocal of tangent, and tangent has period \\(\\pi\\). Therefore, cotangent also has period \\(\\pi\\).",
            id: "worked-examples-paragraph-12"
          },
          {
            type: "paragraph",
            text: "Example 13: Does \\(y=\\csc x\\) have any x-intercepts? No. Cosecant can never equal zero because its numerator is 1.",
            id: "worked-examples-paragraph-13"
          },
          {
            type: "paragraph",
            text: "Example 14: If \\(\\sin x=\\frac{2}{3}\\), find \\(\\csc x\\). Take the reciprocal: \\(\\csc x=\\frac{3}{2}\\).",
            id: "worked-examples-paragraph-14"
          },
          {
            type: "paragraph",
            text: "Example 15: If \\(\\sec x=-4\\), find \\(\\cos x\\). Since secant is the reciprocal of cosine, \\(\\cos x=\\frac{1}{\\sec x}=-\\frac{1}{4}\\).",
            id: "worked-examples-paragraph-15"
          },
          {
            type: "paragraph",
            text: "Example 16: If \\(\\cot x=-2\\), find \\(\\tan x\\). Since cotangent and tangent are reciprocals, \\(\\tan x=-\\frac{1}{2}\\).",
            id: "worked-examples-paragraph-16"
          }
        ]
      },
      {
        id: "visualization",
        title: "Visualizing Reciprocal Graphs",
        content: [
          {
            type: "paragraph",
            text: "A powerful visualization is to display an original trigonometric graph together with its reciprocal graph.",
            id: "visualization-paragraph-1"
          },
          {
            type: "paragraph",
            text: "For sine and cosecant, highlight points where sine is close to zero. Their reciprocal values become very large in magnitude, showing why cosecant approaches vertical asymptotes.",
            id: "visualization-paragraph-2"
          },
          {
            type: "paragraph",
            text: "At points where sine equals \\(1\\) or \\(-1\\), the reciprocal remains \\(1\\) or \\(-1\\). These become the closest points of the cosecant branches to the x-axis.",
            id: "visualization-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The same idea works for cosine and secant. When cosine approaches zero, secant grows without bound in magnitude. When cosine equals \\(1\\) or \\(-1\\), secant equals \\(1\\) or \\(-1\\).",
            id: "visualization-paragraph-4"
          },
          {
            type: "paragraph",
            text: "For tangent and cotangent, show how values near tangent's zeros produce very large cotangent values. This explains why cotangent has asymptotes where tangent crosses the x-axis.",
            id: "visualization-paragraph-5"
          },
          {
            type: "paragraph",
            text: "The key visual lesson is that reciprocal graphs are controlled by the zeros and extreme values of the original functions.",
            id: "visualization-paragraph-6"
          }
        ]
      },
      {
        id: "common-mistakes",
        title: "Common Mistakes to Avoid",
        content: [
          {
            type: "paragraph",
            text: "Mistake 1: Thinking secant is the inverse of cosine. Secant is the reciprocal of cosine, not its inverse function.",
            id: "common-mistakes-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Mistake 2: Thinking cosecant is the inverse of sine. Cosecant means reciprocal: \\(\\csc x=\\frac{1}{\\sin x}\\).",
            id: "common-mistakes-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Mistake 3: Forgetting that reciprocal functions are undefined when the original function equals zero.",
            id: "common-mistakes-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Mistake 4: Assuming reciprocal functions can have zeros. A reciprocal such as \\(\\frac{1}{f(x)}\\) cannot equal zero when it is defined.",
            id: "common-mistakes-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Mistake 5: Thinking \\(\\csc x\\) has the same range as sine. Sine has range \\([-1,1]\\), while cosecant has range \\(( -\\infty,-1]\\cup[1,\\infty)\\).",
            id: "common-mistakes-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Mistake 6: Forgetting that a reciprocal reverses the size of a nonzero number. Values close to zero become large in magnitude.",
            id: "common-mistakes-paragraph-6"
          },
          {
            type: "paragraph",
            text: "Mistake 7: Putting the vertical asymptotes of secant at the zeros of sine. Secant is the reciprocal of cosine, so its asymptotes occur where cosine is zero.",
            id: "common-mistakes-paragraph-7"
          },
          {
            type: "paragraph",
            text: "Mistake 8: Putting the vertical asymptotes of cotangent at the zeros of cosine. Cotangent is \\(\\frac{\\cos x}{\\sin x}\\), so its asymptotes occur where sine is zero.",
            id: "common-mistakes-paragraph-8"
          },
          {
            type: "paragraph",
            text: "Mistake 9: Thinking reciprocal functions have completely new periods. Their periods come directly from the original functions.",
            id: "common-mistakes-paragraph-9"
          },
          {
            type: "paragraph",
            text: "Mistake 10: Thinking an undefined value is equal to infinity. A function may grow without bound near an asymptote, but the function is still undefined at the asymptote.",
            id: "common-mistakes-paragraph-10"
          }
        ]
      },
      {
        id: "big-picture",
        title: "The Big Picture",
        content: [
          {
            type: "paragraph",
            text: "There are six fundamental trigonometric functions, which naturally form three reciprocal pairs.",
            id: "big-picture-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Sine and cosecant are reciprocals: \\(\\csc x=\\frac{1}{\\sin x}\\). Cosine and secant are reciprocals: \\(\\sec x=\\frac{1}{\\cos x}\\). Tangent and cotangent are reciprocals: \\(\\cot x=\\frac{1}{\\tan x}\\).",
            id: "big-picture-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The zeros of the original functions become the undefined points of their reciprocal functions.",
            id: "big-picture-paragraph-3"
          },
          {
            type: "paragraph",
            text: "These undefined points appear as vertical asymptotes on the reciprocal graphs.",
            id: "big-picture-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Cosecant and secant can never take values strictly between \\(-1\\) and \\(1\\), because sine and cosine themselves never have magnitude greater than 1.",
            id: "big-picture-paragraph-5"
          },
          {
            type: "paragraph",
            text: "Cotangent can take every nonzero real value, but it cannot equal zero.",
            id: "big-picture-paragraph-6"
          },
          {
            type: "paragraph",
            text: "The reciprocal functions do not need to be memorized as completely separate objects. Their behavior can be understood by asking one simple question: what happens when we take the reciprocal of the corresponding original trigonometric function?",
            id: "big-picture-paragraph-7"
          },
          {
            type: "paragraph",
            text: "This viewpoint connects the algebraic definitions, domains, ranges, asymptotes, periods, and graphs into one coherent picture.",
            id: "big-picture-paragraph-8"
          }
        ]
      }
    ]
  },
  formulas: [
    {
      id: "cosecant-definition",
      name: "Cosecant",
      expression: "\\(\\csc x=\\frac{1}{\\sin x}\\)",
      explanation: "Cosecant is the reciprocal of sine."
    },
    {
      id: "secant-definition",
      name: "Secant",
      expression: "\\(\\sec x=\\frac{1}{\\cos x}\\)",
      explanation: "Secant is the reciprocal of cosine."
    },
    {
      id: "cotangent-definition",
      name: "Cotangent",
      expression: "\\(\\cot x=\\frac{1}{\\tan x}\\)",
      explanation: "Cotangent is the reciprocal of tangent."
    },
    {
      id: "cotangent-sine-cosine",
      name: "Cotangent in Terms of Sine and Cosine",
      expression: "\\(\\cot x=\\frac{\\cos x}{\\sin x}\\)",
      explanation: "Because tangent is sine divided by cosine, its reciprocal is cosine divided by sine."
    },
    {
      id: "sine-cosecant-identity",
      name: "Sine-Cosecant Identity",
      expression: "\\(\\sin x\\cdot\\csc x=1\\)",
      explanation: "A nonzero number multiplied by its reciprocal equals 1."
    },
    {
      id: "cosine-secant-identity",
      name: "Cosine-Secant Identity",
      expression: "\\(\\cos x\\cdot\\sec x=1\\)",
      explanation: "Cosine multiplied by its reciprocal, secant, equals 1 whenever cosine is nonzero."
    },
    {
      id: "tangent-cotangent-identity",
      name: "Tangent-Cotangent Identity",
      expression: "\\(\\tan x\\cdot\\cot x=1\\)",
      explanation: "Tangent multiplied by its reciprocal, cotangent, equals 1 whenever tangent is nonzero."
    },
    {
      id: "cosecant-domain",
      name: "Cosecant Domain Restriction",
      expression: "\\(x\\neq k\\pi,\\quad k\\in\\mathbb{Z}\\)",
      explanation: "Cosecant is undefined where sine is zero."
    },
    {
      id: "secant-domain",
      name: "Secant Domain Restriction",
      expression: "\\(x\\neq\\frac{\\pi}{2}+k\\pi,\\quad k\\in\\mathbb{Z}\\)",
      explanation: "Secant is undefined where cosine is zero."
    },
    {
      id: "cotangent-domain",
      name: "Cotangent Domain Restriction",
      expression: "\\(x\\neq k\\pi,\\quad k\\in\\mathbb{Z}\\)",
      explanation: "Cotangent is undefined where sine is zero."
    },
    {
      id: "cosecant-range",
      name: "Cosecant Range",
      expression: "\\(y\\leq-1\\quad\\text{or}\\quad y\\geq1\\)",
      explanation: "The reciprocal of a nonzero sine value always has magnitude at least 1."
    },
    {
      id: "secant-range",
      name: "Secant Range",
      expression: "\\(y\\leq-1\\quad\\text{or}\\quad y\\geq1\\)",
      explanation: "The reciprocal of a nonzero cosine value always has magnitude at least 1."
    },
    {
      id: "cotangent-range",
      name: "Cotangent Range",
      expression: "\\(y\\in\\mathbb{R},\\quad y\\neq0\\)",
      explanation: "Cotangent can take every nonzero real value but cannot equal zero."
    },
    {
      id: "cosecant-period",
      name: "Cosecant Period",
      expression: "\\(\\csc(x+2\\pi)=\\csc x\\)",
      explanation: "Cosecant has the same basic period as sine: \\(2\\pi\\)."
    },
    {
      id: "secant-period",
      name: "Secant Period",
      expression: "\\(\\sec(x+2\\pi)=\\sec x\\)",
      explanation: "Secant has the same basic period as cosine: \\(2\\pi\\)."
    },
    {
      id: "cotangent-period",
      name: "Cotangent Period",
      expression: "\\(\\cot(x+\\pi)=\\cot x\\)",
      explanation: "Cotangent has the same basic period as tangent: \\(\\pi\\)."
    }
  ],
  examples: [
    {
      id: "example-csc-30",
      question: "Find \\(\\csc30^\\circ\\).",
      solution: "Since \\(\\sin30^\\circ=\\frac{1}{2}\\), take its reciprocal: \\(\\csc30^\\circ=\\frac{1}{1/2}=2\\)."
    },
    {
      id: "example-sec-60",
      question: "Find \\(\\sec60^\\circ\\).",
      solution: "Since \\(\\cos60^\\circ=\\frac{1}{2}\\), \\(\\sec60^\\circ=\\frac{1}{1/2}=2\\)."
    },
    {
      id: "example-cot-45",
      question: "Find \\(\\cot45^\\circ\\).",
      solution: "Since \\(\\tan45^\\circ=1\\), its reciprocal is also 1. Therefore, \\(\\cot45^\\circ=1\\)."
    },
    {
      id: "example-cot-30",
      question: "Find \\(\\cot30^\\circ\\).",
      solution: "Since \\(\\tan30^\\circ=\\frac{\\sqrt{3}}{3}\\), \\(\\cot30^\\circ=\\frac{1}{\\sqrt{3}/3}=\\sqrt{3}\\)."
    },
    {
      id: "example-sec-undefined",
      question: "Is \\(\\sec90^\\circ\\) defined?",
      solution: "No. Since \\(\\cos90^\\circ=0\\), \\(\\sec90^\\circ=\\frac{1}{0}\\), which is undefined."
    },
    {
      id: "example-csc-undefined",
      question: "Is \\(\\csc180^\\circ\\) defined?",
      solution: "No. Since \\(\\sin180^\\circ=0\\), \\(\\csc180^\\circ=\\frac{1}{0}\\), which is undefined."
    },
    {
      id: "example-csc-asymptotes",
      question: "Find the vertical asymptotes of \\(y=\\csc x\\).",
      solution: "Cosecant is undefined wherever sine is zero. Since \\(\\sin x=0\\) at \\(x=k\\pi\\), the vertical asymptotes occur at \\(x=k\\pi\\), where \\(k\\in\\mathbb{Z}\\)."
    },
    {
      id: "example-sec-asymptotes",
      question: "Find the vertical asymptotes of \\(y=\\sec x\\).",
      solution: "Secant is undefined where cosine is zero. Since \\(\\cos x=0\\) at \\(x=\\frac{\\pi}{2}+k\\pi\\), these are the vertical asymptotes."
    },
    {
      id: "example-cot-asymptotes",
      question: "Find the vertical asymptotes of \\(y=\\cot x\\).",
      solution: "Cotangent is \\(\\frac{\\cos x}{\\sin x}\\), so it is undefined where sine equals zero. Therefore, the vertical asymptotes occur at \\(x=k\\pi\\)."
    },
    {
      id: "example-csc-range",
      question: "Find the range of \\(\\csc x\\).",
      solution: "Since \\(-1\\leq\\sin x\\leq1\\), every nonzero sine value has magnitude at most 1. Its reciprocal therefore has magnitude at least 1. Hence the range is \\(y\\leq-1\\) or \\(y\\geq1\\)."
    },
    {
      id: "example-sec-period",
      question: "Find the period of \\(\\sec x\\).",
      solution: "Secant is the reciprocal of cosine. Since cosine has period \\(2\\pi\\), secant also has period \\(2\\pi\\)."
    },
    {
      id: "example-cot-period",
      question: "Find the period of \\(\\cot x\\).",
      solution: "Cotangent is the reciprocal of tangent. Since tangent has period \\(\\pi\\), cotangent also has period \\(\\pi\\)."
    },
    {
      id: "example-no-csc-zero",
      question: "Does \\(y=\\csc x\\) have any x-intercepts?",
      solution: "No. For an x-intercept, the function would have to equal zero. But \\(\\csc x=\\frac{1}{\\sin x}\\) can never equal zero."
    },
    {
      id: "example-given-sine",
      question: "If \\(\\sin x=\\frac{2}{3}\\), find \\(\\csc x\\).",
      solution: "Cosecant is the reciprocal of sine. Therefore, \\(\\csc x=\\frac{1}{2/3}=\\frac{3}{2}\\)."
    },
    {
      id: "example-given-sec",
      question: "If \\(\\sec x=-4\\), find \\(\\cos x\\).",
      solution: "Since secant is the reciprocal of cosine, \\(\\cos x=\\frac{1}{\\sec x}=\\frac{1}{-4}=-\\frac{1}{4}\\)."
    },
    {
      id: "example-given-cot",
      question: "If \\(\\cot x=-2\\), find \\(\\tan x\\).",
      solution: "Cotangent and tangent are reciprocals. Therefore, \\(\\tan x=\\frac{1}{-2}=-\\frac{1}{2}\\)."
    }
  ],
  key_ideas: [
    "A reciprocal is a number or expression that multiplies with the original to give 1.",
    "Cosecant is the reciprocal of sine.",
    "Secant is the reciprocal of cosine.",
    "Cotangent is the reciprocal of tangent.",
    "The reciprocal identities are \\(\\csc x=\\frac{1}{\\sin x}\\), \\(\\sec x=\\frac{1}{\\cos x}\\), and \\(\\cot x=\\frac{1}{\\tan x}\\).",
    "Cotangent can also be written as \\(\\frac{\\cos x}{\\sin x}\\).",
    "A reciprocal function is undefined wherever its original function is zero.",
    "Cosecant is undefined where sine is zero.",
    "Secant is undefined where cosine is zero.",
    "Cotangent is undefined where sine is zero.",
    "The undefined values of reciprocal functions produce vertical asymptotes.",
    "Cosecant has period \\(2\\pi\\).",
    "Secant has period \\(2\\pi\\).",
    "Cotangent has period \\(\\pi\\).",
    "Cosecant and secant have ranges outside the interval \\([-1,1]\\).",
    "The range of cosecant is \\(y\\leq-1\\) or \\(y\\geq1\\).",
    "The range of secant is \\(y\\leq-1\\) or \\(y\\geq1\\).",
    "The range of cotangent is all nonzero real numbers.",
    "None of the three reciprocal functions has a zero.",
    "Values close to zero become very large in magnitude when reciprocated.",
    "Cosecant can be understood from the sine graph.",
    "Secant can be understood from the cosine graph.",
    "Cotangent can be understood from the tangent graph.",
    "The zeros of an original function become asymptotes of its reciprocal.",
    "The extreme values \\(1\\) and \\(-1\\) of sine and cosine remain \\(1\\) and \\(-1\\) after taking reciprocals.",
    "Reciprocal functions are extensions of the original three trigonometric functions rather than unrelated functions.",
    "The product of a trigonometric function and its reciprocal is 1 wherever both are defined."
  ],
  misconceptions: [
    "Secant is the inverse function of cosine.",
    "Cosecant is the inverse function of sine.",
    "Cotangent is the inverse function of tangent.",
    "Reciprocal and inverse mean the same thing.",
    "A reciprocal function is defined where the original function is zero.",
    "Cosecant can equal zero.",
    "Secant can equal zero.",
    "Cotangent can equal zero.",
    "Cosecant has the same range as sine.",
    "Secant has the same range as cosine.",
    "Secant has vertical asymptotes where sine is zero.",
    "Cosecant has vertical asymptotes where cosine is zero.",
    "Cotangent has vertical asymptotes where cosine is zero.",
    "All reciprocal functions have period \\(2\\pi\\).",
    "A vertical asymptote is a point on the graph.",
    "An undefined value is the same as infinity.",
    "A reciprocal always makes a number smaller.",
    "Taking the reciprocal preserves the value of every number.",
    "The reciprocal of a negative number is positive.",
    "Cotangent is always positive.",
    "Cosecant and secant are always greater than 1.",
    "The reciprocal graphs must look exactly like the original graphs."
  ],
  explorations: [
    {
      id: "explore-reciprocal-sine",
      type: "visualization"
    },
    {
      id: "explore-reciprocal-cosine",
      type: "visualization"
    },
    {
      id: "explore-reciprocal-tangent",
      type: "visualization"
    },
    {
      id: "explore-asymptotes",
      type: "why"
    },
    {
      id: "explore-reciprocal-range",
      type: "why"
    },
    {
      id: "explore-six-functions",
      type: "visualization"
    }
  ],
  sources: [
    "khan-academy-trigonometry",
    "openstax-precalculus"
  ]
};

// ../content/concepts/trigonometricFunctions/trig-equations-01-what-are-equations.json
var trig_equations_01_what_are_equations_default = {
  id: "trig-equations-01",
  title: "What Are Trigonometric Equations?",
  subject: "mathematics",
  topic: "trigonometry",
  section: "trigonometric-equations",
  difficulty: 2,
  connections: {
    prerequisites: [
      "trigonometric-ratios",
      "trigonometric-functions",
      "trigonometric-graphs"
    ],
    leads_to: [
      "trig-equations-02"
    ],
    related: [
      "algebraic-equations",
      "functions",
      "trigonometric-identities",
      "unit-circle",
      "periodic-functions"
    ]
  },
  theory: {
    introduction: "A trigonometric equation is an equation containing one or more trigonometric functions in which the unknown is usually an angle. The goal is to find every value of the unknown that makes the equation true. Unlike many ordinary algebraic equations, trigonometric equations can have more than one solution or infinitely many solutions because trigonometric functions repeat periodically.",
    sections: [
      {
        id: "definition",
        title: "What Is a Trigonometric Equation?",
        content: [
          {
            type: "paragraph",
            text: "An equation states that two expressions are equal. A trigonometric equation is an equation in which at least one expression contains a trigonometric function such as sin, cos, tan, sec, csc, or cot."
          },
          {
            type: "paragraph",
            text: "Examples include sin(x) = 1/2, cos(x) = 0, tan(x) = 1, 2sin(x) + 1 = 0, and sin\xB2(x) + sin(x) = 0."
          },
          {
            type: "paragraph",
            text: "The variable is usually an angle, although it can appear inside a more complicated expression such as sin(2x), cos(x + \u03C0/3), or tan(3x \u2212 \u03C0/4)."
          },
          {
            type: "paragraph",
            text: "The solution of a trigonometric equation is any value of the variable that makes the original equation true."
          }
        ]
      },
      {
        id: "equation-vs-expression",
        title: "Expression, Equation, and Identity",
        content: [
          {
            type: "paragraph",
            text: "A trigonometric expression is a mathematical expression such as sin(x) + cos(x). It does not claim that one quantity equals another."
          },
          {
            type: "paragraph",
            text: "A trigonometric equation contains an equals sign and asks us to find the values of the variable for which the equality is true."
          },
          {
            type: "paragraph",
            text: "A trigonometric identity is different. An identity is true for every value of the variable for which both sides are defined. For example, sin\xB2(x) + cos\xB2(x) = 1 is an identity."
          },
          {
            type: "paragraph",
            text: "When solving an equation, we are looking for particular values that make the equation true. When working with an identity, the equality is already true throughout its domain."
          }
        ]
      },
      {
        id: "examples-of-equations",
        title: "Examples and Non-Examples",
        content: [
          {
            type: "paragraph",
            text: "sin(x) = 1/2 is a trigonometric equation because it asks which values of x make sine equal to 1/2."
          },
          {
            type: "paragraph",
            text: "2cos(x) \u2212 1 = 0 is a trigonometric equation because solving it requires finding values of x for which cosine has a particular value."
          },
          {
            type: "paragraph",
            text: "sin\xB2(x) + cos\xB2(x) = 1 is a trigonometric identity, not an equation that needs to be solved for particular values."
          },
          {
            type: "paragraph",
            text: "sin(x) + 3 is a trigonometric expression, not an equation, because it has no equality statement."
          }
        ]
      },
      {
        id: "goal-of-solving",
        title: "What Does It Mean to Solve One?",
        content: [
          {
            type: "paragraph",
            text: "To solve a trigonometric equation means to determine every allowed value of the variable that satisfies the original equation."
          },
          {
            type: "paragraph",
            text: "For example, solving sin(x) = 1/2 is not simply about calculating one inverse-sine value. The complete answer depends on whether the problem asks for solutions on a particular interval or all possible solutions."
          },
          {
            type: "paragraph",
            text: "A complete solution therefore requires attention to the equation, the domain, the interval if one is specified, and the periodic behavior of the trigonometric function."
          }
        ]
      },
      {
        id: "multiple-solutions",
        title: "Why Can There Be Multiple Solutions?",
        content: [
          {
            type: "paragraph",
            text: "Trigonometric functions are periodic. This means their values repeat after a fixed interval."
          },
          {
            type: "paragraph",
            text: "Sine and cosine repeat every 2\u03C0 radians, while tangent repeats every \u03C0 radians."
          },
          {
            type: "paragraph",
            text: "Because of this repetition, the same trigonometric value can correspond to several angles in one revolution and infinitely many angles when no interval is specified."
          },
          {
            type: "paragraph",
            text: "For example, sin(x) = 1/2 has two solutions in the interval 0 \u2264 x < 2\u03C0, but infinitely many solutions if x is allowed to be any real number."
          }
        ]
      },
      {
        id: "restricted-vs-general",
        title: "Restricted and General Solutions",
        content: [
          {
            type: "paragraph",
            text: "A restricted solution means that the problem specifies an interval in which x must lie, such as 0 \u2264 x < 2\u03C0 or 0\xB0 \u2264 x \u2264 360\xB0."
          },
          {
            type: "paragraph",
            text: "A general solution represents every solution and usually contains an integer parameter such as n \u2208 \u2124."
          },
          {
            type: "paragraph",
            text: "For example, sin(x) = 0 has solutions x = 0 and x = \u03C0 in one interval from 0 to 2\u03C0, but it has infinitely many solutions when x can be any real number."
          },
          {
            type: "paragraph",
            text: "Students must therefore read the requested interval carefully before deciding how many solutions to give."
          }
        ]
      },
      {
        id: "domain",
        title: "Why the Domain Matters",
        content: [
          {
            type: "paragraph",
            text: "A value can only be a solution if the original trigonometric expression is defined at that value."
          },
          {
            type: "paragraph",
            text: "For example, tan(x) is undefined wherever cos(x) = 0, so angles such as \u03C0/2 and 3\u03C0/2 cannot be solutions of an equation involving tan(x) at those points."
          },
          {
            type: "paragraph",
            text: "Similarly, sec(x) is undefined when cos(x) = 0, csc(x) is undefined when sin(x) = 0, and cot(x) is undefined when sin(x) = 0."
          },
          {
            type: "paragraph",
            text: "Domain restrictions become especially important when equations are transformed using reciprocals, multiplication, division, or other algebraic operations."
          }
        ]
      },
      {
        id: "equations-may-have-no-solutions",
        title: "Not Every Trigonometric Equation Has a Solution",
        content: [
          {
            type: "paragraph",
            text: "A trigonometric equation may have no real solution if the requested trigonometric value is outside the range of the function."
          },
          {
            type: "paragraph",
            text: "For example, sin(x) = 2 has no real solution because sine can only have values from \u22121 to 1."
          },
          {
            type: "paragraph",
            text: "Likewise, cos(x) = \u22123 has no real solution because cosine also has a range from \u22121 to 1."
          },
          {
            type: "paragraph",
            text: "Recognizing whether a solution is possible is an important first step before attempting detailed calculations."
          }
        ]
      },
      {
        id: "graphical-meaning",
        title: "Understanding Equations Graphically",
        content: [
          {
            type: "paragraph",
            text: "A trigonometric equation can also be understood using graphs."
          },
          {
            type: "paragraph",
            text: "For an equation such as sin(x) = 1/2, graph y = sin(x) and the horizontal line y = 1/2. Every intersection point corresponds to a solution."
          },
          {
            type: "paragraph",
            text: "This gives a visual explanation for why there can be multiple solutions: the periodic sine graph crosses the same horizontal level repeatedly."
          },
          {
            type: "paragraph",
            text: "Graphical thinking will become especially useful later when solving more complicated equations and interpreting the number of solutions."
          }
        ]
      },
      {
        id: "solution-verification",
        title: "How Do We Know a Solution Is Correct?",
        content: [
          {
            type: "paragraph",
            text: "A proposed value is a solution only if substituting it into the original equation makes both sides equal."
          },
          {
            type: "paragraph",
            text: "For example, if x = \u03C0/6 is proposed for sin(x) = 1/2, substitution gives sin(\u03C0/6) = 1/2, so the value is valid."
          },
          {
            type: "paragraph",
            text: "Checking becomes particularly important in later lessons when equations are manipulated through factoring, squaring, division, reciprocal transformations, or identities."
          }
        ]
      },
      {
        id: "big-picture-strategy",
        title: "The Big Picture of Solving Trigonometric Equations",
        content: [
          {
            type: "paragraph",
            text: "Most trigonometric equations are eventually transformed into a simpler equation involving one basic trigonometric function."
          },
          {
            type: "paragraph",
            text: "The general process is: understand the equation, simplify or rearrange it using algebra and identities, isolate a trigonometric function when possible, find the corresponding angles, include every valid solution in the required interval or general solution, and check the final answers."
          },
          {
            type: "paragraph",
            text: "Later lessons will develop each of these steps in detail. This lesson provides the mental model needed to understand why those steps are necessary."
          }
        ]
      }
    ]
  },
  formulas: [],
  examples: [
    {
      id: "simple-equation-identification",
      question: "Is sin(x) = 1/2 a trigonometric equation?",
      solution: "Yes. It contains the trigonometric function sine, has an equality sign, and asks for the values of x that make the equation true."
    },
    {
      id: "identity-identification",
      question: "Is sin\xB2(x) + cos\xB2(x) = 1 a trigonometric equation that needs to be solved?",
      solution: "It is a trigonometric identity. It is true for every value of x for which the expressions are defined, so there is no particular set of angles to find."
    },
    {
      id: "expression-identification",
      question: "Is 2sin(x) + 3 a trigonometric equation?",
      solution: "No. It is a trigonometric expression because there is no equality sign."
    },
    {
      id: "multiple-solutions",
      question: "How many solutions does sin(x) = 1/2 have on 0 \u2264 x < 2\u03C0?",
      solution: "There are two solutions: x = \u03C0/6 and x = 5\u03C0/6. Both angles have a sine value of 1/2."
    },
    {
      id: "no-real-solution",
      question: "Does sin(x) = 2 have a real solution?",
      solution: "No. The range of sine is \u22121 \u2264 sin(x) \u2264 1, so sine can never equal 2."
    },
    {
      id: "graphical-solution",
      question: "How can sin(x) = 1/2 be understood graphically?",
      solution: "Graph y = sin(x) and y = 1/2. The x-coordinates of their intersection points are the solutions of the equation."
    },
    {
      id: "domain-example",
      question: "Can x = \u03C0/2 be a solution of tan(x) = 1?",
      solution: "No. tan(\u03C0/2) is undefined because cos(\u03C0/2) = 0. Therefore \u03C0/2 is not even in the domain of tangent."
    },
    {
      id: "solution-check",
      question: "Is x = \u03C0/6 a solution of sin(x) = 1/2?",
      solution: "Yes. Substituting x = \u03C0/6 gives sin(\u03C0/6) = 1/2, so the equation is satisfied."
    },
    {
      id: "interval-awareness",
      question: "Why does the answer to a trigonometric equation change when the interval changes?",
      solution: "Because a periodic trigonometric function can reach the same value many times. A restricted interval tells us which of those angles should be included."
    }
  ],
  key_ideas: [
    "A trigonometric equation contains one or more trigonometric functions and an equality.",
    "The goal is to find every allowed value of the variable that makes the original equation true.",
    "The unknown is usually an angle.",
    "A trigonometric equation is different from a trigonometric expression.",
    "A trigonometric equation is different from a trigonometric identity.",
    "Periodic trigonometric functions can produce multiple or infinitely many solutions.",
    "Sine and cosine have period 2\u03C0.",
    "Tangent has period \u03C0.",
    "The specified interval determines which solutions should be listed.",
    "The domain of the original equation must always be respected.",
    "Some equations have no real solution because the requested value is outside the function's range.",
    "Graphs provide a visual interpretation of trigonometric equations as intersection problems.",
    "Every proposed solution should satisfy the original equation.",
    "Solving usually involves algebraic manipulation followed by finding the corresponding angles.",
    "A complete answer must include all valid solutions, not just the first angle found."
  ],
  misconceptions: [
    "Thinking every trigonometric equation has exactly one solution.",
    "Thinking the inverse sine, cosine, or tangent result from a calculator is automatically the complete answer.",
    "Confusing a trigonometric equation with a trigonometric identity.",
    "Thinking an expression such as sin(x) + 2 is itself an equation.",
    "Forgetting that the requested interval controls which solutions should be included.",
    "Assuming every trigonometric equation has a real solution.",
    "Forgetting that sine and cosine have maximum value 1 and minimum value \u22121.",
    "Assuming tangent is defined for every real angle.",
    "Ignoring the domain of reciprocal trigonometric functions.",
    "Checking a solution only against a transformed equation instead of the original equation.",
    "Giving only one solution when the trigonometric function reaches the required value more than once in the interval.",
    "Assuming that finding a reference angle is the same as finding every solution.",
    "Mixing degrees and radians when solving an equation.",
    "Assuming that an equation and an identity are solved in exactly the same way.",
    "Forgetting that periodicity is the reason solutions can repeat indefinitely."
  ],
  explorations: [
    {
      id: "equation-as-graph-intersection",
      type: "visualization"
    },
    {
      id: "trigonometric-equation-vs-identity",
      type: "why"
    },
    {
      id: "why-infinite-solutions",
      type: "why"
    },
    {
      id: "sine-equation-unit-circle",
      type: "visualization"
    },
    {
      id: "trigonometric-function-ranges",
      type: "visualization"
    },
    {
      id: "periodicity-and-repeated-solutions",
      type: "visualization"
    }
  ],
  sources: [
    "openstax-precalculus-trigonometric-equations",
    "openstax-precalculus-trigonometric-identities"
  ]
};

// ../content/concepts/trigonometricFunctions/trig-equations-02-nature-of-solutions.json
var trig_equations_02_nature_of_solutions_default = {
  id: "trig-equations-02",
  title: "Understanding the Nature of Solutions",
  subject: "mathematics",
  topic: "trigonometry",
  section: "trigonometric-equations",
  difficulty: 2,
  connections: {
    prerequisites: [
      "trig-equations-01"
    ],
    leads_to: [
      "trig-equations-03",
      "trig-equations-09",
      "trig-equations-11"
    ],
    related: [
      "trigonometric-functions",
      "trigonometric-graphs",
      "unit-circle",
      "periodic-functions",
      "inverse-trigonometric-functions"
    ]
  },
  theory: {
    introduction: "The solutions of trigonometric equations behave differently from the solutions of many ordinary algebraic equations because trigonometric functions are periodic. A trigonometric function can return to the same value again and again as the angle increases. Understanding period, repeated solutions, principal values, intervals, and general solutions is therefore essential before learning how to solve trigonometric equations systematically.",
    sections: [
      {
        id: "what-periodicity-means",
        title: "What Does Periodic Mean?",
        content: [
          {
            type: "paragraph",
            text: "Sine and cosine repeat every 2\u03C0 radians, while tangent repeats every \u03C0 radians.",
            id: "periodicity-paragraph-1"
          }
        ]
      },
      {
        id: "sine-period",
        title: "Period of Sine",
        content: [
          {
            type: "paragraph",
            text: "A restricted interval asks for only the solutions inside a specified range. A general solution describes all solutions.",
            id: "general-and-restricted-paragraph-1"
          }
        ]
      }
    ]
  },
  formulas: [
    {
      id: "sine-period",
      name: "Sine Period",
      expression: "sin(x + 2\u03C0) = sin(x)",
      explanation: "Sine repeats every 2\u03C0 radians, or 360\xB0. Therefore, adding or subtracting any integer multiple of 2\u03C0 gives the same sine value."
    },
    {
      id: "cosine-period",
      name: "Cosine Period",
      expression: "cos(x + 2\u03C0) = cos(x)",
      explanation: "Cosine repeats every 2\u03C0 radians, or 360\xB0. Therefore, adding or subtracting any integer multiple of 2\u03C0 gives the same cosine value."
    },
    {
      id: "tangent-period",
      name: "Tangent Period",
      expression: "tan(x + \u03C0) = tan(x)",
      explanation: "Tangent repeats every \u03C0 radians, or 180\xB0. A half-turn is enough to produce the same tangent value."
    },
    {
      id: "sine-general-period",
      name: "Sine Periodic Family",
      expression: "sin(x + 2n\u03C0) = sin(x),  n \u2208 \u2124",
      explanation: "Adding any integer multiple of the sine period produces another angle with the same sine value."
    },
    {
      id: "cosine-general-period",
      name: "Cosine Periodic Family",
      expression: "cos(x + 2n\u03C0) = cos(x),  n \u2208 \u2124",
      explanation: "Adding any integer multiple of the cosine period produces another angle with the same cosine value."
    },
    {
      id: "tangent-general-period",
      name: "Tangent Periodic Family",
      expression: "tan(x + n\u03C0) = tan(x),  n \u2208 \u2124",
      explanation: "Adding any integer multiple of \u03C0 produces another angle with the same tangent value, provided the function remains defined."
    },
    {
      id: "full-revolution",
      name: "One Complete Revolution",
      expression: "360\xB0 = 2\u03C0 radians",
      explanation: "A complete rotation around the unit circle is 360\xB0 or 2\u03C0 radians."
    },
    {
      id: "half-revolution",
      name: "Half Revolution",
      expression: "180\xB0 = \u03C0 radians",
      explanation: "A half rotation around the unit circle is 180\xB0 or \u03C0 radians. This is the period of tangent."
    },
    {
      id: "tangent-domain",
      name: "Tangent Domain Restriction",
      expression: "x \u2260 \u03C0/2 + n\u03C0,  n \u2208 \u2124",
      explanation: "Tangent is undefined whenever cos(x) = 0, which occurs at odd multiples of \u03C0/2."
    },
    {
      id: "sine-range",
      name: "Sine Range",
      expression: "\u22121 \u2264 sin(x) \u2264 1",
      explanation: "Sine can produce only values from \u22121 to 1. Therefore an equation such as sin(x) = 2 has no real solution."
    },
    {
      id: "cosine-range",
      name: "Cosine Range",
      expression: "\u22121 \u2264 cos(x) \u2264 1",
      explanation: "Cosine can produce only values from \u22121 to 1. Therefore an equation such as cos(x) = \u22123 has no real solution."
    },
    {
      id: "tangent-range",
      name: "Tangent Range",
      expression: "tan(x) \u2208 \u211D",
      explanation: "Tangent can take every real value, although it is undefined at x = \u03C0/2 + n\u03C0."
    },
    {
      id: "integer-definition",
      name: "Integer Parameter",
      expression: "n \u2208 \u2124",
      explanation: "The symbol n \u2208 \u2124 means that n may be any integer, allowing a general solution to represent infinitely many repeated solutions."
    }
  ],
  examples: [
    {
      id: "period-example",
      question: "If x = \u03C0/6 is a solution of sin(x) = 1/2, give another solution using periodicity.",
      solution: "Sine has period 2\u03C0. Therefore x = \u03C0/6 + 2\u03C0 = 13\u03C0/6 is also a solution."
    },
    {
      id: "multiple-sine-solutions",
      question: "Why does sin(x) = 1/2 have more than one solution during one complete revolution?",
      solution: "On the unit circle, sine represents the y-coordinate. The horizontal level y = 1/2 intersects the unit circle at two points, corresponding to x = \u03C0/6 and x = 5\u03C0/6 within 0 \u2264 x < 2\u03C0."
    },
    {
      id: "cosine-solutions",
      question: "Why can cos(x) = 1/2 have two solutions in 0 \u2264 x < 2\u03C0?",
      solution: "Cosine represents the x-coordinate on the unit circle. The vertical line x = 1/2 intersects the unit circle at two points, corresponding to x = \u03C0/3 and x = 5\u03C0/3."
    },
    {
      id: "tangent-period-example",
      question: "If x = \u03C0/4 is a solution of tan(x) = 1, give another solution.",
      solution: "Tangent has period \u03C0. Therefore x = \u03C0/4 + \u03C0 = 5\u03C0/4 is another solution."
    },
    {
      id: "general-sine-family",
      question: "If x = \u03C0/6 is one solution of a sine equation, how can periodic solutions be represented?",
      solution: "Because sine has period 2\u03C0, the same sine value occurs at x = \u03C0/6 + 2n\u03C0, where n \u2208 \u2124. This represents infinitely many solutions belonging to one periodic family."
    },
    {
      id: "general-tangent-family",
      question: "If x = \u03C0/4 is one solution of tan(x) = 1, how can the repeated solutions be represented?",
      solution: "Tangent has period \u03C0, so the repeated family is x = \u03C0/4 + n\u03C0, where n \u2208 \u2124."
    },
    {
      id: "principal-value",
      question: "A calculator gives sin\u207B\xB9(1/2) = \u03C0/6. Is \u03C0/6 automatically the complete solution of sin(x) = 1/2?",
      solution: "No. \u03C0/6 is the principal value returned by the inverse sine function. The equation has another solution in 0 \u2264 x < 2\u03C0, namely 5\u03C0/6, and infinitely many solutions over all real numbers."
    },
    {
      id: "restricted-interval",
      question: "How does the interval 0 \u2264 x < 2\u03C0 affect the solutions of sin(x) = 1/2?",
      solution: "Only angles between 0 and 2\u03C0 are accepted, with 0 included and 2\u03C0 excluded. The valid solutions are \u03C0/6 and 5\u03C0/6."
    },
    {
      id: "no-sine-solution",
      question: "Does sin(x) = 2 have a real solution?",
      solution: "No. The range of sine is from \u22121 to 1, so sine can never equal 2."
    },
    {
      id: "no-cosine-solution",
      question: "Does cos(x) = \u22124 have a real solution?",
      solution: "No. The range of cosine is from \u22121 to 1, so cosine can never equal \u22124."
    },
    {
      id: "tangent-domain",
      question: "Can x = \u03C0/2 be a solution of tan(x) = 1?",
      solution: "No. tan(\u03C0/2) is undefined because cos(\u03C0/2) = 0. Therefore \u03C0/2 is outside the domain of tangent."
    },
    {
      id: "degree-period",
      question: "If sin(x) is written using degrees, what is its period?",
      solution: "The period is 360\xB0. This is equivalent to 2\u03C0 radians."
    },
    {
      id: "tangent-degree-period",
      question: "If tan(x) is written using degrees, what is its period?",
      solution: "The period is 180\xB0, which is equivalent to \u03C0 radians."
    },
    {
      id: "endpoint-example",
      question: "Why is 2\u03C0 excluded from the interval 0 \u2264 x < 2\u03C0?",
      solution: "The inequality uses < rather than \u2264, so 2\u03C0 is not included. Also, 0 and 2\u03C0 represent the same point after one complete revolution, so a half-open interval avoids counting the same position twice."
    },
    {
      id: "negative-angle-example",
      question: "Is x = \u221211\u03C0/6 related to x = \u03C0/6 for a sine equation?",
      solution: "Yes. \u221211\u03C0/6 + 2\u03C0 = \u03C0/6. The two angles differ by one complete revolution, so they have the same sine value."
    },
    {
      id: "predict-number-solutions",
      question: "Before solving sin(x) = 1/2 on 0 \u2264 x < 2\u03C0, how many solutions should you expect?",
      solution: "You should expect two solutions because the value 1/2 occurs twice during one complete revolution of the sine function."
    },
    {
      id: "period-vs-domain",
      question: "Is knowing that tangent has period \u03C0 enough to understand all possible tangent solutions?",
      solution: "No. You must also remember that tangent is undefined at x = \u03C0/2 + n\u03C0. Period tells you how the values repeat, while domain tells you which inputs are allowed."
    }
  ],
  key_ideas: [
    "Trigonometric functions are periodic.",
    "Period is the positive interval after which a function's values repeat.",
    "Sine has period 2\u03C0 radians or 360\xB0.",
    "Cosine has period 2\u03C0 radians or 360\xB0.",
    "Tangent has period \u03C0 radians or 180\xB0.",
    "Periodicity is the reason trigonometric equations can have infinitely many solutions.",
    "The same trigonometric value can occur at different angles during one revolution.",
    "The unit circle explains why sine and cosine commonly have two angles for the same value in one revolution.",
    "Tangent repeats after a half-turn rather than a full turn.",
    "A principal inverse-trigonometric value is not necessarily the complete solution to an equation.",
    "A restricted solution contains only values inside the specified interval.",
    "A general solution describes all valid solutions.",
    "The integer n \u2208 \u2124 is used to represent infinitely many repeated solutions.",
    "The endpoints of a restricted interval must be checked carefully.",
    "Degrees and radians must not be mixed.",
    "One complete revolution is 360\xB0 = 2\u03C0 radians.",
    "One half revolution is 180\xB0 = \u03C0 radians.",
    "The range of a function can determine whether an equation has any real solutions.",
    "Sine and cosine can only produce values between \u22121 and 1.",
    "Tangent can produce every real value but is undefined at odd multiples of \u03C0/2.",
    "Period and domain describe different properties of a trigonometric function.",
    "A solution should always belong to the domain of the original equation.",
    "Thinking about the expected number and pattern of solutions provides a useful check after solving.",
    "Solutions can be understood as repeating families rather than unrelated individual answers."
  ],
  misconceptions: [
    "Assuming a trigonometric equation has only one solution.",
    "Assuming the answer from sin\u207B\xB9, cos\u207B\xB9, or tan\u207B\xB9 is automatically the complete solution.",
    "Forgetting that sine and cosine repeat every 2\u03C0.",
    "Forgetting that tangent repeats every \u03C0 rather than 2\u03C0.",
    "Adding 2\u03C0 to tangent solutions when the natural period is \u03C0.",
    "Assuming every trigonometric function has the same period.",
    "Thinking the period tells us the domain.",
    "Forgetting that tangent is undefined at \u03C0/2 + n\u03C0.",
    "Ignoring the range of sine and cosine before attempting to solve an impossible equation.",
    "Assuming that every value between \u22121 and 1 automatically produces two solutions in every possible interval.",
    "Forgetting that the number of solutions depends on the interval.",
    "Including solutions outside the specified interval.",
    "Missing solutions because only the principal inverse-trigonometric value was considered.",
    "Counting both 0 and 2\u03C0 as different positions when using a single complete revolution.",
    "Forgetting whether an interval endpoint is included or excluded.",
    "Mixing degrees and radians.",
    "Using a period in radians while the problem is expressed in degrees.",
    "Assuming negative angles are invalid.",
    "Assuming n can be any real number rather than an integer.",
    "Thinking a general solution means only positive solutions.",
    "Forgetting that n can be negative, zero, or positive.",
    "Thinking periodicity means every angle gives the same trigonometric value.",
    "Confusing repeated values with identical angles.",
    "Ignoring domain restrictions after transforming an equation."
  ],
  explorations: [
    {
      id: "why-infinite-solutions",
      type: "visualization"
    },
    {
      id: "unit-circle-repeated-solutions",
      type: "visualization"
    },
    {
      id: "sine-periodicity",
      type: "visualization"
    },
    {
      id: "cosine-periodicity",
      type: "visualization"
    },
    {
      id: "tangent-periodicity",
      type: "visualization"
    },
    {
      id: "principal-value-vs-all-solutions",
      type: "why"
    },
    {
      id: "restricted-vs-general-solutions",
      type: "visualization"
    },
    {
      id: "solution-families",
      type: "visualization"
    },
    {
      id: "period-vs-domain",
      type: "why"
    },
    {
      id: "number-of-solutions-on-unit-circle",
      type: "visualization"
    }
  ],
  sources: [
    "openstax-precalculus-trigonometric-equations",
    "libretexts-basic-trigonometric-equations"
  ]
};

// ../content/concepts/trigonometricFunctions/trig-equations-03-basic-equations.json
var trig_equations_03_basic_equations_default = {
  id: "trig-equations-03",
  title: "Solving Basic Trigonometric Equations",
  subject: "mathematics",
  topic: "trigonometry",
  section: "trigonometric-equations",
  difficulty: 2,
  connections: {
    prerequisites: [
      "trig-equations-02",
      "trigonometric-ratios",
      "unit-circle"
    ],
    leads_to: [
      "trig-equations-04",
      "trig-equations-05",
      "trig-equations-06",
      "trig-equations-07"
    ],
    related: [
      "inverse-trigonometric-functions",
      "unit-circle",
      "trigonometric-functions",
      "periodic-functions",
      "reference-angles",
      "quadrants"
    ]
  },
  theory: {
    introduction: "Basic trigonometric equations are equations that can be transformed into a form involving a single basic trigonometric function such as sin(x), cos(x), or tan(x). The main goal is to find every angle that satisfies the equation. This requires more than simply using an inverse trigonometric function because sine, cosine, and tangent are periodic and can produce the same value at multiple angles.",
    sections: [
      {
        id: "what-basic-equations-are",
        title: "What Is a Basic Trigonometric Equation?",
        content: [
          {
            type: "paragraph",
            text: "For sin(x) = a, find the angles where sine has value a and include all required solutions.",
            id: "sine-paragraph-1"
          }
        ]
      },
      {
        id: "general-solving-process",
        title: "The General Method",
        content: [
          {
            type: "paragraph",
            text: "Start by isolating the trigonometric function, determine the relevant reference/principal angle, generate every branch, and then express or filter the solutions as requested. The reason these branches repeat comes from periodicity, covered in trig-equations-02; interval filtering is covered in trig-equations-09 and general notation in trig-equations-11."
          }
        ]
      },
      {
        id: "isolating-function",
        title: "First Isolate the Trigonometric Function",
        content: [
          {
            type: "paragraph",
            text: "Many equations are not initially written in the form sin(x) = a, cos(x) = a, or tan(x) = a."
          },
          {
            type: "paragraph",
            text: "For example, 2sin(x) \u2212 1 = 0 can be rearranged to 2sin(x) = 1 and then sin(x) = 1/2."
          },
          {
            type: "paragraph",
            text: "Similarly, 3cos(x) + 2 = 0 becomes 3cos(x) = \u22122 and then cos(x) = \u22122/3."
          },
          {
            type: "paragraph",
            text: "The trigonometric solving step should normally begin only after the function has been isolated."
          }
        ]
      },
      {
        id: "sine",
        title: "Solving Sine Equations",
        content: [
          {
            type: "paragraph",
            text: "For an equation of the form sin(x) = a, first check that \u22121 \u2264 a \u2264 1."
          },
          {
            type: "paragraph",
            text: "Use sin\u207B\xB9(a) to obtain a principal angle or use the unit circle to identify the corresponding reference angle."
          },
          {
            type: "paragraph",
            text: "Sine is positive in Quadrants I and II and negative in Quadrants III and IV."
          },
          {
            type: "paragraph",
            text: "Therefore, for most values strictly between \u22121 and 1, two solutions occur during one complete revolution."
          },
          {
            type: "paragraph",
            text: "For all real solutions, periodicity must be included."
          }
        ]
      },
      {
        id: "sine-reference-angle",
        title: "Sine and Reference Angles",
        content: [
          {
            type: "paragraph",
            text: "The reference angle is the positive acute angle between the terminal side of an angle and the x-axis."
          },
          {
            type: "paragraph",
            text: "If the reference angle is \u03B1 and sine is positive, the solutions in one revolution occur in Quadrants I and II."
          },
          {
            type: "paragraph",
            text: "These angles are \u03B1 and \u03C0 \u2212 \u03B1."
          },
          {
            type: "paragraph",
            text: "If sine is negative, the solutions occur in Quadrants III and IV. The corresponding angles in 0 \u2264 x < 2\u03C0 can be written as \u03C0 + \u03B1 and 2\u03C0 \u2212 \u03B1."
          }
        ]
      },
      {
        id: "cosine",
        title: "Solving Cosine Equations",
        content: [
          {
            type: "paragraph",
            text: "For cos(x) = a, use the unit circle and symmetry to locate the angles.",
            id: "cosine-paragraph-1"
          }
        ]
      },
      {
        id: "cosine-reference-angle",
        title: "Cosine and Reference Angles",
        content: [
          {
            type: "paragraph",
            text: "For tan(x) = a, find the reference angle and use tangent's period of \u03C0.",
            id: "tangent-paragraph-1"
          }
        ]
      }
    ]
  },
  formulas: [
    {
      id: "sine-general",
      name: "General Sine Solution",
      expression: "sin(x) = a  \u21D2  x = (\u22121)\u207F sin\u207B\xB9(a) + n\u03C0,  n \u2208 \u2124",
      explanation: "Represents all real solutions when \u22121 \u2264 a \u2264 1. This compact formula automatically accounts for the two sine solution families and the 2\u03C0 periodicity."
    },
    {
      id: "sine-two-family",
      name: "Two-Form Sine Solution",
      expression: "sin(x) = a  \u21D2  x = sin\u207B\xB9(a) + 2n\u03C0  or  x = \u03C0 \u2212 sin\u207B\xB9(a) + 2n\u03C0,  n \u2208 \u2124",
      explanation: "Shows the two repeating solution families explicitly. It is often easier for students to understand than the compact (\u22121)\u207F form."
    },
    {
      id: "sine-equals-sine",
      name: "Sine Equals Sine",
      expression: "sin(x) = sin(\u03B8)  \u21D2  x = \u03B8 + 2n\u03C0  or  x = \u03C0 \u2212 \u03B8 + 2n\u03C0,  n \u2208 \u2124",
      explanation: "Use this when both sides are sine functions. The two families come from the symmetry of sine within one complete revolution."
    },
    {
      id: "cosine-general",
      name: "General Cosine Solution",
      expression: "cos(x) = a  \u21D2  x = \xB1cos\u207B\xB9(a) + 2n\u03C0,  n \u2208 \u2124",
      explanation: "Represents all real solutions when \u22121 \u2264 a \u2264 1. The \xB1 accounts for the two cosine solution families."
    },
    {
      id: "cosine-two-family",
      name: "Two-Form Cosine Solution",
      expression: "cos(x) = a  \u21D2  x = cos\u207B\xB9(a) + 2n\u03C0  or  x = 2\u03C0 \u2212 cos\u207B\xB9(a) + 2n\u03C0,  n \u2208 \u2124",
      explanation: "Shows the two repeating cosine solution families explicitly for a principal angle in the standard first-cycle range."
    },
    {
      id: "cosine-equals-cosine",
      name: "Cosine Equals Cosine",
      expression: "cos(x) = cos(\u03B8)  \u21D2  x = 2n\u03C0 \xB1 \u03B8,  n \u2208 \u2124",
      explanation: "Use this when both sides are cosine functions. The two families arise because cosine is an even function and has period 2\u03C0."
    },
    {
      id: "tangent-general",
      name: "General Tangent Solution",
      expression: "tan(x) = a  \u21D2  x = tan\u207B\xB9(a) + n\u03C0,  n \u2208 \u2124",
      explanation: "Represents all real solutions. Tangent has period \u03C0, so only one solution family is required."
    },
    {
      id: "tangent-equals-tangent",
      name: "Tangent Equals Tangent",
      expression: "tan(x) = tan(\u03B8)  \u21D2  x = \u03B8 + n\u03C0,  n \u2208 \u2124",
      explanation: "Use this when both sides are tangent functions. The solutions repeat every \u03C0 because tangent has period \u03C0."
    },
    {
      id: "sine-zero",
      name: "Sine Equals Zero",
      expression: "sin(x) = 0  \u21D2  x = n\u03C0,  n \u2208 \u2124",
      explanation: "Sine is zero on the x-axis of the unit circle, at every integer multiple of \u03C0."
    },
    {
      id: "cosine-zero",
      name: "Cosine Equals Zero",
      expression: "cos(x) = 0  \u21D2  x = \u03C0/2 + n\u03C0,  n \u2208 \u2124",
      explanation: "Cosine is zero on the y-axis of the unit circle, at odd multiples of \u03C0/2."
    },
    {
      id: "tangent-zero",
      name: "Tangent Equals Zero",
      expression: "tan(x) = 0  \u21D2  x = n\u03C0,  n \u2208 \u2124",
      explanation: "Tangent is zero whenever sine is zero and cosine is nonzero."
    },
    {
      id: "sine-positive-quadrants",
      name: "Sine Positive Quadrants",
      expression: "sin(x) > 0  in Quadrants I and II",
      explanation: "The y-coordinate of the unit-circle point is positive in Quadrants I and II."
    },
    {
      id: "sine-negative-quadrants",
      name: "Sine Negative Quadrants",
      expression: "sin(x) < 0  in Quadrants III and IV",
      explanation: "The y-coordinate of the unit-circle point is negative in Quadrants III and IV."
    },
    {
      id: "cosine-positive-quadrants",
      name: "Cosine Positive Quadrants",
      expression: "cos(x) > 0  in Quadrants I and IV",
      explanation: "The x-coordinate of the unit-circle point is positive in Quadrants I and IV."
    },
    {
      id: "cosine-negative-quadrants",
      name: "Cosine Negative Quadrants",
      expression: "cos(x) < 0  in Quadrants II and III",
      explanation: "The x-coordinate of the unit-circle point is negative in Quadrants II and III."
    },
    {
      id: "tangent-positive-quadrants",
      name: "Tangent Positive Quadrants",
      expression: "tan(x) > 0  in Quadrants I and III",
      explanation: "Tangent is sin(x)/cos(x), so it is positive when sine and cosine have the same sign."
    },
    {
      id: "tangent-negative-quadrants",
      name: "Tangent Negative Quadrants",
      expression: "tan(x) < 0  in Quadrants II and IV",
      explanation: "Tangent is sin(x)/cos(x), so it is negative when sine and cosine have opposite signs."
    },
    {
      id: "sine-range",
      name: "Sine Range",
      expression: "\u22121 \u2264 sin(x) \u2264 1",
      explanation: "An equation sin(x) = a has no real solution when a < \u22121 or a > 1."
    },
    {
      id: "cosine-range",
      name: "Cosine Range",
      expression: "\u22121 \u2264 cos(x) \u2264 1",
      explanation: "An equation cos(x) = a has no real solution when a < \u22121 or a > 1."
    },
    {
      id: "tangent-range",
      name: "Tangent Range",
      expression: "tan(x) \u2208 \u211D",
      explanation: "Tangent can take every real value, although it is undefined at x = \u03C0/2 + n\u03C0."
    },
    {
      id: "sine-period",
      name: "Sine Period",
      expression: "sin(x + 2\u03C0) = sin(x)",
      explanation: "Sine repeats every 2\u03C0 radians or 360\xB0."
    },
    {
      id: "cosine-period",
      name: "Cosine Period",
      expression: "cos(x + 2\u03C0) = cos(x)",
      explanation: "Cosine repeats every 2\u03C0 radians or 360\xB0."
    },
    {
      id: "tangent-period",
      name: "Tangent Period",
      expression: "tan(x + \u03C0) = tan(x)",
      explanation: "Tangent repeats every \u03C0 radians or 180\xB0."
    },
    {
      id: "degree-radian",
      name: "Degree-Radian Conversion",
      expression: "180\xB0 = \u03C0 radians,  360\xB0 = 2\u03C0 radians",
      explanation: "Use these relationships when converting between degree and radian forms."
    },
    {
      id: "tangent-domain",
      name: "Tangent Domain Restriction",
      expression: "x \u2260 \u03C0/2 + n\u03C0,  n \u2208 \u2124",
      explanation: "Tangent is undefined wherever cosine is zero."
    }
  ],
  examples: [
    {
      id: "sine-example",
      question: "Solve sin(x) = 1/2 for 0 \u2264 x < 2\u03C0.",
      solution: "The reference angle is \u03C0/6 because sin(\u03C0/6) = 1/2. Sine is positive in Quadrants I and II. Therefore x = \u03C0/6 and x = \u03C0 \u2212 \u03C0/6 = 5\u03C0/6."
    },
    {
      id: "sine-general-example",
      question: "Solve sin(x) = 1/2 for all real x.",
      solution: "The principal angle is \u03C0/6 and the second angle is 5\u03C0/6. Therefore x = \u03C0/6 + 2n\u03C0 or x = 5\u03C0/6 + 2n\u03C0, where n \u2208 \u2124. Equivalently, x = (\u22121)\u207F\u03C0/6 + n\u03C0."
    },
    {
      id: "sine-equals-sine-example",
      question: "Solve sin(x) = sin(\u03C0/6) for all real x.",
      solution: "Using sin(x) = sin(\u03B8), x = \u03B8 + 2n\u03C0 or x = \u03C0 \u2212 \u03B8 + 2n\u03C0. Therefore x = \u03C0/6 + 2n\u03C0 or x = 5\u03C0/6 + 2n\u03C0, where n \u2208 \u2124."
    },
    {
      id: "sine-negative-example",
      question: "Solve sin(x) = \u22121/2 for 0 \u2264 x < 2\u03C0.",
      solution: "The reference angle is \u03C0/6. Sine is negative in Quadrants III and IV. Therefore x = \u03C0 + \u03C0/6 = 7\u03C0/6 and x = 2\u03C0 \u2212 \u03C0/6 = 11\u03C0/6."
    },
    {
      id: "sine-zero-example",
      question: "Solve sin(x) = 0 for all real x.",
      solution: "Sine is zero whenever the terminal side lies on the x-axis. Therefore x = n\u03C0, where n \u2208 \u2124."
    },
    {
      id: "sine-one-example",
      question: "Solve sin(x) = 1 for 0 \u2264 x < 2\u03C0.",
      solution: "Sine reaches 1 at x = \u03C0/2. Therefore the only solution in the half-open interval is x = \u03C0/2."
    },
    {
      id: "sine-impossible-example",
      question: "Solve sin(x) = 3 for real x.",
      solution: "There is no real solution because sine can only take values from \u22121 to 1."
    },
    {
      id: "cosine-example",
      question: "Solve cos(x) = \u2212\u221A2/2 for 0 \u2264 x < 2\u03C0.",
      solution: "The reference angle is \u03C0/4 because cos(\u03C0/4) = \u221A2/2. Cosine is negative in Quadrants II and III. Therefore x = 3\u03C0/4 and x = 5\u03C0/4."
    },
    {
      id: "cosine-general-example",
      question: "Solve cos(x) = \u22121/2 for all real x.",
      solution: "The principal inverse-cosine angle is 2\u03C0/3. Using x = \xB1cos\u207B\xB9(a) + 2n\u03C0 gives x = \xB12\u03C0/3 + 2n\u03C0, where n \u2208 \u2124."
    },
    {
      id: "cosine-equals-cosine-example",
      question: "Solve cos(x) = cos(\u03C0/3) for all real x.",
      solution: "Use cos(x) = cos(\u03B8) \u21D2 x = 2n\u03C0 \xB1 \u03B8. Therefore x = 2n\u03C0 \xB1 \u03C0/3, where n \u2208 \u2124."
    },
    {
      id: "cosine-positive-example",
      question: "Solve cos(x) = 1/2 for 0 \u2264 x < 2\u03C0.",
      solution: "The reference angle is \u03C0/3. Cosine is positive in Quadrants I and IV. Therefore x = \u03C0/3 and x = 5\u03C0/3."
    },
    {
      id: "cosine-zero-example",
      question: "Solve cos(x) = 0 for all real x.",
      solution: "Cosine is zero at odd multiples of \u03C0/2. Therefore x = \u03C0/2 + n\u03C0, where n \u2208 \u2124."
    },
    {
      id: "cosine-impossible-example",
      question: "Solve cos(x) = \u22122 for real x.",
      solution: "There is no real solution because cosine can only take values from \u22121 to 1."
    },
    {
      id: "tangent-example",
      question: "Solve tan(x) = \u221A3 for all real x.",
      solution: "The reference angle is \u03C0/3 because tan(\u03C0/3) = \u221A3. Tangent is positive in Quadrants I and III and repeats every \u03C0. Therefore x = \u03C0/3 + n\u03C0, where n \u2208 \u2124."
    },
    {
      id: "tangent-negative-example",
      question: "Solve tan(x) = \u22121 for 0 \u2264 x < 2\u03C0.",
      solution: "The reference angle is \u03C0/4. Tangent is negative in Quadrants II and IV. Therefore x = 3\u03C0/4 and x = 7\u03C0/4."
    },
    {
      id: "tangent-equals-tangent-example",
      question: "Solve tan(x) = tan(\u03C0/4) for all real x.",
      solution: "Using tan(x) = tan(\u03B8) \u21D2 x = \u03B8 + n\u03C0, we obtain x = \u03C0/4 + n\u03C0, where n \u2208 \u2124."
    },
    {
      id: "tangent-zero-example",
      question: "Solve tan(x) = 0 for all real x.",
      solution: "Tangent is zero whenever sine is zero and cosine is nonzero. Therefore x = n\u03C0, where n \u2208 \u2124."
    },
    {
      id: "tangent-domain-example",
      question: "Can x = \u03C0/2 be a solution of tan(x) = 1?",
      solution: "No. tan(\u03C0/2) is undefined because cos(\u03C0/2) = 0. Therefore \u03C0/2 is not in the domain of tangent."
    },
    {
      id: "linear-sine-example",
      question: "Solve 2sin(x) \u2212 1 = 0 for 0 \u2264 x < 2\u03C0.",
      solution: "First isolate sine: 2sin(x) = 1, so sin(x) = 1/2. The solutions are x = \u03C0/6 and x = 5\u03C0/6."
    },
    {
      id: "linear-cosine-example",
      question: "Solve 3cos(x) + 2 = 0 for 0 \u2264 x < 2\u03C0.",
      solution: "First isolate cosine: 3cos(x) = \u22122, so cos(x) = \u22122/3. Since cosine is negative in Quadrants II and III, use the reference angle cos\u207B\xB9(2/3) and place the solutions in those quadrants."
    },
    {
      id: "linear-tangent-example",
      question: "Solve 2tan(x) \u2212 2 = 0 for all real x.",
      solution: "First isolate tangent: 2tan(x) = 2, so tan(x) = 1. Since tan\u207B\xB9(1) = \u03C0/4 and tangent has period \u03C0, x = \u03C0/4 + n\u03C0, where n \u2208 \u2124."
    },
    {
      id: "degree-sine-example",
      question: "Solve sin(x) = 1/2 for 0\xB0 \u2264 x < 360\xB0.",
      solution: "The reference angle is 30\xB0. Sine is positive in Quadrants I and II, so x = 30\xB0 and x = 150\xB0."
    },
    {
      id: "degree-cosine-example",
      question: "Solve cos(x) = \u2212\u221A3/2 for 0\xB0 \u2264 x < 360\xB0.",
      solution: "The reference angle is 30\xB0. Cosine is negative in Quadrants II and III, so x = 150\xB0 and x = 210\xB0."
    },
    {
      id: "degree-tangent-example",
      question: "Solve tan(x) = 1 for all real x in degrees.",
      solution: "The reference angle is 45\xB0. Tangent has period 180\xB0, so x = 45\xB0 + 180\xB0n, where n \u2208 \u2124."
    },
    {
      id: "multiple-angle-preview",
      question: "What is the basic idea behind solving sin(2x) = 1/2?",
      solution: "Treat 2x as the angle first. The sine equation  sin(2x) = 1/2 has multiple possible values of 2x. After finding those values, divide the resulting equations by 2 to obtain x. The exact number of solutions depends on the interval."
    },
    {
      id: "method-comparison",
      question: "Which is usually easier for solving cos(x) = cos(\u03C0/3): the unit circle or the cosine-equals-cosine formula?",
      solution: "Both methods work. The direct formula cos(x) = cos(\u03B8) \u21D2 x = 2n\u03C0 \xB1 \u03B8 is especially efficient here because \u03B8 is already known."
    }
  ],
  key_ideas: [
    "The first step is usually to isolate the trigonometric function.",
    "The three fundamental basic forms are sin(x) = a, cos(x) = a, and tan(x) = a.",
    "Inverse trigonometric functions provide principal angles, not automatically every solution.",
    "The unit circle provides the exact locations of common trigonometric values.",
    "Reference angles help locate solutions in all four quadrants.",
    "Sine is positive in Quadrants I and II and negative in III and IV.",
    "Cosine is positive in Quadrants I and IV and negative in II and III.",
    "Tangent is positive in Quadrants I and III and negative in II and IV.",
    "Sine and cosine have period 2\u03C0.",
    "Tangent has period \u03C0.",
    "For sin(x) = sin(\u03B8), use x = \u03B8 + 2n\u03C0 or x = \u03C0 \u2212 \u03B8 + 2n\u03C0.",
    "For cos(x) = cos(\u03B8), use x = 2n\u03C0 \xB1 \u03B8.",
    "For tan(x) = tan(\u03B8), use x = \u03B8 + n\u03C0.",
    "For sin(x) = a, the compact general solution is x = (\u22121)\u207Fsin\u207B\xB9(a) + n\u03C0.",
    "For cos(x) = a, the general solution is x = \xB1cos\u207B\xB9(a) + 2n\u03C0.",
    "For tan(x) = a, the general solution is x = tan\u207B\xB9(a) + n\u03C0.",
    "Sine and cosine cannot equal values outside the interval [\u22121, 1].",
    "Tangent can equal any real number but is undefined at \u03C0/2 + n\u03C0.",
    "Restricted intervals require filtering the general solution to the requested range.",
    "General solutions use n \u2208 \u2124 to represent infinitely many solutions.",
    "Exact unit-circle values should be preferred over decimal approximations when possible.",
    "Degrees and radians must be kept consistent throughout the solution.",
    "The interval endpoints must be checked carefully.",
    "Every final solution should satisfy the original equation.",
    "Recognizing the equation's form helps determine the fastest solving method.",
    "Equations comparing the same trigonometric function on both sides have useful direct general-solution formulas.",
    "Multiple-angle equations use the same basic principles but require additional interval and solution-count care."
  ],
  misconceptions: [
    "Giving only the calculator's inverse-trigonometric answer.",
    "Thinking sin\u207B\xB9(a) means 1/sin(a).",
    "Forgetting that inverse trigonometric functions return principal values.",
    "Forgetting the second solution for sine.",
    "Forgetting the second solution for cosine.",
    "Using the wrong period for tangent.",
    "Assuming tangent has period 2\u03C0 instead of \u03C0.",
    "Using the same quadrant rules for all three functions.",
    "Thinking sine and cosine can take values greater than 1 or less than \u22121.",
    "Forgetting to isolate the trigonometric function before solving.",
    "Forgetting to include all integer values of n in a general solution.",
    "Treating n as a real number instead of an integer.",
    "Forgetting negative values of n in a general solution.",
    "Including solutions outside a restricted interval.",
    "Missing a solution because only one quadrant was considered.",
    "Using a reference angle as though it were always the final angle.",
    "Confusing a reference angle with the actual solution angle.",
    "Mixing degrees and radians.",
    "Leaving the calculator in the wrong angle mode.",
    "Using decimal approximations when an exact unit-circle answer is available.",
    "Forgetting that tangent is undefined at odd multiples of \u03C0/2.",
    "Assuming a value outside the range of sine or cosine can still produce a real angle.",
    "Using x = \u03B8 + 2n\u03C0 for tangent instead of x = \u03B8 + n\u03C0.",
    "Using only x = \u03B8 + 2n\u03C0 for sine equations of the form sin(x) = sin(\u03B8) and missing the second family.",
    "Using x = \u03B8 + 2n\u03C0 for cosine equations and missing the symmetric solution.",
    "Forgetting that cos(x) = cos(\u03B8) has the compact form x = 2n\u03C0 \xB1 \u03B8.",
    "Forgetting that tan(x) = tan(\u03B8) has the compact form x = \u03B8 + n\u03C0.",
    "Dividing by a trigonometric expression without considering whether it can equal zero.",
    "Assuming that solving a transformed equation automatically guarantees every resulting value is valid.",
    "Failing to check final answers against the original equation.",
    "Forgetting that multiple-angle equations may produce more solutions within an interval because the angle expression changes faster."
  ],
  explorations: [
    {
      id: "sine-equation-unit-circle",
      type: "visualization"
    },
    {
      id: "cosine-equation-unit-circle",
      type: "visualization"
    },
    {
      id: "tangent-equation-graph",
      type: "visualization"
    },
    {
      id: "sine-solution-families",
      type: "visualization"
    },
    {
      id: "cosine-solution-families",
      type: "visualization"
    },
    {
      id: "tangent-solution-families",
      type: "visualization"
    },
    {
      id: "reference-angle-quadrants",
      type: "visualization"
    },
    {
      id: "inverse-trig-principal-value",
      type: "why"
    },
    {
      id: "why-sin-equals-sin-has-two-families",
      type: "why"
    },
    {
      id: "why-cos-equals-cos-has-two-families",
      type: "why"
    },
    {
      id: "why-tan-equals-tan-has-one-family",
      type: "why"
    },
    {
      id: "restricted-interval-solutions",
      type: "visualization"
    },
    {
      id: "degrees-vs-radians",
      type: "visualization"
    },
    {
      id: "solution-count-prediction",
      type: "visualization"
    }
  ],
  sources: [
    "openstax-precalculus-trigonometric-equations",
    "libretexts-basic-trigonometric-equations"
  ]
};

// ../content/concepts/trigonometricFunctions/trig-equations-04-reciprocal-function-equations.json
var trig_equations_04_reciprocal_function_equations_default = {
  id: "trig-equations-04",
  title: "Equations Using Reciprocal Functions",
  subject: "mathematics",
  topic: "trigonometry",
  section: "trigonometric-equations",
  difficulty: 3,
  connections: {
    prerequisites: [
      "trig-equations-03"
    ],
    leads_to: [
      "trig-equations-05",
      "trig-equations-07",
      "trig-equations-10"
    ],
    related: [
      "trigonometric-functions",
      "domain-and-range",
      "trigonometric-identities",
      "unit-circle",
      "reference-angles",
      "quadrants"
    ]
  },
  theory: {
    introduction: "Reciprocal trigonometric equations involve secant, cosecant, and cotangent. These functions are reciprocals of cosine, sine, and tangent respectively. Most reciprocal-function equations can be solved by rewriting them in terms of sine, cosine, or tangent, solving the resulting basic trigonometric equation, and then checking that the original reciprocal function is defined.",
    sections: [
      {
        id: "reciprocal-functions",
        title: "Reciprocal Trigonometric Functions",
        content: [
          {
            type: "paragraph",
            text: "Secant is the reciprocal of cosine, cosecant is the reciprocal of sine, and cotangent is the reciprocal of tangent.",
            id: "reciprocal-functions-paragraph-1"
          }
        ]
      },
      {
        id: "reciprocal-from-sine-cosine-tangent",
        title: "How the Reciprocal Functions Are Defined",
        content: [
          {
            type: "paragraph",
            text: "Since tan(x) = sin(x)/cos(x), its reciprocal is cot(x) = cos(x)/sin(x)."
          },
          {
            type: "paragraph",
            text: "Since sec(x) = 1/cos(x), secant is defined only where cosine is nonzero."
          },
          {
            type: "paragraph",
            text: "Since csc(x) = 1/sin(x), cosecant is defined only where sine is nonzero."
          },
          {
            type: "paragraph",
            text: "Since cot(x) = cos(x)/sin(x), cotangent is defined only where sine is nonzero."
          },
          {
            type: "paragraph",
            text: "Understanding these definitions is important because reciprocal functions inherit domain restrictions from the function in their denominator."
          }
        ]
      },
      {
        id: "domain",
        title: "Domain Restrictions",
        content: [
          {
            type: "paragraph",
            text: "These functions are undefined whenever their denominator is zero. Domain restrictions must be respected while solving.",
            id: "domain-paragraph-1"
          }
        ]
      }
    ]
  },
  formulas: [
    {
      id: "sec-reciprocal",
      name: "Secant Reciprocal Identity",
      expression: "sec(x) = 1/cos(x)",
      explanation: "Use this to convert secant equations into cosine equations."
    },
    {
      id: "csc-reciprocal",
      name: "Cosecant Reciprocal Identity",
      expression: "csc(x) = 1/sin(x)",
      explanation: "Use this to convert cosecant equations into sine equations."
    },
    {
      id: "cot-reciprocal",
      name: "Cotangent Reciprocal Identity",
      expression: "cot(x) = 1/tan(x) = cos(x)/sin(x)",
      explanation: "Use this to convert cotangent equations into tangent, sine, or cosine equations when useful."
    },
    {
      id: "sec-to-cos-equation",
      name: "Secant Equation Conversion",
      expression: "sec(x) = a  \u21D2  cos(x) = 1/a,  a \u2260 0",
      explanation: "Rewrite a secant equation as a cosine equation and then use the cosine solution methods."
    },
    {
      id: "csc-to-sin-equation",
      name: "Cosecant Equation Conversion",
      expression: "csc(x) = a  \u21D2  sin(x) = 1/a,  a \u2260 0",
      explanation: "Rewrite a cosecant equation as a sine equation and then use the sine solution methods."
    },
    {
      id: "cot-to-tan-equation",
      name: "Cotangent Equation Conversion",
      expression: "cot(x) = a  \u21D2  tan(x) = 1/a,  a \u2260 0",
      explanation: "Rewrite a cotangent equation as a tangent equation and then use the tangent solution methods."
    },
    {
      id: "sec-general",
      name: "General Secant Solution",
      expression: "sec(x) = a  \u21D2  x = \xB1cos\u207B\xB9(1/a) + 2n\u03C0,  n \u2208 \u2124,  |a| \u2265 1",
      explanation: "Obtained by converting sec(x) = a into cos(x) = 1/a and applying the general cosine solution."
    },
    {
      id: "csc-general",
      name: "General Cosecant Solution",
      expression: "csc(x) = a  \u21D2  x = (\u22121)\u207F sin\u207B\xB9(1/a) + n\u03C0,  n \u2208 \u2124,  |a| \u2265 1",
      explanation: "Obtained by converting csc(x) = a into sin(x) = 1/a and applying the general sine solution."
    },
    {
      id: "cot-general",
      name: "General Cotangent Solution",
      expression: "cot(x) = a  \u21D2  x = tan\u207B\xB9(1/a) + n\u03C0,  n \u2208 \u2124,  a \u2260 0",
      explanation: "Obtained by converting cot(x) = a into tan(x) = 1/a. Cotangent has period \u03C0."
    },
    {
      id: "sec-domain",
      name: "Secant Domain Restriction",
      expression: "cos(x) \u2260 0  \u21D2  x \u2260 \u03C0/2 + n\u03C0,  n \u2208 \u2124",
      explanation: "Secant is undefined wherever cosine is zero."
    },
    {
      id: "csc-domain",
      name: "Cosecant Domain Restriction",
      expression: "sin(x) \u2260 0  \u21D2  x \u2260 n\u03C0,  n \u2208 \u2124",
      explanation: "Cosecant is undefined wherever sine is zero."
    },
    {
      id: "cot-domain",
      name: "Cotangent Domain Restriction",
      expression: "sin(x) \u2260 0  \u21D2  x \u2260 n\u03C0,  n \u2208 \u2124",
      explanation: "Cotangent is undefined wherever sine is zero."
    },
    {
      id: "sec-range",
      name: "Secant Range",
      expression: "sec(x) \u2208 (\u2212\u221E, \u22121] \u222A [1, \u221E)",
      explanation: "Secant cannot have values strictly between \u22121 and 1."
    },
    {
      id: "csc-range",
      name: "Cosecant Range",
      expression: "csc(x) \u2208 (\u2212\u221E, \u22121] \u222A [1, \u221E)",
      explanation: "Cosecant cannot have values strictly between \u22121 and 1."
    },
    {
      id: "cot-range",
      name: "Cotangent Range",
      expression: "cot(x) \u2208 \u211D",
      explanation: "Cotangent can take every real value."
    },
    {
      id: "sec-period",
      name: "Secant Period",
      expression: "sec(x + 2\u03C0) = sec(x)",
      explanation: "Secant has the same period as cosine."
    },
    {
      id: "csc-period",
      name: "Cosecant Period",
      expression: "csc(x + 2\u03C0) = csc(x)",
      explanation: "Cosecant has the same period as sine."
    },
    {
      id: "cot-period",
      name: "Cotangent Period",
      expression: "cot(x + \u03C0) = cot(x)",
      explanation: "Cotangent has the same period as tangent."
    },
    {
      id: "sec-zero",
      name: "Secant Cannot Equal Zero",
      expression: "sec(x) \u2260 0",
      explanation: "A reciprocal of a defined finite nonzero value cannot be zero, so sec(x) = 0 has no real solution."
    },
    {
      id: "csc-zero",
      name: "Cosecant Cannot Equal Zero",
      expression: "csc(x) \u2260 0",
      explanation: "A reciprocal of a defined finite nonzero value cannot be zero, so csc(x) = 0 has no real solution."
    },
    {
      id: "cot-zero",
      name: "Cotangent Equals Zero",
      expression: "cot(x) = 0  \u21D2  x = \u03C0/2 + n\u03C0,  n \u2208 \u2124",
      explanation: "Cotangent is cos(x)/sin(x), so it is zero when cosine is zero while sine remains nonzero."
    },
    {
      id: "sec-range-test",
      name: "Secant Solvability Test",
      expression: "sec(x) = a has real solutions only when |a| \u2265 1",
      explanation: "Because secant is the reciprocal of cosine and |cos(x)| \u2264 1, every defined secant value has magnitude at least 1."
    },
    {
      id: "csc-range-test",
      name: "Cosecant Solvability Test",
      expression: "csc(x) = a has real solutions only when |a| \u2265 1",
      explanation: "Because cosecant is the reciprocal of sine and |sin(x)| \u2264 1, every defined cosecant value has magnitude at least 1."
    }
  ],
  examples: [
    {
      id: "sec-example",
      question: "Solve sec(x) = 2 for 0 \u2264 x < 2\u03C0.",
      solution: "Rewrite using sec(x) = 1/cos(x): 1/cos(x) = 2. Therefore cos(x) = 1/2. Cosine is positive in Quadrants I and IV, so x = \u03C0/3 and x = 5\u03C0/3."
    },
    {
      id: "sec-general-example",
      question: "Solve sec(x) = 2 for all real x.",
      solution: "Convert to cos(x) = 1/2. Therefore x = \xB1\u03C0/3 + 2n\u03C0, where n \u2208 \u2124."
    },
    {
      id: "sec-negative-example",
      question: "Solve sec(x) = \u22122 for 0 \u2264 x < 2\u03C0.",
      solution: "Convert to cos(x) = \u22121/2. Cosine is negative in Quadrants II and III. Therefore x = 2\u03C0/3 and x = 4\u03C0/3."
    },
    {
      id: "sec-impossible-example",
      question: "Solve sec(x) = 1/2 for real x.",
      solution: "Convert to cos(x) = 2. This is impossible because cosine can only take values between \u22121 and 1. Therefore there is no real solution."
    },
    {
      id: "sec-one-example",
      question: "Solve sec(x) = 1 for all real x.",
      solution: "Convert to cos(x) = 1. Therefore x = 2n\u03C0, where n \u2208 \u2124."
    },
    {
      id: "sec-minus-one-example",
      question: "Solve sec(x) = \u22121 for all real x.",
      solution: "Convert to cos(x) = \u22121. Therefore x = \u03C0 + 2n\u03C0, where n \u2208 \u2124."
    },
    {
      id: "csc-example",
      question: "Solve csc(x) = \u22121 for 0 \u2264 x < 2\u03C0.",
      solution: "Convert to sin(x) = \u22121. Sine equals \u22121 at x = 3\u03C0/2. Therefore x = 3\u03C0/2."
    },
    {
      id: "csc-general-example",
      question: "Solve csc(x) = 2 for all real x.",
      solution: "Convert to sin(x) = 1/2. Therefore x = \u03C0/6 + 2n\u03C0 or x = 5\u03C0/6 + 2n\u03C0, where n \u2208 \u2124."
    },
    {
      id: "csc-negative-example",
      question: "Solve csc(x) = \u22122 for 0 \u2264 x < 2\u03C0.",
      solution: "Convert to sin(x) = \u22121/2. The reference angle is \u03C0/6 and sine is negative in Quadrants III and IV. Therefore x = 7\u03C0/6 and x = 11\u03C0/6."
    },
    {
      id: "csc-impossible-example",
      question: "Solve csc(x) = 1/2 for real x.",
      solution: "Convert to sin(x) = 2. Since sine cannot equal 2, there is no real solution."
    },
    {
      id: "csc-one-example",
      question: "Solve csc(x) = 1 for 0 \u2264 x < 2\u03C0.",
      solution: "Convert to sin(x) = 1. Therefore x = \u03C0/2."
    },
    {
      id: "cot-example",
      question: "Solve cot(x) = 1 for 0 \u2264 x < 2\u03C0.",
      solution: "Convert using cot(x) = 1/tan(x): 1/tan(x) = 1, so tan(x) = 1. Tangent is positive in Quadrants I and III. Therefore x = \u03C0/4 and x = 5\u03C0/4."
    },
    {
      id: "cot-general-example",
      question: "Solve cot(x) = \u221A3 for all real x.",
      solution: "Convert to tan(x) = 1/\u221A3. Since tan(\u03C0/6) = 1/\u221A3, the general solution is x = \u03C0/6 + n\u03C0, where n \u2208 \u2124."
    },
    {
      id: "cot-negative-example",
      question: "Solve cot(x) = \u22121 for 0 \u2264 x < 2\u03C0.",
      solution: "Convert to tan(x) = \u22121. Tangent is negative in Quadrants II and IV. Therefore x = 3\u03C0/4 and x = 7\u03C0/4."
    },
    {
      id: "cot-zero-example",
      question: "Solve cot(x) = 0 for all real x.",
      solution: "Since cot(x) = cos(x)/sin(x), cotangent is zero when cos(x) = 0 and sin(x) is nonzero. Therefore x = \u03C0/2 + n\u03C0, where n \u2208 \u2124."
    },
    {
      id: "cot-impossible-domain-example",
      question: "Can x = \u03C0 be a solution of cot(x) = 1?",
      solution: "No. cot(\u03C0) is undefined because sin(\u03C0) = 0. Therefore x = \u03C0 cannot be a solution of any equation involving a defined cotangent value."
    },
    {
      id: "linear-sec-example",
      question: "Solve 2sec(x) \u2212 4 = 0 for 0 \u2264 x < 2\u03C0.",
      solution: "First isolate secant: 2sec(x) = 4, so sec(x) = 2. Convert to cos(x) = 1/2. Therefore x = \u03C0/3 and x = 5\u03C0/3."
    },
    {
      id: "linear-csc-example",
      question: "Solve 3csc(x) + 3 = 0 for 0 \u2264 x < 2\u03C0.",
      solution: "First isolate cosecant: 3csc(x) = \u22123, so csc(x) = \u22121. Convert to sin(x) = \u22121. Therefore x = 3\u03C0/2."
    },
    {
      id: "linear-cot-example",
      question: "Solve 2cot(x) \u2212 2 = 0 for 0 \u2264 x < 2\u03C0.",
      solution: "First isolate cotangent: 2cot(x) = 2, so cot(x) = 1. Convert to tan(x) = 1. Therefore x = \u03C0/4 and x = 5\u03C0/4."
    },
    {
      id: "sec-domain-check-example",
      question: "Explain why x = \u03C0/2 cannot be a solution of sec(x) = 2.",
      solution: "Secant is 1/cos(x). Since cos(\u03C0/2) = 0, sec(\u03C0/2) is undefined. Therefore \u03C0/2 is outside the domain of secant and cannot be a solution."
    },
    {
      id: "csc-domain-check-example",
      question: "Explain why x = \u03C0 cannot be a solution of csc(x) = 2.",
      solution: "Cosecant is 1/sin(x). Since sin(\u03C0) = 0, csc(\u03C0) is undefined. Therefore \u03C0 cannot be a solution."
    },
    {
      id: "sec-graph-example",
      question: "How can sec(x) = 2 be understood graphically?",
      solution: "Graph y = sec(x) and y = 2. The solutions are the x-coordinates where the two graphs intersect. In one interval 0 \u2264 x < 2\u03C0, these occur at x = \u03C0/3 and x = 5\u03C0/3."
    },
    {
      id: "reciprocal-choice-example",
      question: "Which basic function should be used to solve csc(x) = \u22122?",
      solution: "Cosecant is the reciprocal of sine, so convert csc(x) = \u22122 into sin(x) = \u22121/2 and then solve using the sine equation methods."
    },
    {
      id: "range-test-example",
      question: "Without solving, determine whether sec(x) = \u22121/2 can have a real solution.",
      solution: "No. The range of secant is (\u2212\u221E, \u22121] \u222A [1, \u221E), so \u22121/2 is not a possible secant value."
    }
  ],
  key_ideas: [
    "Secant is the reciprocal of cosine.",
    "Cosecant is the reciprocal of sine.",
    "Cotangent is the reciprocal of tangent.",
    "Secant equations can usually be converted into cosine equations.",
    "Cosecant equations can usually be converted into sine equations.",
    "Cotangent equations can usually be converted into tangent equations.",
    "Always isolate the reciprocal function before converting when algebra is required.",
    "Secant can only have values with magnitude at least 1.",
    "Cosecant can only have values with magnitude at least 1.",
    "Cotangent can take any real value.",
    "Secant is undefined wherever cosine is zero.",
    "Cosecant is undefined wherever sine is zero.",
    "Cotangent is undefined wherever sine is zero.",
    "Secant has period 2\u03C0.",
    "Cosecant has period 2\u03C0.",
    "Cotangent has period \u03C0.",
    "Sec(x) = a can be converted to cos(x) = 1/a.",
    "Csc(x) = a can be converted to sin(x) = 1/a.",
    "Cot(x) = a can be converted to tan(x) = 1/a.",
    "The general secant solution follows from the general cosine solution.",
    "The general cosecant solution follows from the general sine solution.",
    "The general cotangent solution follows from the general tangent solution.",
    "Secant and cosecant can never equal zero.",
    "Cotangent can equal zero when cosine is zero and sine is nonzero.",
    "A reciprocal equation should always be checked against the domain of the original function.",
    "Restricted intervals require only the valid solutions inside the requested interval.",
    "The original equation is the final authority when checking a candidate solution.",
    "Understanding reciprocal functions makes later identity-based equations easier to solve."
  ],
  misconceptions: [
    "Thinking sec(x) means 1/sin(x).",
    "Thinking csc(x) means 1/cos(x).",
    "Thinking cot(x) means 1/cos(x).",
    "Forgetting that cot(x) = cos(x)/sin(x).",
    "Thinking secant and cosine are the same function.",
    "Thinking cosecant and sine are the same function.",
    "Thinking cotangent and tangent are the same function.",
    "Forgetting that reciprocal means multiplicative inverse.",
    "Assuming secant or cosecant can take values between \u22121 and 1.",
    "Thinking sec(x) = 0 has solutions.",
    "Thinking csc(x) = 0 has solutions.",
    "Forgetting that cot(x) can equal zero.",
    "Ignoring points where the reciprocal function is undefined.",
    "Assuming a transformed equation automatically preserves every possible value without considering domain restrictions.",
    "Forgetting to convert secant to cosine.",
    "Forgetting to convert cosecant to sine.",
    "Forgetting to convert cotangent to tangent.",
    "Using the period 2\u03C0 for cotangent.",
    "Using the period \u03C0 for secant or cosecant.",
    "Forgetting the reciprocal when converting an equation such as sec(x) = 2.",
    "Incorrectly converting sec(x) = 2 into cos(x) = 2 instead of cos(x) = 1/2.",
    "Incorrectly converting csc(x) = 2 into sin(x) = 2 instead of sin(x) = 1/2.",
    "Incorrectly converting cot(x) = 2 into tan(x) = 2 instead of tan(x) = 1/2.",
    "Accepting values where the original reciprocal function is undefined.",
    "Checking only the converted equation and ignoring the original equation.",
    "Forgetting that restricted intervals still require domain checking.",
    "Assuming there must always be two solutions in 0 \u2264 x < 2\u03C0.",
    "Forgetting that special values such as sec(x) = 1 may have fewer solutions per cycle.",
    "Confusing the range restriction of secant/cosecant with the range restriction of sine/cosine.",
    "Forgetting that tangent and cotangent can take all real values."
  ],
  explorations: [
    {
      id: "reciprocal-function-graphs",
      type: "visualization"
    },
    {
      id: "secant-from-cosine",
      type: "visualization"
    },
    {
      id: "cosecant-from-sine",
      type: "visualization"
    },
    {
      id: "cotangent-from-tangent",
      type: "visualization"
    },
    {
      id: "reciprocal-domain-restrictions",
      type: "visualization"
    },
    {
      id: "secant-range",
      type: "visualization"
    },
    {
      id: "cosecant-range",
      type: "visualization"
    },
    {
      id: "cotangent-range",
      type: "visualization"
    },
    {
      id: "why-reciprocal-functions-cannot-equal-zero",
      type: "why"
    },
    {
      id: "why-sec-and-csc-have-two-sided-ranges",
      type: "why"
    },
    {
      id: "reciprocal-equation-graph-intersection",
      type: "visualization"
    }
  ],
  sources: [
    "openstax-precalculus-trigonometric-functions",
    "openstax-precalculus-trigonometric-equations"
  ]
};

// ../content/concepts/trigonometricFunctions/trig-equations-05-factoring.json
var trig_equations_05_factoring_default = {
  id: "trig-equations-05",
  title: "Factoring Trigonometric Equations",
  subject: "mathematics",
  topic: "trigonometry",
  section: "trigonometric-equations",
  difficulty: 3,
  connections: {
    prerequisites: [
      "trig-equations-03",
      "algebraic-equations"
    ],
    leads_to: [
      "trig-equations-06",
      "trig-equations-07"
    ],
    related: [
      "factoring",
      "zero-product-property"
    ]
  },
  theory: {
    introduction: "Many trigonometric equations can be solved by treating trigonometric expressions such as sin(x), cos(x), or tan(x) like algebraic variables. The key idea is to rearrange the equation so that it can be factored, apply the Zero Product Property, solve every resulting trigonometric equation, and then combine all valid solutions. Factoring is especially useful for equations containing products, common factors, or quadratic expressions in a trigonometric function.",
    sections: [
      {
        id: "zero-product",
        title: "Zero Product Property",
        content: [
          {
            type: "paragraph",
            text: "If a product equals zero, at least one factor must equal zero. This allows a complicated trigonometric equation to be separated into simpler equations.",
            id: "zero-product-paragraph-1"
          }
        ]
      },
      {
        id: "factoring-process",
        title: "General Factoring Process",
        content: [
          {
            type: "paragraph",
            text: "Move all terms to one side, factor the expression, solve each factor, and combine all valid solutions.",
            id: "factoring-process-paragraph-1"
          }
        ]
      }
    ]
  },
  formulas: [
    {
      id: "zero-product-property",
      name: "Zero Product Property",
      expression: "AB = 0  \u21D2  A = 0 or B = 0",
      explanation: "The main rule used after factoring a trigonometric equation. Every factor must be set equal to zero."
    },
    {
      id: "three-factor-zero-product",
      name: "Zero Product Property for Three Factors",
      expression: "ABC = 0  \u21D2  A = 0 or B = 0 or C = 0",
      explanation: "The same principle applies when an equation has three or more factors."
    },
    {
      id: "common-factor",
      name: "Common-Factor Pattern",
      expression: "AB + AC = A(B + C)",
      explanation: "Factor out the common expression before solving. The common factor may be sin(x), cos(x), tan(x), or another trigonometric expression."
    },
    {
      id: "difference-of-squares",
      name: "Difference of Squares",
      expression: "A\xB2 \u2212 B\xB2 = (A \u2212 B)(A + B)",
      explanation: "Useful when a trigonometric equation contains the difference between two squares."
    },
    {
      id: "perfect-square-trinomial",
      name: "Perfect Square Trinomials",
      expression: "A\xB2 + 2AB + B\xB2 = (A + B)\xB2;  A\xB2 \u2212 2AB + B\xB2 = (A \u2212 B)\xB2",
      explanation: "Useful when a trigonometric expression forms a perfect-square trinomial."
    },
    {
      id: "quadratic-factoring",
      name: "Quadratic Factoring Pattern",
      expression: "u\xB2 + bu + c = (u + p)(u + q), where p + q = b and pq = c",
      explanation: "A trigonometric expression such as cos\xB2(x) + bcos(x) + c can be treated algebraically by temporarily viewing cos(x) as the variable u."
    },
    {
      id: "quadratic-zero-form",
      name: "Quadratic Zero Form",
      expression: "au\xB2 + bu + c = 0",
      explanation: "Rewrite a trigonometric equation into zero form before attempting to factor."
    },
    {
      id: "sine-zero",
      name: "Sine Equals Zero",
      expression: "sin(x) = 0  \u21D2  x = n\u03C0,  n \u2208 \u2124",
      explanation: "Useful when sin(x) appears as a factor."
    },
    {
      id: "cosine-zero",
      name: "Cosine Equals Zero",
      expression: "cos(x) = 0  \u21D2  x = \u03C0/2 + n\u03C0,  n \u2208 \u2124",
      explanation: "Useful when cos(x) appears as a factor."
    },
    {
      id: "tangent-zero",
      name: "Tangent Equals Zero",
      expression: "tan(x) = 0  \u21D2  x = n\u03C0,  n \u2208 \u2124",
      explanation: "Useful when tan(x) appears as a factor."
    },
    {
      id: "sine-half",
      name: "Sine Equals One-Half",
      expression: "sin(x) = 1/2  \u21D2  x = \u03C0/6 + 2n\u03C0 or x = 5\u03C0/6 + 2n\u03C0",
      explanation: "A common result when factoring equations involving sin(x)."
    },
    {
      id: "sine-minus-half",
      name: "Sine Equals Negative One-Half",
      expression: "sin(x) = \u22121/2  \u21D2  x = 7\u03C0/6 + 2n\u03C0 or x = 11\u03C0/6 + 2n\u03C0",
      explanation: "Useful when a factored equation produces sin(x) = \u22121/2."
    },
    {
      id: "cosine-half",
      name: "Cosine Equals One-Half",
      expression: "cos(x) = 1/2  \u21D2  x = \u03C0/3 + 2n\u03C0 or x = 5\u03C0/3 + 2n\u03C0",
      explanation: "A common result when factoring equations involving cos(x)."
    },
    {
      id: "cosine-minus-half",
      name: "Cosine Equals Negative One-Half",
      expression: "cos(x) = \u22121/2  \u21D2  x = 2\u03C0/3 + 2n\u03C0 or x = 4\u03C0/3 + 2n\u03C0",
      explanation: "Useful when a factored equation produces cos(x) = \u22121/2."
    },
    {
      id: "sine-range",
      name: "Range of Sine",
      expression: "\u22121 \u2264 sin(x) \u2264 1",
      explanation: "Any factor that produces sin(x) outside this range has no real solution."
    },
    {
      id: "cosine-range",
      name: "Range of Cosine",
      expression: "\u22121 \u2264 cos(x) \u2264 1",
      explanation: "Any factor that produces cos(x) outside this range has no real solution."
    },
    {
      id: "tangent-range",
      name: "Range of Tangent",
      expression: "tan(x) \u2208 \u211D",
      explanation: "Tangent can take every real value, although it is undefined where cos(x) = 0."
    },
    {
      id: "sine-period",
      name: "Period of Sine",
      expression: "sin(x + 2\u03C0) = sin(x)",
      explanation: "Sine repeats every 2\u03C0 radians, which is why general solutions commonly contain 2n\u03C0."
    },
    {
      id: "cosine-period",
      name: "Period of Cosine",
      expression: "cos(x + 2\u03C0) = cos(x)",
      explanation: "Cosine repeats every 2\u03C0 radians."
    },
    {
      id: "tangent-period",
      name: "Period of Tangent",
      expression: "tan(x + \u03C0) = tan(x)",
      explanation: "Tangent repeats every \u03C0 radians, so general tangent solutions commonly contain n\u03C0."
    },
    {
      id: "division-warning",
      name: "Division by a Possible-Zero Factor",
      expression: "If A(x)B(x) = 0, do not divide by A(x) without separately considering A(x) = 0.",
      explanation: "Dividing by an expression that may equal zero can remove valid solutions."
    },
    {
      id: "solution-union",
      name: "Union of Factor Solutions",
      expression: "Solutions of A(x)B(x)=0 = solutions of A(x)=0 \u222A solutions of B(x)=0",
      explanation: "The final answer contains every valid solution from every factor."
    }
  ],
  examples: [
    {
      id: "factoring-example-basic",
      question: "Solve 2sin\xB2(x) \u2212 sin(x) = 0 for 0 \u2264 x < 2\u03C0.",
      solution: "Factor: sin(x)(2sin(x) \u2212 1) = 0. Apply the Zero Product Property: sin(x) = 0 or 2sin(x) \u2212 1 = 0. First, sin(x) = 0 gives x = 0, \u03C0 in the interval. Second, 2sin(x) \u2212 1 = 0 gives sin(x) = 1/2, so x = \u03C0/6, 5\u03C0/6. Therefore the solutions are x = 0, \u03C0/6, 5\u03C0/6, \u03C0."
    },
    {
      id: "factoring-example-common-factor",
      question: "Solve 3cos\xB2(x) \u2212 3cos(x) = 0 for 0 \u2264 x < 2\u03C0.",
      solution: "Factor out 3cos(x): 3cos(x)(cos(x) \u2212 1) = 0. Therefore cos(x) = 0 or cos(x) = 1. On 0 \u2264 x < 2\u03C0, cos(x) = 0 gives x = \u03C0/2, 3\u03C0/2, while cos(x) = 1 gives x = 0. Final answer: x = 0, \u03C0/2, 3\u03C0/2."
    },
    {
      id: "factoring-example-negative",
      question: "Solve 2sin\xB2(x) + sin(x) = 0 for 0 \u2264 x < 2\u03C0.",
      solution: "Factor: sin(x)(2sin(x) + 1) = 0. Therefore sin(x) = 0 or sin(x) = \u22121/2. On 0 \u2264 x < 2\u03C0, sin(x) = 0 gives x = 0, \u03C0. Sin(x) = \u22121/2 gives x = 7\u03C0/6, 11\u03C0/6. Final answer: x = 0, \u03C0, 7\u03C0/6, 11\u03C0/6."
    },
    {
      id: "factoring-example-cosine",
      question: "Solve cos\xB2(x) \u2212 3cos(x) + 2 = 0 for 0 \u2264 x < 2\u03C0.",
      solution: "Treat cos(x) like an algebraic variable. Factor: (cos(x) \u2212 1)(cos(x) \u2212 2) = 0. Therefore cos(x) = 1 or cos(x) = 2. Cos(x) = 2 has no real solution because \u22121 \u2264 cos(x) \u2264 1. Cos(x) = 1 gives x = 0 in the interval. Final answer: x = 0."
    },
    {
      id: "factoring-example-difference-squares",
      question: "Solve sin\xB2(x) \u2212 1 = 0 for 0 \u2264 x < 2\u03C0.",
      solution: "Use the difference of squares: sin\xB2(x) \u2212 1 = (sin(x) \u2212 1)(sin(x) + 1) = 0. Therefore sin(x) = 1 or sin(x) = \u22121. On 0 \u2264 x < 2\u03C0, these give x = \u03C0/2 and x = 3\u03C0/2. Final answer: x = \u03C0/2, 3\u03C0/2."
    },
    {
      id: "factoring-example-two-factors",
      question: "Solve (2sin(x) \u2212 1)(cos(x) + 1) = 0 for 0 \u2264 x < 2\u03C0.",
      solution: "Set each factor equal to zero. 2sin(x) \u2212 1 = 0 gives sin(x) = 1/2, so x = \u03C0/6, 5\u03C0/6. Cos(x) + 1 = 0 gives cos(x) = \u22121, so x = \u03C0. Combine all valid solutions: x = \u03C0/6, 5\u03C0/6, \u03C0."
    },
    {
      id: "factoring-example-no-solution-factor",
      question: "Solve (cos(x) \u2212 2)(sin(x) + 1) = 0.",
      solution: "Set each factor equal to zero. cos(x) \u2212 2 = 0 gives cos(x) = 2, which has no real solution because cosine lies between \u22121 and 1. sin(x) + 1 = 0 gives sin(x) = \u22121, so x = 3\u03C0/2 + 2n\u03C0, n \u2208 \u2124. Therefore the general solution is x = 3\u03C0/2 + 2n\u03C0."
    },
    {
      id: "factoring-example-general",
      question: "Solve 2sin\xB2(x) \u2212 sin(x) = 0 for all real x.",
      solution: "Factor: sin(x)(2sin(x) \u2212 1) = 0. Thus sin(x) = 0 or sin(x) = 1/2. For sin(x) = 0, x = n\u03C0. For sin(x) = 1/2, x = \u03C0/6 + 2n\u03C0 or x = 5\u03C0/6 + 2n\u03C0, where n \u2208 \u2124. These three families form the complete general solution."
    },
    {
      id: "factoring-example-lost-solutions",
      question: "Solve sin(x)(2sin(x) \u2212 1) = 0 and explain why dividing by sin(x) is dangerous.",
      solution: "Factoring already gives sin(x) = 0 or 2sin(x) \u2212 1 = 0. Therefore both sin(x) = 0 and sin(x) = 1/2 must be solved. If we divide by sin(x), we get 2sin(x) \u2212 1 = 0, but this assumes sin(x) \u2260 0 and removes all solutions where sin(x) = 0. The correct approach is to use the Zero Product Property."
    },
    {
      id: "factoring-example-rearrange",
      question: "Solve 2sin\xB2(x) = sin(x) for 0 \u2264 x < 2\u03C0.",
      solution: "Move everything to one side: 2sin\xB2(x) \u2212 sin(x) = 0. Factor: sin(x)(2sin(x) \u2212 1) = 0. Thus sin(x) = 0 or sin(x) = 1/2. The solutions are x = 0, \u03C0, \u03C0/6, 5\u03C0/6. Ordered from smallest to largest: x = 0, \u03C0/6, 5\u03C0/6, \u03C0."
    },
    {
      id: "factoring-example-tangent",
      question: "Solve tan\xB2(x) \u2212 tan(x) = 0 for 0 \u2264 x < 2\u03C0.",
      solution: "Factor: tan(x)(tan(x) \u2212 1) = 0. Therefore tan(x) = 0 or tan(x) = 1. On 0 \u2264 x < 2\u03C0, tan(x) = 0 gives x = 0, \u03C0. Tan(x) = 1 gives x = \u03C0/4, 5\u03C0/4. Final answer: x = 0, \u03C0/4, \u03C0, 5\u03C0/4."
    },
    {
      id: "factoring-example-multiple-factors",
      question: "Solve sin(x)(sin(x) \u2212 1)(sin(x) + 1) = 0 for 0 \u2264 x < 2\u03C0.",
      solution: "Set every factor equal to zero: sin(x) = 0, sin(x) = 1, or sin(x) = \u22121. On 0 \u2264 x < 2\u03C0 these give x = 0, \u03C0; x = \u03C0/2; and x = 3\u03C0/2. Final answer: x = 0, \u03C0/2, \u03C0, 3\u03C0/2."
    },
    {
      id: "factoring-example-grouping",
      question: "Factor and solve sin(x)cos(x) + 2sin(x) + 3cos(x) + 6 = 0.",
      solution: "Group terms: [sin(x)cos(x) + 2sin(x)] + [3cos(x) + 6] = 0. Factor each group: sin(x)[cos(x) + 2] + 3[cos(x) + 2] = 0. Factor again: [sin(x) + 3][cos(x) + 2] = 0. This would require sin(x) = \u22123 or cos(x) = \u22122. Neither is possible for real x because sine and cosine both lie between \u22121 and 1. Therefore there are no real solutions."
    },
    {
      id: "factoring-example-special-values",
      question: "Solve 4cos\xB2(x) \u2212 4 = 0 for 0 \u2264 x < 2\u03C0.",
      solution: "Factor: 4(cos\xB2(x) \u2212 1) = 0. Use difference of squares: 4(cos(x) \u2212 1)(cos(x) + 1) = 0. Therefore cos(x) = 1 or cos(x) = \u22121. On 0 \u2264 x < 2\u03C0, x = 0 for cos(x) = 1 and x = \u03C0 for cos(x) = \u22121. Final answer: x = 0, \u03C0."
    }
  ],
  key_ideas: [
    "Move all terms to one side before factoring whenever possible.",
    "The Zero Product Property is the central rule after factoring.",
    "Every factor must be solved.",
    "Treat sin(x), cos(x), and tan(x) like algebraic variables when the equation has a suitable algebraic structure.",
    "Factor out common trigonometric factors before using more complicated identities.",
    "Use difference of squares when an expression has the form A\xB2 \u2212 B\xB2.",
    "A factor can produce an impossible trigonometric value, such as sin(x) = 2 or cos(x) = \u22123; such a factor has no real solutions.",
    "The final answer is the union of the solutions from every factor.",
    "Do not divide by a trigonometric expression that might equal zero without separately checking that case.",
    "When a restricted interval is given, keep only solutions inside that interval.",
    "When no interval is given, use general solutions with n \u2208 \u2124.",
    "Always pay attention to the period of the trigonometric function being solved.",
    "Check the original equation when transformations may have introduced domain issues or extraneous solutions.",
    "Factoring connects algebraic equations with trigonometric equations and prepares the learner for quadratic trigonometric equations."
  ],
  misconceptions: [
    "Dividing by sin(x) or cos(x) without checking whether that expression can equal zero.",
    "Solving only the first factor and forgetting the remaining factors.",
    "Thinking that A\xB7B = 0 means A = 0 and B = 0 simultaneously.",
    "Forgetting to move all terms to one side before applying the Zero Product Property.",
    "Assuming every algebraic value obtained for sin(x) or cos(x) is possible.",
    "Forgetting that sin(x) and cos(x) can only take values from \u22121 to 1.",
    "Forgetting that tangent is undefined where cos(x) = 0.",
    "Giving only one angle when a trigonometric equation has multiple solutions in the required interval.",
    "Using the wrong period when writing general solutions.",
    "Including an excluded endpoint such as 2\u03C0 when the interval is 0 \u2264 x < 2\u03C0.",
    "Listing duplicate solutions when two different factors produce the same angle.",
    "Assuming factoring automatically means there is a solution from every factor.",
    "Stopping after factoring instead of solving each resulting trigonometric equation.",
    "Using the factored equation for checking when an earlier algebraic operation may have changed the domain.",
    "Confusing 'or' from the Zero Product Property with 'and'."
  ],
  explorations: [
    {
      id: "factoring-trigonometric-equation",
      type: "visualization"
    },
    {
      id: "zero-product-unit-circle",
      type: "visualization"
    },
    {
      id: "factoring-as-branches",
      type: "visualization"
    },
    {
      id: "lost-solutions-by-division",
      type: "why"
    },
    {
      id: "trig-function-as-variable",
      type: "why"
    }
  ],
  sources: [
    "openstax-precalculus-trigonometric-equations"
  ]
};

// ../content/concepts/trigonometricFunctions/trig-equations-06-quadratic-equation.json
var trig_equations_06_quadratic_equation_default = {
  id: "trig-equations-06",
  title: "Quadratic Trigonometric Equations",
  subject: "mathematics",
  topic: "trigonometry",
  section: "trigonometric-equations",
  difficulty: 3,
  connections: {
    prerequisites: [
      "trig-equations-03",
      "trig-equations-05",
      "quadratic-equations"
    ],
    leads_to: [
      "trig-equations-07",
      "trig-equations-08"
    ],
    related: [
      "quadratic-equations",
      "pythagorean-identities"
    ]
  },
  theory: {
    introduction: "Some trigonometric equations have the structure of quadratic equations when one trigonometric expression is temporarily treated as the variable. For example, 2cos\xB2(x) \u2212 3cos(x) + 1 = 0 has the same algebraic structure as 2u\xB2 \u2212 3u + 1 = 0 if u = cos(x). The quadratic can first be solved algebraically, but every resulting value must then be converted back into a trigonometric equation and solved for all possible angles.",
    sections: [
      {
        id: "recognizing-quadratic-form",
        title: "Recognizing Quadratic Trigonometric Equations",
        content: [
          {
            type: "paragraph",
            text: "A quadratic trigonometric equation contains a repeated trigonometric expression whose highest power is 2. Common forms include a sin\xB2(x) + bsin(x) + c = 0, a cos\xB2(x) + bcos(x) + c = 0, and a tan\xB2(x) + btan(x) + c = 0."
          },
          {
            type: "paragraph",
            text: "The important pattern is that the same trigonometric function appears repeatedly. For example, 3sin\xB2(x) \u2212 5sin(x) + 2 = 0 is quadratic in sin(x)."
          },
          {
            type: "paragraph",
            text: "An expression such as sin\xB2(x) + sin(x)cos(x) + cos\xB2(x) = 1 is not immediately a quadratic in a single trigonometric function because more than one trigonometric expression is involved. Such equations may require identities before they become solvable."
          }
        ]
      },
      {
        id: "substitution",
        title: "Using Substitution",
        content: [
          {
            type: "paragraph",
            text: "If an equation contains repeated powers of one trigonometric function, temporarily treat that function as a variable and solve the resulting quadratic.",
            id: "substitution-paragraph-1"
          }
        ]
      },
      {
        id: "factoring-quadratic",
        title: "Solving the Quadratic by Factoring",
        content: [
          {
            type: "paragraph",
            text: "If the quadratic factors easily, factoring is usually the fastest method."
          },
          {
            type: "paragraph",
            text: "For example, 2u\xB2 \u2212 3u + 1 = 0 factors as (2u \u2212 1)(u \u2212 1) = 0. The Zero Product Property gives u = 1/2 or u = 1."
          },
          {
            type: "paragraph",
            text: "After replacing u with the original trigonometric expression, these become separate trigonometric equations."
          },
          {
            type: "paragraph",
            text: "This is where Lesson 05 connects directly to quadratic trigonometric equations: the algebraic quadratic can often be solved using the same factoring techniques learned previously."
          }
        ]
      },
      {
        id: "quadratic-formula",
        title: "Using the Quadratic Formula",
        content: [
          {
            type: "paragraph",
            text: "Not every quadratic factors conveniently. In that case, use the quadratic formula."
          },
          {
            type: "paragraph",
            text: "For au\xB2 + bu + c = 0, the solutions are u = (\u2212b \xB1 \u221A(b\xB2 \u2212 4ac))/(2a)."
          },
          {
            type: "paragraph",
            text: "After finding u, substitute back to obtain an equation such as sin(x) = u or cos(x) = u."
          },
          {
            type: "paragraph",
            text: "The discriminant b\xB2 \u2212 4ac determines the number and type of real algebraic solutions. However, even a real algebraic solution may not correspond to a real angle if it lies outside the range of the trigonometric function."
          }
        ]
      },
      {
        id: "convert-back",
        title: "Convert Back to Angles",
        content: [
          {
            type: "paragraph",
            text: "After solving the quadratic, substitute the trigonometric expression back and solve the resulting trigonometric equations.",
            id: "convert-back-paragraph-1"
          }
        ]
      }
    ]
  },
  formulas: [
    {
      id: "quadratic-form",
      name: "Quadratic Form",
      expression: "au\xB2 + bu + c = 0",
      explanation: "The standard quadratic form used after replacing a repeated trigonometric expression with u."
    },
    {
      id: "quadratic-formula",
      name: "Quadratic Formula",
      expression: "u = (\u2212b \xB1 \u221A(b\xB2 \u2212 4ac))/(2a)",
      explanation: "Used to solve a quadratic when factoring is inconvenient or impossible over the integers."
    },
    {
      id: "discriminant",
      name: "Discriminant",
      expression: "\u0394 = b\xB2 \u2212 4ac",
      explanation: "Determines the nature of the quadratic roots. If \u0394 > 0 there are two distinct real roots, if \u0394 = 0 there is one repeated real root, and if \u0394 < 0 there are no real roots."
    },
    {
      id: "substitution-sine",
      name: "Sine Substitution",
      expression: "u = sin(x),  sin\xB2(x) = u\xB2",
      explanation: "Used when an equation is quadratic in sin(x)."
    },
    {
      id: "substitution-cosine",
      name: "Cosine Substitution",
      expression: "u = cos(x),  cos\xB2(x) = u\xB2",
      explanation: "Used when an equation is quadratic in cos(x)."
    },
    {
      id: "substitution-tangent",
      name: "Tangent Substitution",
      expression: "u = tan(x),  tan\xB2(x) = u\xB2",
      explanation: "Used when an equation is quadratic in tan(x)."
    },
    {
      id: "sine-range",
      name: "Range of Sine",
      expression: "\u22121 \u2264 sin(x) \u2264 1",
      explanation: "Any quadratic root outside this interval cannot be a real value of sin(x)."
    },
    {
      id: "cosine-range",
      name: "Range of Cosine",
      expression: "\u22121 \u2264 cos(x) \u2264 1",
      explanation: "Any quadratic root outside this interval cannot be a real value of cos(x)."
    },
    {
      id: "tangent-range",
      name: "Range of Tangent",
      expression: "tan(x) \u2208 \u211D",
      explanation: "Tangent can take any real value, although it is undefined where cos(x) = 0."
    },
    {
      id: "sine-general",
      name: "General Sine Solution",
      expression: "sin(x) = a  \u21D2  x = sin\u207B\xB9(a) + 2n\u03C0 or x = \u03C0 \u2212 sin\u207B\xB9(a) + 2n\u03C0,  n \u2208 \u2124",
      explanation: "Use after a quadratic in sine produces a valid value a."
    },
    {
      id: "cosine-general",
      name: "General Cosine Solution",
      expression: "cos(x) = a  \u21D2  x = \xB1cos\u207B\xB9(a) + 2n\u03C0,  n \u2208 \u2124",
      explanation: "Use after a quadratic in cosine produces a valid value a."
    },
    {
      id: "tangent-general",
      name: "General Tangent Solution",
      expression: "tan(x) = a  \u21D2  x = tan\u207B\xB9(a) + n\u03C0,  n \u2208 \u2124",
      explanation: "Use after a quadratic in tangent produces a valid value a."
    },
    {
      id: "sine-zero",
      name: "Sine Equals Zero",
      expression: "sin(x) = 0  \u21D2  x = n\u03C0,  n \u2208 \u2124",
      explanation: "Common result when a quadratic in sine has zero as one of its roots."
    },
    {
      id: "cosine-zero",
      name: "Cosine Equals Zero",
      expression: "cos(x) = 0  \u21D2  x = \u03C0/2 + n\u03C0,  n \u2208 \u2124",
      explanation: "Common result when a quadratic in cosine has zero as one of its roots."
    },
    {
      id: "tangent-zero",
      name: "Tangent Equals Zero",
      expression: "tan(x) = 0  \u21D2  x = n\u03C0,  n \u2208 \u2124",
      explanation: "Common result when a quadratic in tangent has zero as one of its roots."
    },
    {
      id: "sine-one",
      name: "Sine Equals One",
      expression: "sin(x) = 1  \u21D2  x = \u03C0/2 + 2n\u03C0,  n \u2208 \u2124",
      explanation: "Useful when a quadratic produces sin(x) = 1."
    },
    {
      id: "sine-negative-one",
      name: "Sine Equals Negative One",
      expression: "sin(x) = \u22121  \u21D2  x = 3\u03C0/2 + 2n\u03C0,  n \u2208 \u2124",
      explanation: "Useful when a quadratic produces sin(x) = \u22121."
    },
    {
      id: "cosine-one",
      name: "Cosine Equals One",
      expression: "cos(x) = 1  \u21D2  x = 2n\u03C0,  n \u2208 \u2124",
      explanation: "Useful when a quadratic produces cos(x) = 1."
    },
    {
      id: "cosine-negative-one",
      name: "Cosine Equals Negative One",
      expression: "cos(x) = \u22121  \u21D2  x = \u03C0 + 2n\u03C0,  n \u2208 \u2124",
      explanation: "Useful when a quadratic produces cos(x) = \u22121."
    },
    {
      id: "sine-pythagorean",
      name: "Pythagorean Identity for Sine",
      expression: "sin\xB2(x) + cos\xB2(x) = 1",
      explanation: "Can convert between sin\xB2(x) and cos\xB2(x) and may turn an equation into quadratic form."
    },
    {
      id: "sine-square-replacement",
      name: "Rewrite sin\xB2(x)",
      expression: "sin\xB2(x) = 1 \u2212 cos\xB2(x)",
      explanation: "Useful for converting an equation involving sin\xB2(x) into one involving cos\xB2(x)."
    },
    {
      id: "cosine-square-replacement",
      name: "Rewrite cos\xB2(x)",
      expression: "cos\xB2(x) = 1 \u2212 sin\xB2(x)",
      explanation: "Useful for converting an equation involving cos\xB2(x) into one involving sin\xB2(x)."
    },
    {
      id: "quadratic-factoring",
      name: "Factored Quadratic",
      expression: "au\xB2 + bu + c = (pu + q)(ru + s)",
      explanation: "When the quadratic can be factored, use the Zero Product Property to obtain the possible values of u."
    },
    {
      id: "zero-product",
      name: "Zero Product Property",
      expression: "AB = 0  \u21D2  A = 0 or B = 0",
      explanation: "Used after factoring the quadratic. Every factor must be considered."
    },
    {
      id: "sine-period",
      name: "Period of Sine",
      expression: "sin(x + 2\u03C0) = sin(x)",
      explanation: "Sine repeats every 2\u03C0 radians."
    },
    {
      id: "cosine-period",
      name: "Period of Cosine",
      expression: "cos(x + 2\u03C0) = cos(x)",
      explanation: "Cosine repeats every 2\u03C0 radians."
    },
    {
      id: "tangent-period",
      name: "Period of Tangent",
      expression: "tan(x + \u03C0) = tan(x)",
      explanation: "Tangent repeats every \u03C0 radians."
    }
  ],
  examples: [
    {
      id: "quadratic-example",
      question: "Solve 2cos\xB2(x) \u2212 3cos(x) + 1 = 0 for 0 \u2264 x < 2\u03C0.",
      solution: "Let u = cos(x). Then 2u\xB2 \u2212 3u + 1 = 0. Factor: (2u \u2212 1)(u \u2212 1) = 0. Therefore u = 1/2 or u = 1. Substitute back: cos(x) = 1/2 or cos(x) = 1. On 0 \u2264 x < 2\u03C0, cos(x) = 1/2 gives x = \u03C0/3, 5\u03C0/3, while cos(x) = 1 gives x = 0. Final answer: x = 0, \u03C0/3, 5\u03C0/3."
    },
    {
      id: "quadratic-sine-example",
      question: "Solve 2sin\xB2(x) \u2212 3sin(x) + 1 = 0 for 0 \u2264 x < 2\u03C0.",
      solution: "Let u = sin(x). Then 2u\xB2 \u2212 3u + 1 = 0. Factor: (2u \u2212 1)(u \u2212 1) = 0. Therefore sin(x) = 1/2 or sin(x) = 1. Sin(x) = 1/2 gives x = \u03C0/6, 5\u03C0/6. Sin(x) = 1 gives x = \u03C0/2. Final answer: x = \u03C0/6, \u03C0/2, 5\u03C0/6."
    },
    {
      id: "quadratic-negative-sine",
      question: "Solve 2sin\xB2(x) + sin(x) \u2212 1 = 0 for 0 \u2264 x < 2\u03C0.",
      solution: "Let u = sin(x). Then 2u\xB2 + u \u2212 1 = 0. Factor: (2u \u2212 1)(u + 1) = 0. Therefore sin(x) = 1/2 or sin(x) = \u22121. On 0 \u2264 x < 2\u03C0, these give x = \u03C0/6, 5\u03C0/6, and 3\u03C0/2. Final answer: x = \u03C0/6, 5\u03C0/6, 3\u03C0/2."
    },
    {
      id: "quadratic-no-valid-root",
      question: "Solve 2sin\xB2(x) \u2212 7sin(x) + 6 = 0.",
      solution: "Let u = sin(x). Then 2u\xB2 \u2212 7u + 6 = 0. Factor: (2u \u2212 3)(u \u2212 2) = 0. Therefore sin(x) = 3/2 or sin(x) = 2. Both values are outside the range [\u22121, 1] of sine. Therefore there are no real solutions."
    },
    {
      id: "quadratic-cosine-impossible-root",
      question: "Solve cos\xB2(x) + cos(x) \u2212 2 = 0.",
      solution: "Let u = cos(x). Then u\xB2 + u \u2212 2 = 0. Factor: (u + 2)(u \u2212 1) = 0. Thus cos(x) = \u22122 or cos(x) = 1. Cos(x) = \u22122 is impossible because cosine lies between \u22121 and 1. Therefore cos(x) = 1, giving x = 2n\u03C0, n \u2208 \u2124."
    },
    {
      id: "quadratic-tangent-example",
      question: "Solve tan\xB2(x) \u2212 3tan(x) + 2 = 0 for 0 \u2264 x < 2\u03C0.",
      solution: "Let u = tan(x). Then u\xB2 \u2212 3u + 2 = 0. Factor: (u \u2212 1)(u \u2212 2) = 0. Therefore tan(x) = 1 or tan(x) = 2. Tan(x) = 1 gives x = \u03C0/4, 5\u03C0/4. Tan(x) = 2 gives x = tan\u207B\xB9(2), \u03C0 + tan\u207B\xB9(2). Final answer: x = \u03C0/4, tan\u207B\xB9(2), 5\u03C0/4, \u03C0 + tan\u207B\xB9(2)."
    },
    {
      id: "quadratic-formula-example",
      question: "Solve 2sin\xB2(x) + sin(x) \u2212 1/2 = 0.",
      solution: "Let u = sin(x). Then 2u\xB2 + u \u2212 1/2 = 0. Multiply by 2: 4u\xB2 + 2u \u2212 1 = 0. Use the quadratic formula: u = [\u22122 \xB1 \u221A(2\xB2 \u2212 4(4)(\u22121))]/8 = [\u22122 \xB1 \u221A20]/8 = (\u22121 \xB1 \u221A5)/4. Both values lie between \u22121 and 1, so both are possible sine values. The final step is to solve sin(x) = (\u22121 + \u221A5)/4 and sin(x) = (\u22121 \u2212 \u221A5)/4, using the appropriate inverse-sine and quadrant methods."
    },
    {
      id: "quadratic-zero-example",
      question: "Solve sin\xB2(x) \u2212 sin(x) = 0 for 0 \u2264 x < 2\u03C0.",
      solution: "Factor: sin(x)(sin(x) \u2212 1) = 0. Therefore sin(x) = 0 or sin(x) = 1. On the interval, sin(x) = 0 gives x = 0, \u03C0 and sin(x) = 1 gives x = \u03C0/2. Final answer: x = 0, \u03C0/2, \u03C0."
    },
    {
      id: "quadratic-zero-cosine-example",
      question: "Solve cos\xB2(x) \u2212 cos(x) = 0 for 0 \u2264 x < 2\u03C0.",
      solution: "Factor: cos(x)(cos(x) \u2212 1) = 0. Therefore cos(x) = 0 or cos(x) = 1. Cos(x) = 0 gives x = \u03C0/2, 3\u03C0/2. Cos(x) = 1 gives x = 0. Final answer: x = 0, \u03C0/2, 3\u03C0/2."
    },
    {
      id: "quadratic-pythagorean-example",
      question: "Solve sin\xB2(x) + cos(x) = 0 for 0 \u2264 x < 2\u03C0.",
      solution: "Use sin\xB2(x) = 1 \u2212 cos\xB2(x). Then 1 \u2212 cos\xB2(x) + cos(x) = 0. Rearrange: cos\xB2(x) \u2212 cos(x) \u2212 1 = 0. Let u = cos(x): u\xB2 \u2212 u \u2212 1 = 0. The quadratic formula gives u = (1 \xB1 \u221A5)/2. The root (1 + \u221A5)/2 is greater than 1 and is impossible for cosine. The root (1 \u2212 \u221A5)/2 lies in [\u22121, 1], so the remaining equation is cos(x) = (1 \u2212 \u221A5)/2. Solve this equation using the cosine general-solution method."
    },
    {
      id: "quadratic-restricted-interval",
      question: "Solve 3cos\xB2(x) \u2212 4cos(x) + 1 = 0 for 0 \u2264 x \u2264 2\u03C0.",
      solution: "Let u = cos(x). Then 3u\xB2 \u2212 4u + 1 = 0. Factor: (3u \u2212 1)(u \u2212 1) = 0. Therefore cos(x) = 1/3 or cos(x) = 1. Cos(x) = 1 gives x = 0 and x = 2\u03C0 because this interval includes both endpoints. Cos(x) = 1/3 gives x = cos\u207B\xB9(1/3) and x = 2\u03C0 \u2212 cos\u207B\xB9(1/3). Final answer: x = 0, cos\u207B\xB9(1/3), 2\u03C0 \u2212 cos\u207B\xB9(1/3), 2\u03C0."
    },
    {
      id: "quadratic-general-sine",
      question: "Solve sin\xB2(x) \u2212 3sin(x) + 2 = 0 for all real x.",
      solution: "Let u = sin(x). Then u\xB2 \u2212 3u + 2 = 0, which factors as (u \u2212 1)(u \u2212 2) = 0. Therefore sin(x) = 1 or sin(x) = 2. Sin(x) = 2 is impossible because the range of sine is [\u22121, 1]. Sin(x) = 1 gives x = \u03C0/2 + 2n\u03C0, n \u2208 \u2124."
    },
    {
      id: "quadratic-complete-workflow",
      question: "Solve 4cos\xB2(x) \u2212 4cos(x) = 0 for 0 \u2264 x < 2\u03C0 and demonstrate the complete workflow.",
      solution: "Step 1: The equation is already equal to zero. Step 2: It is quadratic in cos(x). Step 3: Let u = cos(x). Step 4: 4u\xB2 \u2212 4u = 0. Factor: 4u(u \u2212 1) = 0. Step 5: u = 0 or u = 1, and both are valid cosine values. Step 6: Convert back: cos(x) = 0 or cos(x) = 1. Step 7: On 0 \u2264 x < 2\u03C0, cos(x) = 0 gives x = \u03C0/2, 3\u03C0/2, while cos(x) = 1 gives x = 0. Step 8: Combine and order the solutions. Final answer: x = 0, \u03C0/2, 3\u03C0/2."
    }
  ],
  key_ideas: [
    "Recognize when a trigonometric equation has quadratic structure.",
    "Treat a repeated trigonometric function as a temporary algebraic variable.",
    "Use substitution to simplify quadratic trigonometric equations.",
    "Solve the resulting quadratic by factoring whenever convenient.",
    "Use the quadratic formula when factoring is not convenient.",
    "The solutions of the quadratic are values of the trigonometric function, not automatically angles.",
    "Always convert valid algebraic roots back into trigonometric equations.",
    "Check whether every quadratic root lies within the range of the original trigonometric function.",
    "Sine and cosine values must lie between \u22121 and 1.",
    "Tangent can take any real value but has domain restrictions.",
    "Every valid trigonometric equation must be solved completely.",
    "A single trigonometric value can correspond to multiple angles.",
    "Use the unit circle and quadrant signs to find all restricted-interval solutions.",
    "Use general solution formulas when no interval is specified.",
    "Pythagorean identities can sometimes transform an equation into quadratic form.",
    "Do not divide by a trigonometric factor that could equal zero without separately considering that case.",
    "Remove duplicate solutions from the final answer.",
    "Check the final solutions in the original equation when transformations may have changed the solution set.",
    "The complete process is: recognize \u2192 substitute \u2192 solve quadratic \u2192 validate roots \u2192 convert back \u2192 solve trigonometric equations \u2192 apply interval/general solution \u2192 check."
  ],
  misconceptions: [
    "Thinking that solving the quadratic completes the problem.",
    "Treating the quadratic root u as the angle x instead of as a trigonometric value.",
    "Forgetting to substitute the quadratic roots back into the original trigonometric expression.",
    "Accepting sin(x) = 2 or cos(x) = \u22123 as real solutions.",
    "Forgetting the range restriction of sine and cosine.",
    "Assuming every valid trigonometric value produces only one angle.",
    "Finding only the principal inverse-trigonometric value.",
    "Forgetting the second angle for sine or cosine on a full period.",
    "Using the wrong period for tangent.",
    "Stopping after finding one quadratic root and ignoring the other.",
    "Using the quadratic formula incorrectly because the coefficient a is not 1.",
    "Forgetting to multiply through by a denominator before identifying the quadratic coefficients.",
    "Dividing by sin(x), cos(x), or another expression that may equal zero and losing solutions.",
    "Forgetting that tangent is undefined when cos(x) = 0.",
    "Using a Pythagorean identity incorrectly when converting between sine and cosine.",
    "Including solutions outside the requested interval.",
    "Including both endpoints when the interval excludes one of them.",
    "Listing duplicate solutions.",
    "Assuming a real quadratic root always produces a real trigonometric solution.",
    "Checking only the transformed equation instead of the original equation when a transformation may have introduced or removed solutions."
  ],
  explorations: [
    {
      id: "quadratic-trigonometric-equation",
      type: "visualization"
    },
    {
      id: "quadratic-as-function",
      type: "visualization"
    },
    {
      id: "trig-value-to-angle",
      type: "visualization"
    },
    {
      id: "quadratic-roots-on-unit-circle",
      type: "visualization"
    },
    {
      id: "pythagorean-identity-quadratic",
      type: "visualization"
    },
    {
      id: "why-roots-must-be-validated",
      type: "why"
    },
    {
      id: "why-substitution-works",
      type: "why"
    }
  ],
  sources: [
    "openstax-precalculus-trigonometric-equations"
  ]
};

// ../content/concepts/trigonometricFunctions/trig-equations-07-identities.json
var trig_equations_07_identities_default = {
  id: "trig-equations-07",
  title: "Equations Using Identities",
  subject: "mathematics",
  topic: "trigonometry",
  section: "trigonometric-equations",
  difficulty: 4,
  connections: {
    prerequisites: [
      "advanced-trigonometric-identities",
      "trig-equations-05",
      "trig-equations-06"
    ],
    leads_to: [
      "trig-equations-08",
      "trig-equations-10"
    ],
    related: [
      "trigonometric-identities",
      "double-angle-identities"
    ]
  },
  theory: {
    introduction: "Many difficult trigonometric equations cannot be solved directly. The key is to transform them into a familiar form using identities. The most important skill is not merely memorizing identities, but recognizing which identity will simplify the equation. A good transformation usually reduces the number of different trigonometric functions, reduces the complexity of the expression, creates a factorable or quadratic form, or converts the equation into one of the basic equations already learned.",
    sections: [
      {
        id: "choose-identity",
        title: "Choosing the Right Identity",
        content: [
          {
            type: "paragraph",
            text: "Choose an identity that reduces the number of different trigonometric functions or creates a familiar algebraic form.",
            id: "choose-identity-paragraph-1"
          }
        ]
      },
      {
        id: "identity-strategy",
        title: "A General Identity-Solving Strategy",
        content: [
          {
            type: "paragraph",
            text: "Pythagorean, reciprocal, double-angle, and sum-and-difference identities can transform complicated equations.",
            id: "common-identities-paragraph-1"
          }
        ]
      },
      {
        id: "pythagorean-identities",
        title: "Pythagorean Identities",
        content: [
          {
            type: "paragraph",
            text: "Pythagorean identities are among the most important identities in trigonometric equation solving. They allow squared trigonometric functions to be converted into each other."
          },
          {
            type: "paragraph",
            text: "The fundamental identity is sin\xB2(x) + cos\xB2(x) = 1."
          },
          {
            type: "paragraph",
            text: "Dividing this identity by cos\xB2(x) produces 1 + tan\xB2(x) = sec\xB2(x), while dividing by sin\xB2(x) produces 1 + cot\xB2(x) = csc\xB2(x)."
          },
          {
            type: "paragraph",
            text: "These identities are particularly useful when an equation contains squared trigonometric functions or when you need to eliminate one type of function."
          }
        ]
      },
      {
        id: "reciprocal-identities",
        title: "Reciprocal Identities",
        content: [
          {
            type: "paragraph",
            text: "Reciprocal identities connect each basic trigonometric function with its reciprocal."
          },
          {
            type: "paragraph",
            text: "They are useful when an equation mixes functions such as sec(x) and cos(x), or csc(x) and sin(x)."
          },
          {
            type: "paragraph",
            text: "A common strategy is to rewrite every function using sine and cosine when this produces a simpler equation."
          }
        ]
      },
      {
        id: "quotient-identities",
        title: "Quotient Identities",
        content: [
          {
            type: "paragraph",
            text: "Tangent and cotangent can be rewritten using sine and cosine."
          },
          {
            type: "paragraph",
            text: "This is useful when an equation contains a mixture of tan(x), sin(x), and cos(x), because rewriting tangent may allow the entire equation to be expressed using only sine and cosine."
          }
        ]
      },
      {
        id: "even-odd-identities",
        title: "Even and Odd Identities",
        content: [
          {
            type: "paragraph",
            text: "Even and odd identities describe how trigonometric functions behave when their input is replaced by its negative."
          },
          {
            type: "paragraph",
            text: "They can simplify equations containing negative angles and are especially useful when expressions such as sin(\u2212x), cos(\u2212x), or tan(\u2212x) appear."
          }
        ]
      },
      {
        id: "cofunction-identities",
        title: "Cofunction Identities",
        content: [
          {
            type: "paragraph",
            text: "Cofunction identities relate trigonometric functions of complementary angles."
          },
          {
            type: "paragraph",
            text: "For example, sin(\u03C0/2 \u2212 x) = cos(x). These identities can transform an equation into one involving a single trigonometric function."
          }
        ]
      },
      {
        id: "sum-difference-identities",
        title: "Sum and Difference Identities",
        content: [
          {
            type: "paragraph",
            text: "Sum-and-difference identities expand expressions involving angles such as A + B and A \u2212 B."
          },
          {
            type: "paragraph",
            text: "They are particularly useful when an equation contains expressions such as sin(x + \u03C0/3), cos(x \u2212 \u03C0/4), or products involving known special angles."
          },
          {
            type: "paragraph",
            text: "They can also convert an unfamiliar angle expression into combinations of sin(x) and cos(x)."
          }
        ]
      },
      {
        id: "double-angle-identities",
        title: "Double-Angle Identities",
        content: [
          {
            type: "paragraph",
            text: "Double-angle identities connect expressions involving 2x with expressions involving x."
          },
          {
            type: "paragraph",
            text: "For cosine there are three especially useful forms: cos(2x) = cos\xB2(x) \u2212 sin\xB2(x), cos(2x) = 2cos\xB2(x) \u2212 1, and cos(2x) = 1 \u2212 2sin\xB2(x)."
          },
          {
            type: "paragraph",
            text: "The choice of form matters. Choose the version that matches the functions already present in the equation."
          },
          {
            type: "paragraph",
            text: "Double-angle identities are particularly important for converting between multiple-angle equations and quadratic equations."
          }
        ]
      },
      {
        id: "power-reduction-identities",
        title: "Power-Reduction Identities",
        content: [
          {
            type: "paragraph",
            text: "Power-reduction identities express squared sine and cosine in terms of cos(2x)."
          },
          {
            type: "paragraph",
            text: "These are especially useful when an equation contains sin\xB2(x) or cos\xB2(x) and also contains a multiple-angle expression."
          },
          {
            type: "paragraph",
            text: "They can transform a quadratic-looking equation into a linear equation in cos(2x), or transform a multiple-angle expression into squared functions."
          }
        ]
      },
      {
        id: "triple-angle-identities",
        title: "Triple-Angle Identities",
        content: [
          {
            type: "paragraph",
            text: "Triple-angle identities express sin(3x) and cos(3x) using powers of sin(x) or cos(x)."
          },
          {
            type: "paragraph",
            text: "They can be useful when solving equations containing 3x or when converting a multiple-angle equation into an algebraic equation."
          },
          {
            type: "paragraph",
            text: "Because triple-angle equations can generate several solutions, interval checking is especially important."
          }
        ]
      },
      {
        id: "half-angle-identities",
        title: "Half-Angle Identities",
        content: [
          {
            type: "paragraph",
            text: "Half-angle identities express trigonometric functions of x/2 in terms of functions of x."
          },
          {
            type: "paragraph",
            text: "They are useful when an equation contains angles such as x/2 or when solving equations involving squared trigonometric functions and a change of angle is helpful."
          },
          {
            type: "paragraph",
            text: "The \xB1 sign in square-root forms must be handled carefully because the sign depends on the quadrant of the angle."
          }
        ]
      },
      {
        id: "product-to-sum",
        title: "Product-to-Sum Identities",
        content: [
          {
            type: "paragraph",
            text: "Product-to-sum identities convert products of sine and cosine functions into sums or differences."
          },
          {
            type: "paragraph",
            text: "They are useful when an equation contains products such as sin(A)cos(B), cos(A)cos(B), or sin(A)sin(B) and an additive form is easier to solve."
          },
          {
            type: "paragraph",
            text: "These identities are more specialized than the core Pythagorean and double-angle identities, but they can be essential for certain advanced equation-solving problems."
          }
        ]
      },
      {
        id: "sum-to-product",
        title: "Sum-to-Product Identities",
        content: [
          {
            type: "paragraph",
            text: "Sum-to-product identities convert sums or differences of trigonometric functions into products."
          },
          {
            type: "paragraph",
            text: "They are particularly useful when the resulting product can be set equal to zero and solved using the Zero Product Property."
          }
        ]
      },
      {
        id: "identity-and-factoring",
        title: "Combining Identities with Factoring",
        content: [
          {
            type: "paragraph",
            text: "An identity often does not solve an equation by itself. Its purpose may be to transform the equation into a factorable form."
          },
          {
            type: "paragraph",
            text: "For example, sin\xB2(x) \u2212 sin(x) = 0 can be factored directly, while an equation involving both sin\xB2(x) and cos\xB2(x) may first require the Pythagorean identity before factoring."
          },
          {
            type: "paragraph",
            text: "This creates an important problem-solving pattern: identity \u2192 algebraic simplification \u2192 factoring \u2192 basic trigonometric equations."
          }
        ]
      },
      {
        id: "identity-and-quadratic",
        title: "Combining Identities with Quadratic Methods",
        content: [
          {
            type: "paragraph",
            text: "Identities can transform equations into quadratic form."
          },
          {
            type: "paragraph",
            text: "For example, replacing sin\xB2(x) with 1 \u2212 cos\xB2(x) can turn an equation into a quadratic in cos(x)."
          },
          {
            type: "paragraph",
            text: "This directly connects identity manipulation with the quadratic trigonometric equations studied in the previous lesson."
          }
        ]
      },
      {
        id: "identity-equation-workflow",
        title: "Complete Identity-Based Solving Workflow",
        content: [
          {
            type: "paragraph",
            text: "When an equation needs an identity, identify the target form first, apply the smallest useful identity transformation, solve the resulting trigonometric equation, and check the original equation when necessary. Multiple-angle equation mechanics are applied in trig-equations-08; general-solution notation is consolidated in trig-equations-11."
          }
        ]
      },
      {
        id: "domain-awareness",
        title: "Domain Restrictions During Identity Manipulation",
        content: [
          {
            type: "paragraph",
            text: "Some identities involve division by sin(x) or cos(x). The resulting identity is therefore interpreted on the domain where those divisions are defined."
          },
          {
            type: "paragraph",
            text: "For example, tan(x) = sin(x)/cos(x) requires cos(x) \u2260 0, while sec(x) = 1/cos(x) also requires cos(x) \u2260 0."
          },
          {
            type: "paragraph",
            text: "Never forget the original domain of the equation when rewriting expressions using reciprocals or quotient identities."
          }
        ]
      },
      {
        id: "identity-selection-guide",
        title: "Which Identity Should I Try?",
        content: [
          {
            type: "paragraph",
            text: "sin\xB2(x) and cos\xB2(x) together \u2192 try the Pythagorean identity."
          },
          {
            type: "paragraph",
            text: "tan\xB2(x) and sec\xB2(x) together \u2192 try 1 + tan\xB2(x) = sec\xB2(x)."
          },
          {
            type: "paragraph",
            text: "cot\xB2(x) and csc\xB2(x) together \u2192 try 1 + cot\xB2(x) = csc\xB2(x)."
          },
          {
            type: "paragraph",
            text: "sec(x), csc(x), or cot(x) mixed with sine and cosine \u2192 try reciprocal identities."
          },
          {
            type: "paragraph",
            text: "tan(x) mixed with sine and cosine \u2192 try quotient identities."
          },
          {
            type: "paragraph",
            text: "Expressions involving 2x \u2192 try double-angle identities."
          },
          {
            type: "paragraph",
            text: "Squared sine or cosine \u2192 consider power-reduction or Pythagorean identities depending on the target form."
          },
          {
            type: "paragraph",
            text: "Expressions involving A + B or A \u2212 B \u2192 try sum-and-difference identities."
          },
          {
            type: "paragraph",
            text: "Products of trigonometric functions \u2192 consider product-to-sum identities."
          },
          {
            type: "paragraph",
            text: "Sums or differences of trigonometric functions \u2192 consider sum-to-product identities."
          },
          {
            type: "paragraph",
            text: "Expressions involving 3x \u2192 consider triple-angle identities."
          }
        ]
      }
    ]
  },
  formulas: [
    {
      id: "pythagorean",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Pythagorean Identity",
      expression: "sin\xB2(x) + cos\xB2(x) = 1",
      explanation: "One of the most important identities in trigonometric equation solving. Use it to convert between sin\xB2(x) and cos\xB2(x), eliminate one function, or create quadratic form."
    },
    {
      id: "pythagorean-sine",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Rearranged Pythagorean Identity",
      expression: "sin\xB2(x) = 1 \u2212 cos\xB2(x)",
      explanation: "Useful when you want an equation involving sine and cosine to become an equation only in cos(x)."
    },
    {
      id: "pythagorean-cosine",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Rearranged Pythagorean Identity",
      expression: "cos\xB2(x) = 1 \u2212 sin\xB2(x)",
      explanation: "Useful when you want an equation involving sine and cosine to become an equation only in sin(x)."
    },
    {
      id: "pythagorean-tangent",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Pythagorean Identity",
      expression: "1 + tan\xB2(x) = sec\xB2(x)",
      explanation: "Useful when an equation contains tan\xB2(x) and sec\xB2(x)."
    },
    {
      id: "pythagorean-cotangent",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Pythagorean Identity",
      expression: "1 + cot\xB2(x) = csc\xB2(x)",
      explanation: "Useful when an equation contains cot\xB2(x) and csc\xB2(x)."
    },
    {
      id: "reciprocal-sine",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Reciprocal Identity",
      expression: "csc(x) = 1/sin(x)",
      explanation: "Converts cosecant into sine and is useful when simplifying equations containing csc(x)."
    },
    {
      id: "reciprocal-cosine",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Reciprocal Identity",
      expression: "sec(x) = 1/cos(x)",
      explanation: "Converts secant into cosine and is useful when simplifying equations containing sec(x)."
    },
    {
      id: "reciprocal-tangent",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Reciprocal Identity",
      expression: "cot(x) = 1/tan(x)",
      explanation: "Converts cotangent into tangent."
    },
    {
      id: "reciprocal-forms",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Reciprocal Identities",
      expression: "sin(x) = 1/csc(x),  cos(x) = 1/sec(x),  tan(x) = 1/cot(x)",
      explanation: "The reverse forms of the reciprocal identities. Useful when converting reciprocal functions into their basic counterparts."
    },
    {
      id: "quotient-tangent",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Quotient Identity",
      expression: "tan(x) = sin(x)/cos(x)",
      explanation: "Converts tangent into sine and cosine. Particularly useful when an equation contains tan(x) together with sine or cosine."
    },
    {
      id: "quotient-cotangent",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Quotient Identity",
      expression: "cot(x) = cos(x)/sin(x)",
      explanation: "Converts cotangent into sine and cosine."
    },
    {
      id: "even-sine",
      name: "Odd-Function Identity",
      expression: "sin(\u2212x) = \u2212sin(x)",
      explanation: "Useful for simplifying equations involving negative angles."
    },
    {
      id: "even-cosine",
      name: "Even-Function Identity",
      expression: "cos(\u2212x) = cos(x)",
      explanation: "Useful for simplifying equations involving negative angles."
    },
    {
      id: "odd-tangent",
      name: "Odd-Function Identity",
      expression: "tan(\u2212x) = \u2212tan(x)",
      explanation: "Useful for simplifying equations involving negative angles."
    },
    {
      id: "cofunction-sine",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Cofunction Identity",
      expression: "sin(\u03C0/2 \u2212 x) = cos(x)",
      explanation: "Converts sine of a complementary angle into cosine."
    },
    {
      id: "cofunction-cosine",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Cofunction Identity",
      expression: "cos(\u03C0/2 \u2212 x) = sin(x)",
      explanation: "Converts cosine of a complementary angle into sine."
    },
    {
      id: "cofunction-tangent",
      name: "Cofunction Identity",
      expression: "tan(\u03C0/2 \u2212 x) = cot(x)",
      explanation: "Relates tangent and cotangent of complementary angles."
    },
    {
      id: "cofunction-cotangent",
      name: "Cofunction Identity",
      expression: "cot(\u03C0/2 \u2212 x) = tan(x)",
      explanation: "Relates cotangent and tangent of complementary angles."
    },
    {
      id: "cofunction-sec",
      name: "Cofunction Identity",
      expression: "sec(\u03C0/2 \u2212 x) = csc(x)",
      explanation: "Relates secant and cosecant of complementary angles."
    },
    {
      id: "cofunction-csc",
      name: "Cofunction Identity",
      expression: "csc(\u03C0/2 \u2212 x) = sec(x)",
      explanation: "Relates cosecant and secant of complementary angles."
    },
    {
      id: "sum-sine",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Sine Sum Identity",
      expression: "sin(A + B) = sin(A)cos(B) + cos(A)sin(B)",
      explanation: "Expands the sine of a sum into products of sine and cosine."
    },
    {
      id: "difference-sine",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Sine Difference Identity",
      expression: "sin(A \u2212 B) = sin(A)cos(B) \u2212 cos(A)sin(B)",
      explanation: "Expands the sine of a difference."
    },
    {
      id: "sum-cosine",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Cosine Sum Identity",
      expression: "cos(A + B) = cos(A)cos(B) \u2212 sin(A)sin(B)",
      explanation: "Expands the cosine of a sum."
    },
    {
      id: "difference-cosine",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Cosine Difference Identity",
      expression: "cos(A \u2212 B) = cos(A)cos(B) + sin(A)sin(B)",
      explanation: "Expands the cosine of a difference."
    },
    {
      id: "sum-tangent",
      name: "Tangent Sum Identity",
      expression: "tan(A + B) = (tan(A) + tan(B))/(1 \u2212 tan(A)tan(B))",
      explanation: "Expands tangent of a sum when the denominator is nonzero."
    },
    {
      id: "difference-tangent",
      name: "Tangent Difference Identity",
      expression: "tan(A \u2212 B) = (tan(A) \u2212 tan(B))/(1 + tan(A)tan(B))",
      explanation: "Expands tangent of a difference when the denominator is nonzero."
    },
    {
      id: "double-sine",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Double-Angle Identity",
      expression: "sin(2x) = 2sin(x)cos(x)",
      explanation: "Extremely useful for converting a double-angle expression into a product or converting a product into a double-angle expression."
    },
    {
      id: "double-cosine-main",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Double-Angle Identity",
      expression: "cos(2x) = cos\xB2(x) \u2212 sin\xB2(x)",
      explanation: "The main double-angle cosine identity. Useful when both sin\xB2(x) and cos\xB2(x) appear."
    },
    {
      id: "double-cosine-sine",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Double-Angle Identity",
      expression: "cos(2x) = 1 \u2212 2sin\xB2(x)",
      explanation: "Use when the equation contains sin\xB2(x) and you want to replace it with cos(2x)."
    },
    {
      id: "double-cosine-cosine",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Double-Angle Identity",
      expression: "cos(2x) = 2cos\xB2(x) \u2212 1",
      explanation: "Use when the equation contains cos\xB2(x) and you want to replace it with cos(2x)."
    },
    {
      id: "double-tangent",
      name: "Double-Angle Identity",
      expression: "tan(2x) = 2tan(x)/(1 \u2212 tan\xB2(x))",
      explanation: "Useful for equations containing tan(2x), provided the expression is defined."
    },
    {
      id: "power-reduction-sine",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Power-Reduction Identity",
      expression: "sin\xB2(x) = (1 \u2212 cos(2x))/2",
      explanation: "Converts squared sine into a double-angle cosine expression."
    },
    {
      id: "power-reduction-cosine",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Power-Reduction Identity",
      expression: "cos\xB2(x) = (1 + cos(2x))/2",
      explanation: "Converts squared cosine into a double-angle cosine expression."
    },
    {
      id: "half-angle-sine",
      name: "Half-Angle Identity",
      expression: "sin\xB2(x/2) = (1 \u2212 cos(x))/2",
      explanation: "Useful for equations involving squared sine of a half-angle."
    },
    {
      id: "half-angle-cosine",
      name: "Half-Angle Identity",
      expression: "cos\xB2(x/2) = (1 + cos(x))/2",
      explanation: "Useful for equations involving squared cosine of a half-angle."
    },
    {
      id: "half-angle-sine-root",
      name: "Half-Angle Identity",
      expression: "sin(x/2) = \xB1\u221A((1 \u2212 cos(x))/2)",
      explanation: "The sign depends on the quadrant containing x/2."
    },
    {
      id: "half-angle-cosine-root",
      name: "Half-Angle Identity",
      expression: "cos(x/2) = \xB1\u221A((1 + cos(x))/2)",
      explanation: "The sign depends on the quadrant containing x/2."
    },
    {
      id: "half-angle-tangent",
      name: "Half-Angle Identity",
      expression: "tan(x/2) = \xB1\u221A((1 \u2212 cos(x))/(1 + cos(x)))",
      explanation: "Useful when tangent of a half-angle must be related to cosine."
    },
    {
      id: "triple-sine",
      name: "Triple-Angle Identity",
      expression: "sin(3x) = 3sin(x) \u2212 4sin\xB3(x)",
      explanation: "Useful for equations involving sin(3x) or cubic expressions in sin(x)."
    },
    {
      id: "triple-cosine",
      name: "Triple-Angle Identity",
      expression: "cos(3x) = 4cos\xB3(x) \u2212 3cos(x)",
      explanation: "Useful for equations involving cos(3x) or cubic expressions in cos(x)."
    },
    {
      id: "triple-tangent",
      name: "Triple-Angle Identity",
      expression: "tan(3x) = (3tan(x) \u2212 tan\xB3(x))/(1 \u2212 3tan\xB2(x))",
      explanation: "Useful for certain multiple-angle equations involving tangent, subject to domain restrictions."
    },
    {
      id: "product-sin-cos",
      name: "Product-to-Sum Identity",
      expression: "sin(A)cos(B) = [sin(A + B) + sin(A \u2212 B)]/2",
      explanation: "Converts a sine-cosine product into a sum."
    },
    {
      id: "product-cos-sin",
      name: "Product-to-Sum Identity",
      expression: "cos(A)sin(B) = [sin(A + B) \u2212 sin(A \u2212 B)]/2",
      explanation: "Converts a cosine-sine product into a sum."
    },
    {
      id: "product-cos-cos",
      name: "Product-to-Sum Identity",
      expression: "cos(A)cos(B) = [cos(A + B) + cos(A \u2212 B)]/2",
      explanation: "Converts a cosine-cosine product into a sum."
    },
    {
      id: "product-sin-sin",
      name: "Product-to-Sum Identity",
      expression: "sin(A)sin(B) = [cos(A \u2212 B) \u2212 cos(A + B)]/2",
      explanation: "Converts a sine-sine product into a difference of cosines."
    },
    {
      id: "sum-sin-sin",
      name: "Sum-to-Product Identity",
      expression: "sin(A) + sin(B) = 2sin((A + B)/2)cos((A \u2212 B)/2)",
      explanation: "Converts a sum of sines into a product, which can make the Zero Product Property applicable."
    },
    {
      id: "difference-sin-sin",
      name: "Sum-to-Product Identity",
      expression: "sin(A) \u2212 sin(B) = 2cos((A + B)/2)sin((A \u2212 B)/2)",
      explanation: "Converts a difference of sines into a product."
    },
    {
      id: "sum-cos-cos",
      name: "Sum-to-Product Identity",
      expression: "cos(A) + cos(B) = 2cos((A + B)/2)cos((A \u2212 B)/2)",
      explanation: "Converts a sum of cosines into a product."
    },
    {
      id: "difference-cos-cos",
      name: "Sum-to-Product Identity",
      expression: "cos(A) \u2212 cos(B) = \u22122sin((A + B)/2)sin((A \u2212 B)/2)",
      explanation: "Converts a difference of cosines into a product."
    },
    {
      id: "identity-equivalence",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Identity Principle",
      expression: "If A(x) = B(x) is an identity, either side can replace the other wherever the identity is valid.",
      explanation: "The fundamental principle behind identity-based equation solving. Choose the form that makes the equation easier to solve."
    }
  ],
  examples: [
    {
      id: "identity-example",
      question: "Solve 1 \u2212 2sin\xB2(x) = 0 for 0 \u2264 x < 2\u03C0.",
      solution: "Recognize the double-angle identity cos(2x) = 1 \u2212 2sin\xB2(x). Therefore cos(2x) = 0. Let y = 2x. Then cos(y) = 0, so y = \u03C0/2 + n\u03C0. Thus 2x = \u03C0/2 + n\u03C0, giving x = \u03C0/4 + n\u03C0/2. On 0 \u2264 x < 2\u03C0, the solutions are x = \u03C0/4, 3\u03C0/4, 5\u03C0/4, 7\u03C0/4."
    },
    {
      id: "pythagorean-example",
      question: "Solve sin\xB2(x) + cos(x) = 0 for 0 \u2264 x < 2\u03C0.",
      solution: "Use sin\xB2(x) = 1 \u2212 cos\xB2(x). Then 1 \u2212 cos\xB2(x) + cos(x) = 0. Rearrange: cos\xB2(x) \u2212 cos(x) \u2212 1 = 0. Let u = cos(x). The quadratic formula gives u = (1 \xB1 \u221A5)/2. The value (1 + \u221A5)/2 is greater than 1 and is impossible for cosine. Therefore cos(x) = (1 \u2212 \u221A5)/2. Solve this cosine equation on the required interval."
    },
    {
      id: "identity-factor-example",
      question: "Solve sin\xB2(x) \u2212 sin(x) = 0 for 0 \u2264 x < 2\u03C0.",
      solution: "Factor directly: sin(x)(sin(x) \u2212 1) = 0. Therefore sin(x) = 0 or sin(x) = 1. This gives x = 0, \u03C0 and x = \u03C0/2. Final answer: x = 0, \u03C0/2, \u03C0."
    },
    {
      id: "identity-reciprocal-example",
      question: "Solve sec(x) = 2 for 0 \u2264 x < 2\u03C0.",
      solution: "Use the reciprocal identity sec(x) = 1/cos(x). Then 1/cos(x) = 2, so cos(x) = 1/2. Therefore x = \u03C0/3 or 5\u03C0/3."
    },
    {
      id: "identity-quotient-example",
      question: "Solve tan(x) = sin(x)/cos(x) for all x where both sides are defined.",
      solution: "The quotient identity tan(x) = sin(x)/cos(x) is an identity, meaning the two expressions are equal everywhere on their common domain. The common domain requires cos(x) \u2260 0."
    },
    {
      id: "double-angle-sine-example",
      question: "Solve sin(2x) = sin(x) for 0 \u2264 x < 2\u03C0.",
      solution: "Use sin(2x) = 2sin(x)cos(x). Then 2sin(x)cos(x) = sin(x). Move everything to one side: 2sin(x)cos(x) \u2212 sin(x) = 0. Factor: sin(x)(2cos(x) \u2212 1) = 0. Therefore sin(x) = 0 or cos(x) = 1/2. On 0 \u2264 x < 2\u03C0, this gives x = 0, \u03C0, \u03C0/3, 5\u03C0/3."
    },
    {
      id: "double-angle-cosine-example",
      question: "Solve cos(2x) = cos(x) for 0 \u2264 x < 2\u03C0.",
      solution: "Use cos(2x) = 2cos\xB2(x) \u2212 1. Then 2cos\xB2(x) \u2212 1 = cos(x). Rearrange: 2cos\xB2(x) \u2212 cos(x) \u2212 1 = 0. Factor: (2cos(x) + 1)(cos(x) \u2212 1) = 0. Therefore cos(x) = \u22121/2 or cos(x) = 1. On 0 \u2264 x < 2\u03C0, the solutions are x = 2\u03C0/3, 4\u03C0/3, 0."
    },
    {
      id: "sum-difference-example",
      question: "Solve sin(x + \u03C0/3) = \u221A3/2 for 0 \u2264 x < 2\u03C0.",
      solution: "Let y = x + \u03C0/3. Then sin(y) = \u221A3/2. Therefore y = \u03C0/3 + 2n\u03C0 or y = 2\u03C0/3 + 2n\u03C0. Subtract \u03C0/3 from each family: x = 2n\u03C0 or x = \u03C0/3 + 2n\u03C0. On 0 \u2264 x < 2\u03C0, x = 0 and \u03C0/3."
    },
    {
      id: "sum-to-product-example",
      question: "Solve sin(x) + sin(3x) = 0 for 0 \u2264 x < 2\u03C0.",
      solution: "Use sin(A) + sin(B) = 2sin((A+B)/2)cos((A\u2212B)/2). This gives 2sin(2x)cos(\u2212x) = 0. Since cos(\u2212x) = cos(x), the equation becomes 2sin(2x)cos(x) = 0. Therefore sin(2x) = 0 or cos(x) = 0. Solving both gives the complete set of solutions in the required interval."
    },
    {
      id: "pythagorean-tangent-example",
      question: "Solve sec\xB2(x) \u2212 tan\xB2(x) = 1 for all x in the common domain.",
      solution: "Use the Pythagorean identity sec\xB2(x) \u2212 tan\xB2(x) = 1. The equation is therefore an identity and is true for every x for which sec(x) and tan(x) are defined. Since both require cos(x) \u2260 0, the solution set is all x such that x \u2260 \u03C0/2 + n\u03C0, n \u2208 \u2124."
    },
    {
      id: "identity-choice-example",
      question: "Solve 1 + tan\xB2(x) = 4 for 0 \u2264 x < 2\u03C0.",
      solution: "Recognize the Pythagorean identity 1 + tan\xB2(x) = sec\xB2(x), giving sec\xB2(x) = 4. Thus sec(x) = \xB12. Using sec(x) = 1/cos(x), cos(x) = \xB11/2. Therefore x = \u03C0/3, 2\u03C0/3, 4\u03C0/3, 5\u03C0/3."
    },
    {
      id: "identity-double-angle-selection",
      question: "Rewrite 3 \u2212 2cos\xB2(x) using a double-angle identity.",
      solution: "Use 2cos\xB2(x) \u2212 1 = cos(2x). Therefore 3 \u2212 2cos\xB2(x) = 3 \u2212 [cos(2x) + 1] = 2 \u2212 cos(2x). The important skill is choosing the double-angle form that matches cos\xB2(x)."
    },
    {
      id: "identity-check-example",
      question: "Explain why an identity transformation must preserve the original domain.",
      solution: "Consider tan(x) = sin(x)/cos(x). This equality is valid only where cos(x) \u2260 0 because tan(x) is undefined when cos(x) = 0. Therefore replacing tan(x) with sin(x)/cos(x) does not make those excluded values valid. Domain restrictions from the original equation must always be preserved."
    }
  ],
  key_ideas: [
    "The purpose of an identity is to transform an equation into a form that is easier to solve.",
    "Do not use identities randomly; choose one based on the structure of the equation.",
    "The Pythagorean identities are among the most important identities for problem solving.",
    "Reciprocal identities are useful for converting sec, csc, and cot into basic trigonometric functions.",
    "Quotient identities are useful for converting tan and cot into sine and cosine.",
    "Double-angle identities are essential when equations contain 2x or products such as sin(x)cos(x).",
    "Power-reduction identities are useful when squared sine or cosine expressions need to be converted into double-angle expressions.",
    "Sum-and-difference identities expand compound angles.",
    "Sum-to-product identities can turn an equation into a factorable product.",
    "Product-to-sum identities can turn products into sums or differences.",
    "Pythagorean identities can convert equations into quadratic form.",
    "Identity manipulation and factoring often work together.",
    "Identity manipulation and quadratic methods often work together.",
    "After transforming an equation, return to the basic trigonometric equations whenever possible.",
    "Every resulting factor or trigonometric equation must be solved.",
    "General solutions and restricted-interval solutions must be handled separately.",
    "Domain restrictions must be preserved during identity transformations.",
    "The best identity is the one that moves the equation closer to a familiar solvable form.",
    "Some identities are far more frequently used in problem solving than others; these are explicitly marked as important."
  ],
  misconceptions: [
    "Trying random identities without first identifying the desired target form.",
    "Assuming that applying more identities always makes an equation easier.",
    "Memorizing identities without understanding what type of expression each identity transforms.",
    "Forgetting the rearranged forms of the Pythagorean identity.",
    "Using the wrong double-angle form for the functions present in the equation.",
    "Forgetting that sin\xB2(x) and cos\xB2(x) are squared functions, not sin(x\xB2) and cos(x\xB2).",
    "Applying a reciprocal identity without considering where the reciprocal function is undefined.",
    "Dividing by sin(x) or cos(x) and losing possible solutions.",
    "Forgetting that sum-to-product identities are useful because they create factors.",
    "Stopping after applying an identity instead of solving the resulting equation.",
    "Finding only one angle from a transformed trigonometric equation.",
    "Forgetting to account for the full interval after a multiple-angle substitution.",
    "Ignoring the \xB1 sign in half-angle square-root identities.",
    "Using half-angle identities without determining the correct sign from the quadrant.",
    "Forgetting that an identity may only be valid on a restricted common domain.",
    "Assuming that an identity transformation automatically preserves values where the transformed expression is undefined.",
    "Checking only the transformed equation instead of the original equation when division or another potentially non-reversible operation was used."
  ],
  explorations: [
    {
      id: "identity-to-equation",
      type: "visualization"
    },
    {
      id: "identity-choice-tree",
      type: "visualization"
    },
    {
      id: "pythagorean-identity-unit-circle",
      type: "visualization"
    },
    {
      id: "double-angle-relationship",
      type: "visualization"
    },
    {
      id: "sum-to-product-factoring",
      type: "visualization"
    },
    {
      id: "why-identities-preserve-equations",
      type: "why"
    },
    {
      id: "why-different-forms-exist",
      type: "why"
    }
  ],
  sources: [
    "openstax-precalculus-trigonometric-equations"
  ]
};

// ../content/concepts/trigonometricFunctions/trig-equations-08-multipleAndCompostite.json
var trig_equations_08_multipleAndCompostite_default = {
  id: "trig-equations-08",
  title: "Multiple-Angle and Composite Equations",
  subject: "mathematics",
  topic: "trigonometry",
  section: "trigonometric-equations",
  difficulty: 4,
  connections: {
    prerequisites: [
      "trig-equations-03",
      "trig-equations-07",
      "trigonometric-graphs"
    ],
    leads_to: [
      "trig-equations-09",
      "trig-equations-11"
    ],
    related: [
      "double-angle-identities",
      "triple-angle-identities",
      "periodic-functions",
      "trigonometric-identities"
    ]
  },
  theory: {
    introduction: "Multiple-angle and composite trigonometric equations contain expressions such as sin(2x), cos(3x), tan(4x), or other functions of a multiple or transformed angle. The main challenge is not simply solving the trigonometric equation, but making sure that every solution for the transformed angle produces every valid value of x in the required interval. These equations connect the periodic nature of trigonometric functions with algebraic substitution, identities, and systematic solution generation.",
    sections: [
      {
        id: "multiple-angle",
        title: "What Are Multiple-Angle Equations?",
        content: [
          {
            type: "paragraph",
            text: "Solve the equation for the multiple angle first, then divide by the coefficient of x.",
            id: "multiple-angle-paragraph-1"
          }
        ]
      },
      {
        id: "general-method",
        title: "General Method for Solving Multiple-Angle Equations",
        content: [
          {
            type: "paragraph",
            text: "Step 1: Identify the multiple angle, such as 2x, 3x, or 4x."
          },
          {
            type: "paragraph",
            text: "Step 2: Introduce a temporary variable if useful. For example, let \u03B8 = 3x."
          },
          {
            type: "paragraph",
            text: "Step 3: Solve the resulting basic trigonometric equation completely using the appropriate general-solution formula."
          },
          {
            type: "paragraph",
            text: "Step 4: Account for every solution of the multiple angle that lies within the transformed interval."
          },
          {
            type: "paragraph",
            text: "Step 5: Divide by the coefficient of x only after all relevant solutions for the multiple angle have been generated."
          },
          {
            type: "paragraph",
            text: "Step 6: Apply the original interval for x and remove any values that fall outside it."
          },
          {
            type: "paragraph",
            text: "Step 7: Substitute the final answers back into the original equation when necessary."
          }
        ]
      },
      {
        id: "why-more-solutions",
        title: "Why Multiple-Angle Equations Have More Solutions",
        content: [
          {
            type: "paragraph",
            text: "The basic sine and cosine functions repeat every 2\u03C0, while tangent repeats every \u03C0. If the input becomes 2x or 3x, that input travels through its normal period more quickly as x increases."
          },
          {
            type: "paragraph",
            text: "For example, sin(x) completes one full cycle as x moves through an interval of length 2\u03C0. sin(2x) completes two cycles over the same x-interval. Therefore an equation involving sin(2x) can intersect a horizontal value multiple times."
          },
          {
            type: "paragraph",
            text: "This is why simply finding one principal value and dividing by the coefficient can miss valid solutions."
          }
        ]
      },
      {
        id: "sine-multiple-angle",
        title: "Equations of the Form sin(nx) = a",
        content: [
          {
            type: "paragraph",
            text: "For sin(nx) = a, solve for the angle \u03B8 = nx using the standard sine equation first."
          },
          {
            type: "paragraph",
            text: "The complete solution for \u03B8 is \u03B8 = sin\u207B\xB9(a) + 2k\u03C0 or \u03B8 = \u03C0 \u2212 sin\u207B\xB9(a) + 2k\u03C0, where k \u2208 \u2124."
          },
          {
            type: "paragraph",
            text: "Then replace \u03B8 by nx and solve for x. When a restricted interval is given, use the transformed interval to determine which values of k are required."
          }
        ]
      },
      {
        id: "cosine-multiple-angle",
        title: "Equations of the Form cos(nx) = a",
        content: [
          {
            type: "paragraph",
            text: "For cos(nx) = a, solve the cosine equation for \u03B8 = nx first."
          },
          {
            type: "paragraph",
            text: "The complete solution is \u03B8 = \xB1cos\u207B\xB9(a) + 2k\u03C0, where k \u2208 \u2124."
          },
          {
            type: "paragraph",
            text: "After generating all required \u03B8 values, divide by n and retain only the x-values inside the requested interval."
          }
        ]
      },
      {
        id: "tangent-multiple-angle",
        title: "Equations of the Form tan(nx) = a",
        content: [
          {
            type: "paragraph",
            text: "For tan(nx) = a, solve the tangent equation for \u03B8 = nx."
          },
          {
            type: "paragraph",
            text: "Because tangent has period \u03C0, the general solution is \u03B8 = tan\u207B\xB9(a) + k\u03C0, where k \u2208 \u2124."
          },
          {
            type: "paragraph",
            text: "After solving for \u03B8, divide by n and apply the original interval for x."
          },
          {
            type: "paragraph",
            text: "Remember that tangent is undefined whenever cos(nx) = 0, so domain restrictions must be respected."
          }
        ]
      },
      {
        id: "double-angle",
        title: "Double-Angle Equations",
        content: [
          {
            type: "paragraph",
            text: "Double-angle identities are taught in trig-equations-07. Here the focus is their use inside an equation, such as converting sin(2x) or cos(2x) into a solvable form."
          }
        ]
      },
      {
        id: "triple-angle",
        title: "Triple-Angle Equations",
        content: [
          {
            type: "paragraph",
            text: "Triple-angle identities are part of the identity library in trig-equations-07. Here they are used only when they help solve a multiple-angle equation."
          }
        ]
      },
      {
        id: "composite-equations",
        title: "Composite Trigonometric Equations",
        content: [
          {
            type: "paragraph",
            text: "A composite equation may contain a more complicated angle expression such as sin(2x + \u03C0/3), cos(3x \u2212 \u03C0/4), or tan(4x + \u03C0/6)."
          },
          {
            type: "paragraph",
            text: "The same principle applies: treat the complete angle expression as a single variable, solve the trigonometric equation, and then solve the resulting algebraic equation for x."
          },
          {
            type: "paragraph",
            text: "For example, if sin(2x + \u03C0/3) = 1/2, let \u03B8 = 2x + \u03C0/3. Solve sin(\u03B8) = 1/2 first, then solve each resulting linear equation for x."
          },
          {
            type: "paragraph",
            text: "The coefficient and constant inside the angle must both be handled carefully. Dividing only the trigonometric value or ignoring the constant shift produces incorrect answers."
          }
        ]
      },
      {
        id: "identity-assisted",
        title: "Using Identities Before Solving",
        content: [
          {
            type: "paragraph",
            text: "Some multiple-angle equations cannot be solved conveniently in their current form. A trigonometric identity may be needed first."
          },
          {
            type: "paragraph",
            text: "For example, cos(2x) = 1/2 can be solved directly, but an equation such as 2sin\xB2(x) \u2212 1 = 0 can be recognized using cos(2x) = 1 \u2212 2sin\xB2(x), giving cos(2x) = 0."
          },
          {
            type: "paragraph",
            text: "Choose the identity that reduces the equation to a form that can be solved using the basic trigonometric equations."
          },
          {
            type: "paragraph",
            text: "Do not expand an equation unnecessarily. The goal is to simplify it into a solvable form while preserving the complete set of solutions."
          }
        ]
      },
      {
        id: "solution-count",
        title: "Finding All Solutions",
        content: [
          {
            type: "paragraph",
            text: "When the angle is multiplied, carefully generate all solutions before dividing so that none are missed.",
            id: "solution-count-paragraph-1"
          }
        ]
      }
    ]
  },
  formulas: [
    {
      id: "sine-multiple-general",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Sine Multiple-Angle General Solution",
      expression: "sin(nx) = a  \u21D2  nx = sin\u207B\xB9(a) + 2k\u03C0  OR  nx = \u03C0 \u2212 sin\u207B\xB9(a) + 2k\u03C0,  k \u2208 \u2124",
      explanation: "Solve the sine equation for the complete angle nx first. Only after generating the required solutions should you divide by n."
    },
    {
      id: "sine-multiple-compact",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Compact Sine General Solution",
      expression: "sin(nx) = a  \u21D2  nx = (\u22121)\u1D4F sin\u207B\xB9(a) + k\u03C0,  k \u2208 \u2124",
      explanation: "A compact way to represent both families of sine solutions."
    },
    {
      id: "cosine-multiple-general",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Cosine Multiple-Angle General Solution",
      expression: "cos(nx) = a  \u21D2  nx = \xB1cos\u207B\xB9(a) + 2k\u03C0,  k \u2208 \u2124",
      explanation: "Solve the cosine equation for nx first and then divide by n."
    },
    {
      id: "tangent-multiple-general",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Tangent Multiple-Angle General Solution",
      expression: "tan(nx) = a  \u21D2  nx = tan\u207B\xB9(a) + k\u03C0,  k \u2208 \u2124",
      explanation: "Tangent repeats every \u03C0, so only one family is required. Then solve for x."
    },
    {
      id: "sine-multiple-equality",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Equal Sine Rule",
      expression: "sin(nx) = sin(\u03B8)  \u21D2  nx = \u03B8 + 2k\u03C0  OR  nx = \u03C0 \u2212 \u03B8 + 2k\u03C0",
      explanation: "Use the two sine solution families and then solve each equation for x."
    },
    {
      id: "cosine-multiple-equality",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Equal Cosine Rule",
      expression: "cos(nx) = cos(\u03B8)  \u21D2  nx = 2k\u03C0 \xB1 \u03B8",
      explanation: "Use both signs to obtain the complete set of cosine solutions."
    },
    {
      id: "tangent-multiple-equality",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Equal Tangent Rule",
      expression: "tan(nx) = tan(\u03B8)  \u21D2  nx = \u03B8 + k\u03C0",
      explanation: "Tangent has period \u03C0, so solutions differ by integer multiples of \u03C0."
    },
    {
      id: "sine-double-angle",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Double-Angle Identity for Sine",
      expression: "sin(2x) = 2sin(x)cos(x)",
      explanation: "Useful when an equation contains a product of sin(x) and cos(x) or when sin(2x) needs to be converted into basic functions."
    },
    {
      id: "cosine-double-angle-1",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Double-Angle Identity for Cosine",
      expression: "cos(2x) = cos\xB2(x) \u2212 sin\xB2(x)",
      explanation: "Useful for converting between double angles and squared sine/cosine terms."
    },
    {
      id: "cosine-double-angle-2",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Cosine Double-Angle Form",
      expression: "cos(2x) = 2cos\xB2(x) \u2212 1",
      explanation: "Especially useful when an equation contains cos\xB2(x)."
    },
    {
      id: "cosine-double-angle-3",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Cosine Double-Angle Form",
      expression: "cos(2x) = 1 \u2212 2sin\xB2(x)",
      explanation: "Especially useful when an equation contains sin\xB2(x)."
    },
    {
      id: "tan-double-angle",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Tangent Double-Angle Identity",
      expression: "tan(2x) = 2tan(x) / (1 \u2212 tan\xB2(x))",
      explanation: "Useful for equations involving tan(2x), provided the denominator is nonzero and the original tangent expressions are defined."
    },
    {
      id: "sine-triple-angle",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Sine Triple-Angle Identity",
      expression: "sin(3x) = 3sin(x) \u2212 4sin\xB3(x)",
      explanation: "Useful for converting equations involving sin(3x) into polynomial equations in sin(x), or vice versa."
    },
    {
      id: "cosine-triple-angle",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Cosine Triple-Angle Identity",
      expression: "cos(3x) = 4cos\xB3(x) \u2212 3cos(x)",
      explanation: "Useful for converting equations involving cos(3x) into polynomial equations in cos(x), or vice versa."
    },
    {
      id: "tangent-triple-angle",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Tangent Triple-Angle Identity",
      expression: "tan(3x) = (3tan(x) \u2212 tan\xB3(x)) / (1 \u2212 3tan\xB2(x))",
      explanation: "Useful for equations involving tan(3x), subject to the domain restrictions of tangent."
    },
    {
      id: "multiple-angle-period-sine",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Period of sin(nx)",
      expression: "For n \u2260 0, the fundamental period of sin(nx) is 2\u03C0/|n|",
      explanation: "Explains why increasing the angle coefficient creates more cycles and potentially more solutions over a fixed x-interval."
    },
    {
      id: "multiple-angle-period-cosine",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Period of cos(nx)",
      expression: "For n \u2260 0, the fundamental period of cos(nx) is 2\u03C0/|n|",
      explanation: "Useful for understanding the number and spacing of solutions."
    },
    {
      id: "multiple-angle-period-tangent",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Period of tan(nx)",
      expression: "For n \u2260 0, the fundamental period of tan(nx) is \u03C0/|n|",
      explanation: "Tangent has fundamental period \u03C0, so tan(nx) repeats more frequently as the coefficient n increases."
    },
    {
      id: "sine-zero-multiple",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Zero Sine Equation",
      expression: "sin(nx) = 0  \u21D2  nx = k\u03C0  \u21D2  x = k\u03C0/n,  k \u2208 \u2124",
      explanation: "A frequently used special case. Apply the required interval after solving."
    },
    {
      id: "cosine-zero-multiple",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Zero Cosine Equation",
      expression: "cos(nx) = 0  \u21D2  nx = \u03C0/2 + k\u03C0  \u21D2  x = \u03C0/(2n) + k\u03C0/n,  k \u2208 \u2124",
      explanation: "A frequently used special case for multiple-angle equations."
    },
    {
      id: "tangent-zero-multiple",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Zero Tangent Equation",
      expression: "tan(nx) = 0  \u21D2  nx = k\u03C0  \u21D2  x = k\u03C0/n,  k \u2208 \u2124",
      explanation: "Tangent is zero at integer multiples of \u03C0."
    },
    {
      id: "transformed-interval",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Transforming an Interval",
      expression: "If \u03B8 = nx and a \u2264 x \u2264 b, then for n > 0: na \u2264 \u03B8 \u2264 nb",
      explanation: "Transform the interval before solving so that every relevant solution for the multiple angle is included."
    },
    {
      id: "double-angle-pythagorean",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Pythagorean Double-Angle Relationship",
      expression: "sin\xB2(x) + cos\xB2(x) = 1",
      explanation: "Often combined with double-angle identities to convert an equation into a quadratic in sin(x) or cos(x)."
    },
    {
      id: "double-angle-product",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Product-to-Double-Angle Relationship",
      expression: "2sin(x)cos(x) = sin(2x)",
      explanation: "Useful for recognizing products as double-angle expressions."
    },
    {
      id: "cosine-shift",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Cosine Phase Symmetry",
      expression: "cos(\u03B8) = cos(\u2212\u03B8)",
      explanation: "Explains the \xB1 form in the general solution for cosine equations."
    },
    {
      id: "sine-symmetry",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Sine Supplementary-Angle Relationship",
      expression: "sin(\u03C0 \u2212 \u03B8) = sin(\u03B8)",
      explanation: "Explains why sine equations have two solution families within each 2\u03C0 cycle."
    },
    {
      id: "tangent-period",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Tangent Periodicity",
      expression: "tan(\u03B8 + k\u03C0) = tan(\u03B8),  k \u2208 \u2124",
      explanation: "The fundamental periodic relationship used to solve tangent equations."
    },
    {
      id: "composite-angle-general",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Composite-Angle Substitution",
      expression: "If f(ax + b) = c, let \u03B8 = ax + b, solve f(\u03B8) = c, then solve ax + b = \u03B8",
      explanation: "A general strategy for equations containing shifted and scaled angles."
    },
    {
      id: "degree-radian",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Degree-Radian Conversion",
      expression: "180\xB0 = \u03C0 radians;  \u03B8\xB0 = \u03B8\u03C0/180 radians",
      explanation: "Use consistently when a problem mixes degree and radian measures."
    }
  ],
  examples: [
    {
      id: "double-angle-example",
      question: "Solve cos(2x) = 0 for 0 \u2264 x < 2\u03C0.",
      solution: "Let \u03B8 = 2x. Then cos(\u03B8) = 0, so \u03B8 = \u03C0/2 + k\u03C0. Since 0 \u2264 x < 2\u03C0, we have 0 \u2264 \u03B8 < 4\u03C0. Therefore \u03B8 = \u03C0/2, 3\u03C0/2, 5\u03C0/2, 7\u03C0/2. Divide by 2: x = \u03C0/4, 3\u03C0/4, 5\u03C0/4, 7\u03C0/4."
    },
    {
      id: "sine-double-angle-example",
      question: "Solve sin(2x) = 1/2 for 0 \u2264 x < 2\u03C0.",
      solution: "Let \u03B8 = 2x. Then 0 \u2264 \u03B8 < 4\u03C0. Since sin(\u03B8) = 1/2, \u03B8 = \u03C0/6 + 2k\u03C0 or \u03B8 = 5\u03C0/6 + 2k\u03C0. In 0 \u2264 \u03B8 < 4\u03C0, the solutions are \u03C0/6, 5\u03C0/6, 13\u03C0/6, 17\u03C0/6. Dividing by 2 gives x = \u03C0/12, 5\u03C0/12, 13\u03C0/12, 17\u03C0/12."
    },
    {
      id: "cosine-triple-angle-example",
      question: "Solve cos(3x) = \u22121 for 0 \u2264 x < 2\u03C0.",
      solution: "Let \u03B8 = 3x. Since cos(\u03B8) = \u22121, \u03B8 = \u03C0 + 2k\u03C0. The interval becomes 0 \u2264 \u03B8 < 6\u03C0. Therefore \u03B8 = \u03C0, 3\u03C0, 5\u03C0. Dividing by 3 gives x = \u03C0/3, \u03C0, 5\u03C0/3."
    },
    {
      id: "tangent-double-angle-example",
      question: "Solve tan(2x) = \u221A3 for 0 \u2264 x < 2\u03C0.",
      solution: "Let \u03B8 = 2x. Since tan(\u03B8) = \u221A3, \u03B8 = \u03C0/3 + k\u03C0. Because 0 \u2264 \u03B8 < 4\u03C0, \u03B8 = \u03C0/3, 4\u03C0/3, 7\u03C0/3, 10\u03C0/3. Dividing by 2 gives x = \u03C0/6, 2\u03C0/3, 7\u03C0/6, 5\u03C0/3."
    },
    {
      id: "composite-angle-example",
      question: "Solve sin(2x + \u03C0/3) = 1/2 for 0 \u2264 x < 2\u03C0.",
      solution: "Let \u03B8 = 2x + \u03C0/3. Then sin(\u03B8) = 1/2, so \u03B8 = \u03C0/6 + 2k\u03C0 or \u03B8 = 5\u03C0/6 + 2k\u03C0. From the first family: 2x + \u03C0/3 = \u03C0/6 + 2k\u03C0, giving x = \u2212\u03C0/12 + k\u03C0. From the second family: 2x + \u03C0/3 = 5\u03C0/6 + 2k\u03C0, giving x = \u03C0/4 + k\u03C0. Now select values satisfying 0 \u2264 x < 2\u03C0. The solutions are 11\u03C0/12, 23\u03C0/12, \u03C0/4, and 5\u03C0/4."
    },
    {
      id: "identity-assisted-example",
      question: "Solve 2sin\xB2(x) \u2212 1 = 0 for 0 \u2264 x < 2\u03C0.",
      solution: "Rearrange: 2sin\xB2(x) = 1, so sin\xB2(x) = 1/2. Using cos(2x) = 1 \u2212 2sin\xB2(x), the equation becomes cos(2x) = 0. Therefore 2x = \u03C0/2 + k\u03C0. For 0 \u2264 x < 2\u03C0, we need 0 \u2264 2x < 4\u03C0, giving 2x = \u03C0/2, 3\u03C0/2, 5\u03C0/2, 7\u03C0/2. Hence x = \u03C0/4, 3\u03C0/4, 5\u03C0/4, 7\u03C0/4."
    },
    {
      id: "triple-angle-identity-example",
      question: "Solve 4cos\xB3(x) \u2212 3cos(x) = 0 for 0 \u2264 x < 2\u03C0.",
      solution: "Recognize the triple-angle identity 4cos\xB3(x) \u2212 3cos(x) = cos(3x). Therefore cos(3x) = 0. Hence 3x = \u03C0/2 + k\u03C0. Since 0 \u2264 x < 2\u03C0, 0 \u2264 3x < 6\u03C0. Thus 3x = \u03C0/2, 3\u03C0/2, 5\u03C0/2, 7\u03C0/2, 9\u03C0/2, 11\u03C0/2. Dividing by 3 gives x = \u03C0/6, \u03C0/2, 5\u03C0/6, 7\u03C0/6, 3\u03C0/2, 11\u03C0/6."
    },
    {
      id: "composite-cosine-example",
      question: "Solve cos(3x \u2212 \u03C0/4) = \u221A2/2 for 0 \u2264 x < 2\u03C0.",
      solution: "Let \u03B8 = 3x \u2212 \u03C0/4. Then cos(\u03B8) = \u221A2/2, so \u03B8 = \xB1\u03C0/4 + 2k\u03C0. First: 3x \u2212 \u03C0/4 = \u03C0/4 + 2k\u03C0, giving x = \u03C0/6 + 2k\u03C0/3. Second: 3x \u2212 \u03C0/4 = \u2212\u03C0/4 + 2k\u03C0, giving x = 2k\u03C0/3. Generate all values in 0 \u2264 x < 2\u03C0 from both families and remove duplicates. The solutions are 0, \u03C0/6, 2\u03C0/3, 5\u03C0/6, 4\u03C0/3, 3\u03C0/2."
    },
    {
      id: "solution-count-example",
      question: "How many solutions does sin(4x) = 0 have for 0 \u2264 x < 2\u03C0?",
      solution: "sin(4x) = 0 means 4x = k\u03C0. Therefore x = k\u03C0/4. The interval 0 \u2264 x < 2\u03C0 requires 0 \u2264 k\u03C0/4 < 2\u03C0, so 0 \u2264 k < 8. Thus k = 0,1,2,3,4,5,6,7, giving 8 solutions."
    },
    {
      id: "tangent-domain-example",
      question: "Solve tan(2x) = 0 for 0 \u2264 x < 2\u03C0.",
      solution: "tan(2x) = 0 when 2x = k\u03C0. Hence x = k\u03C0/2. In 0 \u2264 x < 2\u03C0, k = 0,1,2,3, giving x = 0, \u03C0/2, \u03C0, 3\u03C0/2. These values are valid because tangent is defined at each corresponding angle."
    },
    {
      id: "degree-example",
      question: "Solve sin(3x) = 1 for 0\xB0 \u2264 x \u2264 360\xB0.",
      solution: "Let \u03B8 = 3x. Then 0\xB0 \u2264 \u03B8 \u2264 1080\xB0. Since sin(\u03B8) = 1, \u03B8 = 90\xB0 + 360\xB0k. Within the transformed interval, \u03B8 = 90\xB0, 450\xB0, 810\xB0. Therefore x = 30\xB0, 150\xB0, 270\xB0."
    }
  ],
  key_ideas: [
    "Treat the complete multiple angle such as nx as a single angle while solving the trigonometric equation.",
    "Solve the multiple angle completely before dividing by its coefficient.",
    "Transform the interval for x into an interval for nx so that no solutions are missed.",
    "Multiple-angle functions complete their cycles faster, so they can produce more solutions over the same x-interval.",
    "Use the correct general solution for sine, cosine, or tangent.",
    "Tangent has period \u03C0, whereas sine and cosine have period 2\u03C0.",
    "Composite angles such as ax + b must be handled as a complete expression.",
    "Use double-angle and triple-angle identities when they transform an equation into a more convenient solvable form.",
    "Always return to the original interval after solving.",
    "Check final answers in the original equation when transformations could introduce or lose solutions.",
    "For restricted intervals, endpoints matter.",
    "For general solutions, keep the integer parameter k \u2208 \u2124.",
    "The coefficient multiplying x affects the number and spacing of solutions.",
    "The most important practical skill is systematic solution generation rather than finding only a principal angle."
  ],
  misconceptions: [
    "Finding only the principal value of nx and assuming it is the only solution.",
    "Dividing by n before generating all solutions for nx.",
    "Using the interval for x directly when solving for nx.",
    "Forgetting that if x \u2208 [0, 2\u03C0), then 3x \u2208 [0, 6\u03C0).",
    "Assuming sin(nx) and cos(nx) have period 2\u03C0 in x. Their x-period is 2\u03C0/|n|.",
    "Assuming tan(nx) has period 2\u03C0 in x. Its x-period is \u03C0/|n|.",
    "Forgetting the second solution family for sine.",
    "Forgetting the \xB1 solutions for cosine.",
    "Using the sine or cosine general solution for tangent.",
    "Ignoring a constant shift inside a composite angle such as 2x + \u03C0/3.",
    "Dividing only part of an equation such as ax + b = \u03B8 incorrectly.",
    "Using a multiple-angle identity without checking the original domain.",
    "Assuming every algebraic root obtained after an identity transformation is automatically valid.",
    "Counting solutions without checking whether the interval includes its endpoints.",
    "Mixing degrees and radians.",
    "Failing to check tangent-domain restrictions.",
    "Assuming that more complicated-looking equations always require identities; sometimes direct substitution into the multiple angle is simpler.",
    "Stopping after obtaining a general solution without listing restricted-interval solutions when the problem asks for them."
  ],
  explorations: [
    {
      id: "multiple-angle-solutions",
      type: "visualization"
    },
    {
      id: "multiple-angle-period-comparison",
      type: "visualization"
    },
    {
      id: "transformed-interval",
      type: "visualization"
    },
    {
      id: "double-angle-graph-intersections",
      type: "visualization"
    },
    {
      id: "triple-angle-solution-count",
      type: "visualization"
    },
    {
      id: "composite-angle-shift",
      type: "visualization"
    },
    {
      id: "why-solutions-increase",
      type: "why"
    }
  ],
  sources: [
    "openstax-precalculus-trigonometric-equations"
  ]
};

// ../content/concepts/trigonometricFunctions/trig-equations-09-RestrictedInterval.json
var trig_equations_09_RestrictedInterval_default = {
  id: "trig-equations-09",
  title: "Solving on a Restricted Interval",
  subject: "mathematics",
  topic: "trigonometry",
  section: "trigonometric-equations",
  difficulty: 3,
  connections: {
    prerequisites: [
      "trig-equations-02",
      "trig-equations-03",
      "trig-equations-08"
    ],
    leads_to: [
      "trig-equations-10",
      "trig-equations-11"
    ],
    related: [
      "unit-circle",
      "trigonometric-graphs",
      "periodic-functions",
      "inverse-trigonometric-functions"
    ]
  },
  theory: {
    introduction: "A restricted interval limits the set of acceptable solutions. Unlike a general solution, where every possible value is represented using an integer parameter, a restricted-interval problem asks you to find only the solutions that lie inside a specified range. The main skills are reading the interval correctly, finding all trigonometric solutions, using the unit circle and reference angles, handling endpoints correctly, and checking that every answer belongs to the requested interval.",
    sections: [
      {
        id: "what-restricted-interval-means",
        title: "What Is a Restricted Interval?",
        content: [
          {
            type: "paragraph",
            text: "A restricted interval tells you exactly which values of x are allowed. For example, 0 \u2264 x < 2\u03C0 means that x may be 0 but may not be 2\u03C0."
          },
          {
            type: "paragraph",
            text: "A solution to the trigonometric equation is valid only if it satisfies both the equation and the specified interval."
          },
          {
            type: "paragraph",
            text: "The same equation can therefore have infinitely many solutions in general but only a finite number of solutions on a restricted interval."
          }
        ]
      },
      {
        id: "common-intervals",
        title: "Common Intervals",
        content: [
          {
            type: "paragraph",
            text: "Common intervals include 0 \u2264 x < 2\u03C0 and 0\xB0 \u2264 x \u2264 360\xB0.",
            id: "common-intervals-paragraph-1"
          }
        ]
      },
      {
        id: "degrees-and-radians",
        title: "Degrees and Radians",
        content: [
          {
            type: "paragraph",
            text: "Use the unit circle, reference angles, and periodicity to identify every solution inside the required interval.",
            id: "finding-solutions-paragraph-1"
          }
        ]
      },
      {
        id: "unit-circle-method",
        title: "Unit-Circle Method for Restricted Solutions",
        content: [
          {
            type: "paragraph",
            text: "Use the unit circle as a lookup and selection tool. The basic equation lesson determines what trigonometric value is required; this lesson determines which angles in the requested interval produce that value."
          },
          {
            type: "paragraph",
            text: "The objective is interval filtering, not a second derivation of the coordinate definitions of sine, cosine, and tangent."
          }
        ]
      },
      {
        id: "reference-angle",
        title: "Reference Angles as a Solution-Selection Tool",
        content: [
          {
            type: "paragraph",
            text: "Reference angles and quadrant signs were developed in the any-angle trigonometric-ratios lesson. Here they are used only as a procedure for locating solutions after a basic equation has been solved."
          },
          {
            type: "paragraph",
            text: "For an equation such as sin x = a, first determine the reference angle and then select the quadrants in which sine has the required sign. Do not treat this section as a second lesson on constructing reference angles from scratch."
          }
        ]
      },
      {
        id: "quadrant-signs",
        title: "Quadrant Signs for Equation Solving",
        content: [
          {
            type: "paragraph",
            text: "Use the established quadrant sign rules to choose the correct terminal positions for a solution. The full coordinate-plane explanation and CAST/ASTC reasoning belong to trigonometric-ratios-any-angle."
          },
          {
            type: "paragraph",
            text: "In this lesson, the sign table is a decision aid: sine is positive in Quadrants I and II, cosine in I and IV, and tangent in I and III."
          }
        ]
      },
      {
        id: "sine-restricted",
        title: "Solving Sine Equations on a Restricted Interval",
        content: [
          {
            type: "paragraph",
            text: "For a sine equation, first use the basic solution method from trig-equations-03 to identify the branches. Then list only the values inside the specified interval."
          }
        ]
      },
      {
        id: "cosine-restricted",
        title: "Solving Cosine Equations on a Restricted Interval",
        content: [
          {
            type: "paragraph",
            text: "For a cosine equation, first use the basic solution method from trig-equations-03. Then generate and filter all valid angles in the interval."
          }
        ]
      },
      {
        id: "tangent-restricted",
        title: "Solving Tangent Equations on a Restricted Interval",
        content: [
          {
            type: "paragraph",
            text: "For a tangent equation, use its \u03C0 or 180\xB0 periodicity from the basic-equation framework, generate all candidates in the interval, and discard anything outside the bounds."
          }
        ]
      },
      {
        id: "reciprocal-functions",
        title: "Restricted Intervals with Reciprocal Functions",
        content: [
          {
            type: "paragraph",
            text: "For sec, csc, and cot, first rewrite and solve using trig-equations-04. Then apply the interval-filtering method here while preserving the reciprocal function domain restrictions."
          }
        ]
      },
      {
        id: "multiple-angle-interval",
        title: "Multiple-Angle Equations on Restricted Intervals",
        content: [
          {
            type: "paragraph",
            text: "If the equation contains nx, the interval must be transformed before generating solutions."
          },
          {
            type: "paragraph",
            text: "For example, if 0 \u2264 x < 2\u03C0 and the equation contains 3x, then 0 \u2264 3x < 6\u03C0."
          },
          {
            type: "paragraph",
            text: "Solve for 3x across the entire transformed interval, then divide each valid solution by 3."
          },
          {
            type: "paragraph",
            text: "This prevents solutions from being missed."
          }
        ]
      },
      {
        id: "negative-angles",
        title: "Intervals Containing Negative Angles",
        content: [
          {
            type: "paragraph",
            text: "Some problems use intervals such as \u2212\u03C0 \u2264 x \u2264 \u03C0. In these cases, negative angles must be considered directly."
          },
          {
            type: "paragraph",
            text: "Use the even and odd properties of cosine and sine when useful: cos(\u2212x) = cos(x) and sin(\u2212x) = \u2212sin(x)."
          },
          {
            type: "paragraph",
            text: "Tangent is also odd: tan(\u2212x) = \u2212tan(x)."
          }
        ]
      },
      {
        id: "endpoints",
        title: "Handling Endpoints Correctly",
        content: [
          {
            type: "paragraph",
            text: "An endpoint written with \u2264 is included; an endpoint written with < is excluded."
          },
          {
            type: "paragraph",
            text: "For example, 0 \u2264 x < 2\u03C0 includes 0 but excludes 2\u03C0."
          },
          {
            type: "paragraph",
            text: "Because many trigonometric functions repeat at the endpoints of a full revolution, including both 0 and 2\u03C0 can sometimes represent the same point twice. Follow the exact interval given rather than automatically including both."
          },
          {
            type: "paragraph",
            text: "Always test endpoint values in the original equation when there is any doubt."
          }
        ]
      },
      {
        id: "solution-generation",
        title: "Systematically Finding Every Solution",
        content: [
          {
            type: "paragraph",
            text: "A reliable procedure is: identify the function, find the reference angle or principal angle, determine the valid quadrants, generate all angles in the interval, and finally verify the answers."
          },
          {
            type: "paragraph",
            text: "For multiple-angle equations, first transform the interval and solve for the complete multiple angle before converting back to x."
          },
          {
            type: "paragraph",
            text: "Do not stop after finding the first angle returned by a calculator."
          }
        ]
      },
      {
        id: "special-values",
        title: "Special-Angle Values",
        content: [
          {
            type: "paragraph",
            text: "The unit-circle angles 0, \u03C0/6, \u03C0/4, \u03C0/3, \u03C0/2 and their related angles are especially important for exact restricted-interval solutions."
          },
          {
            type: "paragraph",
            text: "Memorizing the standard sine, cosine, and tangent values allows many equations to be solved without a calculator."
          }
        ]
      },
      {
        id: "calculator-method",
        title: "Using a Calculator Correctly",
        content: [
          {
            type: "paragraph",
            text: "A calculator can provide a principal inverse-trigonometric value, but it does not automatically provide every solution in a restricted interval."
          },
          {
            type: "paragraph",
            text: "Use the principal value as a starting point, then generate the other solutions using symmetry, reference angles, or the general solution."
          },
          {
            type: "paragraph",
            text: "Check that the calculator is in degree mode for degree problems and radian mode for radian problems."
          }
        ]
      },
      {
        id: "verification",
        title: "Checking the Final Solutions",
        content: [
          {
            type: "paragraph",
            text: "Substitute each final value into the original equation."
          },
          {
            type: "paragraph",
            text: "Also verify that every answer belongs to the specified interval."
          },
          {
            type: "paragraph",
            text: "For equations involving reciprocals or multiple-angle expressions, checking the original equation is particularly important."
          }
        ]
      }
    ]
  },
  formulas: [
    {
      id: "full-revolution",
      name: "[IMPORTANT FOR PROBLEM SOLVING] One Full Revolution",
      expression: "360\xB0 = 2\u03C0 radians",
      explanation: "One complete revolution can be represented using either degrees or radians."
    },
    {
      id: "degree-radian-conversion",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Degree-Radian Conversion",
      expression: "180\xB0 = \u03C0 radians",
      explanation: "Use this relationship to convert between degrees and radians."
    },
    {
      id: "degrees-to-radians",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Degrees to Radians",
      expression: "\u03B8\xB0 = \u03B8\u03C0/180 radians",
      explanation: "Multiply a degree measure by \u03C0/180 to convert it to radians."
    },
    {
      id: "radians-to-degrees",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Radians to Degrees",
      expression: "\u03B8 radians = 180\u03B8/\u03C0 degrees",
      explanation: "Multiply a radian measure by 180/\u03C0 to convert it to degrees."
    },
    {
      id: "sine-general-restricted",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Sine General Solution",
      expression: "sin(x) = a  \u21D2  x = sin\u207B\xB9(a) + 2n\u03C0  OR  x = \u03C0 \u2212 sin\u207B\xB9(a) + 2n\u03C0,  n \u2208 \u2124",
      explanation: "Generate the complete sine solution set first, then retain only values inside the requested interval."
    },
    {
      id: "sine-compact",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Compact Sine Solution",
      expression: "sin(x) = a  \u21D2  x = (\u22121)\u207Fsin\u207B\xB9(a) + n\u03C0,  n \u2208 \u2124",
      explanation: "A compact form representing both families of sine solutions."
    },
    {
      id: "cosine-general-restricted",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Cosine General Solution",
      expression: "cos(x) = a  \u21D2  x = \xB1cos\u207B\xB9(a) + 2n\u03C0,  n \u2208 \u2124",
      explanation: "Use both signs and then select the values inside the restricted interval."
    },
    {
      id: "tangent-general-restricted",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Tangent General Solution",
      expression: "tan(x) = a  \u21D2  x = tan\u207B\xB9(a) + n\u03C0,  n \u2208 \u2124",
      explanation: "Tangent repeats every \u03C0, so one solution family with n \u2208 \u2124 generates all solutions."
    },
    {
      id: "sine-equality",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Equal Sine Rule",
      expression: "sin(x) = sin(\u03B8)  \u21D2  x = \u03B8 + 2n\u03C0  OR  x = \u03C0 \u2212 \u03B8 + 2n\u03C0",
      explanation: "The two families account for the two sine solutions in each 2\u03C0 cycle."
    },
    {
      id: "cosine-equality",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Equal Cosine Rule",
      expression: "cos(x) = cos(\u03B8)  \u21D2  x = 2n\u03C0 \xB1 \u03B8",
      explanation: "The \xB1 accounts for cosine's symmetry about the x-axis."
    },
    {
      id: "tangent-equality",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Equal Tangent Rule",
      expression: "tan(x) = tan(\u03B8)  \u21D2  x = \u03B8 + n\u03C0",
      explanation: "Tangent repeats every \u03C0."
    },
    {
      id: "sine-quadrants",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Positive and Negative Sine",
      expression: "sin(x) > 0 in Quadrants I and II; sin(x) < 0 in Quadrants III and IV",
      explanation: "Use the sign to determine which quadrants contain solutions."
    },
    {
      id: "cosine-quadrants",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Positive and Negative Cosine",
      expression: "cos(x) > 0 in Quadrants I and IV; cos(x) < 0 in Quadrants II and III",
      explanation: "Use the sign to determine which quadrants contain solutions."
    },
    {
      id: "tangent-quadrants",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Positive and Negative Tangent",
      expression: "tan(x) > 0 in Quadrants I and III; tan(x) < 0 in Quadrants II and IV",
      explanation: "Use the sign to determine the quadrants for tangent solutions."
    },
    {
      id: "sine-period",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Sine Period",
      expression: "sin(x + 2\u03C0) = sin(x)",
      explanation: "Sine repeats every 2\u03C0."
    },
    {
      id: "cosine-period",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Cosine Period",
      expression: "cos(x + 2\u03C0) = cos(x)",
      explanation: "Cosine repeats every 2\u03C0."
    },
    {
      id: "tangent-period",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Tangent Period",
      expression: "tan(x + \u03C0) = tan(x)",
      explanation: "Tangent repeats every \u03C0."
    },
    {
      id: "sine-even-odd",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Sine Symmetry",
      expression: "sin(\u2212x) = \u2212sin(x)",
      explanation: "Sine is an odd function and changes sign for negative angles."
    },
    {
      id: "cosine-even-odd",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Cosine Symmetry",
      expression: "cos(\u2212x) = cos(x)",
      explanation: "Cosine is an even function."
    },
    {
      id: "tangent-even-odd",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Tangent Symmetry",
      expression: "tan(\u2212x) = \u2212tan(x)",
      explanation: "Tangent is an odd function."
    },
    {
      id: "reference-angle-sine",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Sine Reference Angle",
      expression: "\u03B1 = sin\u207B\xB9(|a|), for |a| \u2264 1",
      explanation: "The positive acute angle \u03B1 can be used as the reference angle when solving sin(x) = a."
    },
    {
      id: "reference-angle-cosine",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Cosine Reference Angle",
      expression: "\u03B1 = cos\u207B\xB9(|a|), for |a| \u2264 1",
      explanation: "The positive acute angle \u03B1 can be used as the reference angle when solving cos(x) = a."
    },
    {
      id: "reference-angle-tangent",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Tangent Reference Angle",
      expression: "\u03B1 = tan\u207B\xB9(|a|)",
      explanation: "The positive acute angle \u03B1 can be used as the reference angle when solving tan(x) = a."
    },
    {
      id: "multiple-angle-interval",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Multiple-Angle Interval Transformation",
      expression: "If \u03B8 = nx and a \u2264 x < b, then for n > 0: na \u2264 \u03B8 < nb",
      explanation: "Transform the interval before solving equations involving nx so that no solutions are missed."
    },
    {
      id: "multiple-sine-period",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Period of sin(nx)",
      expression: "Period of sin(nx) = 2\u03C0/|n|",
      explanation: "A larger coefficient creates more cycles over the same x-interval."
    },
    {
      id: "multiple-cosine-period",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Period of cos(nx)",
      expression: "Period of cos(nx) = 2\u03C0/|n|",
      explanation: "Use this to understand solution spacing and solution count."
    },
    {
      id: "multiple-tangent-period",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Period of tan(nx)",
      expression: "Period of tan(nx) = \u03C0/|n|",
      explanation: "Tangent completes a cycle over \u03C0 in its input, so tan(nx) has x-period \u03C0/|n|."
    },
    {
      id: "sec-reciprocal",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Secant Reciprocal Identity",
      expression: "sec(x) = 1/cos(x)",
      explanation: "Use this to convert secant equations into cosine equations."
    },
    {
      id: "csc-reciprocal",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Cosecant Reciprocal Identity",
      expression: "csc(x) = 1/sin(x)",
      explanation: "Use this to convert cosecant equations into sine equations."
    },
    {
      id: "cot-reciprocal",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Cotangent Reciprocal Identity",
      expression: "cot(x) = 1/tan(x)",
      explanation: "Use this to convert cotangent equations into tangent equations when appropriate."
    },
    {
      id: "restricted-sine-zero",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Sine Zero Solutions",
      expression: "sin(x) = 0  \u21D2  x = n\u03C0,  n \u2208 \u2124",
      explanation: "Use the interval to select the valid values."
    },
    {
      id: "restricted-cosine-zero",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Cosine Zero Solutions",
      expression: "cos(x) = 0  \u21D2  x = \u03C0/2 + n\u03C0,  n \u2208 \u2124",
      explanation: "Use the interval to select the valid values."
    },
    {
      id: "restricted-tangent-zero",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Tangent Zero Solutions",
      expression: "tan(x) = 0  \u21D2  x = n\u03C0,  n \u2208 \u2124",
      explanation: "Use the interval to select the valid values."
    },
    {
      id: "special-sine-values",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Common Exact Sine Values",
      expression: "sin(0)=0, sin(\u03C0/6)=1/2, sin(\u03C0/4)=\u221A2/2, sin(\u03C0/3)=\u221A3/2, sin(\u03C0/2)=1",
      explanation: "These unit-circle values are frequently used for exact restricted-interval solutions."
    },
    {
      id: "special-cosine-values",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Common Exact Cosine Values",
      expression: "cos(0)=1, cos(\u03C0/6)=\u221A3/2, cos(\u03C0/4)=\u221A2/2, cos(\u03C0/3)=1/2, cos(\u03C0/2)=0",
      explanation: "These unit-circle values are frequently used for exact restricted-interval solutions."
    },
    {
      id: "special-tangent-values",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Common Exact Tangent Values",
      expression: "tan(0)=0, tan(\u03C0/6)=1/\u221A3, tan(\u03C0/4)=1, tan(\u03C0/3)=\u221A3",
      explanation: "These values are frequently used when solving tangent equations exactly."
    }
  ],
  examples: [
    {
      id: "interval-example",
      question: "Solve cos(x) = 1/2 for 0 \u2264 x < 2\u03C0.",
      solution: "The reference angle is \u03C0/3. Cosine is positive in Quadrants I and IV, giving x = \u03C0/3 and 5\u03C0/3."
    },
    {
      id: "sine-positive-example",
      question: "Solve sin(x) = 1/2 for 0 \u2264 x < 2\u03C0.",
      solution: "The reference angle is \u03C0/6. Sine is positive in Quadrants I and II. Therefore x = \u03C0/6 and 5\u03C0/6."
    },
    {
      id: "sine-negative-example",
      question: "Solve sin(x) = \u22121/2 for 0 \u2264 x < 2\u03C0.",
      solution: "The reference angle is \u03C0/6. Sine is negative in Quadrants III and IV. Therefore x = 7\u03C0/6 and 11\u03C0/6."
    },
    {
      id: "cosine-negative-example",
      question: "Solve cos(x) = \u2212\u221A3/2 for 0 \u2264 x < 2\u03C0.",
      solution: "The reference angle is \u03C0/6. Cosine is negative in Quadrants II and III. Therefore x = 5\u03C0/6 and 7\u03C0/6."
    },
    {
      id: "tangent-example",
      question: "Solve tan(x) = 1 for 0 \u2264 x < 2\u03C0.",
      solution: "The reference angle is \u03C0/4. Tangent is positive in Quadrants I and III. Therefore x = \u03C0/4 and 5\u03C0/4."
    },
    {
      id: "secant-example",
      question: "Solve sec(x) = 2 for 0 \u2264 x < 2\u03C0.",
      solution: "Rewrite as cos(x) = 1/2. The solutions are x = \u03C0/3 and 5\u03C0/3."
    },
    {
      id: "cosecant-example",
      question: "Solve csc(x) = \u22121 for 0 \u2264 x < 2\u03C0.",
      solution: "Rewrite as sin(x) = \u22121. Sine equals \u22121 at x = 3\u03C0/2, which is the only solution in 0 \u2264 x < 2\u03C0."
    },
    {
      id: "cotangent-example",
      question: "Solve cot(x) = 1 for 0 \u2264 x < 2\u03C0.",
      solution: "Since cot(x) = 1/tan(x), tan(x) = 1. Tangent is positive in Quadrants I and III, giving x = \u03C0/4 and 5\u03C0/4."
    },
    {
      id: "multiple-angle-example",
      question: "Solve sin(2x) = 1/2 for 0 \u2264 x < 2\u03C0.",
      solution: "Let \u03B8 = 2x. Then 0 \u2264 \u03B8 < 4\u03C0. Solve sin(\u03B8) = 1/2: \u03B8 = \u03C0/6, 5\u03C0/6, 13\u03C0/6, 17\u03C0/6. Dividing by 2 gives x = \u03C0/12, 5\u03C0/12, 13\u03C0/12, 17\u03C0/12."
    },
    {
      id: "triple-angle-example",
      question: "Solve cos(3x) = 0 for 0 \u2264 x < 2\u03C0.",
      solution: "Let \u03B8 = 3x. Then 0 \u2264 \u03B8 < 6\u03C0. Since cos(\u03B8) = 0, \u03B8 = \u03C0/2 + n\u03C0. The six values in the transformed interval are \u03C0/2, 3\u03C0/2, 5\u03C0/2, 7\u03C0/2, 9\u03C0/2, 11\u03C0/2. Dividing by 3 gives x = \u03C0/6, \u03C0/2, 5\u03C0/6, 7\u03C0/6, 3\u03C0/2, 11\u03C0/6."
    },
    {
      id: "negative-interval-example",
      question: "Solve sin(x) = \u2212\u221A2/2 for \u2212\u03C0 \u2264 x \u2264 \u03C0.",
      solution: "The reference angle is \u03C0/4. In the interval \u2212\u03C0 \u2264 x \u2264 \u03C0, sin(x) is \u2212\u221A2/2 at x = \u22123\u03C0/4 and \u2212\u03C0/4."
    },
    {
      id: "endpoint-example",
      question: "Solve sin(x) = 0 for 0 \u2264 x \u2264 2\u03C0.",
      solution: "Sine is zero at integer multiples of \u03C0. In this closed interval, x = 0, \u03C0, and 2\u03C0. If the interval were 0 \u2264 x < 2\u03C0, then 2\u03C0 would be excluded."
    },
    {
      id: "degree-example",
      question: "Solve cos(x) = 1/2 for 0\xB0 \u2264 x \u2264 360\xB0.",
      solution: "The reference angle is 60\xB0. Cosine is positive in Quadrants I and IV, giving x = 60\xB0 and 300\xB0."
    },
    {
      id: "degree-negative-example",
      question: "Solve sin(x) = \u2212\u221A3/2 for 0\xB0 \u2264 x \u2264 360\xB0.",
      solution: "The reference angle is 60\xB0. Sine is negative in Quadrants III and IV, giving x = 240\xB0 and 300\xB0."
    },
    {
      id: "composite-interval-example",
      question: "Solve cos(2x + \u03C0/3) = 1/2 for 0 \u2264 x < 2\u03C0.",
      solution: "Let \u03B8 = 2x + \u03C0/3. Then cos(\u03B8) = 1/2, so \u03B8 = \xB1\u03C0/3 + 2n\u03C0. Solve both families: 2x + \u03C0/3 = \u03C0/3 + 2n\u03C0 gives x = n\u03C0; and 2x + \u03C0/3 = \u2212\u03C0/3 + 2n\u03C0 gives x = \u2212\u03C0/3 + n\u03C0. Select the values in 0 \u2264 x < 2\u03C0. The solutions are x = 0, \u03C0, 2\u03C0/3, and 5\u03C0/3."
    },
    {
      id: "solution-count-example",
      question: "How many solutions does sin(3x) = 0 have for 0 \u2264 x < 2\u03C0?",
      solution: "sin(3x) = 0 gives 3x = n\u03C0, so x = n\u03C0/3. The interval 0 \u2264 x < 2\u03C0 gives n = 0,1,2,3,4,5. Therefore there are 6 solutions: 0, \u03C0/3, 2\u03C0/3, \u03C0, 4\u03C0/3, and 5\u03C0/3."
    }
  ],
  key_ideas: [
    "A restricted interval determines which solutions are valid.",
    "Always read the endpoint symbols carefully.",
    "Use the unit circle for exact special-angle solutions.",
    "Use reference angles together with quadrant signs for non-special values.",
    "A calculator's inverse trigonometric function normally returns only a principal value.",
    "Sine has period 2\u03C0, cosine has period 2\u03C0, and tangent has period \u03C0.",
    "For multiple-angle equations, transform the interval before solving.",
    "Generate every possible solution before filtering by the original interval.",
    "For reciprocal functions, rewrite using reciprocal identities when useful.",
    "Check the final solutions in the original equation.",
    "Do not confuse degrees and radians.",
    "The interval 0 \u2264 x < 2\u03C0 does not include 2\u03C0, while 0 \u2264 x \u2264 2\u03C0 does.",
    "A general solution and a restricted-interval solution are different forms of the answer.",
    "The safest workflow is: solve completely, restrict, then verify."
  ],
  misconceptions: [
    "Giving a general solution when the question asks for solutions in a restricted interval.",
    "Using only the principal inverse-trigonometric value.",
    "Finding only one quadrant instead of all valid quadrants.",
    "Forgetting that negative trigonometric values occur in different quadrants.",
    "Including an excluded endpoint.",
    "Excluding an endpoint that is actually included.",
    "Automatically listing both 0 and 2\u03C0 when the interval is 0 \u2264 x < 2\u03C0.",
    "Using degree answers for a radian interval.",
    "Using radian answers for a degree interval.",
    "Using a 2\u03C0 period for tangent.",
    "Forgetting to transform the interval for equations involving 2x, 3x, or another multiple angle.",
    "Dividing a multiple-angle equation too early and losing solutions.",
    "Ignoring domain restrictions for tangent and reciprocal functions.",
    "Rounding exact answers unnecessarily.",
    "Failing to check the final answers in the original equation."
  ],
  explorations: [
    {
      id: "restricted-interval-unit-circle",
      type: "visualization"
    },
    {
      id: "reference-angle-explorer",
      type: "visualization"
    },
    {
      id: "quadrant-sign-explorer",
      type: "visualization"
    },
    {
      id: "restricted-interval-slider",
      type: "visualization"
    },
    {
      id: "multiple-angle-interval-visualization",
      type: "visualization"
    },
    {
      id: "degree-radian-circle",
      type: "visualization"
    },
    {
      id: "endpoint-explorer",
      type: "visualization"
    },
    {
      id: "why-calculator-gives-one-answer",
      type: "why"
    },
    {
      id: "why-multiple-angle-has-more-solutions",
      type: "why"
    }
  ],
  sources: [
    "libretexts-basic-trigonometric-equations"
  ]
};

// ../content/concepts/trigonometricFunctions/trig-equations-10-extraneousSolutions.json
var trig_equations_10_extraneousSolutions_default = {
  id: "trig-equations-10",
  title: "Checking for Extraneous Solutions",
  subject: "mathematics",
  topic: "trigonometry",
  section: "trigonometric-equations",
  difficulty: 4,
  connections: {
    prerequisites: [
      "trig-equations-04",
      "trig-equations-05",
      "trig-equations-07",
      "trig-equations-09"
    ],
    leads_to: [
      "trig-equations-11"
    ],
    related: [
      "algebraic-equations",
      "domain-and-range",
      "trigonometric-identities",
      "inverse-trigonometric-functions"
    ]
  },
  theory: {
    introduction: "Algebraic transformations are powerful tools for solving trigonometric equations, but some transformations can change the set of possible solutions. A value obtained during the algebraic process is only a candidate until it has been checked against the original equation and its original domain. An extraneous solution is a value that satisfies a transformed equation but does not satisfy the original equation.",
    sections: [
      {
        id: "what-is-extraneous",
        title: "What Is an Extraneous Solution?",
        content: [
          {
            type: "paragraph",
            text: "An extraneous solution is a value that appears to solve an equation after an algebraic transformation but does not actually satisfy the original equation."
          },
          {
            type: "paragraph",
            text: "The transformed equation may be easier to solve, but it is not always logically equivalent to the original equation."
          },
          {
            type: "paragraph",
            text: "For this reason, every candidate solution must be checked in the original equation whenever a transformation may have changed the solution set."
          }
        ]
      },
      {
        id: "original-domain",
        title: "The Original Domain Comes First",
        content: [
          {
            type: "paragraph",
            text: "Before checking an equation, identify where the original expression is defined."
          },
          {
            type: "paragraph",
            text: "For example, tan(x) = sin(x)/cos(x), so tan(x) is undefined wherever cos(x) = 0."
          },
          {
            type: "paragraph",
            text: "Similarly, sec(x), csc(x), and cot(x) have domain restrictions because they contain reciprocals of cosine, sine, and tangent."
          },
          {
            type: "paragraph",
            text: "A value outside the original domain is never a valid solution, even if an algebraically transformed equation accepts it."
          }
        ]
      },
      {
        id: "when-check",
        title: "When Should You Check?",
        content: [
          {
            type: "paragraph",
            text: "Checking is especially important after squaring, multiplying by expressions, dividing by expressions, or using reciprocal functions.",
            id: "when-check-paragraph-1"
          }
        ]
      },
      {
        id: "squaring",
        title: "Why Squaring Can Create Extraneous Solutions",
        content: [
          {
            type: "paragraph",
            text: "Squaring removes sign information. If A = B, then A\xB2 = B\xB2, but the reverse implication is not always true because A\xB2 = B\xB2 also allows A = \u2212B."
          },
          {
            type: "paragraph",
            text: "Therefore, solving an equation obtained by squaring can produce candidates that satisfy the squared equation but not the original equation."
          },
          {
            type: "paragraph",
            text: "In trigonometry, this commonly occurs when an equation contains a square root or when both sides are squared to remove radicals."
          }
        ]
      },
      {
        id: "square-root",
        title: "Taking Square Roots",
        content: [
          {
            type: "paragraph",
            text: "When solving A\xB2 = B\xB2, the correct conclusion is A = \xB1B, not only A = B."
          },
          {
            type: "paragraph",
            text: "Forgetting the \xB1 can remove valid solutions."
          },
          {
            type: "paragraph",
            text: "Therefore, checking is useful not only for detecting extraneous solutions but also for catching solutions that may have been lost during an incorrect transformation."
          }
        ]
      },
      {
        id: "division",
        title: "Dividing by an Expression",
        content: [
          {
            type: "paragraph",
            text: "Dividing both sides by an expression is only valid when that expression is nonzero."
          },
          {
            type: "paragraph",
            text: "For example, if an equation contains sin(x)cos(x) = 0 and you divide by sin(x), you automatically discard every solution for which sin(x) = 0."
          },
          {
            type: "paragraph",
            text: "This is one of the most common ways valid trigonometric solutions are accidentally lost."
          },
          {
            type: "paragraph",
            text: "Instead of dividing by a variable expression immediately, consider factoring and using the zero-product property."
          }
        ]
      },
      {
        id: "multiplication",
        title: "Multiplying by an Expression",
        content: [
          {
            type: "paragraph",
            text: "Multiplying both sides by an expression can introduce candidates if the original equation contains a denominator that may be zero."
          },
          {
            type: "paragraph",
            text: "The multiplied equation may be defined at values where the original equation was undefined."
          },
          {
            type: "paragraph",
            text: "Therefore, after clearing denominators, every candidate must be tested against the original domain."
          }
        ]
      },
      {
        id: "reciprocal-functions",
        title: "Reciprocal Functions and Domain Restrictions",
        content: [
          {
            type: "paragraph",
            text: "Replacing sec(x) with 1/cos(x), csc(x) with 1/sin(x), or cot(x) with cos(x)/sin(x) can reveal domain restrictions that must be preserved."
          },
          {
            type: "paragraph",
            text: "For example, sec(x) is undefined whenever cos(x) = 0. A transformed equation that happens to accept one of those angles does not make the original secant equation valid."
          },
          {
            type: "paragraph",
            text: "Always carry the original domain restriction throughout the solution."
          }
        ]
      },
      {
        id: "identity-transformations",
        title: "Using Trigonometric Identities Safely",
        content: [
          {
            type: "paragraph",
            text: "A correct trigonometric identity produces an equivalent expression wherever both sides are defined."
          },
          {
            type: "paragraph",
            text: "However, identities involving reciprocals or division may have domain restrictions that must be respected."
          },
          {
            type: "paragraph",
            text: "For example, tan(x) = sin(x)/cos(x) is valid only where cos(x) \u2260 0."
          },
          {
            type: "paragraph",
            text: "When simplifying an equation, do not assume that every intermediate expression has exactly the same domain as the original expression."
          }
        ]
      },
      {
        id: "factoring",
        title: "Factoring and Solution Checking",
        content: [
          {
            type: "paragraph",
            text: "Factoring itself is taught in Lesson 05. Here the only question is whether the resulting candidates satisfy the original equation."
          },
          {
            type: "paragraph",
            text: "After factoring, carry each candidate into the original equation and reject any value that fails. This section therefore focuses on verification rather than reteaching the factoring method."
          }
        ]
      },
      {
        id: "substitution",
        title: "Substitution and Solution Checking",
        content: [
          {
            type: "paragraph",
            text: "The substitution method for quadratic-form equations is taught in Lesson 06. Here, use substitution only to trace candidates back to the original trigonometric equation and verify them."
          },
          {
            type: "paragraph",
            text: "A value can satisfy the transformed algebraic equation yet fail the original equation if a non-equivalent transformation was used."
          }
        ]
      },
      {
        id: "multiple-angle-checking",
        title: "Checking Multiple-Angle Candidates",
        content: [
          {
            type: "paragraph",
            text: "Multiple-angle equation methods belong to Lesson 08. This section applies the same verification principle: substitute each candidate into the original multiple-angle equation rather than relying only on the transformed form."
          }
        ]
      },
      {
        id: "restricted-interval-check",
        title: "Checking Restricted-Interval Solutions",
        content: [
          {
            type: "paragraph",
            text: "Interval filtering belongs to Lesson 09. After that lesson produces the candidates inside the requested interval, use this lesson to verify those candidates in the original equation when transformations may have introduced invalid values."
          }
        ]
      },
      {
        id: "original-equation",
        title: "Check the Original Equation",
        content: [
          {
            type: "paragraph",
            text: "Substitute each candidate back into the original equation rather than checking only a transformed version.",
            id: "original-equation-paragraph-1"
          }
        ]
      }
    ]
  },
  formulas: [
    {
      id: "squaring-condition",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Squaring Both Sides",
      expression: "A = B  \u21D2  A\xB2 = B\xB2, but A\xB2 = B\xB2  \u21CF  A = B",
      explanation: "Squaring can remove sign information and therefore can create extraneous candidates. Always check candidates in the original equation after squaring."
    },
    {
      id: "square-equality",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Difference of Squares Principle",
      expression: "A\xB2 = B\xB2  \u21D2  (A \u2212 B)(A + B) = 0  \u21D2  A = B OR A = \u2212B",
      explanation: "Both possibilities must be considered when removing a square."
    },
    {
      id: "zero-product",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Zero-Product Property",
      expression: "AB = 0  \u21D2  A = 0 OR B = 0",
      explanation: "Factoring and using the zero-product property is often safer than dividing by A or B because it does not automatically discard zero solutions."
    },
    {
      id: "division-condition",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Division Restriction",
      expression: "A/B = C/B  is valid only when B \u2260 0",
      explanation: "Never divide by an expression without considering the possibility that it equals zero."
    },
    {
      id: "tan-definition",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Tangent Definition and Domain",
      expression: "tan(x) = sin(x)/cos(x),  cos(x) \u2260 0",
      explanation: "Tangent is undefined wherever cosine is zero."
    },
    {
      id: "sec-definition",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Secant Definition and Domain",
      expression: "sec(x) = 1/cos(x),  cos(x) \u2260 0",
      explanation: "Secant is undefined wherever cosine is zero."
    },
    {
      id: "csc-definition",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Cosecant Definition and Domain",
      expression: "csc(x) = 1/sin(x),  sin(x) \u2260 0",
      explanation: "Cosecant is undefined wherever sine is zero."
    },
    {
      id: "cot-definition",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Cotangent Definition and Domain",
      expression: "cot(x) = cos(x)/sin(x),  sin(x) \u2260 0",
      explanation: "Cotangent is undefined wherever sine is zero."
    },
    {
      id: "reciprocal-sec",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Secant Reciprocal Identity",
      expression: "sec(x) = 1/cos(x)",
      explanation: "Useful for converting secant equations into cosine equations while preserving the domain restriction cos(x) \u2260 0."
    },
    {
      id: "reciprocal-csc",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Cosecant Reciprocal Identity",
      expression: "csc(x) = 1/sin(x)",
      explanation: "Useful for converting cosecant equations into sine equations while preserving sin(x) \u2260 0."
    },
    {
      id: "reciprocal-cot",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Cotangent Reciprocal Identity",
      expression: "cot(x) = 1/tan(x)",
      explanation: "Useful when converting cotangent equations into tangent equations, provided the relevant domains are respected."
    },
    {
      id: "pythagorean-identity",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Fundamental Pythagorean Identity",
      expression: "sin\xB2(x) + cos\xB2(x) = 1",
      explanation: "Frequently used to transform equations and substitute one squared trigonometric function for another."
    },
    {
      id: "tan-pythagorean",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Tangent Pythagorean Identity",
      expression: "1 + tan\xB2(x) = sec\xB2(x)",
      explanation: "Useful when equations contain tangent and secant."
    },
    {
      id: "cot-pythagorean",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Cotangent Pythagorean Identity",
      expression: "1 + cot\xB2(x) = csc\xB2(x)",
      explanation: "Useful when equations contain cotangent and cosecant."
    },
    {
      id: "sine-range",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Sine Range",
      expression: "\u22121 \u2264 sin(x) \u2264 1",
      explanation: "Any equation sin(x) = a has no real solution if |a| > 1."
    },
    {
      id: "cosine-range",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Cosine Range",
      expression: "\u22121 \u2264 cos(x) \u2264 1",
      explanation: "Any equation cos(x) = a has no real solution if |a| > 1."
    },
    {
      id: "reciprocal-range-sec",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Secant Range",
      expression: "sec(x) \u2264 \u22121 OR sec(x) \u2265 1",
      explanation: "Secant cannot have values strictly between \u22121 and 1."
    },
    {
      id: "reciprocal-range-csc",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Cosecant Range",
      expression: "csc(x) \u2264 \u22121 OR csc(x) \u2265 1",
      explanation: "Cosecant cannot have values strictly between \u22121 and 1."
    },
    {
      id: "division-zero-warning",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Never Divide by a Possible Zero",
      expression: "If f(x) = 0 is possible, dividing by f(x) can remove valid solutions.",
      explanation: "Instead, consider factoring and solving f(x) = 0 as a separate case."
    },
    {
      id: "domain-check",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Domain Check",
      expression: "Valid solution = equation satisfied AND original domain satisfied AND required interval satisfied",
      explanation: "A candidate must pass all three conditions."
    },
    {
      id: "sine-double-angle",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Sine Double-Angle Identity",
      expression: "sin(2x) = 2sin(x)cos(x)",
      explanation: "Useful when converting products into multiple-angle expressions or simplifying equations before solving."
    },
    {
      id: "cosine-double-angle",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Cosine Double-Angle Identities",
      expression: "cos(2x) = cos\xB2(x) \u2212 sin\xB2(x) = 2cos\xB2(x) \u2212 1 = 1 \u2212 2sin\xB2(x)",
      explanation: "Different forms are useful for different equations. Choose the form that matches the expression you need to eliminate or introduce."
    },
    {
      id: "tan-double-angle",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Tangent Double-Angle Identity",
      expression: "tan(2x) = 2tan(x)/(1 \u2212 tan\xB2(x))",
      explanation: "Useful when converting between tan(2x) and tan(x), subject to domain restrictions."
    },
    {
      id: "sine-general",
      name: "[IMPORTANT FOR PROBLEM SOLVING] General Sine Solution",
      expression: "sin(x) = a  \u21D2  x = sin\u207B\xB9(a) + 2n\u03C0 OR x = \u03C0 \u2212 sin\u207B\xB9(a) + 2n\u03C0,  n \u2208 \u2124",
      explanation: "Use to generate complete candidate sets before applying the restricted interval."
    },
    {
      id: "cosine-general",
      name: "[IMPORTANT FOR PROBLEM SOLVING] General Cosine Solution",
      expression: "cos(x) = a  \u21D2  x = \xB1cos\u207B\xB9(a) + 2n\u03C0,  n \u2208 \u2124",
      explanation: "Generate both cosine solution families before restricting the interval."
    },
    {
      id: "tangent-general",
      name: "[IMPORTANT FOR PROBLEM SOLVING] General Tangent Solution",
      expression: "tan(x) = a  \u21D2  x = tan\u207B\xB9(a) + n\u03C0,  n \u2208 \u2124",
      explanation: "Tangent repeats every \u03C0."
    }
  ],
  examples: [
    {
      id: "checking-example",
      question: "Why should a solution obtained after squaring both sides be checked?",
      solution: "Squaring can make two expressions equal even when their original signs were different. For example, \u22122 \u2260 2, but (\u22122)\xB2 = 2\xB2. Therefore, solving the squared equation can produce candidates that do not satisfy the original equation. Every candidate should be substituted into the original equation."
    },
    {
      id: "squaring-extraneous",
      question: "Solve \u221A(sin(x)) = \u22121.",
      solution: "The original equation has no solution because a principal square root is never negative. If both sides are squared, we obtain sin(x) = 1, which would give x = \u03C0/2 + 2n\u03C0. These values solve the squared equation but not the original equation, so they are extraneous."
    },
    {
      id: "division-loses-solutions",
      question: "Solve sin(x)cos(x) = 0 for 0 \u2264 x < 2\u03C0.",
      solution: "Factor using the zero-product property: sin(x) = 0 OR cos(x) = 0. From sin(x) = 0, x = 0, \u03C0. From cos(x) = 0, x = \u03C0/2, 3\u03C0/2. Therefore the solutions are 0, \u03C0/2, \u03C0, and 3\u03C0/2. If we had divided by sin(x), the solutions x = 0 and x = \u03C0 would have been lost."
    },
    {
      id: "domain-extraneous",
      question: "A transformed equation gives x = \u03C0/2 as a candidate for an equation containing sec(x). Is x automatically valid?",
      solution: "No. sec(x) = 1/cos(x), and cos(\u03C0/2) = 0. Therefore sec(\u03C0/2) is undefined. The candidate must be rejected because it is outside the original domain."
    },
    {
      id: "reciprocal-check",
      question: "Solve sec(x) = 2 for 0 \u2264 x < 2\u03C0.",
      solution: "Rewrite sec(x) = 2 as cos(x) = 1/2. This gives x = \u03C0/3 and 5\u03C0/3. Check the original equation: cos(x) is nonzero at both values, and sec(x) = 2 at each. Therefore both are valid."
    },
    {
      id: "substitution-check",
      question: "Solve 2sin\xB2(x) \u2212 3sin(x) + 1 = 0 for 0 \u2264 x < 2\u03C0.",
      solution: "Let u = sin(x). Then 2u\xB2 \u2212 3u + 1 = 0, which factors as (2u \u2212 1)(u \u2212 1) = 0. Therefore u = 1/2 or u = 1. For sin(x) = 1/2, x = \u03C0/6 and 5\u03C0/6. For sin(x) = 1, x = \u03C0/2. All three values satisfy the original equation, so the final solutions are \u03C0/6, \u03C0/2, and 5\u03C0/6."
    },
    {
      id: "range-rejection",
      question: "Can sin(x) = 3/2 have a real solution?",
      solution: "No. Since \u22121 \u2264 sin(x) \u2264 1, sine can never equal 3/2. Therefore there are no real solutions."
    },
    {
      id: "square-both-sides",
      question: "Why can squaring an equation change the solution set?",
      solution: "Suppose A = B. Squaring gives A\xB2 = B\xB2. However, A\xB2 = B\xB2 also allows A = \u2212B. Therefore the squared equation can accept values that do not satisfy the original sign relationship. This is why every candidate must be checked in the original equation."
    },
    {
      id: "multiple-angle-check",
      question: "A candidate x = \u03C0/4 was obtained for sin(2x) = 1. Verify it.",
      solution: "Substitute into the original equation: sin(2\xB7\u03C0/4) = sin(\u03C0/2) = 1. Therefore x = \u03C0/4 satisfies the original equation."
    },
    {
      id: "multiple-angle-invalid",
      question: "A candidate x = \u03C0/2 is obtained for an equation involving tan(2x). Explain why checking is necessary.",
      solution: "Substitute into the original tangent expression: tan(2\xB7\u03C0/2) = tan(\u03C0), which is defined and equals 0. If the original equation required tan(2x) to equal a nonzero value, the candidate would be rejected. The original expression must always be checked."
    },
    {
      id: "restricted-check",
      question: "Suppose x = 2\u03C0 is obtained while solving an equation for 0 \u2264 x < 2\u03C0. Should it be included?",
      solution: "No. Although x = 2\u03C0 may produce the same trigonometric values as x = 0, the interval explicitly excludes 2\u03C0. Therefore x = 2\u03C0 is not an accepted solution."
    },
    {
      id: "identity-domain-check",
      question: "Why must domain restrictions be considered when replacing tan(x) with sin(x)/cos(x)?",
      solution: "The identity tan(x) = sin(x)/cos(x) requires cos(x) \u2260 0. At angles where cos(x) = 0, both the quotient and tangent are undefined. Therefore those values cannot become valid solutions simply because an algebraic transformation produces them."
    }
  ],
  key_ideas: [
    "A candidate solution is not automatically a true solution.",
    "The original equation is the final authority.",
    "Always respect the original domain.",
    "Restricted intervals are part of the conditions for a valid answer.",
    "Squaring can create extraneous solutions because it removes sign information.",
    "Taking a square root requires considering both signs when reversing a square equation.",
    "Dividing by an expression that may equal zero can remove valid solutions.",
    "Clearing denominators can introduce candidates that were undefined in the original equation.",
    "Factoring is often safer than dividing by a variable expression.",
    "Reciprocal trigonometric functions carry important domain restrictions.",
    "Substitution can introduce algebraic candidates that still need to be converted back and checked.",
    "Sine and cosine values must lie between \u22121 and 1.",
    "Multiple-angle candidates should be checked in the complete original expression.",
    "Use the original interval only after generating candidates, unless the solving method naturally incorporates the interval.",
    "Checking is both a way to detect extraneous solutions and a way to catch algebraic mistakes."
  ],
  misconceptions: [
    "Assuming every value obtained through algebra is automatically a solution.",
    "Checking only the transformed equation instead of the original equation.",
    "Believing that squaring two sides always produces an equivalent equation.",
    "Forgetting that A\xB2 = B\xB2 gives A = B or A = \u2212B.",
    "Dividing by sin(x), cos(x), tan(x), or another expression without considering when it can be zero.",
    "Assuming multiplying by a denominator is always reversible.",
    "Ignoring the original domain after replacing reciprocal functions.",
    "Thinking that an identity automatically removes every domain restriction.",
    "Forgetting that tan(x), sec(x), and cot(x) are undefined at certain angles.",
    "Accepting a value outside the restricted interval.",
    "Forgetting that sine and cosine cannot be greater than 1 in magnitude.",
    "Checking a multiple-angle candidate using only the intermediate angle.",
    "Losing valid solutions by dividing instead of factoring.",
    "Assuming that every transformed equation has exactly the same domain as the original equation.",
    "Not checking answers because the algebra appears correct."
  ],
  explorations: [
    {
      id: "checking-solutions",
      type: "visualization"
    },
    {
      id: "squaring-extraneous-solutions",
      type: "visualization"
    },
    {
      id: "domain-restrictions",
      type: "visualization"
    },
    {
      id: "division-loses-solutions",
      type: "visualization"
    },
    {
      id: "original-vs-transformed-equation",
      type: "visualization"
    },
    {
      id: "candidate-solution-checker",
      type: "visualization"
    },
    {
      id: "why-squaring-creates-candidates",
      type: "why"
    },
    {
      id: "why-domain-matters",
      type: "why"
    }
  ],
  sources: [
    "openstax-precalculus-trigonometric-equations"
  ]
};

// ../content/concepts/trigonometricFunctions/trig-equations-11-generalSolution.json
var trig_equations_11_generalSolution_default = {
  id: "trig-equations-11",
  title: "Writing the General Solution",
  subject: "mathematics",
  topic: "trigonometry",
  section: "trigonometric-equations",
  difficulty: 4,
  connections: {
    prerequisites: [
      "trig-equations-02",
      "trig-equations-03",
      "trig-equations-09",
      "trig-equations-10"
    ],
    leads_to: [
      "inverse-trigonometric-functions",
      "trigonometric-inequalities",
      "trigonometric-modeling"
    ],
    related: [
      "periodic-functions",
      "trigonometric-functions",
      "unit-circle",
      "trigonometric-identities",
      "multiple-angle-identities"
    ]
  },
  theory: {
    introduction: "When no interval is specified, a trigonometric equation usually requires a general solution: a mathematical expression that represents every angle satisfying the equation. Because trigonometric functions are periodic, a single equation can have infinitely many solutions. The general solution captures this repeating pattern using an integer parameter such as n \u2208 \u2124. Writing a correct general solution requires understanding the function's period, all solution branches within one period, the effect of multiple angles such as 2x or 3x, and any domain restrictions.",
    sections: [
      {
        id: "what-is-general-solution",
        title: "What Is a General Solution?",
        content: [
          {
            type: "paragraph",
            text: "A general solution is an expression that represents every value of the variable satisfying a trigonometric equation."
          },
          {
            type: "paragraph",
            text: "For example, tan(x) = 1 has infinitely many solutions because tangent repeats every \u03C0 radians. Instead of listing \u03C0/4, 5\u03C0/4, 9\u03C0/4, and so on, we write x = \u03C0/4 + n\u03C0, n \u2208 \u2124."
          },
          {
            type: "paragraph",
            text: "The integer n generates all repeated solutions. Positive, negative, and zero integer values of n allow the formula to represent solutions in both directions along the number line."
          }
        ]
      },
      {
        id: "integer-parameter",
        title: "Using an Integer Parameter",
        content: [
          {
            type: "paragraph",
            text: "The symbol n is usually used to represent any integer, allowing the formula to generate infinitely many solutions.",
            id: "integer-parameter-paragraph-1"
          }
        ]
      },
      {
        id: "period-determines-solution",
        title: "The Period Determines the General Solution",
        content: [
          {
            type: "paragraph",
            text: "The general solution depends on the period of the trigonometric function involved.",
            id: "different-periods-paragraph-1"
          }
        ]
      }
    ]
  },
  formulas: [
    {
      id: "sine-general",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Sine General Solution",
      expression: "sin(x) = a  \u21D2  x = (\u22121)\u207F sin\u207B\xB9(a) + n\u03C0, n \u2208 \u2124",
      explanation: "Compact formula representing every real solution of sin(x) = a."
    },
    {
      id: "sine-general-two-branch",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Sine Two-Branch General Solution",
      expression: "sin(x) = sin(\u03B8)  \u21D2  x = \u03B8 + 2n\u03C0  OR  x = \u03C0 \u2212 \u03B8 + 2n\u03C0, n \u2208 \u2124",
      explanation: "The two branches arise because sine has the same value at \u03B8 and \u03C0 \u2212 \u03B8 in one 2\u03C0 cycle."
    },
    {
      id: "cosine-general",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Cosine General Solution",
      expression: "cos(x) = a  \u21D2  x = \xB1cos\u207B\xB9(a) + 2n\u03C0, n \u2208 \u2124",
      explanation: "Represents every real solution of a cosine equation."
    },
    {
      id: "cosine-general-two-branch",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Cosine Two-Branch General Solution",
      expression: "cos(x) = cos(\u03B8)  \u21D2  x = 2n\u03C0 \xB1 \u03B8, n \u2208 \u2124",
      explanation: "Equivalent form that directly uses cosine's symmetry."
    },
    {
      id: "tangent-general",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Tangent General Solution",
      expression: "tan(x) = a  \u21D2  x = tan\u207B\xB9(a) + n\u03C0, n \u2208 \u2124",
      explanation: "Uses tangent's \u03C0-periodicity."
    },
    {
      id: "tangent-equal",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Equal Tangent General Solution",
      expression: "tan(x) = tan(\u03B8)  \u21D2  x = \u03B8 + n\u03C0, n \u2208 \u2124",
      explanation: "Any two tangent angles with the same value differ by an integer multiple of \u03C0."
    },
    {
      id: "sine-zero",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Sine Equals Zero",
      expression: "sin(x) = 0  \u21D2  x = n\u03C0, n \u2208 \u2124",
      explanation: "Sine is zero at every integer multiple of \u03C0."
    },
    {
      id: "cosine-zero",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Cosine Equals Zero",
      expression: "cos(x) = 0  \u21D2  x = \u03C0/2 + n\u03C0, n \u2208 \u2124",
      explanation: "Cosine is zero at every odd multiple of \u03C0/2."
    },
    {
      id: "tangent-zero",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Tangent Equals Zero",
      expression: "tan(x) = 0  \u21D2  x = n\u03C0, n \u2208 \u2124",
      explanation: "Tangent is zero whenever sine is zero and cosine is nonzero."
    },
    {
      id: "sec-general",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Secant General Solution",
      expression: "sec(x) = a  \u21D2  cos(x) = 1/a  \u21D2  x = \xB1cos\u207B\xB9(1/a) + 2n\u03C0, n \u2208 \u2124",
      explanation: "Valid for a \u2260 0 and |a| \u2265 1. Domain restrictions must also be satisfied."
    },
    {
      id: "csc-general",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Cosecant General Solution",
      expression: "csc(x) = a  \u21D2  sin(x) = 1/a  \u21D2  x = (\u22121)\u207F sin\u207B\xB9(1/a) + n\u03C0, n \u2208 \u2124",
      explanation: "Valid for a \u2260 0 and |a| \u2265 1, with the original cosecant domain respected."
    },
    {
      id: "cot-general",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Cotangent General Solution",
      expression: "cot(x) = a  \u21D2  tan(x) = 1/a  \u21D2  x = tan\u207B\xB9(1/a) + n\u03C0, n \u2208 \u2124",
      explanation: "Valid for a \u2260 0. Cotangent has period \u03C0."
    },
    {
      id: "sec-domain",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Secant Domain",
      expression: "sec(x) is defined only when cos(x) \u2260 0",
      explanation: "Secant is undefined at x = \u03C0/2 + n\u03C0."
    },
    {
      id: "csc-domain",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Cosecant Domain",
      expression: "csc(x) is defined only when sin(x) \u2260 0",
      explanation: "Cosecant is undefined at x = n\u03C0."
    },
    {
      id: "cot-domain",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Cotangent Domain",
      expression: "cot(x) is defined only when sin(x) \u2260 0",
      explanation: "Cotangent is undefined wherever sine is zero."
    },
    {
      id: "sec-zero",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Secant Cannot Equal Zero",
      expression: "sec(x) = 0  \u21D2  no real solution",
      explanation: "Secant is the reciprocal of cosine, so it can never equal zero."
    },
    {
      id: "csc-zero",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Cosecant Cannot Equal Zero",
      expression: "csc(x) = 0  \u21D2  no real solution",
      explanation: "Cosecant is the reciprocal of sine, so it can never equal zero."
    },
    {
      id: "sine-period",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Sine Period",
      expression: "sin(x + 2\u03C0) = sin(x)",
      explanation: "Sine repeats every 2\u03C0 radians."
    },
    {
      id: "cosine-period",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Cosine Period",
      expression: "cos(x + 2\u03C0) = cos(x)",
      explanation: "Cosine repeats every 2\u03C0 radians."
    },
    {
      id: "tangent-period",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Tangent Period",
      expression: "tan(x + \u03C0) = tan(x)",
      explanation: "Tangent repeats every \u03C0 radians."
    },
    {
      id: "cotangent-period",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Cotangent Period",
      expression: "cot(x + \u03C0) = cot(x)",
      explanation: "Cotangent repeats every \u03C0 radians."
    },
    {
      id: "secant-period",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Secant Period",
      expression: "sec(x + 2\u03C0) = sec(x)",
      explanation: "Secant has the same fundamental period as cosine."
    },
    {
      id: "cosecant-period",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Cosecant Period",
      expression: "csc(x + 2\u03C0) = csc(x)",
      explanation: "Cosecant has the same fundamental period as sine."
    },
    {
      id: "multiple-angle-sine",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Period of sin(kx)",
      expression: "Period of sin(kx) = 2\u03C0/|k|",
      explanation: "Multiplying the input by k compresses the graph horizontally and reduces the period."
    },
    {
      id: "multiple-angle-cosine",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Period of cos(kx)",
      expression: "Period of cos(kx) = 2\u03C0/|k|",
      explanation: "Useful for understanding the number of repetitions and solutions in an interval."
    },
    {
      id: "multiple-angle-tangent",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Period of tan(kx)",
      expression: "Period of tan(kx) = \u03C0/|k|",
      explanation: "The tangent period becomes smaller when the input is multiplied by k."
    },
    {
      id: "multiple-angle-sine-equation",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Solving sin(kx) = a",
      expression: "sin(kx) = a  \u21D2  kx = (\u22121)\u207F sin\u207B\xB9(a) + n\u03C0  \u21D2  x = [(\u22121)\u207F sin\u207B\xB9(a) + n\u03C0]/k, n \u2208 \u2124",
      explanation: "Solve the complete equation for the multiple angle kx before dividing by k."
    },
    {
      id: "multiple-angle-cosine-equation",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Solving cos(kx) = a",
      expression: "cos(kx) = a  \u21D2  kx = \xB1cos\u207B\xB9(a) + 2n\u03C0  \u21D2  x = [\xB1cos\u207B\xB9(a) + 2n\u03C0]/k, n \u2208 \u2124",
      explanation: "Generate both cosine branches before isolating x."
    },
    {
      id: "multiple-angle-tangent-equation",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Solving tan(kx) = a",
      expression: "tan(kx) = a  \u21D2  kx = tan\u207B\xB9(a) + n\u03C0  \u21D2  x = [tan\u207B\xB9(a) + n\u03C0]/k, n \u2208 \u2124",
      explanation: "Tangent contributes its \u03C0-periodicity before the division by k."
    },
    {
      id: "degree-radian",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Degree-Radian Conversion",
      expression: "180\xB0 = \u03C0 radians",
      explanation: "The fundamental conversion relationship between degrees and radians."
    },
    {
      id: "degree-to-radian",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Degrees to Radians",
      expression: "\u03B8 radians = \u03B8\xB0 \xD7 \u03C0/180",
      explanation: "Multiply a degree measure by \u03C0/180 to convert it to radians."
    },
    {
      id: "radian-to-degree",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Radians to Degrees",
      expression: "\u03B8\xB0 = \u03B8 radians \xD7 180/\u03C0",
      explanation: "Multiply a radian measure by 180/\u03C0 to convert it to degrees."
    },
    {
      id: "sine-period-degrees",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Sine and Cosine Period in Degrees",
      expression: "Period = 360\xB0",
      explanation: "Sine and cosine repeat every 360 degrees."
    },
    {
      id: "tangent-period-degrees",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Tangent Period in Degrees",
      expression: "Period = 180\xB0",
      explanation: "Tangent and cotangent repeat every 180 degrees."
    },
    {
      id: "sine-range",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Sine Range",
      expression: "\u22121 \u2264 sin(x) \u2264 1",
      explanation: "Therefore sin(x) = a has real solutions only when \u22121 \u2264 a \u2264 1."
    },
    {
      id: "cosine-range",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Cosine Range",
      expression: "\u22121 \u2264 cos(x) \u2264 1",
      explanation: "Therefore cos(x) = a has real solutions only when \u22121 \u2264 a \u2264 1."
    },
    {
      id: "tangent-range",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Tangent Range",
      expression: "tan(x) \u2208 \u211D",
      explanation: "Tangent can take every real value, although it is undefined at x = \u03C0/2 + n\u03C0."
    },
    {
      id: "reciprocal-identities",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Reciprocal Identities",
      expression: "sec(x) = 1/cos(x),  csc(x) = 1/sin(x),  cot(x) = 1/tan(x)",
      explanation: "Useful for converting reciprocal-function equations into sine, cosine, or tangent equations."
    },
    {
      id: "general-solution-period-rule",
      name: "[IMPORTANT FOR PROBLEM SOLVING] General Periodic Solution Rule",
      expression: "If f(x) = f(x + T), then x = \u03B8 + nT, n \u2208 \u2124, whenever \u03B8 is a solution and T is the relevant period",
      explanation: "This is the underlying principle behind general solutions of periodic equations."
    },
    {
      id: "solution-verification",
      name: "[IMPORTANT FOR PROBLEM SOLVING] Verify Solutions in the Original Equation",
      expression: "Candidate solution  \u2192  substitute into the original equation  \u2192  accept only if the original equation is satisfied",
      explanation: "Essential when transformations may introduce extraneous solutions or violate domain restrictions."
    }
  ],
  examples: [
    {
      id: "general-sine-example",
      question: "Find the general solution of sin(x) = 1/2.",
      solution: "The reference angle is \u03C0/6 because sin(\u03C0/6) = 1/2. Sine is positive in Quadrants I and II. Therefore x = \u03C0/6 + 2n\u03C0 or x = 5\u03C0/6 + 2n\u03C0, where n \u2208 \u2124."
    },
    {
      id: "general-cosine-example",
      question: "Find the general solution of cos(x) = \u22121/2.",
      solution: "The reference angle is \u03C0/3. Cosine is negative in Quadrants II and III. Therefore x = 2\u03C0/3 + 2n\u03C0 or x = 4\u03C0/3 + 2n\u03C0, where n \u2208 \u2124. Equivalently, x = \xB12\u03C0/3 + 2n\u03C0."
    },
    {
      id: "general-tangent-example",
      question: "Find the general solution of tan(x) = \u221A3.",
      solution: "The reference angle is \u03C0/3 because tan(\u03C0/3) = \u221A3. Tangent has period \u03C0, so x = \u03C0/3 + n\u03C0, where n \u2208 \u2124."
    },
    {
      id: "sine-zero-example",
      question: "Find the general solution of sin(x) = 0.",
      solution: "Sine is zero at 0, \u03C0, 2\u03C0, and every integer multiple of \u03C0. Therefore x = n\u03C0, where n \u2208 \u2124."
    },
    {
      id: "cosine-zero-example",
      question: "Find the general solution of cos(x) = 0.",
      solution: "Cosine is zero at \u03C0/2 and 3\u03C0/2 in one revolution. Since the solutions are separated by \u03C0, the general solution is x = \u03C0/2 + n\u03C0, where n \u2208 \u2124."
    },
    {
      id: "sec-general-example",
      question: "Find the general solution of sec(x) = 2.",
      solution: "Rewrite the equation as cos(x) = 1/2. Therefore x = \xB1\u03C0/3 + 2n\u03C0, where n \u2208 \u2124. Equivalently, x = \u03C0/3 + 2n\u03C0 or x = 5\u03C0/3 + 2n\u03C0."
    },
    {
      id: "csc-general-example",
      question: "Find the general solution of csc(x) = \u22122.",
      solution: "Rewrite as sin(x) = \u22121/2. The solutions are x = 7\u03C0/6 + 2n\u03C0 or x = 11\u03C0/6 + 2n\u03C0, where n \u2208 \u2124."
    },
    {
      id: "cot-general-example",
      question: "Find the general solution of cot(x) = 1.",
      solution: "Since cot(x) = 1 means tan(x) = 1, the reference angle is \u03C0/4. Tangent has period \u03C0, so x = \u03C0/4 + n\u03C0, where n \u2208 \u2124."
    },
    {
      id: "multiple-sine-example",
      question: "Find the general solution of sin(2x) = 1/2.",
      solution: "Let y = 2x. Then sin(y) = 1/2, so y = \u03C0/6 + 2n\u03C0 or y = 5\u03C0/6 + 2n\u03C0. Since y = 2x, divide by 2: x = \u03C0/12 + n\u03C0 or x = 5\u03C0/12 + n\u03C0, where n \u2208 \u2124."
    },
    {
      id: "multiple-cosine-example",
      question: "Find the general solution of cos(3x) = 0.",
      solution: "For cos(y) = 0, y = \u03C0/2 + n\u03C0. Let y = 3x. Then 3x = \u03C0/2 + n\u03C0, so x = \u03C0/6 + n\u03C0/3, where n \u2208 \u2124."
    },
    {
      id: "multiple-tangent-example",
      question: "Find the general solution of tan(2x) = 1.",
      solution: "For tan(y) = 1, y = \u03C0/4 + n\u03C0. Set y = 2x. Then 2x = \u03C0/4 + n\u03C0, giving x = \u03C0/8 + n\u03C0/2, where n \u2208 \u2124."
    },
    {
      id: "composite-angle-example",
      question: "Find the general solution of sin(2x \u2212 \u03C0/3) = 0.",
      solution: "Let y = 2x \u2212 \u03C0/3. Since sin(y) = 0, y = n\u03C0. Therefore 2x \u2212 \u03C0/3 = n\u03C0. Solving for x gives x = \u03C0/6 + n\u03C0/2, where n \u2208 \u2124."
    },
    {
      id: "identity-general-example",
      question: "Find the general solution of 2sin\xB2(x) \u2212 1 = 0.",
      solution: "Rearrange: 2sin\xB2(x) = 1, so sin\xB2(x) = 1/2. Therefore sin(x) = \xB11/\u221A2. The corresponding angles are x = \u03C0/4, 3\u03C0/4, 5\u03C0/4, and 7\u03C0/4 in one 2\u03C0 cycle. A compact general solution is x = \u03C0/4 + n\u03C0/2, where n \u2208 \u2124."
    },
    {
      id: "degree-general-example",
      question: "Find the general solution of sin(x) = \u221A3/2 in degrees.",
      solution: "The reference angle is 60\xB0. Sine is positive in Quadrants I and II, so x = 60\xB0 + 360\xB0n or x = 120\xB0 + 360\xB0n, where n \u2208 \u2124."
    },
    {
      id: "period-example",
      question: "Explain why tan(x) = 2 has infinitely many solutions.",
      solution: "Tangent has period \u03C0. If \u03B8 = tan\u207B\xB9(2) is one solution, then \u03B8 + n\u03C0 is also a solution for every integer n. Therefore the general solution is x = tan\u207B\xB9(2) + n\u03C0, n \u2208 \u2124."
    },
    {
      id: "negative-n-example",
      question: "For x = \u03C0/4 + n\u03C0, what happens when n = \u22121?",
      solution: "Substituting n = \u22121 gives x = \u03C0/4 \u2212 \u03C0 = \u22123\u03C0/4. This is a valid solution because the general solution includes negative angles as well as positive angles."
    },
    {
      id: "no-solution-example",
      question: "Find the general solution of 2sin(x) = 3.",
      solution: "Rearrange to sin(x) = 3/2. Since the range of sine is [\u22121, 1], sine cannot equal 3/2. Therefore there is no real solution."
    },
    {
      id: "sec-no-solution-example",
      question: "Find the general solution of sec(x) = 1/2.",
      solution: "Rewrite as cos(x) = 2. Since cosine can only take values from \u22121 to 1, cos(x) = 2 is impossible. Therefore there is no real solution."
    }
  ],
  key_ideas: [
    "A general solution represents every solution, not just the solutions in one revolution.",
    "n represents any integer, so always state n \u2208 \u2124.",
    "The period determines how solutions repeat.",
    "Sine and cosine normally use 2n\u03C0 in their general solutions.",
    "Tangent and cotangent normally use n\u03C0 because their period is \u03C0.",
    "Sine equations generally have two solution branches in one 2\u03C0 cycle.",
    "Cosine equations can be expressed using \xB1\u03B8 or two explicit branches.",
    "Tangent equations require only one branch plus integer multiples of \u03C0.",
    "Secant, cosecant, and cotangent equations can usually be converted to cosine, sine, and tangent equations.",
    "Reciprocal-function domain restrictions must be checked.",
    "Secant and cosecant can never equal zero.",
    "For multiple-angle equations, solve for the complete multiple angle before isolating x.",
    "Multiplying the angle by k changes the period and can increase the number of solutions in a fixed interval.",
    "For composite angles such as ax + b, solve for the complete angle expression first.",
    "When identities or algebraic transformations are used, the final solution must still satisfy the original equation.",
    "General solutions may be written in degrees or radians, but the units must remain consistent.",
    "Restricted solutions and general solutions are different types of answers.",
    "The integer parameter allows the solution pattern to extend infinitely in both directions.",
    "A correct general solution must contain every valid branch and must not include invalid values."
  ],
  misconceptions: [
    "Forgetting to include n \u2208 \u2124.",
    "Giving only the solutions from 0 to 2\u03C0 when a general solution is required.",
    "Using 2\u03C0 as the period for tangent.",
    "Using \u03C0 as the period for sine or cosine.",
    "Finding only one solution branch for sine or cosine.",
    "Dividing by the multiple-angle coefficient before generating all solutions.",
    "Forgetting that a composite angle such as 3x \u2212 \u03C0/4 must be treated as the complete angle first.",
    "Mixing degrees and radians in the same solution.",
    "Assuming every reciprocal-function equation has a solution.",
    "Forgetting that sec(x) and csc(x) cannot equal zero.",
    "Ignoring the domain of secant, cosecant, or cotangent.",
    "Assuming that n must be positive.",
    "Assuming negative values of n are invalid.",
    "Writing a formula that generates only some of the solutions.",
    "Accepting solutions introduced by an algebraic transformation without checking the original equation.",
    "Using an inverse-trigonometric calculator result as the complete answer.",
    "Forgetting that inverse trigonometric functions return principal values, not all possible solutions.",
    "Assuming that the same general-solution formula works unchanged for every trigonometric function.",
    "Forgetting that the period of sin(kx), cos(kx), and tan(kx) changes when the angle is multiplied by k.",
    "Failing to check whether the equation has any real solution based on the range of the function."
  ],
  explorations: [
    {
      id: "general-solution-patterns",
      type: "visualization"
    },
    {
      id: "integer-n-slider",
      type: "visualization"
    },
    {
      id: "sine-general-solution-graph",
      type: "visualization"
    },
    {
      id: "cosine-general-solution-graph",
      type: "visualization"
    },
    {
      id: "tangent-general-solution-graph",
      type: "visualization"
    },
    {
      id: "multiple-angle-solution-count",
      type: "visualization"
    },
    {
      id: "period-and-solution-spacing",
      type: "visualization"
    },
    {
      id: "general-vs-restricted-solutions",
      type: "visualization"
    },
    {
      id: "why-integer-n-creates-infinite-solutions",
      type: "why"
    },
    {
      id: "why-tangent-uses-pi",
      type: "why"
    }
  ],
  sources: [
    "libretexts-basic-trigonometric-equations",
    "openstax-precalculus-trigonometric-equations"
  ]
};

// ../content/concepts/applicationOfTrigo/application-trigo.json
var application_trigo_default = {
  id: "applications-of-trigonometry",
  title: "Applications of Trigonometry",
  subject: "mathematics",
  topic: "trigonometry",
  section: "intro-trigono",
  difficulty: 1,
  connections: {
    prerequisites: [],
    leads_to: [
      "trigonometric-ratios",
      "trigonometric-functions",
      "unit-circle",
      "law-of-sines",
      "law-of-cosines",
      "vectors",
      "periodic-functions"
    ],
    related: [
      "geometry",
      "coordinate-geometry",
      "physics",
      "engineering",
      "astronomy",
      "navigation",
      "computer-graphics",
      "waves"
    ]
  },
  theory: {
    introduction: "Trigonometry is much more than a collection of triangle formulas. It is a mathematical language for understanding relationships between angles, distances, directions, rotations, and repeating patterns. The surprising part is that the same ideas that begin with simple triangles can eventually help us understand how tall a mountain is, how a spacecraft can be located, how a robot moves its arm, how a building is designed, how a computer creates a rotating object, and how waves such as sound and light can be modeled. Applications of Trigonometry introduces these possibilities without requiring the student to solve the problems yet. Its purpose is to build curiosity: to make the student wonder how information about an angle can possibly tell us something about a distance, how triangles can help measure things we cannot reach, and why sine and cosine appear in subjects far beyond geometry.",
    sections: [
      {
        id: "trigonometry-as-a-tool",
        title: "Trigonometry as a Tool for Seeing the Invisible",
        content: [
          {
            type: "paragraph",
            text: "Imagine standing far away from a tall building. You cannot climb it, and you do not have a measuring tape long enough to reach its top. Yet, by observing an angle and knowing a distance that is easier to measure, mathematics can help determine the building's height. This is one of the central ideas behind applied trigonometry: information that seems unrelated to an unknown quantity can be connected through geometry.",
            id: "trigonometry-as-a-tool-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Trigonometry is especially powerful when something is difficult, dangerous, inaccessible, or impossible to measure directly. Instead of physically measuring the unknown, we measure other quantities and use mathematical relationships to infer it.",
            id: "trigonometry-as-a-tool-paragraph-2"
          },
          {
            type: "paragraph",
            text: "This idea of indirect measurement is one of the reasons trigonometry became such an important mathematical tool. A distance on the ground, an angle of sight, or a direction can contain enough information to reveal something that cannot be directly observed.",
            id: "trigonometry-as-a-tool-paragraph-3"
          }
        ]
      },
      {
        id: "measuring-heights-and-distances",
        title: "Measuring What We Cannot Reach",
        content: [
          {
            type: "paragraph",
            text: "One of the most intuitive applications of trigonometry is measuring heights and distances indirectly. Towers, trees, cliffs, mountains, and other large objects can be studied using angles and distances without physically reaching their highest points.",
            id: "measuring-heights-and-distances-paragraph-1"
          },
          {
            type: "paragraph",
            text: "The basic idea is surprisingly simple: if we know how far we are from an object and know the direction in which we are looking, the angle between the horizontal direction and our line of sight provides information about the object's height.",
            id: "measuring-heights-and-distances-paragraph-2"
          },
          {
            type: "paragraph",
            text: "This leads to a fascinating question for a learner: how can an angle, which seems to contain no information about length by itself, help us determine a physical distance? The answer lies in the consistent relationships between the sides and angles of triangles.",
            id: "measuring-heights-and-distances-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Students do not need to calculate these heights at this stage. The purpose is simply to recognize that trigonometry can turn angular observations into information about physical distances.",
            id: "measuring-heights-and-distances-paragraph-4"
          }
        ]
      },
      {
        id: "surveying",
        title: "Surveying the World",
        content: [
          {
            type: "paragraph",
            text: "Surveyors need to determine positions, distances, elevations, and boundaries across land. Many of the points they care about cannot be measured directly from a single location.",
            id: "surveying-paragraph-1"
          },
          {
            type: "paragraph",
            text: "By measuring carefully chosen angles and distances and connecting them through geometric relationships, surveyors can construct a network of triangles. This idea, known as triangulation, allows locations to be determined indirectly.",
            id: "surveying-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The important idea for a beginner is that a small number of carefully chosen measurements can reveal much more information than we might expect. Trigonometry provides the relationships that connect those measurements.",
            id: "surveying-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Modern surveying uses sophisticated instruments and technologies, but the geometric idea behind many measurements remains closely connected to triangles, angles, and distances.",
            id: "surveying-paragraph-4"
          }
        ]
      },
      {
        id: "navigation",
        title: "Finding Your Way",
        content: [
          {
            type: "paragraph",
            text: "Navigation is fundamentally about position and direction. If an aircraft, ship, vehicle, or robot moves in a particular direction for a particular distance, we may want to know where it ends up relative to its starting point.",
            id: "navigation-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Angles provide a natural way to describe direction. When directions and distances are combined, geometric shapes such as triangles appear, and trigonometric relationships can connect the different pieces of information.",
            id: "navigation-paragraph-2"
          },
          {
            type: "paragraph",
            text: "This idea appears in marine navigation, aviation, mapping, robotics, and positioning systems. Even when the technology becomes extremely advanced, the underlying question remains geometric: if we know some directions and distances, what can we determine about position?",
            id: "navigation-paragraph-3"
          },
          {
            type: "paragraph",
            text: "This application gives students an early glimpse of how trigonometry connects mathematics to movement and the physical world.",
            id: "navigation-paragraph-4"
          }
        ]
      },
      {
        id: "architecture-and-construction",
        title: "Designing Buildings and Structures",
        content: [
          {
            type: "paragraph",
            text: "Buildings and structures contain countless angles, slopes, lengths, and directions. Roofs, ramps, bridges, staircases, supports, cables, and structural components can all involve geometric relationships that are naturally described using trigonometry.",
            id: "architecture-and-construction-paragraph-1"
          },
          {
            type: "paragraph",
            text: "An angle can describe the inclination of a roof or ramp. A length can describe a support or beam. Relationships between these quantities allow designers and engineers to determine dimensions that satisfy geometric requirements.",
            id: "architecture-and-construction-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Trigonometry therefore helps turn a design drawn on paper into a structure that can actually be built.",
            id: "architecture-and-construction-paragraph-3"
          },
          {
            type: "paragraph",
            text: "For a student, the interesting realization is that a formula learned in mathematics class can eventually become part of the process used to design things that exist in the physical world.",
            id: "architecture-and-construction-paragraph-4"
          }
        ]
      },
      {
        id: "engineering",
        title: "Understanding Forces and Motion",
        content: [
          {
            type: "paragraph",
            text: "Many quantities in physics and engineering have both a size and a direction. A force can push an object upward and sideways at the same time. A moving object can travel in a direction that is neither purely horizontal nor purely vertical.",
            id: "engineering-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Trigonometry provides a way to separate an angled quantity into simpler perpendicular parts. This allows a complicated direction to be represented using horizontal and vertical components.",
            id: "engineering-paragraph-2"
          },
          {
            type: "paragraph",
            text: "This idea is important in mechanics, structural engineering, robotics, aircraft design, and many other areas where direction matters.",
            id: "engineering-paragraph-3"
          },
          {
            type: "paragraph",
            text: "What begins as a relationship between sides of a triangle eventually becomes a tool for understanding how physical systems move and interact.",
            id: "engineering-paragraph-4"
          }
        ]
      },
      {
        id: "astronomy",
        title: "Studying Objects in Space",
        content: [
          {
            type: "paragraph",
            text: "Astronomy presents an extreme version of the indirect-measurement problem. We cannot simply travel to a distant star and measure its distance with a tape measure. Astronomers instead collect observations and use mathematical models to infer properties of objects that are extremely far away.",
            id: "astronomy-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Angular measurements and geometric relationships can be used to determine information about positions and distances. Techniques based on parallax and triangulation are examples of how observations from different locations can reveal information about objects that cannot be directly reached.",
            id: "astronomy-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The scale changes dramatically, but the mathematical idea is familiar: observe angles, understand the geometry, and use relationships between angles and distances to discover something that cannot be measured directly.",
            id: "astronomy-paragraph-3"
          },
          {
            type: "paragraph",
            text: "This is one of the most powerful ways to appreciate the reach of mathematics: the geometry of a triangle can help us reason about objects far beyond Earth.",
            id: "astronomy-paragraph-4"
          }
        ]
      },
      {
        id: "robotics",
        title: "Helping Robots Move",
        content: [
          {
            type: "paragraph",
            text: "A robot arm may need to move its hand to a particular position. To do this, the robot must understand the lengths of its parts and the angles at its joints.",
            id: "robotics-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Each segment of a robot arm can be represented geometrically, and the position of the end of the arm depends on the angles between its segments. Trigonometric relationships can therefore connect joint angles to the position of the robot's hand.",
            id: "robotics-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Similar ideas appear in robotic movement, industrial machines, drones, automated systems, and mechanical linkages.",
            id: "robotics-paragraph-3"
          },
          {
            type: "paragraph",
            text: "The surprising connection is that changing an angle can change a position. Trigonometry gives mathematics a way to describe exactly how that change happens.",
            id: "robotics-paragraph-4"
          }
        ]
      },
      {
        id: "computer-graphics",
        title: "Creating Movement in Computer Graphics",
        content: [
          {
            type: "paragraph",
            text: "Computers frequently need to calculate where an object should appear after it rotates. If a point moves around a circle, its horizontal and vertical positions change in a predictable way as the angle changes.",
            id: "computer-graphics-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Sine and cosine provide mathematical relationships that describe these changing coordinates. This makes them useful in animation, games, simulations, graphical interfaces, camera movement, and three-dimensional graphics.",
            id: "computer-graphics-paragraph-2"
          },
          {
            type: "paragraph",
            text: "A student may first encounter sine and cosine as ratios in a triangle, but these same functions can later control movement on a computer screen.",
            id: "computer-graphics-paragraph-3"
          },
          {
            type: "paragraph",
            text: "This is an important conceptual transition: trigonometry is not restricted to static triangles. It can also describe continuous movement and rotation.",
            id: "computer-graphics-paragraph-4"
          }
        ]
      },
      {
        id: "waves",
        title: "Understanding Waves and Repetition",
        content: [
          {
            type: "paragraph",
            text: "Many things in nature repeat. Vibrations, sound, alternating electrical signals, tides, and idealized models of many physical waves exhibit patterns that repeat over time or distance.",
            id: "waves-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Sine and cosine functions are especially useful for representing repeating behavior because their values rise and fall in a regular cycle.",
            id: "waves-paragraph-2"
          },
          {
            type: "paragraph",
            text: "This creates a remarkable connection between triangles and waves. A function that begins as a ratio associated with an angle can eventually become a mathematical description of something changing continuously through time.",
            id: "waves-paragraph-3"
          },
          {
            type: "paragraph",
            text: "Understanding this connection later becomes important in physics, signal processing, sound, electronics, and many areas of engineering.",
            id: "waves-paragraph-4"
          }
        ]
      },
      {
        id: "technology",
        title: "Trigonometry Behind Modern Technology",
        content: [
          {
            type: "paragraph",
            text: "Trigonometry is part of the mathematical foundation behind many technologies that students encounter every day. Positioning, computer graphics, robotics, simulations, engineering software, signal processing, and navigation all make use of relationships involving angles, directions, distances, or periodic behavior.",
            id: "technology-paragraph-1"
          },
          {
            type: "paragraph",
            text: "The technology itself may involve advanced mathematics, algorithms, sensors, matrices, vectors, and numerical computation. Nevertheless, many of those systems build upon simpler geometric ideas that can be introduced through elementary trigonometry.",
            id: "technology-paragraph-2"
          },
          {
            type: "paragraph",
            text: "The goal at this stage is not to understand every technical detail. It is to recognize that trigonometry is a gateway to many fields rather than an isolated chapter of school mathematics.",
            id: "technology-paragraph-3"
          }
        ]
      },
      {
        id: "from-triangles-to-functions",
        title: "From Triangles to Something Much Bigger",
        content: [
          {
            type: "paragraph",
            text: "The most important curiosity to develop is that trigonometry eventually grows beyond the triangle. At first, sine, cosine, and tangent can be introduced as relationships between the sides of a right triangle.",
            id: "from-triangles-to-functions-paragraph-1"
          },
          {
            type: "paragraph",
            text: "Later, these ideas can be understood through the unit circle and expressed as functions whose inputs are angles and whose outputs change continuously.",
            id: "from-triangles-to-functions-paragraph-2"
          },
          {
            type: "paragraph",
            text: "Once trigonometric functions are understood, they can describe rotation, periodic motion, waves, oscillations, and many other phenomena.",
            id: "from-triangles-to-functions-paragraph-3"
          },
          {
            type: "paragraph",
            text: "This is why applications of trigonometry belongs near the beginning of the learning journey. The student does not need to know the machinery yet. They only need to see what that machinery will eventually allow them to explore.",
            id: "from-triangles-to-functions-paragraph-4"
          }
        ]
      },
      {
        id: "curiosity-questions",
        title: "Questions Worth Exploring Later",
        content: [
          {
            type: "paragraph",
            text: "How can we calculate the height of a building without climbing it?",
            id: "curiosity-questions-paragraph-1"
          },
          {
            type: "paragraph",
            text: "How can a ship determine where it is using directions and distances?",
            id: "curiosity-questions-paragraph-2"
          },
          {
            type: "paragraph",
            text: "How can astronomers estimate the distance to objects that are unimaginably far away?",
            id: "curiosity-questions-paragraph-3"
          },
          {
            type: "paragraph",
            text: "How can a robot know where its hand will be when one of its joints rotates?",
            id: "curiosity-questions-paragraph-4"
          },
          {
            type: "paragraph",
            text: "Why do sine and cosine appear when we draw waves?",
            id: "curiosity-questions-paragraph-5"
          },
          {
            type: "paragraph",
            text: "How can an angle determine the horizontal and vertical movement of an object?",
            id: "curiosity-questions-paragraph-6"
          },
          {
            type: "paragraph",
            text: "Why can the same mathematical functions be useful in geometry, physics, engineering, computer graphics, and astronomy?",
            id: "curiosity-questions-paragraph-7"
          },
          {
            type: "paragraph",
            text: "These questions are not meant to be solved in this introductory topic. They are invitations to explore the concepts that come next.",
            id: "curiosity-questions-paragraph-8"
          }
        ]
      }
    ]
  },
  formulas: [],
  examples: [],
  key_ideas: [
    "Trigonometry is a tool for connecting angles, distances, directions, and positions.",
    "One of the most important applications of trigonometry is indirect measurement: determining something that cannot be measured directly by using quantities that can be measured.",
    "Triangles provide a simple geometric model for many real-world situations.",
    "Angles can contain useful information about distances because geometric relationships connect angles and side lengths.",
    "Surveying uses geometric relationships to determine positions, distances, and elevations.",
    "Navigation uses directions, angles, and distances to reason about position and movement.",
    "Engineering uses trigonometry to reason about slopes, structures, forces, and components.",
    "Astronomy uses angular observations and geometric relationships to learn about objects that cannot be directly measured.",
    "Robotics uses relationships between lengths and angles to determine positions and movement.",
    "Computer graphics use trigonometric functions to represent rotation, circular motion, and changing coordinates.",
    "Sine and cosine eventually become tools for describing waves and periodic phenomena.",
    "The applications of trigonometry extend far beyond the triangle.",
    "The same mathematical ideas can appear in seemingly unrelated fields because they describe fundamental geometric relationships.",
    "Applications are presented here to build curiosity rather than to teach the detailed techniques needed to solve application problems.",
    "The detailed mathematical machinery behind these applications will be developed in later topics."
  ],
  misconceptions: [
    "Trigonometry is only useful for solving triangle problems.",
    "Trigonometry is mainly a collection of formulas that must be memorized.",
    "If something cannot be measured directly, mathematics cannot determine it.",
    "Angles only tell us about direction and cannot provide information about distance.",
    "Sine and cosine are useful only when a physical triangle is present.",
    "Trigonometry is useful only in mathematics classes and has little connection to technology.",
    "Every real-world application of trigonometry can be solved using only the basic SOH-CAH-TOA ratios.",
    "Learning applications means immediately learning how to calculate every real-world quantity described.",
    "The same trigonometric ideas cannot be useful in both geometry and fields such as physics or computer science.",
    "Real-world systems use exactly the same simplified assumptions as textbook triangle problems."
  ],
  explorations: [
    {
      id: "why-angles-reveal-distance",
      type: "why"
    },
    {
      id: "why-indirect-measurement-works",
      type: "why"
    },
    {
      id: "trigonometry-in-the-real-world",
      type: "visualization"
    },
    {
      id: "height-without-climbing",
      type: "visualization"
    },
    {
      id: "surveying-triangulation",
      type: "visualization"
    },
    {
      id: "navigation-and-position",
      type: "visualization"
    },
    {
      id: "robot-arm-and-angles",
      type: "visualization"
    },
    {
      id: "trigonometry-behind-waves",
      type: "visualization"
    },
    {
      id: "from-triangle-to-unit-circle",
      type: "deeper"
    },
    {
      id: "from-trig-to-functions",
      type: "deeper"
    },
    {
      id: "trigonometry-in-physics",
      type: "deeper"
    },
    {
      id: "trigonometry-in-computer-science",
      type: "deeper"
    }
  ],
  sources: [
    "openstax-precalculus-applications-trigonometry",
    "khan-academy-trigonometry",
    "khan-academy-modeling-right-triangles",
    "usgs-triangulation",
    "nist-digital-library-mathematical-functions"
  ]
};

// services/content.ts
var concepts = [
  // Introduction to Trigonometry
  angles_default,
  angle_measurement_default,
  degrees_and_radians_default,
  angles_on_a_circle_default,
  clock_and_rotation_default,
  right_triangles_default,
  similar_triangles_default,
  bridge_to_trig_ratios_default,
  // Trigonometric Ratios and Functions
  trigonometric_ratios_default,
  reciprocal_trigonometric_ratios_default,
  trigonometric_ratios_any_angle_default,
  exact_trigonometric_values_default,
  tangent_function_default,
  sine_function_default,
  cosine_function_default,
  trigonometric_functions_default,
  reciprocal_trigonometric_functions_default,
  // Trigonometric Equations
  trig_equations_01_what_are_equations_default,
  trig_equations_02_nature_of_solutions_default,
  trig_equations_03_basic_equations_default,
  trig_equations_04_reciprocal_function_equations_default,
  trig_equations_05_factoring_default,
  trig_equations_06_quadratic_equation_default,
  trig_equations_07_identities_default,
  trig_equations_08_multipleAndCompostite_default,
  trig_equations_09_RestrictedInterval_default,
  trig_equations_10_extraneousSolutions_default,
  trig_equations_11_generalSolution_default,
  // Applications
  application_trigo_default
];
function getAllConcepts() {
  return concepts;
}
__name(getAllConcepts, "getAllConcepts");
function getConceptById(id) {
  return concepts.find((concept) => concept.id === id);
}
__name(getConceptById, "getConceptById");
function getAllSubjects() {
  const subjects = /* @__PURE__ */ new Map();
  for (const concept of concepts) {
    const subjectId = concept.subject;
    if (!subjects.has(subjectId)) {
      subjects.set(subjectId, {
        id: subjectId,
        title: formatTitle(subjectId),
        conceptCount: 0
      });
    }
    subjects.get(subjectId).conceptCount++;
  }
  return Array.from(subjects.values());
}
__name(getAllSubjects, "getAllSubjects");
function getSubjectById(subjectId) {
  const subjectConcepts = concepts.filter(
    (concept) => concept.subject === subjectId
  );
  if (subjectConcepts.length === 0) {
    return void 0;
  }
  const topics = /* @__PURE__ */ new Map();
  for (const concept of subjectConcepts) {
    const topicId = concept.topic;
    if (!topics.has(topicId)) {
      topics.set(topicId, {
        id: topicId,
        title: formatTitle(topicId),
        conceptCount: 0
      });
    }
    topics.get(topicId).conceptCount++;
  }
  return {
    id: subjectId,
    title: formatTitle(subjectId),
    conceptCount: subjectConcepts.length,
    topics: Array.from(topics.values())
  };
}
__name(getSubjectById, "getSubjectById");
function getAllTopics() {
  const topics = /* @__PURE__ */ new Map();
  for (const concept of concepts) {
    const topicId = concept.topic;
    if (!topics.has(topicId)) {
      topics.set(topicId, {
        id: topicId,
        title: formatTitle(topicId),
        subject: concept.subject,
        conceptCount: 0
      });
    }
    topics.get(topicId).conceptCount++;
  }
  return Array.from(topics.values());
}
__name(getAllTopics, "getAllTopics");
function getTopicById(topicId) {
  const topicConcepts = concepts.filter(
    (concept) => concept.topic === topicId
  );
  if (topicConcepts.length === 0) {
    return void 0;
  }
  return {
    id: topicId,
    title: formatTitle(topicId),
    subject: topicConcepts[0].subject,
    conceptCount: topicConcepts.length,
    concepts: topicConcepts.map((concept) => ({
      id: concept.id,
      title: concept.title,
      difficulty: concept.difficulty
    }))
  };
}
__name(getTopicById, "getTopicById");
function formatTitle(id) {
  return id.split("-").map(
    (word) => word.charAt(0).toUpperCase() + word.slice(1)
  ).join(" ");
}
__name(formatTitle, "formatTitle");
function getRoadmapByTopic(topicId) {
  const topicConcepts = concepts.filter(
    (concept) => concept.topic === topicId
  );
  if (topicConcepts.length === 0) {
    return void 0;
  }
  const conceptIds = new Set(
    topicConcepts.map((concept) => concept.id)
  );
  const nodes = topicConcepts.map((concept) => ({
    id: concept.id,
    title: concept.title,
    difficulty: concept.difficulty
  }));
  const edges = [];
  for (const concept of topicConcepts) {
    for (const prerequisite of concept.connections.prerequisites) {
      if (conceptIds.has(prerequisite)) {
        edges.push({
          from: prerequisite,
          to: concept.id,
          type: "prerequisite"
        });
      }
    }
    for (const leadsTo of concept.connections.leads_to) {
      if (conceptIds.has(leadsTo)) {
        edges.push({
          from: concept.id,
          to: leadsTo,
          type: "leads_to"
        });
      }
    }
    for (const related of concept.connections.related) {
      if (conceptIds.has(related)) {
        edges.push({
          from: concept.id,
          to: related,
          type: "related"
        });
      }
    }
  }
  return {
    topic: {
      id: topicId,
      title: formatTitle(topicId)
    },
    nodes,
    edges
  };
}
__name(getRoadmapByTopic, "getRoadmapByTopic");
function getContentElement(conceptId, contentId) {
  const concept = getConceptById(conceptId);
  if (!concept) {
    return void 0;
  }
  for (const section of concept.theory.sections) {
    for (const element of section.content) {
      if ("id" in element && element.id === contentId) {
        return {
          sectionTitle: section.title,
          element
        };
      }
    }
  }
  return void 0;
}
__name(getContentElement, "getContentElement");

// routes/concepts.ts
var conceptsRouter = new Hono2();
conceptsRouter.get("/", (c) => {
  const concepts2 = getAllConcepts();
  return c.json({
    count: concepts2.length,
    concepts: concepts2
  });
});
conceptsRouter.get("/:conceptId", (c) => {
  const conceptId = c.req.param("conceptId");
  const concept = getConceptById(conceptId);
  if (!concept) {
    return c.json(
      {
        error: "Concept not found"
      },
      404
    );
  }
  return c.json(concept);
});
var concepts_default = conceptsRouter;

// routes/subjects.ts
var subjectsRouter = new Hono2();
subjectsRouter.get("/", (c) => {
  const subjects = getAllSubjects();
  return c.json({
    count: subjects.length,
    subjects
  });
});
subjectsRouter.get("/:subjectId", (c) => {
  const subjectId = c.req.param("subjectId");
  const subject = getSubjectById(subjectId);
  if (!subject) {
    return c.json(
      {
        error: "Subject not found"
      },
      404
    );
  }
  return c.json(subject);
});
var subjects_default = subjectsRouter;

// routes/topics.ts
var topicsRouter = new Hono2();
topicsRouter.get("/", (c) => {
  const topics = getAllTopics();
  return c.json({
    count: topics.length,
    topics
  });
});
topicsRouter.get("/:topicId", (c) => {
  const topicId = c.req.param("topicId");
  const topic = getTopicById(topicId);
  if (!topic) {
    return c.json(
      {
        error: "Topic not found"
      },
      404
    );
  }
  return c.json(topic);
});
var topics_default = topicsRouter;

// services/gemini.ts
var GEMINI_MODEL = "gemini-3.6-flash";
var GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
async function askGemini(apiKey, systemInstruction, history, userMessage) {
  const contents = [
    ...history.map((message) => ({
      role: message.role,
      parts: [
        {
          text: message.text
        }
      ]
    })),
    {
      role: "user",
      parts: [
        {
          text: userMessage
        }
      ]
    }
  ];
  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [
          {
            text: systemInstruction
          }
        ]
      },
      contents,
      generationConfig: {
        maxOutputTokens: 1e3
      }
    })
  });
  const rawResponse = await response.text();
  console.log("Gemini HTTP status:", response.status);
  console.log("Gemini raw response:", rawResponse);
  let data;
  try {
    data = JSON.parse(rawResponse);
  } catch {
    throw new Error(
      `Gemini returned non-JSON response: ${rawResponse}`
    );
  }
  if (!response.ok) {
    throw new Error(
      `Gemini ${response.status}: ${data.error?.message || rawResponse}`
    );
  }
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error(
      `Gemini returned no text. Raw response: ${rawResponse}`
    );
  }
  return text;
}
__name(askGemini, "askGemini");

// routes/ai.ts
var aiRouter = new Hono2();
aiRouter.post("/chat", async (c) => {
  try {
    const body = await c.req.json();
    const {
      conceptId,
      contentId,
      mode = "normal",
      message,
      history = []
    } = body;
    if (!conceptId) {
      return c.json(
        {
          error: "conceptId is required"
        },
        400
      );
    }
    if (!message) {
      return c.json(
        {
          error: "message is required"
        },
        400
      );
    }
    const concept = getConceptById(conceptId);
    if (!concept) {
      return c.json(
        {
          error: "Concept not found"
        },
        404
      );
    }
    let focusedContent = null;
    if (contentId) {
      focusedContent = getContentElement(
        conceptId,
        contentId
      );
    }
    const context = {
      concept: {
        id: concept.id,
        title: concept.title,
        subject: concept.subject,
        topic: concept.topic,
        difficulty: concept.difficulty
      },
      focusedContent,
      theory: concept.theory,
      formulas: concept.formulas,
      examples: concept.examples,
      keyIdeas: concept.key_ideas,
      misconceptions: concept.misconceptions
    };
    const systemInstruction = `
You are the AI tutor inside an interactive education platform.

Your job is to help the student understand the concept they are currently studying.

IMPORTANT RULES:

1. Teach for understanding, not memorization.
2. Use the provided learning material as the primary source of truth.
3. Do not invent facts that contradict the provided material.
4. Adapt your explanation to the requested mode.
5. Never assume the student already understands something simply because it is mathematically elementary.
6. If the student asks "why", explain the reasoning rather than merely repeating the definition.
7. If the student asks for an example, create a clear example appropriate to the current concept.
8. Do not unnecessarily introduce advanced topics outside the current concept.
9. Keep the student's current context in mind.
10. If the question is unrelated to the current concept, answer briefly and guide the student back toward the relevant concept.

Requested explanation mode:
${mode}

Current learning context:

${JSON.stringify(context, null, 2)}
`;
    const apiKey = c.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing");
      return c.json(
        {
          error: "AI service is not configured"
        },
        500
      );
    }
    const answer = await askGemini(
      apiKey,
      systemInstruction,
      history,
      message
    );
    return c.json({
      answer
    });
  } catch (error) {
    console.error("AI route error:", error);
    return c.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate AI response"
      },
      500
    );
  }
});
var ai_default = aiRouter;

// routes/roadmap.ts
var roadmapRouter = new Hono2();
roadmapRouter.get("/:topicId", (c) => {
  const topicId = c.req.param("topicId");
  const roadmap = getRoadmapByTopic(topicId);
  if (!roadmap) {
    return c.json(
      {
        error: "Topic not found"
      },
      404
    );
  }
  return c.json(roadmap);
});
var roadmap_default = roadmapRouter;

// index.ts
var app = new Hono2();
app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    message: "SIH backend is running"
  });
});
app.route("/api/concepts", concepts_default);
app.route("/api/subjects", subjects_default);
app.route("/api/topics", topics_default);
app.route("/api/roadmap", roadmap_default);
app.route("/api/ai", ai_default);
var index_default = app;

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-wpnQPw/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = index_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-wpnQPw/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
