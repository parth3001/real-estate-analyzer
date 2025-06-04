"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runApiSmokeTests = runApiSmokeTests;
var axios_1 = require("axios");
var BASE_URL = process.env.TEST_API_URL || 'http://localhost:3001';
var REQUIRED_FIELDS = [
    'monthlyAnalysis',
    'annualAnalysis',
    'longTermAnalysis',
    'keyMetrics',
];
function testEndpoint(endpoint_1) {
    return __awaiter(this, arguments, void 0, function (endpoint, method, data) {
        var res, err_1;
        var _a;
        if (method === void 0) { method = 'get'; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, axios_1.default)({ method: method, url: "".concat(BASE_URL).concat(endpoint), data: data })];
                case 1:
                    res = _b.sent();
                    console.log("[PASS] ".concat(method.toUpperCase(), " ").concat(endpoint));
                    return [2 /*return*/, res.data];
                case 2:
                    err_1 = _b.sent();
                    console.error("[FAIL] ".concat(method.toUpperCase(), " ").concat(endpoint, ":"), ((_a = err_1.response) === null || _a === void 0 ? void 0 : _a.data) || err_1.message);
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function checkRequiredFields(obj, label) {
    var allPresent = true;
    for (var _i = 0, REQUIRED_FIELDS_1 = REQUIRED_FIELDS; _i < REQUIRED_FIELDS_1.length; _i++) {
        var field = REQUIRED_FIELDS_1[_i];
        if (!(field in obj)) {
            console.error("[FAIL] ".concat(label, ": Missing field '").concat(field, "'"));
            allPresent = false;
        }
        else {
            console.log("[PASS] ".concat(label, ": Field '").concat(field, "' present"));
        }
    }
    return allPresent;
}
function runApiSmokeTests() {
    return __awaiter(this, void 0, void 0, function () {
        var sfr, mf, sfrAnalysis, mfAnalysis;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('Running API smoke tests...');
                    return [4 /*yield*/, testEndpoint('/api/deals/sample-sfr')];
                case 1:
                    sfr = _a.sent();
                    return [4 /*yield*/, testEndpoint('/api/deals/sample-mf')];
                case 2:
                    mf = _a.sent();
                    if (!sfr) return [3 /*break*/, 4];
                    return [4 /*yield*/, testEndpoint('/api/deals/analyze', 'post', sfr)];
                case 3:
                    sfrAnalysis = _a.sent();
                    if (sfrAnalysis)
                        checkRequiredFields(sfrAnalysis, 'SFR Analysis');
                    _a.label = 4;
                case 4:
                    if (!mf) return [3 /*break*/, 6];
                    return [4 /*yield*/, testEndpoint('/api/deals/analyze', 'post', mf)];
                case 5:
                    mfAnalysis = _a.sent();
                    if (mfAnalysis)
                        checkRequiredFields(mfAnalysis, 'MF Analysis');
                    _a.label = 6;
                case 6:
                    console.log('API smoke tests complete.');
                    return [2 /*return*/];
            }
        });
    });
}
