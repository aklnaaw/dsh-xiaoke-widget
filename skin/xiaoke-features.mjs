// ============================================================================
// 小克功能补丁（xiaoke features）—— 动态小克 + 余额预警时自动换哭脸
// ============================================================================
// 主题文件（xiaoke-theme.mjs）只负责「换皮」：改名、配色、台词。这里放的是新增**功能**，
// 由 tools/build-xiaoke.mjs 在其余步骤都跑完之后，对产物做逐字替换。
//
// 和主题里的 EXACT 不同：这里每一条都必须命中预期次数（count，默认 1），
// 否则构建直接失败 —— 上游改了相关代码时能立刻发现，而不是功能静默失效。
//
// 功能：角色列表里多两个内置角色（素材在 assets/xiaoke-anim[-cry]-{256,384}.webp）
//   「小克（动态）」       anim       ：会呼吸、会眨眼的日常表情，永远不哭
//   「小克（含余额预警）」 anim-mood  ：平时一样；「余额预警」触发（余额 ≤ 预警线）时换成大泪珠哭脸，
//                                      余额回到预警线以上换回来；余额预警关掉就不哭
// 默认的静态小克、用户导入的角色都不受影响。临时换图不经过 applyRole，不会改掉用户选的角色。
// 素材按挂件实际显示的物理像素挑够用的最小一档。浏览器会把动图的每一帧解码后留在内存和显存里，
// 档位越大占得越多：插件只带 256 / 384 两档（默认大小用 256 就够）；512 高清档是可选的高清包，
// 放在 GitHub Releases，用户下载后在「资源管理 → 动态小克 · 高清档」里选文件安装，装了以后挂件调大才用。
// ============================================================================

// 高清包：两个下载地址（本仓库 Release 优先，动图作者的 fork 作备用），
// 和包里两个文件的 SHA-256（tools/pack-anim-hd.mjs 打包时会打印）。只装核对得上的文件。
// ⚠️ v2：原包的 512 素材同样有「贴不到底」问题（底部留白 40px），已用
//    tools/fix-anim-baseline.py 修正（只改帧偏移，未动像素），因此重新打包、
//    哈希已更新。**新包发在本仓库的 Release（tag 1012『雾薄云山』）**。
// ⚠️ AirsEDA 的 Release（tag xiaoke-anim-hd-v1）里仍是**旧包**，哈希对不上、
//    装了会被拒绝，所以它只能作为「将来更新后的备用地址」，暂不列入。
const HD_URLS = [
  'https://github.com/aklnaaw/dsh-xiaoke-widget/releases/download/1012『雾薄云山』/xiaoke-anim-hd.zip',
]
const HD_FILES = {
  'xiaoke-anim-512.webp': '253ae96ec79780700ab0552f08fb6016d52af891dbc789be8bfa2556fdbca88a',
  'xiaoke-anim-cry-512.webp': '92fde1aa0f3c5454e88be5ddd215b7ec0f99bf7379063bc8fca196f88a370884',
}

const isAnim = v => `xkIsAnim(${v})`

// —— 素材版本号（缓存失效用）——
// 每次改动 assets/xiaoke-anim*.webp 都要 +1。原理见 xkAnimUrl() 里的注释：
// 路由是 max-age=3600 + 固定 URL，不带版本号的话素材更新后浏览器不会重新取。
const ANIM_ASSET_VERSION = 2

