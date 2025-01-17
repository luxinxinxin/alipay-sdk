"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const is = require("is");
const crypto = require("crypto");
const urllib = require("urllib");
const request = require("request");
const decamelize = require("decamelize");
const camelcaseKeys = require("camelcase-keys");
const snakeCaseKeys = require("snakecase-keys");
const util_1 = require("./util");
const pkg = require('../package.json');
const dateformat = require("dateformat");
const form_1 = require("./form");

class AlipaySdk {
    constructor(config) {
        if (!config.appId) {
            throw Error('config.appId is required');
        }
        if (!config.privateKey) {
            throw Error('config.privateKey is required');
        }
        const privateKeyType = config.keyType === 'PKCS8' ? 'PRIVATE KEY' : 'RSA PRIVATE KEY';
        config.privateKey = this.formatKey(config.privateKey, privateKeyType);
        if (config.alipayPublicKey) {
            config.alipayPublicKey = this.formatKey(config.alipayPublicKey, 'PUBLIC KEY');
        }
        this.config = Object.assign({
            urllib,
            gateway: 'https://openapi.alipay.com/gateway.do',
            timeout: 5000,
            camelcase: true,
            signType: 'RSA2',
            charset: 'utf-8',
            version: '1.0',
        }, camelcaseKeys(config, { deep: true }));
        this.sdkVersion = `AlipaySdk-${pkg.version}`;
    }

    // 格式化 key
    formatKey(key, type) {
        const item = key.split('\n').map(val => val.trim());
        // 删除包含 `RSA PRIVATE KEY / PUBLIC KEY` 等字样的第一行
        if (item[0].includes(type)) {
            item.shift();
        }
        // 删除包含 `RSA PRIVATE KEY / PUBLIC KEY` 等字样的最后一行
        if (item[item.length - 1].includes(type)) {
            item.pop();
        }
        return `-----BEGIN ${type}-----\n${item.join('')}\n-----END ${type}-----`;
    }

    // 格式化请求 url（按规范把某些固定的参数放入 url）
    formatUrl(url, params) {
        let requestUrl = url;
        // 需要放在 url 中的参数列表
        const urlArgs = [
            'app_id', 'method', 'format', 'charset',
            'sign_type', 'sign', 'timestamp', 'version',
            'notify_url', 'return_url', 'auth_token', 'app_auth_token',
        ];
        for (const key in params) {
            if (urlArgs.indexOf(key) > -1) {
                const val = encodeURIComponent(params[key]);
                requestUrl = `${requestUrl}${requestUrl.includes('?') ? '&' : '?'}${key}=${val}`;
                // 删除 postData 中对应的数据
                delete params[key];
            }
        }
        return { execParams: params, url: requestUrl };
    }

    // 文件上传
    multipartExec(method, option = {}) {
        const config = this.config;
        let signParams = {};
        let formData = {};
        const infoLog = (option.log && is.fn(option.log.info)) ? option.log.info : null;
        const errorLog = (option.log && is.fn(option.log.error)) ? option.log.error : null;
        option.formData.getFields().forEach((field) => {
            // 字段加入签名参数（文件不需要签名）
            signParams[field.name] = field.value;
            formData[field.name] = field.value;
        });
        // 签名方法中使用的 key 是驼峰
        signParams = camelcaseKeys(signParams, { deep: true });
        formData = snakeCaseKeys(formData);
        option.formData.getFiles().forEach((file) => {
            // 文件名需要转换驼峰为下划线
            const fileKey = decamelize(file.fieldName);
            // 单独处理文件类型
            formData[fileKey] = fs.createReadStream(file.path);
        });
        // 计算签名
        const signData = util_1.sign(method, signParams, config);
        // 格式化 url
        const { url } = this.formatUrl(config.gateway, signData);
        infoLog && infoLog('[AlipaySdk]start exec url: %s, method: %s, params: %s', url, method, JSON.stringify(signParams));
        return new Promise((resolve, reject) => {
            request.post({
                url,
                formData,
                json: false,
                timeout: config.timeout,
                headers: { 'user-agent': this.sdkVersion },
            }, (err, { }, body) => {
                if (err) {
                    err.message = '[AlipaySdk]exec error';
                    errorLog && errorLog(err);
                    reject(err);
                }
                infoLog && infoLog('[AlipaySdk]exec response: %s', body);
                const result = JSON.parse(body);
                const responseKey = `${method.replace(/\./g, '_')}_response`;
                const data = result[responseKey];
                // 开放平台返回错误时，`${responseKey}` 对应的值不存在
                if (data) {
                    // 验签
                    const validateSuccess = option.validateSign ? this.checkResponseSign(body, responseKey) : true;
                    if (validateSuccess) {
                        resolve(config.camelcase ? camelcaseKeys(data, { deep: true }) : data);
                    }
                    else {
                        reject({ serverResult: body, errorMessage: '[AlipaySdk]验签失败' });
                    }
                }
                reject({ serverResult: body, errorMessage: '[AlipaySdk]HTTP 请求错误' });
            });
        });
    }

