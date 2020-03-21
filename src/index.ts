import fs, { stat } from 'fs'
import sift from 'sift'
import http from 'http'
import zlib from 'zlib'
import HarTool from './HarTool'
import { Har as HarFormat } from "har-format"

function getHarRawByArgv() {

  console.log(process.env.inputFile);

  let harPath;

  if (process.env.inputFile) {
    harPath = process.env.inputFile
  } else {
    if (process.argv.length != 3) {
      throw Error('Missing file parameter');
    }
    harPath = process.argv[2];
  }



  const result = fs.readFileSync(harPath)
  const harRaw: HarFormat = JSON.parse(result.toString())

  return harRaw
}


try {
  const harRaw = getHarRawByArgv();
  var har = new HarTool({
    raw: harRaw
  })

  har.exportEntriesToFile();

} catch (error) {
  console.error(error.toString())
  process.exit()
}






// let har = JSON.parse(result)

/**
 * 配置项 config
 */
// const hostname = '127.0.0.1'
// const port = 5920


// const getText = (responseContent) => {
//   switch (responseContent.mimeType) {
//     case 'image/png':
//     case 'image/jpeg':
//     case 'image/gif':
//     case 'application/x-font-woff':
//     case 'application/octet-stream':
//       //二进制
//       return new Buffer(responseContent.text, 'base64')
//       break
//     default:
//       //文本
//       return responseContent.text
//   }
// }




// const server = http.createServer((req, res) => {
//   let result = sift({
//     'request.url': new RegExp(req.url.replace('?', '\\?'))
//   }, har.log.entries)
//   if (result.length) {
//     res.statusCode = result[0].response.status
//     res.setHeader('Content-Type', result[0].response.content.mimeType)
//     res.setHeader('Content-Encoding', 'gzip')
//     res.end(zlib.gzipSync(getText(result[0].response.content)))
//   } else {
//     res.statusCode = 404
//     res.setHeader('Content-Type', 'text/plain')
//     res.end('404\n')
//   }
// })

// server.listen(port, hostname, () => {
//   console.log(`Server running at http://${hostname}:${port}/`)
// })