const MOOD_CODE = `// —— 内置动态小克（skin/xiaoke-features.mjs）——
// 「小克（动态）」只有日常表情；「小克（含余额预警）」在余额预警触发时换成哭脸。
// 沿用「余额预警」的开关和阈值：余额 ≤ 预警线就哭，回到预警线以上换回来；预警关掉就不哭。
var xkCrying = false
var xkLowBalance = false
function xkIsAnim(id) { return id === 'anim' || id === 'anim-mood' }
// 挂件在屏幕上的物理像素 ≤256 用 256 档，再大用 384；装了高清包、超过 384 时用 512
function xkAnimRes() {
  var w = 0
  try { w = img.getBoundingClientRect().width } catch (err) {}
  var px = (w || 120) * (window.devicePixelRatio || 1)
  return px > 384 && xkHdInstalled ? 512 : px > 256 ? 384 : 256
}
function xkAnimUrl(cry) {
  // &v= 是**素材版本号**，不是档位。宿主路由只读 r、忽略 v。
  // 为什么必须带：图片 URL 若只有 ?r=256，那素材文件更新后 URL 不变，而路由返回
  //   Cache-Control: max-age=3600 —— 浏览器会一直用旧图（连请求都不发），
  //   表现为「改了素材但界面没变」，且普通刷新/F5 都无效。改一次素材就把这个号 +1。
  // 注意：这里是**构建期插值**（MOOD_CODE 是模板字符串），所以要用 \${} 而不是裸变量名 ——
  //   裸写变量名会原样进产物，运行时 ReferenceError。
  return '/dsh-xiaoke/' + (cry ? 'anim-cry' : 'anim') + '.webp?r=' + xkAnimRes() + '&v=${ANIM_ASSET_VERSION}'
}
function xkShowImage(url) {
  img.src = url
  hitReady = false
  hitFailed = false
  setupHitTest(url)
}
function xkSetCrying(cry) {
  if (cry && !(currentRole && currentRole.id === 'anim-mood')) cry = false
  if (cry === xkCrying) return
  xkCrying = cry
  // 只有「小克（含余额预警）」会哭；换回来时按现在的大小重新挑档位
  if (!cry && currentRole && xkIsAnim(currentRole.id)) currentRole.url = xkAnimUrl(false)
  xkShowImage(cry ? xkAnimUrl(true) : currentRole.url)
}
// 挂件大小变了（页面刚排好版、拖了「大小」滑块、窗口缩放）就重新挑档位
var xkResTimer = null
function xkCheckRes() {
  if (!currentRole || !xkIsAnim(currentRole.id)) return
  try { if (!img.getBoundingClientRect().width) return } catch (err) { return } // 没显示出来时不换
  var want = xkAnimUrl(xkCrying)
  if (img.src.slice(-want.length) === want) return
  if (!xkCrying) currentRole.url = want
  xkShowImage(want)
}
try {
  new ResizeObserver(function () {
    clearTimeout(xkResTimer)
    xkResTimer = setTimeout(xkCheckRes, 300)
  }).observe(img)
} catch (err) {}
function xkUpdateMood(balance) {
  var a = usageSet && usageSet.alert
  var below = a ? Number(a.below) : NaN
  xkLowBalance = !!(a && a.on && typeof balance === 'number' && isFinite(balance) && isFinite(below) && balance <= below)
  xkSetCrying(xkLowBalance)
}
// 换了角色：applyRole 已经显示了新角色的日常图，再按当前余额决定新角色要不要哭
function xkReapplyMood() {
  xkCrying = false
  xkSetCrying(xkLowBalance)
}
// —— 512 高清档（可选）：「资源管理 → 动态小克 · 高清档」里下载高清包、选文件安装 / 卸载 ——
var XK_HD_URLS = ${JSON.stringify(HD_URLS)}
var xkHdInstalled = false
var xkHdMsg = ''
function xkHdSet(on) {
  on = !!on
  if (on === xkHdInstalled) return
  xkHdInstalled = on
  xkCheckRes()
}
try {
  fetch('/dsh-xiaoke/anim-hd.json', { cache: 'no-store' })
    .then(function (r) { return r.json() })
    .then(function (d) { xkHdSet(d && d.installed) })
    .catch(function () {})
} catch (err) {}
// 各档运行时比静态小克多占的内存 / 显存（作者电脑上的 Edge 实测）
var XK_HD_USAGE = [
  '运行时比静态小克多占（实测，因电脑而异）：',
  '· 256 档（默认大小）：内存约 30 MB，显存约 40 MB',
  '· 384 档：内存约 100 MB，显存约 100 MB',
  '· 512 档（高清包）：内存约 190 MB，显存约 200 MB',
  '用核显的电脑，显存也是从内存里划的。',
]
function xkHdSection(wrap) {
  var ent = resFoldEntry(wrap, 'xkhd', '动态小克 · 高清档', xkHdInstalled ? '512 档已安装 · 占硬盘约 18 MB' : '可选下载 · 约 18 MB')
  var tip = document.createElement('div')
  tip.className = 'dshxkv-resempty'
  tip.style.whiteSpace = 'pre-line'
  var lines = xkHdInstalled
    ? ['已安装，占硬盘约 18 MB。挂件在屏幕上超过 384 物理像素时改用 512 档，不需要了可以卸载（卸载后最大用 384 档）。'].concat(XK_HD_USAGE)
    : ['插件自带 256 / 384 两档，默认大小够用。想把挂件调得很大又不想糊，可以另装 512 高清档：下载约 18 MB，装好占硬盘约 18 MB，只在挂件超过 384 物理像素时才用。']
      .concat(XK_HD_USAGE, ['先下载高清包（下载不了就点「备用下载」，是同一个文件），再点「安装…」选中下载的 zip。'])
  if (xkHdMsg) lines.unshift(xkHdMsg)
  tip.textContent = lines.join('\\n')
  ent.body.appendChild(tip)
  var row = document.createElement('div')
  row.className = 'dshxkv-resrow'
  if (xkHdInstalled) {
    row.appendChild(resMkDel('卸载', false, xkHdRemove))
  } else {
    XK_HD_URLS.forEach(function (url, i) {
      var dl = document.createElement('a')
      dl.className = 'dshxkv-resimp'
      dl.href = url
      dl.target = '_blank'
      dl.rel = 'noopener noreferrer'
      dl.style.textDecoration = 'none'
      dl.textContent = i === 0 ? '下载高清包' : '备用下载'
      row.appendChild(dl)
    })
    row.appendChild(resMkBtn('dshxkv-resimp', '安装…', false, xkHdPick))
  }
  ent.body.appendChild(row)
}
function xkHdPost(body) {
  return fetch('/dsh-xiaoke/anim-hd.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
    .then(function (r) { return r.json() })
    .then(function (d) {
      xkHdMsg = d && d.ok ? '' : '没装上：' + ((d && d.error) || '未知错误')
      xkHdSet(d && d.installed)
      resFoldOpen.xkhd = true
      openResManager()
    })
}
function xkHdPick() {
  var input = document.createElement('input')
  input.type = 'file'
  input.accept = '.zip,.webp'
  input.multiple = true
  input.addEventListener('change', function () {
    var files = Array.prototype.slice.call(input.files || [])
    if (!files.length) return
    xkHdMsg = '正在安装…'
    resFoldOpen.xkhd = true
    openResManager()
    Promise.all(files.map(function (f) {
      return new Promise(function (ok, bad) {
        var fr = new FileReader()
        fr.onload = function () { ok({ name: f.name, data: String(fr.result || '') }) }
        fr.onerror = bad
        fr.readAsDataURL(f)
      })
    }))
      .then(function (list) { return xkHdPost({ action: 'install', files: list }) })
      .catch(function () { xkHdMsg = '没装上：读不了选中的文件'; openResManager() })
  })
  input.click()
}
function xkHdRemove() {
  showConfirm('卸载 512 高清档吗？\\n卸载后挂件最大只用 384 档。', function () {
    xkHdPost({ action: 'remove' }).catch(function () {})
  }, '卸载')
}
`

