import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
register('./dev/loader.js', pathToFileURL('./'));
