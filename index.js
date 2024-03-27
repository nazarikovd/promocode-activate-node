const iconv = require('iconv-lite');
const axios = require('axios');
const fs = require('fs');
const promos = fs.readFileSync('./promos.txt').toString().split("\n");
const cookies = fs.readFileSync('./cookies.txt').toString();
const capsol = require('./cap.js')
async function getHash(cookie) {
	let headers = {
		'authority': 'vk.com',
		'accept': '*/*',
		'accept-language': 'en-US,en;q=0.9,ru;q=0.8',
		'Accept-Encoding': 'gzip, deflate, br, zstd',
		'content-type': 'application/x-www-form-urlencoded',
		'cookie': cookie,
		'origin': 'https://vk.com',
		'referer': 'https://vk.com/settings?act=payments&w=promocode',

		'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
		'x-requested-with': 'XMLHttpRequest',
	}
	let data = {
		'act': 'show',
		'al': '1',
		'dmcah': '',
		'is_znav': '1',
		'loc': 'settings',
		'ref': '',
		'w': 'promocode',
	}
	let response = await axios.post('https://vk.com/wkview.php?act=show', data, {
		headers: headers
	})
	let data2 = response.data.payload.toString()
	return data2.split('hash: \'')[1].split('\'')[0]
}

async function activate_promocode(cookie, hash, promocode, sid = null, key = null) {
	let headers = {
		'authority': 'vk.com',
		'accept': '*/*',
		'accept-language': 'en-US,en;q=0.9,ru-RU;q=0.8,ru;q=0.7',
		'accept-Encoding': 'gzip, deflate, br, zstd',
		'content-type': 'application/x-www-form-urlencoded',
		'cookie': cookie,
		'origin': 'https://vk.com',
		'referer': 'https://vk.com/settings?act=payments&w=promocode',
		'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
		'x-requested-with': 'XMLHttpRequest',
	}
	let data = {
		'act': 'activate',
		'al': '1',
		'hash': hash,
		'promo_code': promocode,
	}
	if (sid) {
		data.captcha_sid = sid
		data.captcha_key = key
	}
	let response = await axios.post('https://vk.com/promo_codes.php?act=activate', data, {
		headers: headers, responseType: 'arraybuffer', responseEncoding: 'binary'
	})
	let json = iconv.decode(Buffer.from(response.data), 'windows-1251')
	json = JSON.parse(json)
	json = json.payload
	if (json[0] == '2') {
		console.log(`[${promocode}]: captcha solving...`)
		let sidd = JSON.parse(json[1][0])
		let keyy = await capsol(JSON.parse(json[1][4]));

		return activate_promocode(cookie, hash, promocode, sidd, keyy[0])
	}

	if (json[1][0].status) {
		if (json[1][0].status == "error") {
			return "bad promocode"
		}
		if (json[1][0].status == "success") {
			return "activated! balance: "+json[1][0].data.balance
		}
	}
	throw new Error('something wrong '+json) 
}

async function main(){
	let cookie = cookies
	let hash = await getHash(cookie)
	for(let promocode of promos){
		promocode = promocode.replace("\r", "")
		let status = await activate_promocode(cookie, hash, promocode)
		console.log(`[${promocode}]: ${status}`)
	}
}
main()
