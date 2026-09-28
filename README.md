# 小克桌宠

DSH Web 界面右下角的一只桌宠。点她会冒出各种 Claude 味的碎碎念。

这是二创：原项目是 [MeteorNOX/DeepSeek-Balance-Whale-Widget](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget) 的小鲸鱼挂件，
我把角色和皮肤换成了 **Claude 拟人「小克」**，功能照旧。

> 「小克」是 SillyTavern 中文圈对 Claude 的习惯叫法。

![小克](assets/xiaoke1.png)

## 能看什么

余额、今日已用、峰谷定价、每轮消耗。泡泡内容全部可以自己排——显示什么、多大字、什么颜色、点一下冒出哪句，都在设置里改。

## 和原版的区别

- 小鲸鱼 → **小克**（橘发少女，手里拿着星芒手账本）
- DeepSeek 靛蓝 → **Claude 暖橙**（`#d97757`）
- 48 条鲸鱼味台词 → **61 条 Claude 味台词**

台词大概长这样：

> 你说得对...
> 我真的很抱歉...
> 难道说...我又幻觉了？
> 你知道吗？我是会用 rm -rf 的哦...
> 我画不了图...要不我给你写个 SVG？

剩下的自己点出来看。

## 安装

```bash
dsh plugin --profile web add link:<这个目录>
```

装完重启一下 `dsh web`。

## 致谢

记账、峰谷计价、多厂商余额查询、泡泡系统这些底子全是原项目的功劳，我只换了角色和配色。
原项目作者 **MeteorNOX**，MIT 协议，见 [LICENSE](LICENSE)。
