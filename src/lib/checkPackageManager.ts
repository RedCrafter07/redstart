/**
 * @license GPL3
 * @author RedCrafter07 <https://github.com/RedCrafter07>
 */

import { execSync } from 'child_process';

export default async function checkPackageManager(
    packageManager: 'npm' | 'yarn' | 'pnpm'
) {
    //   check if package manager is installed

    try {
        const packageManagerInstalled = await execSync(
            `${packageManager} --version`
        )
            .toString()
            .trim();

        if (packageManagerInstalled) {
            return true;
        }
    } catch (error) {
        return false;
    }
}
