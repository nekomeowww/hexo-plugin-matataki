// Dependencies
const fs = require('hexo-fs')
const log = require('hexo-log')({ 'debug': false, 'slient': false })
const path = require('path')
const https = require('https')
const crypto = require('crypto')


// Local Packages
const { textToArray, hexToArray } = require('./src/util.js')

/**
 * Get Two Salt at https://www.random.org/strings/?num=2&len=20&digits=on&upperalpha=on&loweralpha=on&unique=on&format=html&rnd=new
 */
const keySalt = textToArray('fan8AGM8uBt0Ep3oLiph')
const ivSalt = textToArray('XDUSdgPjUPWgLXnrPqtl')

let template = fs.readFileSync(path.resolve(__dirname, './lib/template.html')).toString()

https.get('https://api.smartsignature.io/trade/direct/73?type=tokenId', (res) => {
    res.setEncoding('utf8')
    res.on('data', function (body) {

        hexo.extend.filter.register('after_post_render', (data) => {

            let password = data.password
            let matatakiToken = data.matatakiToken
            /**
             * If password or matataki is empty, disable this functionality
             */
            if (password === "" || matatakiToken === "") {
                return data
            }

            /**
             * If password matataki is never defined, disable this functionality
             */
            if (password === undefined || matatakiToken === undefined) {
                return data
            }

            data.origin = data.content
            let content = data.content.trim()

            const key = crypto.pbkdf2Sync(password, keySalt, 1024, 32, 'sha256')
            const iv = crypto.pbkdf2Sync(password, ivSalt, 512, 16, 'sha256')

            const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
            const hmac = crypto.createHmac('sha256', key)

            let encryptedData = cipher.update(content, 'utf8', 'hex')
            hmac.update(content, 'utf8')
            encryptedData += cipher.final('hex')
            const hmacDigest = hmac.digest('hex')

            console.log(body)
            body = JSON.parse(body)
            const config = {
                abstract: '这篇文章使用了 Fan 票加密，持有' + data.amount + body.data.token_name + ' (' + body.data.symbol + ') ' + '来解锁文章',
                wrongPassMessage: '解锁失败了呢。',
                wrongHashMessage: '好像文章加密的时候的时候遗漏了几页呢，不过这些剩下的内容还是可以看看啦',
                message: '持有<span class="purple"> ' + data.amount + body.data.token_name + ' (' + body.data.symbol + ') ' + '</span>解锁文章',
                avatar: 'https://ssimg.frontenduse.top' + body.data.logo
            }

            data.content = template.replace(/{{hpmEncryptedData}}/g, encryptedData)
                .replace(/{{hpmHmacDigest}}/g, hmacDigest)
                .replace(/{{hpmWrongPassMessage}}/g, config.wrongPassMessage)
                .replace(/{{hpmWrongHashMessage}}/g, config.wrongHashMessage)
                .replace(/{{hpmMessage}}/g, config.message)
                .replace(/{{hpmSymbolAvatar}}/g, config.avatar)

            console.log(data.content)
            data.content += `<script src="${hexo.config.root}lib/hpm.js"></script><link href="${hexo.config.root}css/hpm.css" rel="stylesheet" type="text/css">`
            data.excerpt = data.more = config.abstract
        })
    })
})


hexo.extend.generator.register('hexo-plugin-matataki', () => [
    {
        'data': () => fs.createReadStream(path.resolve(__dirname, './lib/hpm.css')),
        'path': 'css/hpm.css',
    },
    {
        'data': () => fs.createReadStream(path.resolve(__dirname, './lib/hpm.js')),
        'path': 'lib/hpm.js',
    },
]);