"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Har = /** @class */ (function () {
    function Har(raw) {
        this.raw = raw;
    }
    Har.prototype.exportEntriesToFile = function () {
        this.raw.log.entries.forEach(function (entry) {
            console.log(entry);
        });
    };
    return Har;
}());
exports.default = Har;
