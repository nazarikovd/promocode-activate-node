const fs = require('fs')
const os = require('os')
const promos = fs.readFileSync('./promos.txt').toString().split(os.EOL);
const cookies = fs.readFileSync('./cookies.txt').toString();
const VKPromo = require('./vkpromo.js')
console.clear()
new VKPromo(cookies, promos)