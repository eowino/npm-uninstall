import { execSync } from 'child_process';
import { existsSync } from 'fs';
import inquirer from 'inquirer';
import { join } from 'path';

interface IDependencies {
    dependencies: string[];
    devDependencies: string[];
    optionalDependencies: string[];
}

enum DependencyType {
    DEPENDENCIES = 'dependencies',
    DEV_DEPENDENCIES = 'devDependencies',
    OPTIONAL_DEPENDENCIES = 'optionalDependencies'
}

const MAX_CLIMB = 10;

async function inquireDependencies({ dependencies, devDependencies, optionalDependencies }: IDependencies) {
    const { choice }: { choice: string } = await inquirer.prompt({
        choices: Object.values(DependencyType),
        message: 'Which dependencies would you like to delete?',
        name: 'choice',
        type: 'checkbox'
    });

    const depsChoice: string[] = [];

    if (choice.includes(DependencyType.DEPENDENCIES)) {
        depsChoice.push(...dependencies);
    }

    if (choice.includes(DependencyType.DEV_DEPENDENCIES)) {
        depsChoice.push(...devDependencies);
    }

    if (choice.includes(DependencyType.OPTIONAL_DEPENDENCIES)) {
        depsChoice.push(...optionalDependencies);
    }

    const { depsToDelete }: { depsToDelete: string[] } = await inquirer.prompt({
        choices: depsChoice,
        message: 'Select the packages you want to uninstall',
        name: 'depsToDelete',
        type: 'checkbox'
    });

    return depsToDelete;
}

function getPath(count: number) {
    let path = '';
    for (let i = 0; i < count; i++) {
        path += '../';
    }

    return path;
}

function getDependenciesFromPackage(): IDependencies {
    const pkgJson = 'package.json';

    let pkgFound = false;
    let iteration = 0;
    let path = '';

    while (!pkgFound && iteration <= MAX_CLIMB) {
        path = join(process.cwd(), getPath(iteration), pkgJson);
        pkgFound = existsSync(path);
        iteration += 1;
    }

    if (!pkgFound) {
        console.error(`Climbed ${MAX_CLIMB} without finding package.json 😞`);
        process.exit();
    }

    try {
        const packageJson = require(path) ?? {};
        const dependencies: IDependencies = {
            dependencies: [],
            devDependencies: [],
            optionalDependencies: []
        };

        dependencies.dependencies = Object.keys(packageJson.dependencies || {});
        dependencies.devDependencies = Object.keys(packageJson.devDependencies || {});
        dependencies.optionalDependencies = Object.keys(packageJson.optionalDependencies || {});

        return dependencies;
    } catch (error) {
        console.error(`Found ${pkgJson} but was not able to parse it.`, error);
        return process.exit();
    }
}

function getSaveFlag(dependencyType: DependencyType) {
    switch (dependencyType) {
        case DependencyType.DEPENDENCIES:
            return 'save';
        case DependencyType.DEV_DEPENDENCIES:
            return 'save-dev';
        case DependencyType.OPTIONAL_DEPENDENCIES:
            return 'save-optional';
    }
}

function getDependencyType(depsToDelete: string[], allDependencies: IDependencies): IDependencies {
    const dependencies: string[] = [];
    const devDependencies: string[] = [];
    const optionalDependencies: string[] = [];

    depsToDelete.forEach((dependency) => {
        if (allDependencies.dependencies.includes(dependency)) {
            dependencies.push(dependency);
        } else if (allDependencies.devDependencies.includes(dependency)) {
            devDependencies.push(dependency);
        } else if (allDependencies.optionalDependencies.includes(dependency)) {
            optionalDependencies.push(dependency);
        }
    });

    return {
        dependencies,
        devDependencies,
        optionalDependencies
    };
}

(async () => {
    const allDependencies = getDependenciesFromPackage();

    if (!allDependencies.dependencies.length && !allDependencies.devDependencies.length && !allDependencies.optionalDependencies.length) {
        console.log('\nNo dependencies found');
        process.exit();
    }

    const depsToDelete = await inquireDependencies(allDependencies);

    if (!depsToDelete.length) {
        console.log('\nNo dependencies selected');
        process.exit();
    }

    const formattedDepsToDelete = getDependencyType(depsToDelete, allDependencies);

    Object.keys(formattedDepsToDelete).forEach((type) => {
        const dependencyType = type as DependencyType;
        const dependencies = formattedDepsToDelete[dependencyType];
        const saveFlag = getSaveFlag(dependencyType);

        if (dependencies.length) {
            console.log('\n🛠  Uninstalling:', dependencies);
            execSync(`npm uninstall --${saveFlag} ${dependencies.join(' ')}`);
            console.log('\n🏁  Uninstalled:', dependencies);
        }
    });
})();
