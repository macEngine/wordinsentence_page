/**
 * Cards in the home page's right column. Edit this file to add your 公众号,
 * links, or anything else; each card is a title plus a markdown body.
 *
 * Images: drop the file in public/ (e.g. public/wechat-qr.png) and reference it
 * as `![](wechat-qr.png)` — the base path is added automatically.
 */
export interface SidebarCard {
  /** Card header. Give both languages; `en` falls back to `zh`. */
  zh: string;
  en?: string;
  /** Markdown body. */
  markdown: string;
}

export const HOME_SIDEBAR: SidebarCard[] = [
  {
    zh: '关于',
    en: 'About',
    markdown:
      '每天从一篇外刊里挑一个词，连着它出现的那句话一起记。\n\n' +
      '**文章**是单词在真实世界里的一次出现；**单词**页把同一个词的所有出现放在一起，再加上最常用的几层意思和帮你记住它的意象。',
  },
  {
    zh: '公众号',
    en: 'WeChat',
    // TODO(owner): 换成你的公众号名字和二维码。二维码放到 public/wechat-qr.png，
    // 然后把下面这行换成 ![](wechat-qr.png)
    markdown: '公众号二维码 / 链接待添加。',
  },
  {
    zh: '友情链接',
    en: 'Links',
    markdown:
      '- [GitHub · wordinsentence_page](https://github.com/macEngine/wordinsentence_page)',
  },
];