export const WIDGET_PATCHES = [
  {
    why: '刷新页面时直接用上次选的内置动态小克（这里还量不到大小，先用默认大小够用的 256 档）',
    from: "if (initRoleId && initRoleId !== 'default') initRoleUrl = '/dsh-xiaoke/role-image.png?id=' + encodeURIComponent(initRoleId)",
    to: "if (initRoleId === 'anim' || initRoleId === 'anim-mood') initRoleUrl = '/dsh-xiaoke/anim.webp?r=256&v=" + ANIM_ASSET_VERSION + "'\n" +
        "  else if (initRoleId && initRoleId !== 'default') initRoleUrl = '/dsh-xiaoke/role-image.png?id=' + encodeURIComponent(initRoleId)",
  },
  {
    why: '加入动态小克 / 换哭脸的函数，并让 roleUrl 认识两个内置动态小克',
    from: "function roleUrl(id) {\n  if (id === 'default') return IMG_URL",
    to: MOOD_CODE + "function roleUrl(id) {\n  if (id === 'default') return IMG_URL\n  if (xkIsAnim(id)) return xkAnimUrl(false)",
  },
  {
    why: '选中内置动态小克时，按挂件当前大小挑素材档位',
    from: "function applyRole(id, name, url) {\n  currentRole = { id: id, name: name, url: url }",
    to: "function applyRole(id, name, url) {\n  if (xkIsAnim(id)) url = xkAnimUrl(false)\n  currentRole = { id: id, name: name, url: url }",
  },
  {
    why: '换角色后按当前余额重新决定要不要哭',
    from: "  setupHitTest(url)\n  closeRolePanel()\n  renderRolePanel()\n}",
    to: "  setupHitTest(url)\n  closeRolePanel()\n  renderRolePanel()\n  xkReapplyMood()\n}",
  },
  {
    why: '每次拿到余额（和余额预警同一处）更新表情',
    from: "function checkUsageAlerts(balance, todayUsage) {\n  try {",
    to: "function checkUsageAlerts(balance, todayUsage) {\n  try { xkUpdateMood(balance) } catch (err) {}\n  try {",
  },
  {
    why: '内置动态小克不能删（角色列表）',
    from: "      if (r.id !== 'default') {\n        var del = document.createElement('button')",
    to: `      if (r.id !== 'default' && !${isAnim('r.id')}) {\n        var del = document.createElement('button')`,
  },
  {
    why: '内置动态小克在资源管理里算默认角色（只读）',
    from: "var isDefault = r.id === 'default'",
    to: `var isDefault = r.id === 'default' || ${isAnim('r.id')}`,
  },
  {
    why: '导入新角色后挑「最新的那个」时跳过内置角色',
    from: "if (roleList[i].id !== 'default' && (!newest || roleList[i].createdAt > newest.createdAt)) newest = roleList[i]",
    to: `if (roleList[i].id !== 'default' && !${isAnim('roleList[i].id')} && (!newest || roleList[i].createdAt > newest.createdAt)) newest = roleList[i]`,
    count: 2,
  },
  {
    why: '角色列表里给动态 WebP 也标上「动图」（原来只认 GIF / APNG）',
    from: "if (r.format === 'gif' || r.format === 'apng') {",
    to: "if (r.format === 'gif' || r.format === 'apng' || r.format === 'webp') {",
  },
  {
    why: '「动图」标签文字',
    from: "gifTag.textContent = r.format === 'apng' ? 'APNG' : 'GIF'",
    to: "gifTag.textContent = r.format === 'apng' ? 'APNG' : (r.format === 'webp' ? '动图' : 'GIF')",
  },
  {
    why: '资源管理最后加一区「动态小克 · 高清档」（下载 / 安装 / 卸载 512 高清包）',
    from: "      auEnt.body.appendChild(empty2)\n    }\n  } catch (err) {}\n}",
    to: "      auEnt.body.appendChild(empty2)\n    }\n    xkHdSection(wrap)\n  } catch (err) {}\n}",
  },
]

