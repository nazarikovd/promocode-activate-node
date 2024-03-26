const {Rucaptcha} = require('rucaptcha-client');
const axios = require('axios');
const rucaptcha = new Rucaptcha(''); //rucapctha key
const fs = require('fs');
const promos = fs.readFileSync('./promos.txt').toString().split("\n");
const cookies = fs.readFileSync('./cookies.txt');

async function getHash(cookie) {
	let headers = {
		'authority': 'vk.com',
		'accept': '*/*',
		'accept-language': 'en-US,en;q=0.9,ru;q=0.8',
		'content-type': 'application/x-www-form-urlencoded',
		'cookie': cookie,
		'origin': 'https://vk.com',
		'referer': 'https://vk.com/settings?act=payments&w=promocode',
		'sec-ch-ua': '"Not:A-Brand";v="99", "Chromium";v="112"',
		'sec-ch-ua-mobile': '?0',
		'sec-ch-ua-platform': '"Linux"',
		'sec-fetch-dest': 'empty',
		'sec-fetch-mode': 'cors',
		'sec-fetch-site': 'same-origin',
		'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
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
		'accept-language': 'en-US,en;q=0.9,ru;q=0.8',
		'content-type': 'application/x-www-form-urlencoded',
		'cookie': cookie,
		'origin': 'https://vk.com',
		'referer': 'https://vk.com/settings?act=payments&w=promocode',
		'sec-ch-ua': '"Not:A-Brand";v="99", "Chromium";v="112"',
		'sec-ch-ua-mobile': '?0',
		'sec-ch-ua-platform': '"Linux"',
		'sec-fetch-dest': 'empty',
		'sec-fetch-mode': 'cors',
		'sec-fetch-site': 'same-origin',
		'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
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
		headers: headers
	})
	let json = response.data.payload
	if (json[0] == '2') {
		console.log(`[${promocode}]: captcha solving...`)
		let sid = JSON.parse(json[1][0])
		let key = await rucaptcha.solve(JSON.parse(json[1][4]));
		key = key.text
		return await activate_promocode(cookie, hash, promocode, sid, key)
	}
	if (json[1][0].status) {
		if (json[1][0].status == "error") {
			return "bad promocode"
		}
		if (json[1][0].status == "success") {
			return "activated! balance: "+json[1][0].data.balance
		}
	}
	return 'something wrong'
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
