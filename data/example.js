/**
 * @api {get} /hello/world/
 * @apiSuccess {String} foo
 * @apiSuccess {String} bar
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "foo": "hello",
 *       "bar": "world",
 *     }
 */
const getExample = () => {};

/**
 * @api {post} /hello/world/
 * @apiHeader {String} Authorization Authorization: Token AUTH_TOKEN
 * @apiSuccess {String} foo
 * @apiSuccess {String} bar
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "foo": "hello",
 *       "bar": "world",
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
 *       "bar": "world",
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
 *       "bar": "world",
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
 *       "bar": "world",
 *     }
 */
const deleteExample = () => {};

module.exports = { getExample, postExample, putExample, patchExample, deleteExample };