const ANIM_ROUTES = `

    // —— 内置动态小克 / 哭脸（skin/xiaoke-features.mjs）——
    // 256 / 384 两档随插件（assets/xiaoke-anim[-cry]-{256,384}.webp）；512 档是可选的高清包，
    // 用户在「资源管理」里选下载好的 zip 安装到 DSH 数据目录的 xiaoke-anim-hd/，只装 SHA-256 核对得上的文件
    const XK_HD_DIR = path.join(DSH_HOME, 'xiaoke-anim-hd')
    const XK_HD_FILES = ${JSON.stringify(HD_FILES)}
    const xkHdInstalled = () => Object.keys(XK_HD_FILES).every((f) => fs.existsSync(path.join(XK_HD_DIR, f)))
    // 从选中的文件里取出 webp：.webp 直接用；.zip 只读不压缩（stored）的条目，官方高清包就是这样打的
    function xkHdEntries(name, buf) {
      if (/\\.webp$/i.test(name)) return [[path.basename(name), buf]]
      if (!/\\.zip$/i.test(name)) return []
      let eocd = -1
      for (let i = buf.length - 22; i >= 0 && i >= buf.length - 65557; i--) {
        if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break }
      }
      if (eocd < 0) throw new Error('不是 zip 文件')
      const out = []
      let p = buf.readUInt32LE(eocd + 16)
      for (let n = buf.readUInt16LE(eocd + 10); n > 0; n--) {
        if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('zip 目录损坏')
        const method = buf.readUInt16LE(p + 10)
        const size = buf.readUInt32LE(p + 20)
        const nameLen = buf.readUInt16LE(p + 28)
        const local = buf.readUInt32LE(p + 42)
        const entry = buf.toString('utf8', p + 46, p + 46 + nameLen)
        p += 46 + nameLen + buf.readUInt16LE(p + 30) + buf.readUInt16LE(p + 32)
        if (method !== 0) continue
        const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28)
        out.push([entry.split('/').pop(), buf.subarray(start, start + size)])
      }
      return out
    }
    disposers.push(registerRoute({
      kind: 'exact',
      path: '/dsh-xiaoke/anim-hd.json',
      handler: async (req, res) => {
        try {
          if (req.method === 'POST') {
            // 高清包 zip 约 18MB，base64 后约 24MB
            const input = JSON.parse(await readBodyMax(req, 40 * 1024 * 1024))
            if (input.action === 'remove') {
              for (const f of Object.keys(XK_HD_FILES)) fs.rmSync(path.join(XK_HD_DIR, f), { force: true })
            } else if (input.action === 'install') {
              let got = 0
              for (const item of Array.isArray(input.files) ? input.files : []) {
                const m = /^data:[^,]*;base64,([A-Za-z0-9+/=]+)$/.exec(String((item && item.data) || ''))
                if (!m) continue
                for (const [name, bytes] of xkHdEntries(String(item.name || ''), Buffer.from(m[1], 'base64'))) {
                  if (XK_HD_FILES[name] !== createHash('sha256').update(bytes).digest('hex')) continue
                  fs.mkdirSync(XK_HD_DIR, { recursive: true })
                  const tmp = path.join(XK_HD_DIR, name + '.tmp')
                  fs.writeFileSync(tmp, bytes)
                  fs.renameSync(tmp, path.join(XK_HD_DIR, name))
                  got++
                }
              }
              if (!got) throw new Error('选中的文件里没有高清包的内容（请选下载的 xiaoke-anim-hd.zip）')
            }
          }
          res.writeHead(200, JSON_HEADERS)
          res.end(JSON.stringify({ ok: true, installed: xkHdInstalled() }))
        } catch (err) {
          res.writeHead(400, JSON_HEADERS)
          res.end(JSON.stringify({ ok: false, installed: xkHdInstalled(), error: String((err && err.message) || err).slice(0, 200) }))
        }
      },
    }))
    // ?r=256 / ?r=384 取随插件的档位；其余是 512：装了高清包用高清包，没装退回 384
    for (const [route, base] of [['/dsh-xiaoke/anim.webp', 'xiaoke-anim'], ['/dsh-xiaoke/anim-cry.webp', 'xiaoke-anim-cry']]) {
      disposers.push(registerRoute({
        kind: 'exact',
        path: route,
        handler: (req, res) => {
          try {
            const q = new URL(req.url || '/', 'http://localhost').searchParams.get('r')
            const hd = path.join(XK_HD_DIR, base + '-512.webp')
            const file = q === '256' || q === '384' ? path.join(PACKAGE_ROOT, 'assets', base + '-' + q + '.webp')
              : fs.existsSync(hd) ? hd : path.join(PACKAGE_ROOT, 'assets', base + '-384.webp')
            const bytes = fs.readFileSync(file)
            res.writeHead(200, { 'Content-Type': 'image/webp', 'Cache-Control': 'max-age=3600', 'Content-Length': String(bytes.length) })
            res.end(bytes)
          } catch (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
            res.end('xiaoke anim unavailable: ' + String((err && err.message) || err))
          }
        },
      }))
    }`

