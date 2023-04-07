import {
    createShortUrl,
    IShortUrlParam,
    SHORT_CODE_MAX_LENGTH,
    SHORT_URL_PREFIX,
    StatusCode,
} from '../src/shortUrl';
import { nanoid } from 'nanoid';
import { ShortUrlError } from '../src/ShortUrlError';
import {
    closeDb,
    createShortUrlTable,
    getDb,
    loadDb,
    SHORT_URL_TABLE,
} from '../src/db';

const testLongUrl =
    'https://github.com/lyf-coder/interview-assignments/tree/url-shortener';

describe('shortUrl', () => {
    describe('createShortUrl', () => {
        beforeAll(async () => {
            loadDb({
                client: 'sqlite3',
                connection: {
                    filename: './data.db',
                },
            });
            await createShortUrlTable();
        });

        beforeEach(async () => {
            // 清除表内容
            await getDb()(SHORT_URL_TABLE).del();
        });
        it('no specify shortCode', async () => {
            const shortUrlParam: IShortUrlParam = {
                longUrl: testLongUrl,
            };
            const result = await createShortUrl(shortUrlParam);
            expect(result.code).toBe(StatusCode.Success);
            expect(result.shortUrl).toBeDefined();
            console.log(result);
            expect(result.shortUrl.length).toBe(
                SHORT_CODE_MAX_LENGTH + SHORT_URL_PREFIX.length
            );
        });
        it('exist longUrl', async () => {
            const shortUrlParam: IShortUrlParam = {
                longUrl: testLongUrl,
            };
            const result = await createShortUrl(shortUrlParam);
            expect(result.code).toBe(StatusCode.Success);
            expect(result.shortUrl).toBeDefined();
            expect(result.shortUrl.length).toBe(
                SHORT_CODE_MAX_LENGTH + SHORT_URL_PREFIX.length
            );

            const result2 = await createShortUrl(shortUrlParam);
            expect(result2.code).toBe(StatusCode.Success);
            expect(result2.shortUrl).toBe(result.shortUrl);
        });

        it('specify shortCode', async () => {
            const shortUrlParam: IShortUrlParam = {
                longUrl: testLongUrl,
                shortCode: nanoid(Math.random() * SHORT_CODE_MAX_LENGTH),
            };
            const result = await createShortUrl(shortUrlParam);
            expect(result.code).toBe(StatusCode.Success);
            expect(result.shortUrl).toBeDefined();
            expect(result.shortUrl).toBe(
                `${SHORT_URL_PREFIX}${shortUrlParam.shortCode}`
            );
        });

        it('specify exist shortCode', async () => {
            const shortCode = nanoid(Math.random() * SHORT_CODE_MAX_LENGTH);
            const shortUrlParam: IShortUrlParam = {
                longUrl: testLongUrl,
                shortCode,
            };
            const result = await createShortUrl(shortUrlParam);
            expect(result.code).toBe(StatusCode.Success);
            expect(result.shortUrl).toBeDefined();
            expect(result.shortUrl).toBe(
                `${SHORT_URL_PREFIX}${shortUrlParam.shortCode}`
            );

            try {
                await createShortUrl(shortUrlParam);
            } catch (e) {
                expect(e).toStrictEqual(new ShortUrlError('短码已存在！'));
            }
        });

        it('specify overlong shortCode', async () => {
            const shortUrlParam: IShortUrlParam = {
                longUrl: testLongUrl,
                shortCode: nanoid(SHORT_CODE_MAX_LENGTH + 1),
            };
            try {
                await createShortUrl(shortUrlParam);
            } catch (e) {
                expect(e).toStrictEqual(new ShortUrlError('短码过长！'));
            }
        });

        it('wrong long url format', async () => {
            const shortUrlParam: IShortUrlParam = {
                longUrl: testLongUrl.substring(8),
                shortCode: nanoid(SHORT_CODE_MAX_LENGTH + 1),
            };
            try {
                await createShortUrl(shortUrlParam);
            } catch (e) {
                expect(e).toStrictEqual(
                    new ShortUrlError('长域名格式不正确！')
                );
            }
        });
        afterAll(async () => {
            await getDb().schema.dropTableIfExists(SHORT_URL_TABLE);
            await closeDb();
        });
    });
});
