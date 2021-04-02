const axios = require('axios');
const jwt_decode = require('jwt-decode');

/**
 * Sankaku-api client
 *
 * @class
 * @param {object} [extra_headers] Headers added to every request.
 * @example
 * const {Client} = require('sankaku-client')
 * const client = new Client({header1: 'header1_info', header2: 'header2_info'});
 */
class Client {
    constructor(extra_headers) {
        this.#extra_headers = extra_headers;
    }

    #extra_headers = [];

    #access_token = '';

    #login = '';

    #password = '';

    #user_info = {};

    async #request(options) {
        if (this.#access_token && Date.now() >= jwt_decode(this.#access_token).exp * 1000)
            await this.login({ login: this.#login, password: this.#password });

        const config = {
            ...options,
            headers: {
                authorization: this.#access_token ? `Bearer ${this.#access_token}` : '',
                ...this.#extra_headers,
                ...options.headers
            }
        };

        return axios(config).catch((e) => {
            throw new Error(e);
        });
    }

    /**
     * Login with an user account.<br>
     * It will refresh the token automatically when needed, by reusing the same login and password. <br>
     * ⚠ If the credentials are changed, some functions may stop working and you will have to logout().
     *
     * @throws {Error} Will throw an error if the login/password combination is invalid or for generic network issues.
     * @returns {Promise<void>}
     * @example
     * client.login({login: 'user', password: 'hunter2'})
     *  .catch(e => console.log(e)); // Invalid login and password combination
     * @param {object} account - Account you want to login
     * @param {string} account.login Email or username
     * @param {string} account.password Plain password
     */
    async login({ login, password }) {
        const req = await this.#request({
            url: 'https://capi-v2.sankakucomplex.com/auth/token',
            method: 'POST',
            data: {
                login: login,
                password: password
            }
        });
        this.#access_token = req.data.access_token;
        this.#user_info = req.data.current_user;
        this.#login = login;
        this.#password = password;
    }

