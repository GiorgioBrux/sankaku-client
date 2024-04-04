import Client from '../../src/index';

require('dotenv').config({ path: '.env.test' }); // Adjust the path to your Client class

describe('Client Integration Tests', () => {
    /** @type {Client} */
    let client;

    beforeAll(() => {
        client = new Client();
    });

    it('logs in successfully with valid credentials', async () => {
        await expect(
            client.login({
                login: process.env.SANKAKU_USER,
                password: process.env.SANKAKU_PASSWORD
            })
        ).resolves.not.toThrow();

        // Additional checks can be performed here to ensure that
        // the login function behaves as expected, e.g., checking if
        // an access token is set
        expect(client.isLoggedIn()).toBe(true);
    });

    it('requests user info correctly', async () =>
        // Random popular user
        client.getUserInfo({ name: 'LewdNyaruko' }).then((data) => {
            expect(data.created_at).toBe('2017-10-09T18:34:06.514Z');
            expect(data.id).toBe(490414);
        }));

    it('fetches notification settings correctly', async () => {
        await client.login({
            login: process.env.SANKAKU_USER,
            password: process.env.SANKAKU_PASSWORD
        });
        const settings = await client.getNotificationSettings();
        expect(settings[0]).toHaveProperty('category_id');
    });

    it('updates notification settings successfully', async () => {
        const newSettings = { category_id: 1, is_email: false, is_push: false }; // example change
        await expect(client.setNotificationSettings(newSettings)).resolves.not.toThrow();
        const settings = await client.getNotificationSettings();

        // Verify the settings were updated correctly
        expect(settings[0].is_email).toBe(false);
        expect(settings[0].is_push).toBe(false);
    });

    it('searches submissions correctly', async () => {
        const searchOptions = { tags: ['original'] };
        const result = await client.searchSubmissions(searchOptions);
        expect(result.data).not.toHaveLength(0);
    });

    it('retrieves a submission by ID correctly', async () => {
        const submissionId = 24846188;
        const submission = await client.getSubmission(submissionId);

        expect(submission.id).toBe(submissionId);
    });

    it('searches books correctly', async () => {
        const searchOptions = { order_by: 'popularity' }; // Example search
        const result = await client.searchBooks(searchOptions);
        expect(result.data).not.toHaveLength(0);
    });

    it('retrieves a book by ID correctly', async () => {
        const bookId = 385168; // Example ID
        const book = await client.getBook(bookId);
        expect(book.id).toBe(bookId);
    });
});
