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

        /**
         * Return stage string to post. 
         * @since v1.0.6
         * @param {Object} shiftObj - Object of shift.
         * @returns {string} - Stage names.
        */
        this.stageMaker = (shiftObj) => {
            console.log('func: MessageMaker.stageMaker');
            let res = '';
            shiftObj.forEach((obj, index, arr) => {
                res += obj.name;
                res += (index !== arr.length - 1) ? ' / ' : '';
            });
            return res;
        }
    }

    // ルールバッジ存在チェック
    /**
     * Get rule badge tag. 
     * @since v1.0.8
     * @param {string} name - Name of the rule.
     * @param {string} series - Name of the series. (rule || cat)
     * @returns {string} - Badge image tag or blank string
    */
    getBadgeId(name, series) {
        const obj = (series === 'rule') ? this.ruleBadges : this.catBadges;
        const result = (Reflect.has(obj, name)) ? obj[name] : "";
        return result;
    }

    /**
     * Return stage string to post. 
     * @since v1.0.6
     * @param {string} cat - Category of Bankara Match. (OPEN | CHALLENGE)
     * @returns {string} - Text of rules.
    */
    bankaraRuleStageMessageMaker(cat) {
        const text = (cat === 'OPEN') ? 'オープン' : 'チャレンジ';
        return `**${text}** ${this.getBadgeId(this.shift[cat].rule.name, 'rule')} ${this.shift[cat].rule.name}\n`
    }

    /**
     * Return schedule list.
     * @since v1.0.8
     * @param {Object} time - Object of time list.
     * @returns {string} - Text of time list.
     */
    timeList() {
        console.log('func: messageMaker.timeList');
        let res = '';
        this.shift.time.forEach((obj, index, arr) => {
            res += `・${format(utcToZonedTime(new Date(obj.startunix * 1000), 'Asia/Tokyo'), 'M月d日(E) HH:mm', { locale: ja })} - ${format(utcToZonedTime(new Date(obj.endunix * 1000), 'Asia/Tokyo'), 'M月d日(E) HH:mm', { locale: ja })}`;
            res += (index !== arr.length - 1) ? "\n" : '';
        });
        return res;
    }

    /**
     * Make message to send.
     * @since v1.0.0
     * @returns {string} - Message to send
    */
    maker() {
        console.log('func: messageMaker.maker');
        /** @type {string} */
        const rule = (this.category !== 'バンカラマッチ') ? `${this.getBadgeId(this.shift.rule.name, 'rule')} ${this.shift.rule.name}\n` : '';
        /** @type {string} */
        let msg = (this.now) ? "**ただいまの" : "**次の";

        msg += `${this.category + this.getBadgeId(this.category, 'cat')}**`;

        msg += (this.category !== 'イベントマッチ' && !this.now) ? `\n${format(utcToZonedTime(new Date(this.shift.startunix * 1000), 'Asia/Tokyo'), 'M月d日(E) HH:mm', { locale: ja })}スタート！` : '';
        msg += "\n";

        switch (this.category) {
            case 'バンカラマッチ':
                msg += this.bankaraRuleStageMessageMaker('CHALLENGE');
                msg += `ステージ: ${this.stageMaker(this.shift.CHALLENGE.stage)}`;
                msg += `\n${this.bankaraRuleStageMessageMaker('OPEN')}`;
                msg += `ステージ: ${this.stageMaker(this.shift.OPEN.stage)}`;
                break;
            case 'イベントマッチ':
                msg += `**${this.shift.name}**\n`;
                msg += `<small>${this.shift.regulation.replace(/<br \/>/g, "\n").replace(/\n\n/g, "\n")}</small>\n`;
                msg += `${rule + this.timeList()}\n`;
                msg += `ステージ: ${this.stageMaker(this.shift.stage)}`;
                break;
            default:
                msg += rule;
                msg += `ステージ: ${this.stageMaker(this.shift.stage)}`;
        }
        return msg;
    }
}

export default MessageMaker;