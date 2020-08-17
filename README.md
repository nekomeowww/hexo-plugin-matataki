<h1 align="center">hexo-plugin-matataki</h1>
<p align="center">Hexo Plugin for Matataki Fan Token</p>
<p align="center">This is a on going working project</p>

## 安装

这个插件需要两个系统合作完成工作，一个是 [FanLocker](https://github.com/nekomeowww/fanlocker) 一个是本插件。同时你需要一个 [Matataki 开发者中心](https://developer.matataki.io) 的账号来获取 FanLocker  所需要的 ClientId 和 ClientSecret

使用 npm 请使用 `npm install` 命令，使用 yarn 的话可以直接复制下面这段添加到博客根目录的依赖项内

```
yarn add hexo-plugin-matataki
```

## 配置

hexo-plugin-matataki 的配置很简单，在你的每一篇文章的开头，也就是被称之为 Front-matter 的地方，添加以下内容，

```
matataki:
	token: 0
	password: password
	name: name
	amount: 0
	mode: hold | pay
```

这些参数分别是：

1. Token ID（Fan 票 ID）
2. 密码（在保险库中也要填写一样的内容）
3. 密码名称（在保险库中填写一样的内容）
4. 数量（多少 Fan 票）
5. 模式（hold 或者 pay，现在仅支持 pay）