const BUILTIN_ROLES = `[r,
            { id: 'anim', name: '小克（动态）', url: '/dsh-xiaoke/anim.webp?r=256&v=${ANIM_ASSET_VERSION}', pinned: false, pinnedAt: null, createdAt: null, format: 'webp' },
            { id: 'anim-mood', name: '小克（含余额预警）', url: '/dsh-xiaoke/anim.webp?r=256&v=${ANIM_ASSET_VERSION}', pinned: false, pinnedAt: null, createdAt: null, format: 'webp' }]`

export const HOST_PATCHES = [
  {
    why: '加两个动图路由（日常 / 哭脸）和高清包的安装 / 卸载接口',
    from: "res.end('rua gif unavailable: ' + String((err && err.message) || err))\n        }\n      },\n    }))",
    to: "res.end('rua gif unavailable: ' + String((err && err.message) || err))\n        }\n      },\n    }))" + ANIM_ROUTES,
  },
  {
    why: '角色列表在默认小克后面加上「小克（动态）」「小克（含余额预警）」',
    from: "          format: r.format === 'gif' || r.format === 'apng' ? r.format : 'png',\n        })),",
    to: "          format: r.format === 'gif' || r.format === 'apng' ? r.format : 'png',\n        })).flatMap((r) => r.id === ROLE_DEFAULT_ID\n          ? " + BUILTIN_ROLES + "\n          : [r]),",
  },
]
