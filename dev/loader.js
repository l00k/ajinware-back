import { resolve as resolveTs } from 'ts-node/esm';
import * as tsConfigPaths from 'tsconfig-paths';
import { pathToFileURL } from 'url';
import * as path from 'node:path';

const { absoluteBaseUrl, paths } = tsConfigPaths.loadConfig();

const aliases = {};
for (let [ alias, def ] of Object.entries(paths)) {
    // remove trailing *
    alias = alias.slice(0, -1);
    aliases[alias] = def.map((p) => p.slice(0, -1));
}

function matchPath (specifier)
{
    for (let [ alias, def ] of Object.entries(aliases)) {
        if (specifier.startsWith(alias)) {
            const unaliasedPath = specifier.replace(alias, def[0]);
            return path.resolve(
                absoluteBaseUrl,
                unaliasedPath
            );
        }
    }
}

export function resolve (specifier, ctx, defaultResolve)
{
    const match = matchPath(specifier);
    return match
        ? resolveTs(pathToFileURL(`${match}`).href, ctx, defaultResolve)
        : resolveTs(specifier, ctx, defaultResolve);
}

export { load, transformSource } from 'ts-node/esm';
