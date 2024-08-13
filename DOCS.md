# How to use

<details>
<summary><h3 style="display: inline-block">Tooling requirements</h3></summary>

The basic use requirements:
* [Node.js version 18+](https://nodejs.org/)
* NPM
</details>

<details>
<summary><h3 style="display: inline-block">CLI use</h3></summary>

Basic CLI functionality can also be viewed under a simple terminal command
```shell
$ mock -h
```

#### Options
| CLI OPTION   | DESCRIPTION                                                               | TYPE               | CHOICES | DEFAULT |
|--------------|---------------------------------------------------------------------------|--------------------|---------|---------|
| -p, --port   | Set mock server port                                                      | number             |         | 8000    |
| -w, --watch  | Watch single, or multiple, files and extensions using glob patterns.      | string \| string[] |         |         | 

#### Use the CLI with NPM scripts
CLI usage can be placed under NPM scripts

A basic mock example using your own scripts

   ```js
   "scripts": {
     "api": "mock -w [PATH TO FILES] -w [ANOTHER PATH TO FILES]"
   }
   ```


</details>

<details>
<summary><h3 style="display: inline-block">Mock comment use</h3></summary>

`apidoc-mock` makes use of specific [apiDoc](https://apidocjs.com/) and [JSDoc](https://github.com/jsdoc/jsdoc) styled comment tags to generate mocks.

> For reference, we break these styled comments into the format `@[TAG] {[TYPE]} [NAME|TITLE] [DESCRIPTION]`

#### Comment tags
The tags `apidoc-mock` uses are...

| COMMENT TAG        | COMMENT TYPE                                                                                                                               | COMMENT NAME                                             | COMMENT DESCRIPTION                                                       | ADDITIONAL EXPLANATION                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
|--------------------|--------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------|---------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| @api               | `get` \| `patch` \| `post` \| `put` \| `delete` \| defaults to `get` if missing                                                            | `string`, the API path to serve                          | **IGNORED!**                                                              |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| @apiMock           | `force` \| `forceStatus` \| `forcedStatus`                                                                                                 | `number`, a HTTP status to serve when the path is called | **IGNORED!**                                                              |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| @apiMock           | `random` \| `randomResponse`                                                                                                               | **IGNORED!**                                             | **IGNORED!**                                                              | Returns a random'ish response of `success`<sup>1</sup> \| `error`<sup>2</sup> if multiple related examples are provided.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| @apiMock           | `randomSuccess`                                                                                                                            | **IGNORED!**                                             | **IGNORED!**                                                              | Returns a random'ish response of `success`<sup>1</sup> if multiple related examples are provided.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| @apiMock           | `randomError`                                                                                                                              | **IGNORED!**                                             | **IGNORED!**                                                              | Returns a random'ish response of `error`<sup>2</sup> if multiple related examples are provided.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| @apiMock           | `delay` \| `delayResponse`                                                                                                                 | `number`, milliseconds to delay the mock response        | **IGNORED!**                                                              | The number of milliseconds to delay the response                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| @apiHeader         | `request` \| `response` \| defaults to `request` if missing or another value is used                                                       | `string`, see `@apiHeaderExample` for limitations        | `string`, An `apidoc` example header content                              | Minimally recognizes the `Authorization` `request` header, see `@apiHeaderExample` for limitations.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| @apiHeaderExample  | `request` \| `response` \| defaults to `request` if missing or another value is used                                                       | **IGNORED!**                                             | `string`, An `apidoc` example header, written in `JSON` format            | The `JSON` object properties are used to "help" generate `response` headers for mock responses, and are generally used for custom headers.<br/><br/>The only `request` header used for mocks is `Authorization`. When `Authorization` is declared the mocks will attempt to minimally apply authorization to the related response. This means you'll need to pass mock authorization with your request. Any other mock related `request` headers are ignored by design.<br/><br/>In addition, when generating mocks not all `response` headers will be used some are ignored, like CORS related headers, and a general list of [`spec level forbidden headers`](https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_header_name). |
| @apiSuccessExample | `css` \| `csv`  \| `gzip` \| `html` \| `json` \| `svg` \| `txt` \| `xml` \| `zip` \| defaults to `txt` if missing or another value is used | **IGNORED!**                                             | `string`, An `apidoc` example response used as the returned mock response | Any API response `description` that is missing will attempt to fallback to a default internal string response.<sup>3</sup>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| @apiErrorExample   | `css` \| `csv`  \| `gzip` \| `html` \| `json` \| `svg` \| `txt` \| `xml` \| `zip` \| defaults to `txt` if missing or another value is used | **IGNORED!**                                             | `string`, An `apidoc` example response used as the returned mock response | Any API response `description` that is missing will attempt to fallback to a default internal string response.<sup>3</sup>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

> footnotes:<br/>
> 1. Success is defined as a http status numeric value of less than `400`
> 1. Error is defined as a http status numeric value greater than or equal to `400`
> 1. If unrecognized, MIME response types will attempt to fall back towards `text/plain`

##### JS/TS linting and comments

Since `apidoc-mock` uses custom comments you may come across issues if you decide to run a linter like `eslint-plugin-jsdoc`. You may
need to allow custom `tags` and `types`.

If you're using `eslint` see the related `JSDoc plugin` for rule reference and settings explanations
- [jsdoc/check-tag-names](https://github.com/gajus/eslint-plugin-jsdoc/blob/main/.README/rules/check-tag-names.md)
- [jsdoc/no-undefined-types](https://github.com/gajus/eslint-plugin-jsdoc/blob/main/.README/rules/no-undefined-types.md)
- [settings.jsdoc.preferredTypes](https://github.com/gajus/eslint-plugin-jsdoc/blob/main/docs/settings.md#settings-to-configure-check-types-and-no-undefined-types)


##### Example comments
###### @apiMock tag, force HTTP status
To force a specific status use the `ForceStatus` type. 

_Note: This will always return a `400`_ 
```
/**
 * @api {get} /hello/world/
 * @apiMock {forceStatus} 400
 * @apiSuccessExample {json} Success-Response
 *   HTTP/1.1 200 OK
 *   {
 *     "hello": "world"
 *   }
 * @apiErrorExample {json} Error-Response
 *   HTTP/1.1 400 Bad Request
 *   {
 *     "bad": "request"
 *   }
 */
```

###### @apiMock tag, force a random response
To force a random status that uses success and error responses use the `RandomResponse` type.
```
/**
 * @api {get} /hello/world/
 * @apiMock {randomResponse}
 * @apiSuccessExample {json} Success-Response
 *   HTTP/1.1 200 OK
 *   {
 *     "hello": "world"
 *   }
 * @apiSuccessExample {json} Success-Response
 *   HTTP/1.1 200 OK
 *   {
 *     "lorem": "ipsum"
 *   }
 * @apiErrorExample {json} Error-Response
 *   HTTP/1.1 400 Bad Request
 *   {
 *     "bad": "request"
 *   }
 */
```

###### @apiMock tag, force a delayed response
To force a delayed response in milliseconds use the `DelayResponse` type.
```
/**
 * @api {get} /hello/world/
 * @apiMock {delayResponse} 5000
 * @apiSuccessExample {json} Success-Response
 *   HTTP/1.1 200 OK
 *   {
 *     "hello": "world"
 *   }
 */
```

###### @apiHeaderExample tag, use an Authorization and custom header 
To force the use of an Authorization header use the `@apiHeaderExample` tag.
> This tag can be used to apply a variety of headers to any response header on the mock response.

_Note: In this example you must pass, as part of your request, some form of token, mock or otherwise, to the Authorization header in order for the server to respond with a success_
```
/**
 * @api {get} /hello/world/
 * @apiHeaderExample {request} Request-Header
 *   {
 *     "Authorization": "Token EXAMPLE_TOKEN"
 *   }
 * @apiHeaderExample {response} Response-Header
 *   {
 *     "Dolor": "sit"
 *   }
 * @apiSuccessExample {json} Success-Response
 *   HTTP/1.1 200 OK
 *   {
 *     "hello": "world"
 *   }
 * @apiErrorExample {json} Error-Response
 *   HTTP/1.1 401 Unauthorized
 *   {
 *     "detail": "Authentication credentials were not provided."
 *   }
 */
```

###### @apiMockResponse tag, create a mock response like JSON, XML/HTML/SVG, or ZIP
To create a mock response apply one of the noted `types`.
> Any unrecognized type will automatically use a response type of `text/plain`

_Note: JSON example_
```
/**
 * @api {get} /hello/world/
 * @apiSuccessExample {json} Success-Response
 *   HTTP/1.1 200 OK
 *   {
 *     "hello": "world"
 *   }
 */
```

_Note: HTML example_
```
/**
 * @api {get} /hello/world/
 * @apiMockResponse {html} Success-Response
 *   HTTP/1.1 200 OK
 *   <html>
 *     <body>
 *       hello world
 *     </body>
 *   </html>
 */
```

_Note: ZIP example_
```
/**
 * @api {get} /hello/world/
 * @apiMockResponse {zip} Success-Response
 *   HTTP/1.1 200 OK
 *   success
 */
```

</details>