    // page 类接口
    pageExec(method, option = {}) {
        let signParams = { alipaySdk: this.sdkVersion };
        const config = this.config;
        const infoLog = (option.log && is.fn(option.log.info)) ? option.log.info : null;
        option.formData.getFields().forEach((field) => {
            signParams[field.name] = field.value;
        });
        // 签名方法中使用的 key 是驼峰
        signParams = camelcaseKeys(signParams, { deep: true });
        // 计算签名
        const signData = util_1.sign(method, signParams, config);
        // 格式化 url
        const { url, execParams } = this.formatUrl(config.gateway, signData);
        infoLog && infoLog(`[AlipaySdk]start exec url: ${url}, method: ${method}, params: ${JSON.stringify(signParams)}`);
        if (option.formData.getMethod() === 'get') {
            return new Promise((resolve) => {
                const query = Object.keys(execParams).map((key) => {
                    return `${key}=${encodeURIComponent(execParams[key])}`;
                });
                resolve(`${url}&${query.join('&')}`);
            });
        }
        return new Promise((resolve) => {
            // 生成表单
            const formName = `alipaySDKSubmit${Date.now()}`;
            resolve(`
        <form action="${url}" method="post" name="${formName}" id="${formName}">
          ${Object.keys(execParams).map((key) => {
                const value = String(execParams[key]).replace(/\"/g, '&quot;');
                return `<input type="hidden" name="${key}" value="${value}" />`;
            }).join('')}
        </form>
        <script>document.forms["${formName}"].submit();</script>
      `);
        });
    }

    /**
     *
     * @param originStr 开放平台返回的原始字符串
     * @param responseKey xx_response 方法名 key
     */
    getSignStr(originStr, responseKey) {
        // 待签名的字符串
        let validateStr = originStr.trim();
        // 找到 xxx_response 开始的位置
        const startIndex = originStr.indexOf(`${responseKey}"`);
        // 找到最后一个 “"sign"” 字符串的位置（避免）
        const lastIndex = originStr.lastIndexOf('"sign"');
        /**
         * 删除 xxx_response 及之前的字符串
         * 假设原始字符串为
         *  {"xxx_response":{"code":"10000"},"sign":"jumSvxTKwn24G5sAIN"}
         * 删除后变为
         *  :{"code":"10000"},"sign":"jumSvxTKwn24G5sAIN"}
         */
        validateStr = validateStr.substr(startIndex + responseKey.length + 1);
        /**
         * 删除最后一个 "sign" 及之后的字符串
         * 删除后变为
         *  :{"code":"10000"},
         * {} 之间就是待验签的字符串
         */
        validateStr = validateStr.substr(0, lastIndex);
        // 删除第一个 { 之前的任何字符
        validateStr = validateStr.replace(/^[^{]*{/g, '{');
        // 删除最后一个 } 之后的任何字符
        validateStr = validateStr.replace(/\}([^}]*)$/g, '}');
        return validateStr;
    }

    /**
     * @description 执行请求
     * @param {string} method 调用接口方法名，比如 alipay.ebpp.bill.add
     * @param {object} params 请求参数
     * @param {object} params.bizContent 业务请求参数
     * @param {Boolean} option 选项
     * @param {Boolean} option.validateSign 是否验签
     * @param {object} args.log 可选日志记录对象
     * @return {Promise} 请求执行结果
     */
    exec(method, params = {}, option = {}) {
        if (option.formData) {
            if (option.formData.getFiles().length > 0) {
                return this.multipartExec(method, option);
            }
            /**
             * fromData 中不包含文件时，认为是 page 类接口（返回 form 表单）
             * 比如 PC 端支付接口 alipay.trade.page.pay
             */
            return this.pageExec(method, option);
        }
        const config = this.config;
        // 计算签名
        const signData = util_1.sign(method, params, config);
        const { url, execParams } = this.formatUrl(config.gateway, signData);
        const infoLog = (option.log && is.fn(option.log.info)) ? option.log.info : null;
        const errorLog = (option.log && is.fn(option.log.error)) ? option.log.error : null;
        infoLog && infoLog(`[AlipaySdk]start exec, url: ${url}, method: ${method}, params:${JSON.stringify(execParams)}`);
        return new Promise((resolve, reject) => {
            config.urllib.request(url, {
                method: 'POST',
                data: execParams,
                // 按 text 返回（为了验签）
                dataType: 'text',
                timeout: config.timeout,
                headers: { 'user-agent': this.sdkVersion },
            })
                .then((ret) => {
                    infoLog && infoLog(`[AlipaySdk]exec response: ${JSON.stringify(ret.data)}`, ret);
                    if (ret.status === 200) {
                        /**
                         * 示例响应格式
                         * {"alipay_trade_precreate_response":
                         *  {"code": "10000","msg": "Success","out_trade_no": "111111","qr_code": "https:\/\/"},
                         *  "sign": "abcde="
                         * }
                         * 或者
                         * {"error_response":
                         *  {"code":"40002","msg":"Invalid Arguments","sub_code":"isv.code-invalid","sub_msg":"授权码code无效"},
                         * }
                         */
                        const result = JSON.parse(ret.data);
                        const responseKey = `${method.replace(/\./g, '_')}_response`;
                        const data = result[responseKey];
                        if (data) {
                            // 按字符串验签
                            const validateSuccess = option.validateSign ? this.checkResponseSign(ret.data, responseKey) : true;
                            if (validateSuccess) {
                                resolve(config.camelcase ? camelcaseKeys(data, { deep: true }) : data);
                            }
                            else {
                                reject({ serverResult: ret, errorMessage: '[AlipaySdk]验签失败' });
                            }
                        }
                        reject({ serverResult: ret, errorMessage: '[AlipaySdk]HTTP 请求错误' });
                    }
                    reject({ serverResult: ret, errorMessage: '[AlipaySdk]HTTP 请求错误' });
                })
                .catch((err) => {
                    err.message = '[AlipaySdk]exec error';
                    errorLog && errorLog(err);
                    reject(err);
                });
        });
    }

