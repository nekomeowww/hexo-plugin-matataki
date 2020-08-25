// Dependencies
const fs = require('hexo-fs')
const log = require('hexo-log')({ 'debug': false, 'slient': false })
const path = require('path')
const https = require('https')
const crypto = require('crypto')


// Local Packages
const { textToArray, hexToArray } = require('./src/util.js')
const { default: Axios } = require('axios')

/**
 * Get Two Salt at https://www.random.org/strings/?num=2&len=20&digits=on&upperalpha=on&loweralpha=on&unique=on&format=html&rnd=new
 */
const keySalt = textToArray('fan8AGM8uBt0Ep3oLiph')
const ivSalt = textToArray('XDUSdgPjUPWgLXnrPqtl')

let template = fs.readFileSync(path.resolve(__dirname, './lib/template.html')).toString()

hexo.extend.filter.register('after_post_render', async (data) => {
    const tagEncryptPairs = []
    let tagUsed = false;

    if (hexo.config.matataki === undefined) {
        hexo.config.matataki = []
    }

    if (('matataki' in hexo.config) && ('tags' in hexo.config.matataki)) {
        hexo.config.matataki.tags.forEach((tagObj) => {
            tagEncryptPairs[tagObj.name] = tagObj.password
        })
    }

    let href = data.matataki.oauth || hexo.theme.config.fanlocker || hexo.config.fanlocker || 'https://developer.matataki.io/doc'
    let name = data.matataki.name || data.source.replace(/^_post\/|^.*\//, '').replace(/\.md$/, '').trim()
    let mode = data.matataki.mode
    let password = data.matataki.password
    let matatakiToken = data.matataki.token
    let amount = data.matataki.amount

    if (data.tags) {
        data.tags.forEach((cTag) => {
            if (tagEncryptPairs.hasOwnProperty(cTag.name)) {
                tagUsed = password ? tagUsed : cTag.name
                password = password || tagEncryptPairs[cTag.name]
            }
        })
    }

    if (!data.matataki) return data

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

    if (tagUsed === false) {
        log.info(`hexo-plugin-matataki: encrypting "${data.title.trim()}" based on the password configured in Front-matter.`)
    } else {
        log.info(`hexo-plugin-matataki: encrypting "${data.title.trim()}" based on Tag: "${tagUsed}".`)
    }

    const key = crypto.pbkdf2Sync(password, keySalt, 1024, 32, 'sha256')
    const iv = crypto.pbkdf2Sync(password, ivSalt, 512, 16, 'sha256')

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
    const hmac = crypto.createHmac('sha256', key)

    let encryptedData = cipher.update(content, 'utf8', 'hex')
    hmac.update(content, 'utf8')
    encryptedData += cipher.final('hex')
    const hmacDigest = hmac.digest('hex')

    const res = await Axios.get('https://api.smartsignature.io/minetoken/' + matatakiToken)
    let body = res.data

    const defaultConfig = {
        'abstract': '这篇文章使用了 Fan 票加密，持有' + amount + body.data.token.name + ' (' + body.data.token.symbol + ') ' + '来解锁文章',
        'message': '持有<span class="purple"> ' + amount + body.data.token.name + ' (' + body.data.token.symbol + ') ' + '</span>解锁文章',
        'wrongPassMessage': '解锁失败了呢。如果你是博客作者遇到这个问题，看看保险箱的键值对是否设置正确呢',
        'wrongHashMessage': '好像文章加密的时候的时候遗漏了几页呢，不过这些剩下的内容还是可以看看啦',
        'avatar': 'https://ssimg.frontenduse.top' + body.data.token.logo
    }

    const config = Object.assign(defaultConfig, hexo.config.matataki, data)

    data.content = template.replace(/{{hpmEncryptedData}}/g, encryptedData)
        .replace(/{{hpmHmacDigest}}/g, hmacDigest)
        .replace(/{{hpmWrongPassMessage}}/g, config.wrongPassMessage)
        .replace(/{{hpmWrongHashMessage}}/g, config.wrongHashMessage)
        .replace(/{{hpmMessage}}/g, config.message)
        .replace(/{{hpmSymbolAvatar}}/g, config.avatar)
        .replace(/{{hpmHref}}/g, href)
        .replace(/{{hpmEncrypName}}/g, name)
        .replace(/{{hpmAmount}}/g, amount)
        .replace(/{{hpmToken}}/g, matatakiToken)

    data.content += `</script><link href="${hexo.config.root}css/hpm.css" rel="stylesheet" type="text/css">`
    data.excerpt = data.more = config.abstract
})


hexo.extend.generator.register('hexo-plugin-matataki', () => [
    {
        'data': () => fs.createReadStream(path.resolve(__dirname, './lib/hpm.css')),
        'path': 'css/hpm.css',
    }
])