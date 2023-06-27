/* eslint-disable camelcase */
import * as Misskey from 'misskey-js';
import axios from 'axios';
import schedule from 'node-schedule';
import * as dotenv from 'dotenv';

// eslint-disable-next-line import/extensions
import MessageMaker from './message-maker.js';

// 設定項目読み込み
dotenv.config();
const { BOT_TOKEN, MISSKEY_URL, JSON_URL, npm_package_version } = process.env;

process.title = 'Bankara Misskey Bot';

// Misskeyへ接続
/**
 * Misskey Client
 * @since v1.0.0
 * @type {Misskey}
 * @instance
 */
const cli = new Misskey.api.APIClient(
    {
        origin: MISSKEY_URL,
        credential: BOT_TOKEN
    });

// メッセージ送信用function
/**
 * Send message to Misskey.
 * @since v1.0.0
 * @param {string} msg - Message to send. 
 * @param {boolean} visibility - Flag of visibility.
 * @param {boolean} cw - Flag of CW.
 * @param {string} replyId - User ID to reply.
 * @returns {void}
 */
const sendMessage = async (msg, visibility = null, cw = null, replyId = null) => {
    console.log('func: sendMessage');
    const args = { text: msg };
    if (visibility) {
        args.visibility = visibility;
    }
    if (cw) {
        args.cw = cw;
    }
    if (replyId) {
        args.replyId = replyId;
    }
    await cli.request('notes/create', args).catch(e => { console.error(e) });
}

/**
 * Make and send message to Misskey.
 * @since v1.0.0
 * @returns {void}
 */
const bankara = async () => {
    try {
        const res = await axios.get(JSON_URL);

        const regularNow = new MessageMaker(res.data.regular[0], "レギュラーマッチ", true);
        const regularNext = new MessageMaker(res.data.regular[1], "レギュラーマッチ", false);
        const regularMsg = `${regularNow.maker()}\n---\n${regularNext.maker()}`;

        const bankaraNow = new MessageMaker(res.data.bankara[0], "バンカラマッチ", true);
        const bankaraNext = new MessageMaker(res.data.bankara[1], "バンカラマッチ", false);
        const bankaraMsg = `${bankaraNow.maker()}\n---\n${bankaraNext.maker()}`;

        const xNow = new MessageMaker(res.data.xmatch[0], "Xマッチ", true,);
        const xNext = new MessageMaker(res.data.xmatch[1], "Xマッチ", false);
        const xMsg = `${xNow.maker()}\n---\n${xNext.maker()}`;

        await sendMessage(regularMsg);
        await sendMessage(bankaraMsg);
        await sendMessage(xMsg);

        if (res.data.event.length > 0) {
            const eventNow = new MessageMaker(res.data.event[0], "イベントマッチ", true);
            let eventMsg = eventNow.maker();
            if (res.data.event.length > 2) {
                const eventNext = new MessageMaker(res.data.event[1], "イベントマッチ", false);
                eventMsg += `\n---\n${eventNext.maker()}`;
            }
            await sendMessage(eventMsg);
        }
    } catch (e) {
        console.error(e);
        sendMessage('$[x2 :error:]\nAPIのデータに問題があるため、定時のシフトのお知らせができませんでした。');
    }

}

// スケジュール。奇数時間の正時に実行。
/**
 * Regular schedule.
 * @since v1.0.0
 * @type {schedule}
 */
// eslint-disable-next-line no-unused-vars
const bankarajob = schedule.scheduleJob('0 0 1-23/2 * * *', () => { bankara() });

/**
 * Return time.
 * @since v1.0.1
 * @param {int} restOfHours - Rest of hours of the shift.
 * @param {Object} data - Shift object.
 * @param {int} nowUnix - Unix Time of now.
 * @returns {Object} - New end time and new rest of hours.
 */
// const returnTime = (restOfHours, data, nowUnix) => {
//     let newEndUnix;
//     let newRestOfHours;
//     if (restOfHours === 0) {
//         newEndUnix = data[1].endunix;
//         newRestOfHours = Math.ceil((newEndUnix - nowUnix) / (60 * 60));
//     } else {
//         newEndUnix = data[0].endunix;
//         newRestOfHours = Math.ceil((newEndUnix - nowUnix) / (60 * 60));
//     }
//     return { newEndUnix, newRestOfHours };
// }

// bankara();

// 起動時メッセージ
/**
 * Send up message to misskey
 * @since v1.0.0
 * @returns {void}
 */
const upNotice = () => {
    sendMessage(`【Bot再起動通知】v${npm_package_version} で起動しました。`);
}

upNotice();
