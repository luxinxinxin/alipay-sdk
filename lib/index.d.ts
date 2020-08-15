import AliPayForm from './form';

export interface AlipaySdkConfig {
    /** 应用ID */
    appId: string;
    /**
     * 应用私钥字符串
     * 密钥格式一栏请选择 “PKCS1”
     */
    privateKey: string;
    signType?: 'RSA2' | 'RSA';
    /** 支付宝公钥（需要对返回值做验签时候必填） */
    alipayPublicKey?: string;
    /** 网关 */
    gateway?: string;
    /** 网关超时时间（单位毫秒，默认 5s） */
    timeout?: number;
    /** 是否把网关返回的下划线 key 转换为驼峰写法 */
    camelcase?: boolean;
    /** 编码（只支持 utf-8） */
    charset?: 'utf-8';
    /** api版本 */
    version?: '1.0';
    urllib?: any;
    /** 指定private key类型, 默认： PKCS1, PKCS8: PRIVATE KEY, PKCS1: RSA PRIVATE KEY */
    keyType?: 'PKCS1' | 'PKCS8';
}

export interface AlipaySdkCommonResult {
    code: string;
    msg: string;
    sub_code?: string;
    sub_msg?: string;
}

export interface IRequestParams {
    [key: string]: any;
    bizContent?: any;
}

export interface IRequestParam {
    [key: string]: any;
}

export interface PrecreateParams {
    outTradeNo: string;
    subject: string;
    totalAmount: number;
    notifyUrl?: string;
    [key: string]: any;
}

export interface RefundParams {
    outTradeNo: string;
    refundAmount: number;
    [key: string]: any;
}

export interface RefundQueryParam {
    outTradeNo: string;
    outRequestNo: string;
    [key: string]: any;
}

export interface BillParam {
    billType: string;
    billDate: string;
}

export interface IRequestOption {
    validateSign?: boolean;
    log?: {
        info(...args: any[]): any;
        error(...args: any[]): any;
    };
    formData?: AliPayForm;
}

export interface LogOption {
    info(...args: any[]): any;
    error(...args: any[]): any;
}

declare class AlipaySdk {
    private sdkVersion;
    config: AlipaySdkConfig;
    constructor(config: AlipaySdkConfig);
    private formatKey;
    private formatUrl;
    private multipartExec;
    private pageExec;

    /**
     *
     * @param originStr 开放平台返回的原始字符串
     * @param responseKey xx_response 方法名 key
     */
    getSignStr(originStr: string, responseKey: string): string;

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
    exec(method: string, params?: IRequestParams, option?: IRequestOption): Promise<AlipaySdkCommonResult | string>;

    /**
     * @description 获取18位按日期和随机数拼接生成的订单号
     * @return {string}
     */
    getOutTradeNo(): string;

    /**
     * @description 订单预创建生成支付二维码
     * @param {object} param 请求参数 
     * @param {string} param.outTradeNo 商户订单号
     * @param {string} param.subject 订单标题
     * @param {number} param.totalAmount 订单金额
     * @param {string} param.notifyUrl 异步通知地址
     * @param {object} args.log 可选日志记录对象
     * @return {Promise}
     */
    tradePrecreate(param: PrecreateParams, log?: LogOption): Promise<AlipaySdkCommonResult | string>;

    /**
     * @description 手机网站支付
     * @param {object} param 请求参数 
     * @param {string} param.outTradeNo 商户订单号
     * @param {string} param.subject 订单标题
     * @param {number} param.totalAmount 订单金额
     * @param {string} param.returnUrl 回跳地址
     * @param {string} param.notifyUrl 异步通知地址
     * @param {string} param.timeoutExpress 允许的最晚付款时间
     * @param {object} args.log 可选日志记录对象
     * @return {Promise}
     */
    wapPay(param: PrecreateParams, log?: LogOption): Promise<AlipaySdkCommonResult | string>;

    /**
     * @description 订单查询 
     * @param {string} outTradeNo 商户订单号
     * @param {object} args.log 可选日志记录对象
     * @return {Promise}
     */
    tradeQuery(outTradeNo: string, log?: LogOption): Promise<AlipaySdkCommonResult | string>;

    /**
     * @description 订单撤销
     * @param {string} outTradeNo 商户订单号
     * @param {object} args.log 可选日志记录对象
     * @return {Promise}
     */
    tradeCancel(outTradeNo: string, log?: LogOption): Promise<AlipaySdkCommonResult | string>;

    /**
     * @description 订单关闭
     * @param {string} outTradeNo 商户订单号
     * @param {object} args.log 可选日志记录对象
     * @return {Promise}
     */
    tradeClose(outTradeNo: string, log?: LogOption): Promise<AlipaySdkCommonResult | string>;

    /**
     * @description 订单退款
     * @param {object} param 请求参数 
     * @param {string} param.outTradeNo 商户订单号
     * @param {string} param.outRequestNo 退款请求号,同一笔交易多次退款需要保证唯一，如需部分退款，则此参数必传。
     * @param {number} param.refundAmount 订单金额
     * @param {object} args.log 可选日志记录对象
     * @return {Promise}
     */
    tradeRefund(param: RefundParams, log?: LogOption): Promise<AlipaySdkCommonResult | string>;

    /**
     * @description 订单退款查询
     * @param {object} param 请求参数 
     * @param {string} param.outTradeNo 商户订单号
     * @param {string} param.outRequestNo 退款请求号,请求退款接口时，传入的退款请求号，如果在退款请求时未传入，则该值为创建交易时的外部交易号
     * @param {object} args.log 可选日志记录对象
     * @return {Promise}
     */
    tradeRefundQuery(param: RefundQueryParam, log?: LogOption): Promise<AlipaySdkCommonResult | string>;

    /**
     * @description 查询对账单下载地址
     * @param {object} param 请求参数 
     * @param {string} param.billType 账单类型(trade、signcustomer),trade指商户基于支付宝交易收单的业务账单,signcustomer是指基于商户支付宝余额收入及支出等    资金变动的帐务账单
     * @param {string} param.billDate 账单时间：日账单格式为yyyy-MM-dd，月账单格式为yyyy-MM。
     * @param {object} args.log 可选日志记录对象
     * @return {Promise}
     */
    billDownloadUrl(param: BillParam, log?: LogOption): Promise<AlipaySdkCommonResult | string>;

    /**
     * @description 返回结果验签
     * @param {string} signStr 带验签参数的字符串
     * @param {string} responseKey 截取目标字符的标志字符
     * @return {boolean}
     */
    checkResponseSign(signStr: string, responseKey: string): boolean;

    /**
     * @description 通知验签
     * @param postData {JSON} 服务端的消息内容
     */
    checkNotifySign(postData: any): boolean;
}
export default AlipaySdk;
