/**
 * @api {get} /hello/world/ Get
 * @apiGroup Hello World
 * @apiMock {RandomResponse}
 * @apiSuccess {string} foo
 * @apiSuccess {string} bar
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
 * @apiError {string} bad
 * @apiError {string} request
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 400 OK
 *     {
 *       "bad": "hello",
 *       "request": "world"
 *     }
 * @apiError {string} detail
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "detail": "Authentication credentials were not provided."
 *     }
 */
const getExample = () => {};

/**
 * @api {post} /hello/world/ Post
 * @apiGroup Hello World
 * @apiMock {RandomResponse}
 * @apiHeader {string} Authorization Authorization: Token AUTH_TOKEN
 * @apiSuccess {string} foo
 * @apiSuccess {string} bar
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 201 OK
 *     {
 *       "foo": "hello",
 *       "bar": "world"
 *     }
 * @apiError {string} detail
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "detail": "Authentication credentials were not provided."
 *     }
 */
const postExample = () => {};

/**
 * @api {put} /hello/world/ Put
 * @apiGroup Hello World
 * @apiHeader {string} Authorization Authorization: Token AUTH_TOKEN
 * @apiSuccess {string} foo
 * @apiSuccess {string} bar
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
 * @apiGroup Hello World
 * @apiHeader {string} Authorization Authorization: Token AUTH_TOKEN
 * @apiSuccess {string} foo
 * @apiSuccess {string} bar
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
 * @apiGroup Hello World
 * @apiHeader {string} Authorization Authorization: Token AUTH_TOKEN
 * @apiSuccess {string} foo
 * @apiSuccess {string} bar
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "foo": "hello",
 *       "bar": "world"
 *     }
 */
const deleteExample = () => {};

module.exports = { getExample, postExample, putExample, patchExample, deleteExample };
