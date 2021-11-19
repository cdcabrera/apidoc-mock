/**
 * @api {get} /hello/world/
 * @apiMock {RandomResponse}
 * @apiSuccess {String} foo
 * @apiSuccess {String} bar
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
 * @apiError {String} bad
 * @apiError {String} request
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 400 OK
 *     {
 *       "bad": "hello",
 *       "request": "world"
 *     }
 */
const getExample = () => {};

/**
 * @api {post} /hello/world/
 * @apiMock {RandomResponse}
 * @apiHeader {String} Authorization Authorization: Token AUTH_TOKEN
 * @apiSuccess {String} foo
 * @apiSuccess {String} bar
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 201 OK
 *     {
 *       "foo": "hello",
 *       "bar": "world"
 *     }
 * @apiError {String} detail
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "detail": "Authentication credentials were not provided."
 *     }
 */
const postExample = () => {};

/**
 * @api {put} /hello/world/
 * @apiHeader {String} Authorization Authorization: Token AUTH_TOKEN
 * @apiSuccess {String} foo
 * @apiSuccess {String} bar
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "foo": "hello",
 *       "bar": "world"
 *     }
 */
const putExample = () => {};

/**
 * @api {patch} /hello/world/
 * @apiHeader {String} Authorization Authorization: Token AUTH_TOKEN
 * @apiSuccess {String} foo
 * @apiSuccess {String} bar
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "foo": "hello",
 *       "bar": "world"
 *     }
 */
const patchExample = () => {};

/**
 * @api {delete} /hello/world/
 * @apiHeader {String} Authorization Authorization: Token AUTH_TOKEN
 * @apiSuccess {String} foo
 * @apiSuccess {String} bar
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "foo": "hello",
 *       "bar": "world"
 *     }
 */
const deleteExample = () => {};

module.exports = { getExample, postExample, putExample, patchExample, deleteExample };
