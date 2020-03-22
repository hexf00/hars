import { Har as HarFormat, Entry, Har } from "har-format"
import path from 'path'
import url from 'url'
import fs, { stat } from 'fs'
import request from 'request'
import { resolve } from "dns"

export default class HarTool {
  public raw: HarFormat
  public outPath: string = ""

  constructor(entry: { raw: HarFormat }) {
    this.raw = entry.raw

    this.outPath = path.join(process.cwd(), 'output')
  }

  mkdir(dir: string) {
    if (fs.existsSync(dir)) {
      return
    } else {
      if (!fs.existsSync(path.dirname(dir))) {
        this.mkdir(path.dirname(dir))
      }
      fs.mkdirSync(dir)
    }
  }

  mineToExt(mine: string) {
    if (mine == "application/json") {
      return '.json';
    } else if (mine == "text/html") {
      return ".html";
    } else {
      console.log("未知mine", mine)
      return ""
    }
  }

  clearPath(dir: string) {
    const paths = fs.readdirSync(dir)
    paths.forEach(p => {
      const fullPath = path.join(dir, p)
      if (fs.statSync(fullPath).isDirectory()) {
        this.clearPath(fullPath)
      } else if (fs.statSync(fullPath).isFile()) {
        fs.unlinkSync(fullPath)
      }
    })
    fs.rmdirSync(dir)
  }

  exportEntryToFile(entry: { url: string; fileName: string; fileExt: string; mineType: string; fileDir: string; size: number; content: Buffer | undefined }) {
    this.mkdir(path.join(this.outPath, entry.fileDir))
    const fullPath = path.join(this.outPath, entry.fileDir, entry.fileName + (entry.fileExt === "" ? this.mineToExt(entry.mineType) : ""))
    fs.writeFileSync(fullPath, entry.content);
  }

  async downloadFile(url: string) {
    return new Promise((resolve, reject) => {

      console.log("downloadFile", url)
      request.get(url, (error, response, body) => {
        if (error) {
          reject(error)
        } else {
          if (response.statusCode == 200) {
            resolve(body)
          } else {

            reject("出错了" + url);
          }
        }
      })
    })

  }

  async checkSourceMap(entry: Entry) {
    // 应该做一个缓存 有的sourceMap文件特别大 可能多大20M

    // 2048
    const text = entry.response.content.text?.substr(-2048) || "";
    const flag = "//# sourceMappingURL="
    const startIndex = text.lastIndexOf(flag)

    if (startIndex === -1) {
      console.log("没有sourceMap文件", entry.request.url);
    } else {
      let urlObj = url.parse(entry.request.url)
      if (urlObj.pathname) {
        let pathObj = path.parse(urlObj.pathname)

        let sourceMapPath = text.substr(startIndex + flag.length);
        let sourceMapFullUrl = `${urlObj.protocol}//${urlObj.host}${pathObj.dir}${sourceMapPath}`;

        console.log(sourceMapFullUrl)
        let body = await this.downloadFile(sourceMapFullUrl)

        // console.log(body)


        this.mkdir(path.join(this.outPath, pathObj.dir))
        const fullPath = path.join(this.outPath, pathObj.dir, sourceMapPath)

        // console.log(fullPath)
        fs.writeFileSync(fullPath, body);
      }
    }


  }

  exportEntriesToFile() {
    this.clearPath(this.outPath)
    const entries = this.raw.log.entries

    entries.forEach(async entry => {
      const status = entry.response.status;
      if (status === 200 || status === 304) {
        const urlObj = url.parse(entry.request.url)
        if (urlObj.pathname) {
          const urlPathObj = path.parse(urlObj.pathname);

          let content;
          if (entry.response.content.text) {
            if (entry.response.content.encoding) {
              if (entry.response.content.encoding == "base64") {
                content = Buffer.from(entry.response.content.text, 'base64')
              }
            } else {
              content = Buffer.from(entry.response.content.text)
            }
            if (entry.response.content.mimeType === "application/javascript") {
              await this.checkSourceMap(entry)
            }
          }

          this.exportEntryToFile({
            url: entry.request.url,
            fileName: urlPathObj.base,
            fileDir: urlPathObj.dir,
            fileExt: urlPathObj.ext,
            mineType: entry.response.content.mimeType,
            size: entry.response.content.size,
            content
          });

        } else {
          throw Error("没有pathname的URL" + entry.request.url);
        }
      } else if (status == 404) {
        //不处理，记录日志
      } else {
        // 301 302 等
      }
    })
  }

}