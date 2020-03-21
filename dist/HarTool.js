"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = __importDefault(require("path"));
var url_1 = __importDefault(require("url"));
var fs_1 = __importDefault(require("fs"));
var HarTool = /** @class */ (function () {
    function HarTool(entry) {
        this.outPath = "";
        this.raw = entry.raw;
        this.outPath = path_1.default.join(process.cwd(), 'output');
    }
    HarTool.prototype.mkdir = function (dir) {
        if (fs_1.default.existsSync(dir)) {
            return;
        }
        if (fs_1.default.existsSync(path_1.default.dirname(dir))) {
            fs_1.default.mkdirSync(dir);
        }
        else {
            this.mkdir(path_1.default.dirname(dir));
        }
    };
    HarTool.prototype.mineToExt = function (mine) {
        if (mine == "application/json") {
            return '.json';
        }
        else if (mine == "text/html") {
            return ".html";
        }
        else {
            console.log("未知mine", mine);
            return "";
        }
    };
    HarTool.prototype.clearPath = function (dir) {
        var _this = this;
        var paths = fs_1.default.readdirSync(dir);
        paths.forEach(function (p) {
            var fullPath = path_1.default.join(dir, p);
            if (fs_1.default.statSync(fullPath).isDirectory()) {
                _this.clearPath(fullPath);
            }
            else if (fs_1.default.statSync(fullPath).isFile()) {
                fs_1.default.unlinkSync(fullPath);
            }
        });
        fs_1.default.rmdirSync(dir, { recursive: true });
    };
    HarTool.prototype.exportEntryToFile = function (entry) {
        this.mkdir(path_1.default.join(this.outPath, entry.fileDir));
        var fullPath = path_1.default.join(this.outPath, entry.fileDir, entry.fileName + (entry.fileExt === "" ? this.mineToExt(entry.mineType) : ""));
        console.log(path_1.default.join(this.outPath, entry.fileDir), "--", fullPath);
        // fs.writeFileSync(fullPath, entry.content);
        // console.log(fullPath)
        // if (!entry.fileExt) {
        // }
        // console.log(entry.fileDir, entry.fileName)
    };
    HarTool.prototype.exportEntriesToFile = function () {
        var _this = this;
        this.clearPath(this.outPath);
        this.raw.log.entries.forEach(function (entry) {
            var status = entry.response.status;
            if (status === 200 || status === 304) {
                var urlObj = url_1.default.parse(entry.request.url);
                if (urlObj.pathname) {
                    var urlPathObj = path_1.default.parse(urlObj.pathname);
                    var content = void 0;
                    if (entry.response.content.text) {
                        if (entry.response.content.encoding) {
                            if (entry.response.content.encoding == "base64") {
                                content = Buffer.from(entry.response.content.text, 'base64');
                            }
                        }
                        else {
                            content = Buffer.from(entry.response.content.text);
                        }
                    }
                    _this.exportEntryToFile({
                        url: entry.request.url,
                        fileName: urlPathObj.base,
                        fileDir: urlPathObj.dir,
                        fileExt: urlPathObj.ext,
                        mineType: entry.response.content.mimeType,
                        size: entry.response.content.size,
                        content: content
                    });
                }
                else {
                    throw Error("没有pathname的URL" + entry.request.url);
                }
            }
            else if (status == 404) {
                //不处理，记录日志
            }
            else {
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
        });
    };
    return HarTool;
}());
exports.default = HarTool;
