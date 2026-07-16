export interface EmojiItem {
  value: string;
  label: string;
}

export type EmojiCategoryId =
  | "common"
  | "smileys"
  | "gestures"
  | "people"
  | "animals"
  | "food"
  | "activities"
  | "objects"
  | "symbols";

export interface EmojiCategory {
  id: EmojiCategoryId;
  label: string;
  icon: string;
  items: EmojiItem[];
}

const emojiItems = (...items: Array<[string, string]>): EmojiItem[] =>
  items.map(([value, label]) => ({ value, label }));

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: "common",
    label: "常用",
    icon: "⭐",
    items: emojiItems(
      ["😀", "笑脸"],
      ["😂", "笑哭"],
      ["😊", "微笑"],
      ["😍", "喜爱"],
      ["🤔", "思考"],
      ["😭", "大哭"],
      ["👍", "赞"],
      ["👏", "鼓掌"],
      ["🙏", "感谢"],
      ["❤️", "爱心"],
      ["🔥", "火热"],
      ["🎉", "庆祝"],
      ["✅", "完成"],
      ["🚀", "火箭"],
      ["💡", "灵感"],
      ["✨", "闪亮"],
    ),
  },
  {
    id: "smileys",
    label: "表情",
    icon: "😀",
    items: emojiItems(
      ["😃", "开心"],
      ["😄", "大笑"],
      ["😁", "露齿笑"],
      ["😆", "眯眼笑"],
      ["😅", "流汗笑"],
      ["🙂", "浅笑"],
      ["🙃", "倒脸"],
      ["😉", "眨眼"],
      ["🥰", "幸福"],
      ["🤩", "星星眼"],
      ["😎", "酷"],
      ["😡", "生气"],
    ),
  },
  {
    id: "gestures",
    label: "手势",
    icon: "👋",
    items: emojiItems(
      ["👎", "踩"],
      ["👌", "好"],
      ["✌️", "胜利"],
      ["🤞", "好运"],
      ["🤟", "爱你手势"],
      ["🤘", "摇滚"],
      ["🤙", "打电话"],
      ["👈", "向左指"],
      ["👉", "向右指"],
      ["👆", "向上指"],
      ["👇", "向下指"],
      ["🙌", "欢呼"],
    ),
  },
  {
    id: "people",
    label: "人物",
    icon: "🧑",
    items: emojiItems(
      ["👶", "婴儿"],
      ["🧒", "儿童"],
      ["👦", "男孩"],
      ["👧", "女孩"],
      ["🧑", "成年人"],
      ["👨", "男人"],
      ["👩", "女人"],
      ["🧓", "老人"],
      ["👮", "警察"],
      ["👷", "工人"],
      ["🧑‍⚕️", "医护人员"],
      ["🧑‍💻", "程序员"],
    ),
  },
  {
    id: "animals",
    label: "动物",
    icon: "🐶",
    items: emojiItems(
      ["🐶", "小狗"],
      ["🐱", "小猫"],
      ["🐭", "老鼠"],
      ["🐹", "仓鼠"],
      ["🐰", "兔子"],
      ["🦊", "狐狸"],
      ["🐻", "熊"],
      ["🐼", "熊猫"],
      ["🐨", "考拉"],
      ["🐯", "老虎"],
      ["🦁", "狮子"],
      ["🐸", "青蛙"],
    ),
  },
  {
    id: "food",
    label: "食物",
    icon: "🍎",
    items: emojiItems(
      ["🍎", "苹果"],
      ["🍊", "橘子"],
      ["🍋", "柠檬"],
      ["🍉", "西瓜"],
      ["🍇", "葡萄"],
      ["🍓", "草莓"],
      ["🍒", "樱桃"],
      ["🍔", "汉堡"],
      ["🍕", "披萨"],
      ["🍜", "面条"],
      ["🍰", "蛋糕"],
      ["☕", "咖啡"],
    ),
  },
  {
    id: "activities",
    label: "活动",
    icon: "⚽",
    items: emojiItems(
      ["⚽", "足球"],
      ["🏀", "篮球"],
      ["🏈", "橄榄球"],
      ["⚾", "棒球"],
      ["🎾", "网球"],
      ["🏓", "乒乓球"],
      ["🏸", "羽毛球"],
      ["🎮", "游戏"],
      ["🎯", "目标"],
      ["🎨", "绘画"],
      ["🎵", "音乐"],
      ["🏆", "奖杯"],
    ),
  },
  {
    id: "objects",
    label: "物品",
    icon: "💡",
    items: emojiItems(
      ["📱", "手机"],
      ["💻", "电脑"],
      ["⌨️", "键盘"],
      ["📷", "相机"],
      ["🎬", "电影"],
      ["📚", "书籍"],
      ["📝", "笔记"],
      ["📌", "图钉"],
      ["📎", "回形针"],
      ["🔍", "搜索"],
      ["🔔", "铃铛"],
      ["🔒", "锁"],
    ),
  },
  {
    id: "symbols",
    label: "符号",
    icon: "❤️",
    items: emojiItems(
      ["🧡", "橙心"],
      ["💛", "黄心"],
      ["💚", "绿心"],
      ["💙", "蓝心"],
      ["💜", "紫心"],
      ["🖤", "黑心"],
      ["💯", "满分"],
      ["❗", "感叹号"],
      ["❓", "问号"],
      ["⚠️", "警告"],
      ["⭕", "圆圈"],
      ["❌", "错误"],
    ),
  },
];

export const EMOJI_LABELS = new Map<string, string>(
  EMOJI_CATEGORIES.flatMap((category) =>
    category.items.map((item) => [item.value, item.label]),
  ),
);
