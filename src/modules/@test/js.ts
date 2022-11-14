/**
 * @license GPL3
 * @author FishingHacks (https://github.com/FishingHacks)
 */

import { createSpinner } from 'nanospinner';
import { join } from 'path';
import { is } from '../../lib/utils';
import { Module } from '../../types';

export default {
    validate(config, cwd) {
        return (
            is.set(config.testfile) &&
            (config.testfile.endsWith('.mjs') ||
                config.testfile.endsWith('.js'))
        );
    },
    initiate(config, cwd) {
        const testspinner = createSpinner('Loading testfile...');
        try {
            let test = require(join(cwd, config.testfile));
            if (typeof test?.default === 'function') test = test.default; // in case test is a module
            if (!test || typeof test !== 'function')
                return testspinner.error({ text: 'Test file not found!' });
            const returnValue = test(cwd);
            if (returnValue === true)
                return testspinner.success({ text: 'Tests completed!' });
            else if (returnValue === false)
                return testspinner.error({ text: 'Tests failed!' });
            else if (typeof returnValue === 'number' && returnValue !== 0)
                return testspinner.success({
                    text: 'Tests completed!',
                });
            else if (typeof returnValue === 'number')
                return testspinner.error({
                    text:
                        'Tests failed! Tests failed: ' + returnValue.toString(),
                });
            else
                return testspinner.stop({
                    text: "The testing function didn't return a boolean or number.",
                });
        } catch (e) {
            testspinner.error({
                text: 'Error during the execution of the tests!',
            });
            console.error(e);
        }
    },
} as Module;