    /**
     * @description 获取18位按日期和随机数拼接生成的订单号
     * @return {string}
     */
    getOutTradeNo() {
        return `${dateformat(new Date(), "yyyymmddHHMMss")}${Math.floor(Math.random() * (8999) + 1000)}`;
    }

    /**
     * @description 订单预创建生成支付二维码
     * @param {object} param 请求参数 
     * @param {string} param.outTradeNo 商户订单号
     * @param {string} param.subject 订单标题
     * @param {number} param.totalAmount 订单金额
     * @param {object} args.log 可选日志记录对象
     * @return {Promise}
     */
    tradePrecreate(param, log) {
        const method = 'alipay.trade.precreate';
        let params = {};
        let option = {};
        param = camelcaseKeys(param, { deep: true });
        if (param.notifyUrl) {
            params.notifyUrl = param.notifyUrl;
            delete param.notifyUrl;
        }
        params.bizContent = Object.assign(param);
        option.validateSign = this.config.alipayPublicKey ? true : false;
        option.log = log ? log : null;
        return this.exec(method, params, option);
    }

    /**
     * @description 手机网站支付
     * @param {object} param 请求参数 
     * @param {string} param.outTradeNo 商户订单号
     * @param {string} param.subject 订单标题
     * @param {number} param.totalAmount 订单金额
     * @param {object} args.log 可选日志记录对象
     * @return {Promise} 返回form表单,唤起支付宝
     */
    wapPay(param, log) {
        const method = 'alipay.trade.wap.pay';
        let option = {};
        let bizContent = { productCode: 'QUICK_WAP_WAY' }
        const formData = new form_1.default();
        param = camelcaseKeys(param, { deep: true });
        if (param.notifyUrl) {
            formData.addField('notifyUrl', param.notifyUrl);
            delete param.notifyUrl
        }
        if (param.returnUrl) {
            formData.addField('returnUrl', param.returnUrl);
            delete param.returnUrl
        }
        bizContent = Object.assign(param);
        formData.addField('bizContent', bizContent);
        option.log = log ? log : null
        option.formData = formData
        return this.exec(method, {}, option)
    }

    /**
     * @description 订单查询 
     * @param {string} outTradeNo 商户订单号
     * @param {object} args.log 可选日志记录对象
     * @return {Promise}
     */
    tradeQuery(outTradeNo, log) {
        const method = 'alipay.trade.query';
        let params = { bizContent: {} };
        let option = {};
        params.bizContent.outTradeNo = outTradeNo;
        option.validateSign = this.config.alipayPublicKey ? true : false;
        option.log = log ? log : null;
        return this.exec(method, params, option);
    }

    /**
     * @description 订单撤销
     * @param {string} outTradeNo 商户订单号
     * @param {object} args.log 可选日志记录对象
     * @return {Promise}
     */
    tradeCancel(outTradeNo, log) {
        const method = 'alipay.trade.cancel';
        let params = { bizContent: {} };
        let option = {};
        params.bizContent.outTradeNo = outTradeNo;
        option.validateSign = this.config.alipayPublicKey ? true : false;
        option.log = log ? log : null;
        return this.exec(method, params, option);
    }

