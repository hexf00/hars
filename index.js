/**
 * hars
 * A .har file-based replication / replay / local / offline server.
 * @licence MIT
 * @version 0.1.0
 * @author hexf00@5920Team
 * @date 2016-11-21
 */

const fs = require('fs')
const path = require('path')
const url = require('url')
const sift = require('sift')
const http = require('http')
const zlib = require('zlib')

/**
 * 配置项 config
 */

let arg = process.argv.slice(2,3)
const harPath = arg.length ? arg[0] : 'test.har'
const hostname = '127.0.0.1'
const port = 5920


const getText = (responseContent) => {
	switch (responseContent.mimeType) {
		case 'image/png':
		case 'image/jpeg':
		case 'image/gif':
		case 'application/x-font-woff':
		case 'application/octet-stream':
			//二进制
			return new Buffer(responseContent.text, 'base64')
			break
		default:
			//文本
			return responseContent.text
	}
}

let result
try{
    result = fs.readFileSync(harPath)
}catch(e) {
	console.error(`har file ${harPath} not exist.`)
	return
}

let har = JSON.parse(result)

delete result

const server = http.createServer((req, res) => {
	let result = sift({
		'request.url': new RegExp(req.url.replace('?', '\\?'))
	}, har.log.entries)
	if (result.length) {
		res.statusCode = result[0].response.status
		res.setHeader('Content-Type', result[0].response.content.mimeType)
		res.setHeader('Content-Encoding', 'gzip')
		res.end(zlib.gzipSync(getText(result[0].response.content)))
	} else {
		res.statusCode = 404
		res.setHeader('Content-Type', 'text/plain')
		res.end('404\n')
	}
})

server.listen(port, hostname, () => {
	console.log(`Server running at http://${hostname}:${port}/`)
})
