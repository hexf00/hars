import { Har as HarFormat } from "har-format"
import path from 'path'
import url from 'url'
import fs, { stat } from 'fs'

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
    }
    if (fs.existsSync(path.dirname(dir))) {
      fs.mkdirSync(dir)
    } else {
      this.mkdir(path.dirname(dir))
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
    fs.rmdirSync(dir, { recursive: true })
  }

  exportEntryToFile(entry: { url: string; fileName: string; fileExt: string; mineType: string; fileDir: string; size: number; content: Buffer | undefined }) {



    this.mkdir(path.join(this.outPath, entry.fileDir))

    const fullPath = path.join(this.outPath, entry.fileDir, entry.fileName + (entry.fileExt === "" ? this.mineToExt(entry.mineType) : ""))

    console.log(path.join(this.outPath, entry.fileDir), "--", fullPath);
    // fs.writeFileSync(fullPath, entry.content);

    // console.log(fullPath)

    // if (!entry.fileExt) {

    // }
    // console.log(entry.fileDir, entry.fileName)
  }

  exportEntriesToFile() {
    this.clearPath(this.outPath)

    this.raw.log.entries.forEach(entry => {
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



      //   console.log(urlPathObj.base) //文件名
      //   console.log(entry.response.status)
      //   console.log(entry.response.content.mimeType)
      //   console.log(entry.response.content.encoding)
      //   console.log(entry.response.content.size)
      // } else {
      //   console.log("异常的urlObj", urlObj);
      // }



    })

  }


}