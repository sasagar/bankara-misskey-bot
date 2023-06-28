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
     * Return stage string to post.
     * @since v1.0.6
     * @param {Object} shiftObj - Object of shift.
     * @returns {string} - Stage names.
     */
    static stageMaker(shiftObj) {
        let res = '';
        shiftObj.forEach((obj, index, arr) => {
            res = obj.name;

            if (index !== arr.length - 1) {
                res += " / ";
            }
        });
        return res;
    }

    bankaraRuleStageMessageMaker(cat) {
        const text = (cat === 'OPEN') ? 'オープン' : 'チャレンジ';
        return `**${text}** ${this.ruleBadgeId(this.shift[cat].rule.name)} ${this.shift[cat].rule.name}\n`
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

        msg += `${this.category + this.catBadgeId(this.category)}**`;

        if (this.category !== 'イベントマッチ' && !this.now) {
            msg += `\n${format(utcToZonedTime(new Date(this.shift.startunix * 1000), 'Asia/Tokyo'), 'M月d日(E) HH:mm', { locale: ja })}スタート！`;
        }
        msg += "\n";

        if (this.category === "バンカラマッチ") {
            msg += this.bankaraRuleStageMessageMaker('CHALLENGE');

            msg += "ステージ: ";
            msg += this.stageMaker(this.shift.CHALLENGE.stage);

            msg += "\n";
            msg += this.bankaraRuleStageMessageMaker('OPEN');

            msg += "ステージ: ";

            msg += this.stageMaker(this.shift.OPEN.stage);
        } else {
            if (this.category === "イベントマッチ") {
                msg += `**${this.shift.name}**\n`;
                // msg += this.shift.desc;
                // msg += "\n";
                msg += `<small>${this.shift.regulation.replace(/<br \/>/g, "\n")}</small>\n`;
            }
            msg += `${this.ruleBadgeId(this.shift.rule.name)} ${this.shift.rule.name}\n`;

            if (this.category === "イベントマッチ") {
                this.shift.time.forEach((obj, index, arr) => {
                    msg += `・${format(utcToZonedTime(new Date(obj.startunix * 1000), 'Asia/Tokyo'), 'M月d日(E) HH:mm', { locale: ja })} - ${format(utcToZonedTime(new Date(obj.endunix * 1000), 'Asia/Tokyo'), 'M月d日(E) HH:mm', { locale: ja })}`

                    if (index !== arr.length - 1) {
                        msg += "\n";
                    }
                });
                msg += "\n";
            }

            msg += "ステージ: ";

            msg += this.stageMaker(this.shift.stage);
        }
        return msg;
    }
}

export default MessageMaker;