    /**
     * @description 订单关闭
     * @param {string} outTradeNo 商户订单号
     * @param {object} args.log 可选日志记录对象
     * @return {Promise}
     */
    tradeClose(outTradeNo, log) {
        const method = 'alipay.trade.close';
        let params = { bizContent: {} };
        let option = {};
        params.bizContent.outTradeNo = outTradeNo;
        option.validateSign = this.config.alipayPublicKey ? true : false;
        option.log = log ? log : null;
        return this.exec(method, params, option);
    }

    /**
     * @description 订单退款
     * @param {object} param 请求参数 
     * @param {string} param.outTradeNo 商户订单号
     * @param {string} param.outRequestNo 退款请求号,同一笔交易多次退款需要保证唯一，如需部分退款，则此参数必传。
     * @param {number} param.refundAmount 退款金额
     * @param {object} args.log 可选日志记录对象
     * @return {Promise}
     */
    tradeRefund(param, log) {
        const method = 'alipay.trade.refund';
        let params = {};
        let option = {};
        param = camelcaseKeys(param, { deep: true });
        param.outRequestNo = param.outRequestNo ? param.outRequestNo : param.outTradeNo;
        params.bizContent = Object.assign(param);
        option.validateSign = this.config.alipayPublicKey ? true : false;
        option.log = log ? log : null;
        return this.exec(method, params, option);
    }

    /**
     * @description 订单退款查询
     * @param {object} param 请求参数 
     * @param {string} param.outTradeNo 商户订单号
     * @param {string} param.outRequestNo 退款请求号,请求退款接口时，传入的退款请求号，如果在退款请求时未传入，则该值为创建交易时的外部交易号
     * @param {object} args.log 可选日志记录对象
     * @return {Promise}
     */
    tradeRefundQuery(param, log) {
        const method = 'alipay.trade.fastpay.refund.query';
        let params = {};
        let option = {};
        params.bizContent = Object.assign(param);
        option.validateSign = this.config.alipayPublicKey ? true : false;
        option.log = log ? log : null;
        return this.exec(method, params, option);
    }

    /**
     * @description 查询对账单下载地址
     * @param {object} param 请求参数 
     * @param {string} param.billType 账单类型(trade、signcustomer),trade指商户基于支付宝交易收单的业务账单,signcustomer是指基于商户支付宝余额收入及支出等    资金变动的帐务账单
     * @param {string} param.billDate 账单时间：日账单格式为yyyy-MM-dd，月账单格式为yyyy-MM。
     * @param {object} args.log 可选日志记录对象
     * @return {Promise}
     */
    billDownloadUrl(param, log) {
        const method = 'alipay.data.dataservice.bill.downloadurl.query';
        let params = {};
        let option = {};
        params.bizContent = Object.assign(param);
        option.validateSign = this.config.alipayPublicKey ? true : false;
        option.log = log ? log : null;
        return this.exec(method, params, option);
    }

    // 结果验签
    checkResponseSign(signStr, responseKey) {
        if (!this.config.alipayPublicKey || this.config.alipayPublicKey === '') {
            console.warn('config.alipayPublicKey is empty');
            // 支付宝公钥不存在时不做验签
            return true;
        }
        // 带验签的参数不存在时返回失败
        if (!signStr) {
            return false;
        }
        // 根据服务端返回的结果截取需要验签的目标字符串
        const validateStr = this.getSignStr(signStr, responseKey);
        // 服务端返回的签名
        const serverSign = JSON.parse(signStr).sign;
        // 参数存在，并且是正常的结果（不包含 sub_code）时才验签
        const verifier = crypto.createVerify(util_1.ALIPAY_ALGORITHM_MAPPING[this.config.signType]);
        verifier.update(validateStr, 'utf8');
        return verifier.verify(this.config.alipayPublicKey, serverSign, 'base64');
    }

    /**
     * @description 通知验签
     * @param postData {JSON} 服务端的消息内容
     */
    checkNotifySign(postData) {
        const signStr = postData.sign;
        const signType = postData.sign_type || 'RSA2';
        if (!this.config.alipayPublicKey || !signStr) {
            return false;
        }
        const signArgs = Object.assign({}, postData);
        // 除去sign、sign_type 皆是待验签的参数。
        delete signArgs.sign;
        delete signArgs.sign_type;
        const decodeSign = Object.keys(signArgs).sort().filter(val => val).map((key) => {
            let value = signArgs[key];
            if (Array.prototype.toString.call(value) !== '[object String]') {
                value = JSON.stringify(value);
            }
            return `${key}=${decodeURIComponent(value)}`;
        }).join('&');
        const verifier = crypto.createVerify(util_1.ALIPAY_ALGORITHM_MAPPING[signType]);
        verifier.update(decodeSign, 'utf8');
        return verifier.verify(this.config.alipayPublicKey, signStr, 'base64');
    }
}
exports.default = AlipaySdk;