    /**
     * Logout from current account.<br>
     * It calls the api logout endpoint and deletes the saved account data.
     *
     * @throws {Error} WIll throw an error for generic network issues or if the logout api call fails (the latter can be usually ignored safely).
     * @returns {Promise<void>}
     * @async
     */
    async logout() {
        this.#access_token = '';
        this.#login = '';
        this.#password = '';
        this.user_info = '';

        await this.#request({
            url: 'https://capi-v2.sankakucomplex.com/auth/logout',
            method: 'POST'
        });
    }

    /**
     * Get user info fetching latest data from api, either by id or name.
     *
     * @throws {Error} Will throw error if not logged in AND no id/name is specified, or for generic network issues.
     * @example
     * // Get info about logged in account
     * client.getUserInfo()
     *  .then(r => console.log(r));
     * @example
     * // Get info about account named 'smith'
     * client.getUserInfo({name: 'smith'})
     *  .then(r => console.log(r));
     * @param {object} [config] The request config.
     * @param {number} [config.id] The id of the user you want to get info about.
     * @param {string} [config.name] The name of the user you want to get info about.
     * @returns {Promise<object>} Object with user info
     */
    async getUserInfo({ id, name } = {}) {
        const req = await this.#request({
            url: name
                ? `https://capi-v2.sankakucomplex.com/users/name/${name}`
                : `https://capi-v2.sankakucomplex.com/users/${id || 'me'}`,
            method: 'GET',
            params: {
                lang: 'en'
            }
        });
        if (!id && !name) this.#user_info = req.data.user;

        if (!name) return req.data.user;
        return req.data;
    }

    /**
     * Edit user info/general settings.
     *
     * @throws {Error} Will throw error if not logged in or for generic network issues.
     * @example
     * // Disable 'Send email when messaged'
     * client.setUserInfo({receive_dmails: false})
     * @param {object} change The object with the change you want to want.
     * @returns {Promise<object>} Object with success property set to true or false.
     */
    async setUserInfo(change) {
        const req = await this.#request({
            url: `https://capi-v2.sankakucomplex.com/notifications/${this.#user_info.id}`,
            method: 'PUT',
            params: {
                lang: 'en'
            },
            data: {
                user: change
            }
        });

        return req.data;
    }

    /**
     * Get user settings fetching latest data from api
     *
     * @throws {Error} Will throw error if not logged in or for generic network issues.
     * @example
     * client.updateUserSettings()
     *  .then(r => console.log(r));
     * @returns {Promise<object>} Object with user info
     */
    async getNotificationSettings() {
        const req = await this.#request({
            url: 'https://capi-v2.sankakucomplex.com/notifications/settings',
            method: 'GET',
            params: {
                lang: 'en'
            }
        });
        return req.data;
    }

    /**
     * Edit notifications settings.
     *
     * @throws {Error} Will throw error if not logged in or for generic network issues.
     * @example
     * // Notify me when I am contacted in these ways => Messages => Enable email and push
     * client.setNotificationSettings({category_id: 1, is_email: true, is_push: true})
     * @param {object} change The object with the change you want to make.
     * @returns {Promise<object>} Object with success property set to true or false.
     */
    async setNotificationSettings(change) {
        const req = await this.#request({
            url: 'https://capi-v2.sankakucomplex.com/notifications/settings',
            method: 'POST',
            params: {
                lang: 'en'
            },
            data: change
        });
        return req.data;
    }

    /**
     * Search submissions through the website, anonymously or with your account if you are logged in.<br>
     * Can handle up to 2 tags anonymously.<br>
     * Some submissions may not have any url if:
     *  * They are premium and the client isn't logged in with a premium account.<br>
     *  * They have some special tags (e.g. loli) and the client isn't logged in.
     * It can fail with an error 408 if the search time is exceeded.
     *
     * @async
     * @returns {Promise<Array.<{meta: object, data: object[]}>>} Array containing the meta and data part, the latter with submissions as objects.
     * @throws {Error} Will throw an error not logged in, the search time is exceeded or for generic network issues.
     * @example
     * // Returns a random submission
     * client.searchSubmissions({limit: 1, order_by: 'random'})
     * @example
     * // Returns 40 yuri no yaoi submissions, r18+ only
     * client.searchSubmissions({order_by: 'random', rating: {g: false, r15: false, r18: true}, tags: ['yuri', '-yaoi']})
     * @example
     * // Returns 40 images/gifs.
     * client.searchSubmissions({tags: ['-video']})
     * @example
     * // Scroll through yuri submissions.
     * client.searchSubmissions({tags: ['yuri']})
     * const r1 = await client.searchSubmissions({ tags: ['yuri'] }); // Page 1
     * const r2 = await client.searchSubmissions({ next: r1.meta.next, tags: ['yuri'] }); // Page 1 -> Page 2
     * const r3 = await client.searchSubmissions({ prev: r2.meta.prev, tags: ['yuri'] }); // Page 2 -> Page 1
     * console.log(r1 === r3); // true
     * @example
     * // Returns max 40 submissions from today
     * client.searchSubmissions({date: new Date(Date.now())})
     * // Returns max 40 submissions from january 2021
     * test.searchSubmissions({ date: [new Date(2020, 1, 1), new Date(2020, 1, 30)] });
     * // Would probably return code 408 without premium
     * @param {object} config The request config
     * @param {('popularity'|'date'|'quality'|'random'|'recently_favorited'|'recently_voted')} [config.order_by=date] Sort order.
     * @param {number} [config.limit=40] Number of submissions wanted at once. Maximum is 100.
     * @param {string} [config.next] The metadata used to scroll through the submission. If set, it will return the next 'page' of a request.
     * @param {string} [config.prev] The metadata used to scroll through the submission. If set, it will return the previous 'page' of a request.
     * @param {object} [config.rating] Nudity rating filters.
     * @param {boolean} [config.rating.g=true] Everyone.
     * @param {boolean} [config.rating.r15=true] Younger teenagers.
     * @param {boolean} [config.rating.r18=true] Adults.
     * @param {Date|Array<Date>} [config.date] Specify the search day or the search interval in an array.
     * @param {('never'|'always'|'in-larger-tags')} [config.hide_posts_in_books=in-larger-tags] Hide book pages grouped into books
     * @param {number} [config.threshold=1] Filters away everything under the threshold. Ranges from one to five.
     * @param {('any'|'large'|'huge'|'long'|'wallpaper'|'16:9'|'4:3'|'3:2'|'1:1')} [config.size=any] Size of the media.
     * @param {('any'|'video'|'gif')} [config.file_type=any] Type of the media.
     * @param {string} [config.recommended_for] Show media recommended for username.
     * @param {string} [config.favorited_by] Show media favorited by username.
     * @param {string} [config.voted_by] Show media voted by username.
     * @param {Array<string>} [config.tags] Tags following the format <code>'yuri','-yaoi'</code>
     * @todo Add personalized recommended parameter
     */
    async searchSubmissions({
        order_by = 'date',
        limit = 40,
        next = '',
        prev = '',
        rating: { g = true, r15 = true, r18 = true } = {},
        date,
        hide_posts_in_books = 'in-larger-tags',
        threshold = 1,
        size = 'any',
        file_type = 'any',
        recommended_for = '',
        favorited_by = '',
        voted_by = '',
        tags = []
    } = {}) {
        let all_tags = [];
        if (order_by !== 'date') all_tags.push(`order:${order_by}`);
        if (recommended_for) all_tags.push(`fav:${recommended_for}`);
        if (voted_by) all_tags.push(`voted:${voted_by}`);
        if (favorited_by) all_tags.push(`user:${favorited_by}`);
        if (!(g && r15 && r18)) {
            if (g) all_tags.push(`rating:q`);
            if (r15) all_tags.push(`rating:s`);
            if (r18) all_tags.push(`rating:e`);
        }
        if (file_type !== 'any') all_tags.push(`file_type:${file_type}`);
        if (size !== 'any') all_tags.push(`+${size}`);

        if (date instanceof Date) all_tags.push(`date:${date.toLocaleString('kk-KZ').split(',')[0]}`);
        else if (date instanceof Array)
            all_tags.push(
                `date:${date[0].toLocaleString('kk-KZ').split(',')[0]}..${
                    date[1].toLocaleString('kk-KZ').split(',')[0]
                }`
            );

        all_tags = [...all_tags, ...tags].join(' ');
        const req = await this.#request({
            url: 'https://capi-v2.sankakucomplex.com/posts/keyset',
            method: 'GET',
            headers: {
                dnd: 1,
                origin: 'https://beta.sankakucomplex.com',
                referer: 'https://beta.sankakucomplex.com/',
                accept: 'application/vnd.sankaku.api+json;v=2'
            },
            params: {
                lang: 'en',
                limit: limit,
                next: next,
                prev: prev,
                hide_posts_in_books: hide_posts_in_books,
                default_threshold: threshold,
                tags: all_tags
            }
        });

        return req.data;
    }

    /**
     * Searches books through the website.
     * ⚠ The "Search by article title" filter is not implemented because as of 31/03/2021 it is broken (tested with a free account only).<br>
     *
     * @async
     * @returns {Promise<Array.<{meta: object, data: object[]}>>} Array containing the meta and data part, the latter with books as objects.
     * @throws {Error} Will throw an error not logged in or for generic network issues.
     * @example
     * // Get 40 random books
     * client.searchBooks({order_by: 'random'})
     *  .then(r => console.log(r.data))
     * @param {object} config The request config
     * @param {('popularity'|'date'|'quality'|'random'|'recently_favorited'|'recently_voted')} [config.order_by=popularity] Sort order
     * @param {number} [config.limit=20] Number of submissions wanted.
     * @param {string} [config.next] The metadata used to scroll through the submission. If set, it will return the next 'page' of a request.
     * @param {string} [config.prev] The metadata used to scroll through the submission. If set, it will return the previous 'page' of a request.
     * @param {object} [config.rating] Nudity rating filters.
     * @param {boolean} [config.rating.g=true] Everyone.
     * @param {boolean} [config.rating.r15=true] Younger teenagers.
     * @param {boolean} [config.rating.r18=true] Adults.
     * @param {string} [config.favorited_by] Show media favorited by username.
     * @param {string} [config.voted_by] Show media voted by username.
     * @param {boolean} [config.show_empty=false] Show books with no posts.
     * @param {Array<string>} [config.tags] Tags following the format <code>'yuri','-yaoi'</code>
     */
    async searchBooks({
        order_by = 'popularity',
        limit = 40,
        next = '',
        prev = '',
        rating: { g = true, r15 = true, r18 = true } = {},
        favorited_by = '',
        voted_by = '',
        show_empty = false,
        tags = []
    } = {}) {
        if (!this.#access_token) throw new Error('You must be logged in to use this feature');

        let all_tags = [`order:${order_by}`];
        if (!(g && r15 && r18)) {
            if (g) all_tags.push(`rating:q`);
            if (r15) all_tags.push(`rating:s`);
            if (r18) all_tags.push(`rating:e`);
        }
        if (show_empty) all_tags.push(`show_empty:true`);
        if (voted_by) all_tags.push(`voted:${voted_by}`);
        if (favorited_by) all_tags.push(`user:${favorited_by}`);

        all_tags = [...all_tags, ...tags].join(' ');
        const req = await this.#request({
            url: 'https://capi-v2.sankakucomplex.com/pools/keyset',
            method: 'GET',
            headers: {
                dnd: 1,
                origin: 'https://beta.sankakucomplex.com',
                referer: 'https://beta.sankakucomplex.com/',
                accept: 'application/vnd.sankaku.api+json;v=2'
            },
            params: {
                lang: 'en',
                limit: limit,
                next: next,
                prev: prev,
                pool_type: 0,
                tags: all_tags
            }
        });

        return req.data;
    }

    /**
     * Get submission by id<br>
     * If logged it, it will also return the user_vote, and is_favorited.
     *
     * @async
     * @example
     * // Get submission 24846188
     * client.getSubmission(24846188)
     *  .then(r => console.log(r));
     * @param {number} id id of the submission
     * @returns {Promise<object>} Submission object
     */
    async getSubmission(id) {
        const req = await this.#request({
            url: 'https://capi-v2.sankakucomplex.com/posts',
            method: 'GET',
            params: {
                lang: 'en',
                limit: 1,
                tags: `id_range:${id}`
            }
        });
        return req.data[0];
    }

    /**
     * Get book by id<br>
     * If logged it, it will also return the user_vote, and is_favorited.
     *
     * @async
     * @example
     * // Get book 385168
     * client.getBook(385168)
     *  .then(r => console.log(r));
     * @throws {Error} Throws error for generic network issues, or if a book with the id doesn't exist.
     * @param {number} id id of the book
     * @returns {Promise<object>} Book object
     */
    async getBook(id) {
        const req = await this.#request({
            url: `https://capi-v2.sankakucomplex.com/pools/${id}`,
            method: 'GET',
            params: {
                lang: 'en',
                limit: 1
            }
        });
        return req.data;
    }

    /**
     * Get comments of a post/submission
     *
     * @param {object} config The request config
     * @throws {Error} Throws error for generic network issues, or if the submission is premium and client isn't logged in with a premium account
     * @param {('books'|'posts')} [config.type='posts'] Whether you want to get comments for a book or a submission
     * @param {number} [config.limit=20] Number of comments wanted.
     * @param {number} [config.page=1] Page number
     * @param {number} config.id id of the book/submission
     * @returns {Promise<object>} Object with all the returned data.
     */
    async getComments({ type = 'posts', limit = 10, page = 1, id }) {
        const req = await this.#request({
            url: `https://capi-v2.sankakucomplex.com/${type === 'books' ? 'pools' : type}/${id}/comments`,
            method: 'GET',
            params: {
                lang: 'en',
                limit: limit,
                page: page
            }
        });
        return req.data;
    }

    /**
     * Get private messages
     *
     * @throws {Error} Throws error if not logged in and for generic network issues.
     * @param {object} [config] The request config
     * @param {number} [config.limit=20] Number of private messages wanted.
     * @param {number} [config.page=1] Page number
     * @returns {Promise<object>} Object with all the returned data.
     */
    async getDMs({ limit = 20, page = 1 } = {}) {
        if (!this.#access_token) throw new Error('You must be logged in to use this feature');
        const req = await this.#request({
            url: `https://capi-v2.sankakucomplex.com/dmail`,
            method: 'GET',
            params: {
                limit: limit,
                page: page,
                lang: 'en'
            }
        });

        return req.data;
    }

    /**
     * Send DM to user with id.
     *
     * @example
     * // Send DM to user Smith
     * const user = await client.getUserInfo({name: 'Smith'})
     * await client.sendDM({ id: user.id, title: 'test', body: 'test' });
     *
     * @throws {Error} Throws error if not logged in, for generic network issues, in case of invalid request data or if you try to send a message to yourself.
     * @param {object} config The request config
     * @param {number} config.id id of the user
     * @param {string} config.title The title of the DM
     * @param {string} config.body The body of the DM
     * @returns {Promise<object>} Object with returned data
     */
    async sendDM({ id, title, body }) {
        if (!this.#access_token) throw new Error('You must be logged in to use this feature');

        const req = await this.#request({
            url: 'https://capi-v2.sankakucomplex.com/dmail',
            method: 'POST',
            data: {
                dmail: {
                    user_id: id,
                    title: title,
                    body: body
                }
            }
        });

        return req.data;
    }

    /**
     * Upvote or downvote comment
     *
     * @example
     * client.scoreComment({ id: 111319, score: 'plus' });
     * @param {object} config The request config
     * @param {number} config.id id of the comment
     * @param {'minus'|'plus'} config.score Whether you want to upvote (plus) or downvote (minus)
     * @returns {Promise<object>} Object with all the returned data.
     */
    async scoreComment({ id, score }) {
        if (!this.#access_token) throw new Error('You must be logged in to use this feature');
        const req = await this.#request({
            url: `https://capi-v2.sankakucomplex.com/comments/${id}/vote`,
            method: 'PUT',
            params: {
                lang: 'en'
            },
            data: {
                score: score
            }
        });
        return req.data;
    }

    /**
     * Add like to a book or post.
     *
     * @throws {Error} Will throw an error not logged in or for generic network issues.
     * @async
     * @example
     * // Add like to post 24838772, 24838766
     * client.like({id: 24838772})
     *  .then(result => console.log(result));
     *  //  { success: true, post_id: 24838772, favorited_users: '', score: 40 }
     * @param {object} config The request config
     * @param {('books'|'posts')} [config.type='posts'] Whether you want to like a book or a submission
     * @param {number} config.id id of the post/submission
     * @param {boolean} [config.remove=false] If you want to remove the like instead of adding it, set this to true.
     * @returns {Promise<{success: boolean, post_id: number, favorited_users: string, score: number}>} - Object with all the returned data.
     */
    async like({ type = 'posts', remove = false, id }) {
        if (!this.#access_token) throw new Error('You must be logged in to use this feature');
        const req = await this.#request({
            method: remove ? 'DELETE' : 'POST',
            url: `https://capi-v2.sankakucomplex.com/${type === 'books' ? 'pools' : type}/${id}/favorite`,
            params: {
                lang: 'en'
            }
        });
        return req.data;
    }

    /**
     * Add, edit or remove vote to a book or post.
     *
     * @async
     * @throws {Error} Will throw an error not logged in or for generic network issues.
     * @example
     * // Vote post 24835970
     * client.vote({votes: [{id: 24835970, score: 5}]})
     *  .then(result => console.log(result[0]));
     *  // { "success":true, "post_id":24835970, "vote_count":2, "score":10 }
     * @param {object} config The request config
     * @param {('books'|'posts')} [config.type='posts'] Whether you want to like a book or a submission
     * @param {number} config.id id of the post/submission
     * @param {number} config.score Score to give. Goes from one to five. Give zero to remove the vote.
     * @returns {Promise<{success: boolean, post_id: number, vote_count: number, score: number}>} Object with all the returned data.
     */
    async vote({ type = 'posts', id, score }) {
        if (!this.#access_token) throw new Error('You must be logged in to use this feature');
        const req = await this.#request({
            method: score === 0 ? 'DELETE' : 'PUT',
            url: `https://capi-v2.sankakucomplex.com/${type}/${id}/vote`,
            params: {
                lang: 'en'
            },
            data: {
                score: score
            }
        });

        return req.data;
    }
}

module.exports = { Client };
