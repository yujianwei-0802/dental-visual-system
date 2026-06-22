# 可视化修改疾病 — Dental Visual System

白里挑一（杭州）医疗科技有限公司

## 快速启动

```bash
cd dental-visual-system
python -m http.server 8080
# 浏览器打开 http://localhost:8080
```

或直接双击 `index.html` 用浏览器打开。

## 项目结构

```
dental-visual-system/
├── index.html          # 主页面
├── css/
│   └── style.css       # 样式（深色主题、金色强调）
├── js/
│   ├── data.js         # 数据层（8张照片、22颗牙位、疾病类型）
│   └── app.js          # 核心应用（状态管理、渲染、交互）
└── README.md
```

## 功能

- 8 张口内照片切换（缩略图条）
- 22 颗牙齿标记点（正视图 11 上 + 11 下）
- 3 种操作模式：新增/修改/移出疾病
- 疾病标签条：快速查看、编辑、删除
- 红色标记点：已有疾病的牙齿
- Toast 反馈提示
- 无需安装依赖，纯前端

## 颜色规范

| 用途 | 色值 |
|------|------|
| 背景 | #2D2D2D |
| 卡片 | #3A3A3A |
| 金色强调 | #C8A020 |
| 绿色确认 | #55AA00 |
| 红色警示 | #DD0000 |

## API

浏览器控制台可调用：

```js
DentalApp.state           // 当前状态
DentalApp.addDisease('16', '龋齿', 'moderate', '近中龋坏')
DentalApp.removeDisease('16')
DentalApp.resetAll()
```
