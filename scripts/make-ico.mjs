import { readFileSync, writeFileSync } from 'fs';
import toIco from 'to-ico';

const png = readFileSync('icon256.png');
const ico = await toIco([png]);
writeFileSync('icon256.ico', ico);
console.log('icon256.ico written');
