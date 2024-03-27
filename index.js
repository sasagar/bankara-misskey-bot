/* eslint-disable camelcase */
import * as Misskey from "misskey-js";
import axios from "axios";
import schedule from "node-schedule";
// import * as dotenv from "dotenv";

// eslint-disable-next-line import/extensions
import MessageMaker from "./message-maker.js";

// 設定項目読み込み
// dotenv.config();
const { BOT_TOKEN, MISSKEY_URL, JSON_URL, npm_package_version } = process.env;

process.title = "Bankara Misskey Bot";

// Misskeyへ接続
/**
 * Misskey Client
 * @since v1.0.0
 * @type {Misskey}
 * @instance
 */
const cli = new Misskey.api.APIClient({
	origin: MISSKEY_URL,
	credential: BOT_TOKEN,
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
const sendMessage = async (
	msg,
	visibility = null,
	cw = null,
	replyId = null,
) => {
	console.log("func: sendMessage");
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
	await cli.request("notes/create", args).catch((e) => {
		console.error(e);
	});
};

/**
 * Get schedule data.
 * Since v1.0.2
 * Updated v2.0.0
 * @since v1.0.2
 * @returns {Object} - Schedule data.
 */
const getJson = async () => {
	try {
		const regular = await axios.get(`${JSON_URL}/regular/schedule`);
		const bankara_open = await axios.get(`${JSON_URL}/bankara-open/schedule`);
		const bankara_challenge = await axios.get(
			`${JSON_URL}/bankara-challenge/schedule`,
		);
		const x = await axios.get(`${JSON_URL}/x/schedule`);
		const event_tmp = await axios.get(`${JSON_URL}/event/schedule`);
		const event = event_tmp.data.results.filter((e) => e.rule != null);
		const json = {
			regular: regular.data.results,
			bankara_open: bankara_open.data.results,
			bankara_challenge: bankara_challenge.data.results,
			x: x.data.results,
			event: event,
		};

		return json;
	} catch (e) {
		console.error(e);
		sendMessage(
			"$[x2 :error:]\nAPIのデータに問題があるため、定時のシフトのお知らせができませんでした。",
		);
		return null;
	}
};

/**
 * Create note and send.
 * @since v1.0.5
 * @param {Object} shift - All shift includes schedules to send.
 * @param {int} index - Array index of origin schedule.
 * @param {string} category - Category name.
 * @returns {void}
 */

const sendNote = async (shift, index = 0, category = "") => {
	console.log("func: sendNote");
	try {
		const noteNow = new MessageMaker(shift[index], category, true);
		const noteNext = new MessageMaker(shift[index + 1], category, false);
		const noteMsg = `${noteNow.maker()}\n---\n${noteNext.maker()}`;
		sendMessage(noteMsg);
	} catch (e) {
		console.error(e);
		sendMessage(`$[x2 :error:]\nNoteの送信に失敗しました。(${category})`);
	}
};

/**
 * Create note and send.
 * @since v1.0.8
 * @param {Object} res - All shift includes schedules to send.
 * @param {int} now - Unixtime of now.
 * @returns {void}
 */

const eventSendNote = (res, now) => {
	console.log("func: eventSendNote");
	let eventNow;
	let eventNext;
	if (res.length >= 2 && now > res[0].start_time) {
		eventNow = new MessageMaker(res[0], "イベントマッチ", true);
		eventNext = new MessageMaker(res[1], "イベントマッチ", false);
	} else {
		eventNow = new MessageMaker(res[0], "イベントマッチ", false);
	}

	let eventMsg = eventNow.maker();
	if (eventNext != null) {
		eventMsg += `\n---\n${eventNext.maker()}`;
	}
	sendMessage(eventMsg);
};

/**
 * Make and send message to Misskey.
 * @since v1.0.0
 * @returns {void}
 */
const bankara = async () => {
	console.log("func: bankara");
	const res = await getJson();
	const now = new Date();
	const regular_time = new Date(res.regular[0].end_time);

	const i = regular_time < now ? 1 : 0;

	sendNote(res.regular, i, "レギュラーマッチ");
	sendNote(res.bankara_open, i, "バンカラマッチ（オープン）");
	sendNote(res.bankara_challenge, i, "バンカラマッチ（チャレンジ）");
	sendNote(res.x, i, "Xマッチ");

	try {
		if (res.event.length > 1) {
			eventSendNote(res.event, now);
		}
	} catch (e) {
		console.error(e);
		sendMessage("$[x2 :error:]\nNoteの送信に失敗しました。(イベントマッチ)");
	}
};

// スケジュール。奇数時間の正時に実行。
/**
 * Regular schedule.
 * @since v1.0.0
 * @type {schedule}
 */
// eslint-disable-next-line no-unused-vars
const bankarajob = schedule.scheduleJob("0 0 1-23/2 * * *", () => {
	bankara();
});

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
};

upNotice();
