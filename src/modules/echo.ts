/**
 * @license GPL3
 * @author FishingHacks <https://github.com/FishingHacks>
 */

import chalk from 'chalk';
import { is } from '../lib/utils';
import { Module } from '../types';

const translator = {
    red: chalk.redBright,
    green: chalk.greenBright,
    yellow: chalk.yellowBright,
    blue: chalk.blueBright,
    white: chalk.whiteBright,
    black: chalk.blackBright,
    purple: chalk.magentaBright,
    aqua: chalk.cyanBright,
};

export default {
    validate(config) {
        return (
            is.set(config.message) &&
            is.str(config.message) &&
            config.message !== ''
        );
    },
    initiate(config) {
        if (config.color && Object.keys(translator).includes(config.color))
            return console.log(
                translator[config.color as keyof typeof translator](
                    config.message
                )
            );
        else return console.log(config.message);
    },
    required: ['message'],
    optional: ['color'],
} as Module;
