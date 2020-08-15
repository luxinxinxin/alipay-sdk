# Zhifubao-Pay SDK


蚂蚁金服开放平台SDK

> 第一次使用，请参考[蚂蚁金服开放平台配置](#蚂蚁金服开放平台配置)设置公钥

# SDK 使用文档

## 1. 实例化 SDK

```
// TypeScript
import AlipaySdk from 'zhifubao-pay';

const alipaySdk = new AlipaySdk(AlipaySdkConfig);
```


`AlipaySdkConfig` 配置项

* 必选
  * `appId`: `String` 开放平台上创建应用时生成的 appId
  * `privateKey`: `String` 应用私钥
* 可选
  * `alipayPublicKey`: `String` 支付宝公钥，用于开放平台返回值的验签，需要对返回值做验签时候必填，配置公钥后默认对接口返回数据验签
  * `timeout`: `Number` 网关超时时间，单位毫秒，默认 `5000`
  * `camelcase`: `Boolean` 是否把服务端返回的数据中的字段名从下划线转为驼峰，默认 `true`

### 完整示例：

```
// TypeScript
import AlipaySdk from 'zhifubao-pay';

const alipaySdk = new AlipaySdk({
    appId: '2016123456789012',
    privateKey: fs.readFileSync('./private-key.pem', 'ascii'),
    alipayPublicKey: fs.readFileSync('./public-key.pem', 'ascii'),
});
```


## 2. 支付类接口调用
> 请求参数和响应参数请以[api接口文档](https://docs.open.alipay.com/api)为准

### 2.1 订单号生成接口调用

```
// TypeScript
let outTradeNo = alipaySdk.getOutTradeNo()    //返回由时间和随机数拼接成的18位数字字符串，也可自己生成
```

### 2.2 扫码支付订单预创建接口调用

```
// TypeScript
try {
  let params = {
            outTradeNo: '201903110955276273',       //订单号
            totalAmount: 1,                         //订单金额
            subject: '测试订单',                     //订单标题
            timeoutExpress: '15m',                  //该笔订单允许的最晚付款时间，逾期将关闭交易。
            notifyUrl: 'http://www.com/notify',    //异步通知地址
        }
  const result: any = await alipaySdk.tradePrecreate(params)
  // console.log(result);
} catch (err) {
  // ...
}
```

* 返回结果示例：
```
{ 
  code: '10000',
  msg: 'Success',
  outTradeNo: '201903110955276273',
  qrCode: 'https://qr.alipay.com/bax02694dswkq5jsdi580047' 
}
```

### 2.3 订单查询接口调用

```
// TypeScript
try {
  let outTradeNo: '201902271024027518';
  const result: any = await alipaySdk.tradePrecreate(outTradeNo)
  // console.log(result);
} catch (err) {
  // ...
} 
```

* 返回结果示例：
```
{ 
  code: '10000',
  msg: 'Success',
  buyerLogonId: 'fkv***@sandbox.com',
  buyerPayAmount: '1.00',
  buyerUserId: '2088102177641782',
  buyerUserType: 'PRIVATE',
  fundBillList: [ { amount: '1.00', fundChannel: 'ALIPAYACCOUNT' } ],
  invoiceAmount: '1.00',
  outTradeNo: '201902271024027518',
  pointAmount: '0.00',
  receiptAmount: '1.00',
  sendPayDate: '2019-02-27 10:25:37',
  totalAmount: '1.00',
  tradeNo: '2019022722001441780500887897',
  tradeStatus: 'TRADE_SUCCESS' 
}
```

### 2.4 订单撤销接口调用

```
// TypeScript
try {
  let outTradeNo: '201902271031403456';
  let result: any = await alipaySdk.tradeCancel(outTradeNo)
  // console.log(result);
} catch (err) {
  // ...
} 
```

* 返回结果示例：
```
{
  code: '10000',
  msg: 'Success',
  action: 'close',
  outTradeNo: '201902271031403456',
  retryFlag: 'N',
  tradeNo: '2019022722001441780500887750' 
}
```

### 2.5 订单关闭接口调用

```
// TypeScript
try {
  let outTradeNo: '201902271031403456';
  let result: any = await alipaySdk.tradeClose(outTradeNo)
  // console.log(result);
} catch (err) {
  // ...
} 
```

* 返回结果示例：
```
{
  code: '10000',
  msg: 'Success',
  outTradeNo: '201902271031403456',
  tradeNo: '2019022722001441780500887750' 
}
```

### 2.6 订单退款接口调用

```
// TypeScript
try {
  let outTradeNo: '201903071549362531';
  let params = {
            outTradeNo: outTradeNo,     //订单号
            outRequestNo: outTradeNo,   //退款请求号
            refundAmount: 0.01,           //退款金额
        }
  let result: any = await alipaySdk.tradeRefund(params)
  console.log(result);
} catch (err) {
  // ...
} 
```

* 返回结果示例：
```
{ 
  code: '10000',
  msg: 'Success',
  buyerLogonId: 'fkv***@sandbox.com',
  buyerUserId: '2088102177641782',
  fundChange: 'Y',
  gmtRefundPay: '2019-03-07 15:58:09',
  outTradeNo: '201903071549362531',
  refundDetailItemList: [ { amount: '0.01', fundChannel: 'ALIPAYACCOUNT' } ],
  refundFee: '0.01',
  sendBackFee: '0.01',
  tradeNo: '2019030722001441780500890974' 
}
```

### 2.7 订单退款查询接口调用

```
// TypeScript
try {
  let outTradeNo: '201903071549362531';
  let params = {
            outTradeNo: outTradeNo,         //订单号
            outRequestNo: outTradeNo        //退款请求号
          }
  let result: any = await alipaySdk.tradeRefundQuery(params)
  // console.log(result);
} catch (err) {
  // ...
} 
```

* 返回结果示例：
```
{ 
  code: '10000',
  msg: 'Success',
  outRequestNo: '201903071549362531',
  outTradeNo: '201903071549362531',
  refundAmount: '0.01',
  totalAmount: '0.01',
  tradeNo: '2019030722001441780500890974' 
}
```

### 2.8 对账单下载地址查询接口调用

```
// TypeScript
try {
  let params = {
            billType: 'trade',    //账单类型    
            billDate: '2019-03-06'//账单日期
        }
  let result: any = await alipaySdk.billDownloadUrl(params)
  // console.log(result);
} catch (err) {
  // ...
} 
```

* 返回结果示例：
```
{
  code: '10000',
  msg: 'Success',
  billDownloadUrl: 'http://dwbillcenter.alipay.com/downloadBillFile.resource?bizType=X&userId=X&fileType=X&bizDates=X&downloadFileName=X&fileId=X'
}
```

### 2.9 手机网站支付接口调用

```
// TypeScript
try {
  let outTradeNo = alipaySdk.getOutTradeNo()
  let params = {
      //returnUrl:
      notifyUrl: 'http://www.com/notify',  //异步通知地址
      outTradeNo: outTradeNo,                           //订单号
      totalAmount: 0.01,                                //订单金额
      subject: 'wap测试订单',                            //订单标题
      timeoutExpress: '5m',                             //该笔订单允许的最晚付款时间，逾期将关闭交易。

  }
  let result: any = await alipaySdk.wapPay(params)
  //console.log(result);
} catch (err) {
  // ...
} 

// 返回form表单,前端提交并可唤起手机支付宝支付
```

### 2.10 异步通知验签接口调用

```
// TypeScript
try 
  const body = (req as any).body{
  if (alipaySdk.checkNotifySign(body)) {
    // 商户需要验证该通知数据中的out_trade_no是否为商户系统中创建的订单号，并判断total_amount是否确实为该订单的实际金额（即商户订单创建时的金额），同时需要校验通知中的seller_id（或者seller_email) 是否为out_trade_no这笔单据的对应的操作方（有的时候，一个商户可能有多个seller_id/seller_email）
  }
  else{
    return res.send('fail')
  }
  return res.send('success')
} catch (err) {
  // ...
} 
```


## 3. 通过 `exec` 调用 API
> 更多API请参考[蚂蚁金服开发者文档](https://docs.open.alipay.com/api)

```
// TypeScript
try {
  const result = await alipaySdk.exec(method, params, options);

  // console.log(result);
} catch (err) {
  // ...
}
```

* exec 参数列表

  * 必选
    * `method`: `String` 调用的 Api，比如 `alipay.trade.precreate`
  * 可选
    * `params`: `Object` Api 的请求参数（包含部分“公共请求参数”和“请求参数”）
        * `bizContent`: `Object` 可选项
          * **注意：** 仅当 Api 文档的“公共请求参数”列表中存在 `biz_content`时，才需要通过 `bizContent` 设置请求参数，否则应该通过 `params` 传递请求参数
    * `options`: `Object` 可选项
      * `validateSign`: `Boolean` 是否对返回值验签（依赖实例化时配置的”支付宝公钥“），默认 `false`
      * `formData`: `Object` 文件上传类接口的请求参数，，默认 `null`
      * `log`: Log 对象，存在时会调用 `info`、`error` 方法写日志，默认 `null` 即不写日志
* exec 返回值类型： `Promise`


### 完整示例

#### 不包含 biz_content 参数

```
// TypeScript
try {
  const result = await alipaySdk.exec('alipay.system.oauth.token', {
    grantType: 'authorization_code',
    code: 'code',
    refreshToken: 'token'
  }, {
    // 验签
    validateSign: true,
    // 打印执行日志
    log: this.logger,
  });

  // result 为 API 介绍内容中 “响应参数” 对应的结果
  console.log(result);
} catch (err) {
  //...
}
```

#### 包含 biz_content 参数

```
// TypeScript
try {
  const result = await alipaySdk.exec('alipay.trade.precreate', {
    notifyUrl: 'http://notify_url',
    // sdk 会自动把 bizContent 参数转换为字符串，不需要自己调用 JSON.stringify
    bizContent: {
        outTradeNo: 'outTradeNo',         //订单号
        totalAmount: 'totalAmount',       //订单金额
        subject: 'subject',               //订单标题
    },
  }, {
    // 验签
    validateSign: true,
    // 打印执行日志
    log: this.logger,
  });

  // result 为 API 介绍内容中 “响应参数” 对应的结果
  console.log(result);
} catch (err) {
  //...
}
```


## 4. 其他

### 4.1 文件上传类接口调用

```
// 引入 AlipayFormData 并实例化
import AlipayFormData from 'zhifubao-pay/lib/form';

const formData = new AlipayFormData();
```

AlipayFormData 提供了下面 2 个方法，用于增加字段文件：

* `addField(fieldName, fieldValue)` 增加字段，包含 2 个参数
  * `fieldName`: `String` 字段名
  * `fieldValue`: `String` 字段值

* `addFile(fieldName, fileName, filePath)` 增加文件，包含 3 个参数
  * `fieldName`: `String` 字段名
  * `fileName`: `String` 文件名
  * `filePath`: `String` 文件绝对路径


#### 完整示例

```
// TypeScript
import AlipayFormData from 'zhifubao-pay/lib/form';

const formData = new AlipayFormData();

// 增加字段
formData.addField('imageType', 'jpg');
formData.addField('imageName', '图片.jpg');
// 增加上传的文件
formData.addFile('imageContent', '图片.jpg', path.join(__dirname, './test.jpg'));


try {
  const result = await alipaySdk.exec(
    'alipay.offline.material.image.upload',
    // 文件上传类接口 params 需要设置为 {}
    {},
    {
      // 通过 formData 设置请求参数
      formData: formData,
      validateSign: true,
    },
  );

  /**
   * result 为 API 介绍内容中 “响应参数” 对应的结果
   * 调用成功的情况下，返回值内容如下：
   * {
   *   "code":"10000",
   *   "msg":"Success",
   *   "imageId":"4vjkXpGkRhKRH78ylDPJ4QAAACMAAQED",
   *   "imageUrl":"http://oalipay-dl-django.alicdn.com/rest/1.0/image?fileIds=4vjkXpGkRhKRH78ylDPJ4QAAACMAAQED&zoom=original"
   * }
   */
  console.log(result);
} catch (err) {
  //...
}
```


### 4.2 页面类接口调用

页面类接口默认返回的数据为 html 代码片段，比如 PC 支付接口 `alipay.trade.page.pay` 返回的内容为 Form 表单。
同文件上传，此类接口也需要通过 `AlipayFormData.addField` 来增加参数。此外，AlipayFormData 还提供了 `setMethod` 方法，用于直接返回 url：

* `setMethod(method)` 设置请求方法
  * `method`: `'post' | 'get'` 默认为 post


#### 完整示例

##### 返回 form 表单

```
// TypeScript
import AlipayFormData from 'zhifubao-pay/lib/form';

const formData = new AlipayFormData();

formData.addField('notifyUrl', 'http://www.com/notify');
formData.addField('bizContent', {
  outTradeNo: 'out_trade_no',
  productCode: 'FAST_INSTANT_TRADE_PAY',
  totalAmount: '0.01',
  subject: '商品',
  body: '商品详情',
});

try {
  const result = await alipaySdk.exec(
    'alipay.trade.page.pay',
    {},
    { formData: formData },
  );

  // result 为 form 表单
  console.log(result);
} catch (err) {}
```

##### 返回支付链接

```
// TypeScript
import AlipayFormData from 'zhifubao-pay/lib/form';

const formData = new AlipayFormData();
// 调用 setMethod 并传入 get，会返回可以跳转到支付页面的 url
formData.setMethod('get');

formData.addField('notifyUrl', 'http://www.com/notify');
formData.addField('bizContent', {
  outTradeNo: 'out_trade_no',
  productCode: 'FAST_INSTANT_TRADE_PAY',
  totalAmount: '0.01',
  subject: '商品',
  body: '商品详情',
});

try {
  const result = await alipaySdk.exec(
    'alipay.trade.page.pay',
    {},
    { formData: formData },
  );

  // result 为可以跳转到支付链接的 url
  console.log(result);
} catch (err) {}
```

# 蚂蚁金服开放平台配置

## 1. 注册蚂蚁金服开放平台账号
  
  蚂蚁金服开放平台： https://open.alipay.com/

## 2. 创建开发者应用

  参考文档创建开发者应用：https://docs.open.alipay.com/200/105310/

## 3. 生成密钥

1. 下载 RSA密钥工具：https://docs.open.alipay.com/291/106097/
2. 切换到生成秘钥 tab，秘钥格式选择“PKCS1（非JAVA适用）” 

    > 不需要手动修改秘钥格式，SDK 会自动处理

    ![img](https://gw.alipayobjects.com/zos/rmsportal/WYvBOnJBmBzBovsqYePF.png)

3. 新建 private-key.pem 保存私钥，文件格式如下：
    ```
    // 粘贴上一步生成的私钥到这里（不需要换行）
    ```

    完整的 private-key.pem 文件例子：

    ```
    MIIEpQIBAAKCAQEAvtdAumT11WRkjlTm9yzp791FODLKKqIMM9hUKV+5HeIGjJWXLqqoWhLZG/NObkfbpanKuOQ4GamugAjDYC1EUGrxdQpQ8q0N/oZwF6gGLd+TrZprqc7uOIEBDV9OTTSsx7b9M5Pm/uQi8wTa3VBxa1YoogJgD72srgPaNYBBdCjMWr9rEi4rwgef2fJxd7AGGz1Mcd9hPD4KkDIzRkAmqolv673qBdHlpiRwsN8cIwIamXrYUY+Kf4hpPHz3BXokUQyfmkWGQ+6o5HcWR8LQO1zb8Hr6NkRktaF7LZ+wdigHA7M6y4mSS6DElgbedHGVe3/PxcSavhymwsVoJK+02QIDAQABAoIBAQCtT5Rz8g4jXgnIDKi4HqzQ7dTX5aAduY51YueDr2/RCJxD/fIPKmK7clSDAqHemxmJSDpXUML141ga5FpyNInOsmBXlyfOS4Ti+jo/8ZKzBFD8HrnZu5gx7k4DU+MrUEP9F1y5A3+LSanHo0gUJuLpxJQgFSIiCXIRkmQPpEtM7dKmtXZoDBCztxNHLUt/SYQmDk/c0J+8CxfAAFAg6ATBAa8Ymk/GVA2bVyzfkko0Hjcid2WOkSNUw/yBSGXyUOhPPz8UPC5BuiaqHOkFqz7oSgtp6NWgvVVe9hjsIql/RcLgU8zU3ch/UZa3u1Yx8H9iyqYlYIzKR6runB4eanYVAoGBAOFJXRRDevTh6txzfGAAQQgTgjGf3plNSO86zo0J7wGHZeQE5bmdSlVsdLDrHV7Az5pb0j3XvCQstQBw0livqSvv4r8jVSd1aGgsEaqQpc+c7WltX4YGYGe1B1WJB7BPfvn2fK+g4NUnm3Y5wgX9WoBsBC2NG+LPwAj0Z9FJWF4bAoGBANjbtk3ar4vjGktb03EsDakpynO+pA5AnA/zsZjI1uzha/0IeGFn6BbFuYDmzqYf7x6/x20nQDolN8UujtKTXTYPNWuKXv4/V1zczdwfbVSz2gfCMXcuvyFKhJBL+dxhuphmcvV5eS6jcjXZrEDUn4JeM2Oyl+iHH99nZ8RuVdgbAoGBAJ7BmzUXZINC3MWjIEdqhmlRjhK4TR4M51OmRj3/fQy/xF6N0PEfVW2jMwwlcxn9l454HEz2RR/c3WRFHQXgK7/JmSkGlhBrXTrjq0NeEWqfdHIx3/nLbo5GdLejC+cD7j/poe4F2cp70cLbas3bvrX26G7NHJSVwAbPbIWAQSR3AoGAN7WZy75WQpWA98MLOpOans6Bl+JtusuWS/LKuPk/XXM7jrFSW5OZ59+7nAWvKLYjc77IuJ3Qvh85iIpBXo9E7tJRYuMVLDOReeWvbNEWASCC7mNQ2dFEgIToMTmTYq4ohWYsOiuOmhCbEoJs4eq9X3xbr0z+AVpVMcsauTevDekCgYEAgkFkDfkP8OYrKMn6gmfusnkZeV6yzFaNggwKPlNQ0c8vAwns7soPOFiWT8qQ9WdBalxIBQAJj3veZNtJfTffIK+UWc8e59sWeVCZZ5q7KMiNytGUntGQ68GabwQRj5z7ewrf3A31LABQ/u40gDvZCaFi/HVKL7KD3CHKSAEsaPQ=
    ```
## 4. 设置应用公钥

1. 复制 2.2 中生成的应用公钥

    ![img](https://gw.alipayobjects.com/zos/rmsportal/EUxpNrlWOhTYWbfljYUe.png)

2. 登录开放平台设置应用公钥

    ![img](https://gw.alipayobjects.com/zos/rmsportal/CyUzmlKmpCNPAPdNevTd.png)

## 5. 保存支付宝公钥

> “支付宝公钥”用于开放平台返回值的进行验签

1. 开放平台“应用概览”页面中复制“支付宝公钥”

    ![img](https://gw.alipayobjects.com/zos/rmsportal/kdRFpjYmQdBNonEMXSBO.png)

2. 新建 public-key.pem 保存公钥，文件格式如下：

    ```
    // 粘贴上一步复制的“支付宝公钥”到这里（不需要换行）
    ```

    完整的 public-key.pem 文件例子：

    ```
    MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvtdAumT11WRkjlTm9yzp791FODLKKqIMM9hUKV+5HeIGjJWXLqqoWhLZG/NObkfbpanKuOQ4GamugAjDYC1EUGrxdQpQ8q0N/oZwF6gGLd+TrZprqc7uOIEBDV9OTTSsx7b9M5Pm/uQi8wTa3VBxa1YoogJgD72srgPaNYBBdCjMWr9rEi4rwgef2fJxd7AGGz1Mcd9hPD4KkDIzRkAmqolv673qBdHlpiRwsN8cIwIamXrYUY+Kf4hpPHz3BXokUQyfmkWGQ+6o5HcWR8LQO1zb8Hr6NkRktaF7LZ+wdigHA7M6y4mSS6DElgbedHGVe3/PxcSavhymwsVoJK+02QIDAQAB
    ```