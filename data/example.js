/**
 * @api {get} /hello/world/demo
 * @apiSuccessExample {html} 200
 * <html>
 *   <header>
 *     <script>
 *       function displayStatus(...args) {
 *         const displayElement = document.getElementById('demoOutput');
 *         displayElement.textContent = `${displayElement.textContent}\n${args.join(' ')}`.trim();
 *         displayElement.scrollTo(0, displayElement.scrollHeight);
 *       }
 *
 *       function testApi(config = { method: 'GET' }, url='/hello/world') {
 *         const pendingStatus = ['>>> PENDING :', `${config.method}\t:`, `${url}:`];
 *         console.info(...pendingStatus);
 *         displayStatus(...pendingStatus);
 *
 *         const callback = async response => {
 *           const output = await response.text();
 *           const completeStatus = ['>>> COMPLETE:', `${config.method}\t:`, `${url}:`, response];
 *           console.info(...completeStatus);
 *           displayStatus(...completeStatus.slice(0, 3), `${output}`.replace(/\n/g, ' '));
 *         };
 *         fetch(url, config).then(callback, callback);
 *      }
 *     </script>
 *     <style>
 *       h2,p,li,a { font-family:sans-serif; }
 *     </style>
 *   </header>
 *   <body>
 *     <h2>"hello/world" demo</h2>
 *     <p>Generated content and API</p>
 *     <ul>
 *      <li>GET
 *        <ul>
 *          <li><a href="javascript:void(0)" onclick="testApi()">Random'ish</a>
 *        </ul>
 *      <li>POST
 *        <ul>
 *          <li><a href="javascript:void(0)" onclick="testApi({ method: 'POST', headers: { Authorization: 'Token spoof' }, body: JSON.stringify({ lorem: 'ipsum' })})">Authenticated</a>
 *          <li><a href="javascript:void(0)" onclick="testApi({ method: 'POST', headers: {}, body: JSON.stringify({ lorem: 'ipsum' })})">Unauthenticated</a>
 *        </ul>
 *
 *      <li>PUT
 *        <ul>
 *          <li><a href="javascript:void(0)" onclick="testApi({ method: 'PUT', headers: { Authorization: 'Token spoof' }, body: JSON.stringify({ lorem: 'ipsum' })})">Authenticated</a>
 *          <li><a href="javascript:void(0)" onclick="testApi({ method: 'PUT', headers: {}, body: JSON.stringify({ lorem: 'ipsum' })})">Unauthenticated</a>
 *        </ul
 *
 *      <li>PATCH
 *        <ul>
 *          <li><a href="javascript:void(0)" onclick="testApi({ method: 'PATCH', headers: { Authorization: 'Token spoof' }, body: JSON.stringify({ lorem: 'ipsum' })})">Authenticated</a>
 *          <li><a href="javascript:void(0)" onclick="testApi({ method: 'PATCH', headers: {}, body: JSON.stringify({ lorem: 'ipsum' })})">Unauthenticated</a>
 *        </ul>
 *
 *      <li>DELETE
 *        <ul>
 *          <li><a href="javascript:void(0)" onclick="testApi({ method: 'DELETE', headers: { Authorization: 'Token spoof' }, body: JSON.stringify({ lorem: 'ipsum' })})">Authenticated</a>
 *          <li><a href="javascript:void(0)" onclick="testApi({ method: 'DELETE', headers: {}, body: JSON.stringify({ lorem: 'ipsum' })})">Unauthenticated</a>
 *        </ul>
 *     </ul>
 *     <pre id="demoOutput" style="width:100%;height:25rem;overflow:hidden;overflow-y:auto;background-color:whitesmoke;border:1px solid gray"></pre>
 *   </body>
 * </html>
 */

/**
 * @api {get} /hello/world/ Get
 * @apiMock {RandomResponse}
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "foo": "hello",
 *       "bar": "world"
 *     }
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 201 OK
 *     {
 *       "lorem": "dolor",
 *       "ipsum": "est"
 *     }
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "bad": "hello",
 *       "request": "world"
 *     }
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "detail": "Authentication credentials were not provided."
 *     }
 */
const getExample = () => {};

/**
 * @api {post} /hello/world/ Post
 * @apiHeaderExample {request} Request-Header
 *     {
 *       "Authorization": "Token AUTH_TOKEN"
 *     }
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 201 OK
 *     {
 *       "foo": "hello",
 *       "bar": "world"
 *     }
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "detail": "Authentication credentials were not provided."
 *     }
 */
const postExample = () => {};

/**
 * @api {put} /hello/world/ Put
 * @apiHeader Authorization Token AUTH_TOKEN
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "foo": "hello",
 *       "bar": "world"
 *     }
 */
const putExample = () => {};

/**
 * @api {patch} /hello/world/ Patch
 * @apiHeaderExample Request-Header
 *     {
 *       "Authorization": "Token AUTH_TOKEN"
 *     }
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "foo": "hello",
 *       "bar": "world"
 *     }
 */
const patchExample = () => {};

/**
 * @api {delete} /hello/world/ Delete
 * @apiHeaderExample Request-Header
 *     {
 *       "Authorization": "Token AUTH_TOKEN"
 *     }
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "foo": "hello",
 *       "bar": "world"
 *     }
 */
const deleteExample = () => {};

module.exports = { getExample, postExample, putExample, patchExample, deleteExample };
