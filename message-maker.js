import fs from 'fs';
import { format, utcToZonedTime } from 'date-fns-tz';
// eslint-disable-next-line import/extensions
import ja from 'date-fns/locale/ja/index.js';

/**
 * Class to generate message.
 * @since v1.0.0
 * @param { Object } shift - Shift object.
 * @param { string } category - The Category of the rules.
 * @param { boolean } now - Now or not.
 */
const MessageMaker = class {
    constructor(shift, category, now = true) {
        this.shift = shift;
        this.category = category;
        this.now = now;

        // ルールのバッジを選べるように
        /**
         * Object of rule badges.
         * @since v1.0.0
         * @type {Object}
         */
        this.ruleBadges = JSON.parse(fs.readFileSync('./JSON/rules.json'));

        /**
         * Object of category badges.
         * @since v1.0.0
         * @type {Object}
         */
        this.catBadges = JSON.parse(fs.readFileSync('./JSON/categories.json'));
    }

    // ルールバッジ存在チェック
    /**
     * Get rule badge tag.
     * @since v1.0.0
     * @param {string} name - Name of the rule.
     * @returns {string} - Badge image tag or blank string
     */
    ruleBadgeId(name) {
        let result;

        if (Reflect.has(this.ruleBadges, name)) {
            result = this.ruleBadges[name];
        } else {
            result = "";
        }

        return result;
    }

    // カテゴリバッジ存在チェック
    /**
     * Get category badge tag.
     * @since v1.0.0
     * @param {string} name - Name of the category.
     * @returns {string} - Badge image tag or blank string
     */
    catBadgeId(name) {
        let result;

        if (Reflect.has(this.catBadges, name)) {
            result = this.catBadges[name];
        } else {
            result = "";
        }

        return result;
    }

    /**
     * Make message to send.
     * @since v1.0.0
     * @returns {string} - Message to send
     */
    maker() {
        console.log('func: message.maker');
        /** @type {string} */
        let msg = "";

        if (this.now) {
            msg += "**ただいまの";
        } else {
            msg += "**次の";
        }

        msg += this.category;
        msg += this.catBadgeId(this.category);
        msg += "**";

        if (this.category !== 'イベントマッチ' && !this.now) {
            msg += "\n";
            msg += `${format(utcToZonedTime(new Date(this.shift.startunix * 1000), 'Asia/Tokyo'), 'M月d日(E) HH:mm', { locale: ja })}スタート！`;
        }
        msg += "\n";

        if (this.category === "バンカラマッチ") {
            msg += "**チャレンジ**";
            msg += " ";
            msg += this.ruleBadgeId(this.shift.CHALLENGE.rule.name);
            msg += " ";
            msg += this.shift.CHALLENGE.rule.name;
            msg += "\n";

            msg += "ステージ: ";

            this.shift.CHALLENGE.stage.forEach((obj, index, arr) => {
                msg += obj.name;

                if (index !== arr.length - 1) {
                    msg += " / ";
                }
            });
            msg += "\n";

            msg += "**オープン**";
            msg += " ";
            msg += this.ruleBadgeId(this.shift.OPEN.rule.name);
            msg += " ";
            msg += this.shift.OPEN.rule.name;
            msg += "\n";

            msg += "ステージ: ";

            this.shift.CHALLENGE.stage.forEach((obj, index, arr) => {
                msg += obj.name;

                if (index !== arr.length - 1) {
                    msg += " / ";
                }
            });
        } else {
            if (this.category === "イベントマッチ") {
                msg += `**${this.shift.name}**`;
                msg += "\n";
                // msg += this.shift.desc;
                // msg += "\n";
                msg += "<small>";
                msg += this.shift.regulation.replace(/<br \/>/g, "\n");
                msg += "</small>";
                msg += "\n";
            }
            msg += this.ruleBadgeId(this.shift.rule.name);
            msg += " ";
            msg += this.shift.rule.name;
            msg += "\n";

            if (this.category === "イベントマッチ") {
                this.shift.time.forEach((obj, index, arr) => {
                    msg += "・";
                    msg += format(utcToZonedTime(new Date(obj.startunix * 1000), 'Asia/Tokyo'), 'M月d日(E) HH:mm', { locale: ja });
                    msg += " - ";
                    msg += format(utcToZonedTime(new Date(obj.endunix * 1000), 'Asia/Tokyo'), 'M月d日(E) HH:mm', { locale: ja })

                    if (index !== arr.length - 1) {
                        msg += "\n";
                    }
                });
                msg += "\n";
            }

            msg += "ステージ: ";

            this.shift.stage.forEach((obj, index, arr) => {
                msg += obj.name;

                if (index !== arr.length - 1) {
                    msg += " / ";
                }
            });
        }
        return msg;
    }
}

export default MessageMaker;