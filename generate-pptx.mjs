import PptxGenJS from 'pptxgenjs'
import fs from 'fs'
import path from 'path'

const pptx = new PptxGenJS()
pptx.layout = 'LAYOUT_WIDE' // 13.33 x 7.5 inches
pptx.author = 'Piaoshu Team'
pptx.title = '飘数 Piaoshu · 创始人行动手册'
pptx.subject = 'Web4.0 AI原生创业操作系统'

// Color constants
const DARK_BG = '0A0F1A'
const DARK_BG2 = '1A1A2E'
const EMERALD = '10B981'
const TEAL = '14B8A6'
const DARK_EMERALD = '059669'
const WHITE = 'FFFFFF'
const GRAY = '94A3B8'
const LIGHT_GRAY = 'CBD5E1'
const CARD_BG = '1E293B'
const CARD_BG2 = '162032'
const ACCENT_LINE = '059669'
const DIM_TEXT = '64748B'

// ========== HELPER FUNCTIONS ==========

function addDarkSlide(bgColor) {
  const slide = pptx.addSlide()
  slide.background = { color: bgColor || DARK_BG }
  return slide
}

function addAccentBar(slide, y = 0, height = 0.06, color = EMERALD) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: y, w: 13.33, h: height,
    fill: { color: color },
    line: { width: 0 },
  })
}

function addTopAccentLine(slide) {
  addAccentBar(slide, 0, 0.05, EMERALD)
}

function addSideAccent(slide, x = 0, w = 0.06) {
  slide.addShape(pptx.ShapeType.rect, {
    x: x, y: 0, w: w, h: 7.5,
    fill: { color: EMERALD },
    line: { width: 0 },
  })
}

function addSlideNumber(slide, num, total = 12) {
  slide.addText(`${num} / ${total}`, {
    x: 11.8, y: 7.0, w: 1.3, h: 0.35,
    fontSize: 10, color: DIM_TEXT, align: 'right',
    fontFace: 'Consolas',
  })
}

function addSectionTitle(slide, title, subtitle, slideNum) {
  addTopAccentLine(slide)
  addSideAccent(slide)
  slide.addText(title, {
    x: 0.7, y: 0.4, w: 10, h: 0.7,
    fontSize: 30, color: WHITE, bold: true,
    fontFace: 'Microsoft YaHei',
  })
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.7, y: 1.1, w: 10, h: 0.45,
      fontSize: 16, color: TEAL,
      fontFace: 'Microsoft YaHei',
    })
  }
  // Divider line
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.7, y: 1.65, w: 2.5, h: 0.04,
    fill: { color: EMERALD },
    line: { width: 0 },
  })
  addSlideNumber(slide, slideNum)
}

function addCard(slide, x, y, w, h, opts = {}) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x: x, y: y, w: w, h: h,
    fill: { color: opts.bgColor || CARD_BG },
    rectRadius: 0.12,
    line: { width: opts.borderWidth || 0.5, color: opts.borderColor || '2D3B4F' },
    shadow: opts.shadow ? { type: 'outer', blur: 6, offset: 2, color: '000000', opacity: 0.3 } : undefined,
  })
}

function addBulletList(slide, x, y, w, h, items, opts = {}) {
  const textItems = items.map(item => ({
    text: item,
    options: {
      fontSize: opts.fontSize || 14,
      color: opts.color || LIGHT_GRAY,
      fontFace: opts.fontFace || 'Microsoft YaHei',
      bullet: { type: 'bullet', code: opts.bulletCode || '25CF' },
      paraSpaceAfter: opts.spacing || 8,
      bold: opts.bold || false,
    },
  }))
  slide.addText(textItems, {
    x: x, y: y, w: w, h: h,
    valign: 'top',
  })
}

function addProgressBar(slide, x, y, w, progress, label) {
  // Background bar
  slide.addShape(pptx.ShapeType.roundRect, {
    x: x, y: y, w: w, h: 0.25,
    fill: { color: '2D3B4F' },
    rectRadius: 0.12,
    line: { width: 0 },
  })
  // Progress fill
  const fillW = w * Math.min(progress, 1)
  if (fillW > 0) {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: x, y: y, w: fillW, h: 0.25,
      fill: { color: EMERALD },
      rectRadius: 0.12,
      line: { width: 0 },
    })
  }
  // Label
  if (label) {
    slide.addText(label, {
      x: x, y: y - 0.3, w: w, h: 0.25,
      fontSize: 10, color: GRAY, fontFace: 'Consolas',
    })
  }
}

// ========== SLIDE 1: COVER ==========
function createSlide1() {
  const slide = addDarkSlide()

  // Gradient overlay effect - darker at bottom
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 13.33, h: 7.5,
    fill: { color: DARK_BG },
    line: { width: 0 },
  })

  // Top emerald accent bar
  addAccentBar(slide, 0, 0.08, EMERALD)

  // Bottom accent bar
  addAccentBar(slide, 7.42, 0.08, DARK_EMERALD)

  // Decorative geometric shapes
  slide.addShape(pptx.ShapeType.rect, {
    x: 10.5, y: 1.0, w: 2.0, h: 0.03,
    fill: { color: EMERALD }, line: { width: 0 },
  })
  slide.addShape(pptx.ShapeType.rect, {
    x: 10.5, y: 1.15, w: 1.2, h: 0.03,
    fill: { color: TEAL }, line: { width: 0 },
  })

  // Small decorative dots
  for (let i = 0; i < 5; i++) {
    slide.addShape(pptx.ShapeType.ellipse, {
      x: 0.5 + i * 0.25, y: 6.8, w: 0.08, h: 0.08,
      fill: { color: i === 0 ? EMERALD : DIM_TEXT }, line: { width: 0 },
    })
  }

  // Main title
  slide.addText('飘数 Piaoshu · 创始人操作系统', {
    x: 0.8, y: 2.0, w: 11.5, h: 1.2,
    fontSize: 38, color: WHITE, bold: true,
    fontFace: 'Microsoft YaHei',
    align: 'left',
  })

  // Subtitle with emerald highlight
  slide.addText([
    { text: 'Web4.0 AI原生创业操作系统', options: { color: TEAL, fontSize: 20 } },
    { text: ' — ', options: { color: GRAY, fontSize: 20 } },
    { text: '将AI从执行者升维为共生体', options: { color: EMERALD, fontSize: 20, bold: true } },
  ], {
    x: 0.8, y: 3.4, w: 11.5, h: 0.6,
    fontFace: 'Microsoft YaHei',
    align: 'left',
  })

  // Divider
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.8, y: 4.2, w: 3.0, h: 0.04,
    fill: { color: EMERALD }, line: { width: 0 },
  })

  // Version info
  slide.addText('v0.1.0-alpha | 90天硬核序列', {
    x: 0.8, y: 4.5, w: 5, h: 0.4,
    fontSize: 14, color: GRAY,
    fontFace: 'Consolas',
  })

  // Bottom branding
  slide.addText('飘数 Piaoshu Team', {
    x: 0.8, y: 6.3, w: 4, h: 0.35,
    fontSize: 12, color: DIM_TEXT,
    fontFace: 'Microsoft YaHei',
  })

  addSlideNumber(slide, 1)
}

// ========== SLIDE 2: 愿景与定位 ==========
function createSlide2() {
  const slide = addDarkSlide()
  addSectionTitle(slide, '愿景与定位', 'Vision & Positioning', 2)

  // Core concept card
  addCard(slide, 0.7, 1.9, 5.8, 2.2, { shadow: true })
  slide.addText('核心理念', {
    x: 1.0, y: 2.05, w: 3, h: 0.4,
    fontSize: 16, color: EMERALD, bold: true, fontFace: 'Microsoft YaHei',
  })
  slide.addText([
    { text: 'AI', options: { color: TEAL, bold: true } },
    { text: ' 从执行者 → ', options: { color: LIGHT_GRAY } },
    { text: '共生体', options: { color: EMERALD, bold: true } },
  ], {
    x: 1.0, y: 2.5, w: 5, h: 0.4,
    fontSize: 18, fontFace: 'Microsoft YaHei',
  })
  slide.addText([
    { text: '创始人', options: { color: TEAL, bold: true } },
    { text: ' → ', options: { color: LIGHT_GRAY } },
    { text: '系统造物主', options: { color: EMERALD, bold: true } },
  ], {
    x: 1.0, y: 3.0, w: 5, h: 0.4,
    fontSize: 18, fontFace: 'Microsoft YaHei',
  })

  // 3 principles cards
  const principles = [
    { icon: '⚙', title: '务实架构', desc: '每一行代码都服务于核心业务闭环，拒绝过度设计' },
    { icon: '🛡', title: '拒绝概念堆砌', desc: '不追风口，只选经过验证的技术路径' },
    { icon: '🚀', title: '先跑通核心链路', desc: 'MVP先行，快速验证，迭代优于完美' },
  ]

  principles.forEach((p, i) => {
    const xPos = 0.7 + i * 4.1
    addCard(slide, xPos, 4.4, 3.8, 2.6, { shadow: true })
    slide.addText(p.icon, {
      x: xPos + 0.2, y: 4.55, w: 0.6, h: 0.5,
      fontSize: 22, align: 'center',
    })
    slide.addText(p.title, {
      x: xPos + 0.8, y: 4.6, w: 2.8, h: 0.4,
      fontSize: 16, color: WHITE, bold: true, fontFace: 'Microsoft YaHei',
    })
    slide.addText(p.desc, {
      x: xPos + 0.3, y: 5.2, w: 3.2, h: 1.5,
      fontSize: 12, color: GRAY, fontFace: 'Microsoft YaHei',
      valign: 'top',
    })
  })
}

// ========== SLIDE 3: 系统架构总览 ==========
function createSlide3() {
  const slide = addDarkSlide()
  addSectionTitle(slide, '系统架构总览', 'System Architecture Overview', 3)

  const engines = [
    { name: '认知分片引擎', sub: 'Cognitive Sharding', color: EMERALD, x: 5.17, y: 1.9 },
    { name: '可信证据链', sub: 'Evidence Chain', color: TEAL, x: 1.2, y: 4.0 },
    { name: '流体协作调度器', sub: 'Fluid Router', color: '0EA5E9', x: 9.1, y: 4.0 },
    { name: '虚实共生沙盒', sub: 'XDP Sandbox', color: 'F59E0B', x: 5.17, y: 6.0 },
  ]

  // Draw connecting lines between engines
  // Top to Left
  slide.addShape(pptx.ShapeType.line, {
    x: 5.17, y: 2.8, w: 2.5, h: 1.6,
    line: { color: '2D3B4F', width: 1.5, dashType: 'dash' },
  })
  // Top to Right
  slide.addShape(pptx.ShapeType.line, {
    x: 7.67, y: 2.8, w: 2.43, h: 1.6,
    line: { color: '2D3B4F', width: 1.5, dashType: 'dash' },
  })
  // Top to Bottom
  slide.addShape(pptx.ShapeType.line, {
    x: 6.67, y: 2.8, w: 0, h: 3.2,
    line: { color: '2D3B4F', width: 1.5, dashType: 'dash' },
  })
  // Left to Bottom
  slide.addShape(pptx.ShapeType.line, {
    x: 3.7, y: 4.8, w: 1.47, h: 1.2,
    line: { color: '2D3B4F', width: 1.5, dashType: 'dash' },
  })
  // Right to Bottom
  slide.addShape(pptx.ShapeType.line, {
    x: 9.1, y: 4.8, w: -1.93, h: 1.2,
    line: { color: '2D3B4F', width: 1.5, dashType: 'dash' },
  })

  // Draw engine cards
  engines.forEach((eng) => {
    addCard(slide, eng.x, eng.y, 3.0, 1.2, { borderColor: eng.color, borderWidth: 1.5, shadow: true })
    // Color accent bar at top of card
    slide.addShape(pptx.ShapeType.rect, {
      x: eng.x + 0.02, y: eng.y + 0.02, w: 2.96, h: 0.05,
      fill: { color: eng.color }, line: { width: 0 },
    })
    slide.addText(eng.name, {
      x: eng.x + 0.15, y: eng.y + 0.15, w: 2.7, h: 0.5,
      fontSize: 14, color: WHITE, bold: true, fontFace: 'Microsoft YaHei',
      align: 'center',
    })
    slide.addText(eng.sub, {
      x: eng.x + 0.15, y: eng.y + 0.6, w: 2.7, h: 0.35,
      fontSize: 10, color: GRAY, fontFace: 'Consolas',
      align: 'center',
    })
  })

  // Center hub label
  slide.addShape(pptx.ShapeType.ellipse, {
    x: 5.77, y: 3.7, w: 1.8, h: 1.0,
    fill: { color: DARK_BG2 }, line: { color: EMERALD, width: 1.5 },
  })
  slide.addText('Piaoshu\nCore', {
    x: 5.77, y: 3.8, w: 1.8, h: 0.8,
    fontSize: 12, color: EMERALD, fontFace: 'Consolas',
    align: 'center', valign: 'middle', bold: true,
  })
}

// ========== SLIDE 4: 认知分片引擎 ==========
function createSlide4() {
  const slide = addDarkSlide()
  addSectionTitle(slide, '认知分片引擎', 'Cognitive Sharding Engine', 4)

  // Left: Core function
  addCard(slide, 0.7, 1.9, 5.8, 2.0, { shadow: true })
  slide.addText('核心功能', {
    x: 1.0, y: 2.05, w: 3, h: 0.35,
    fontSize: 15, color: EMERALD, bold: true, fontFace: 'Microsoft YaHei',
  })
  slide.addText('吸收创始人战略直觉，生成专属数字分身', {
    x: 1.0, y: 2.45, w: 5.3, h: 0.6,
    fontSize: 14, color: LIGHT_GRAY, fontFace: 'Microsoft YaHei',
  })
  slide.addText('将隐性认知显性化、结构化、可验证化', {
    x: 1.0, y: 2.95, w: 5.3, h: 0.4,
    fontSize: 13, color: GRAY, fontFace: 'Microsoft YaHei',
  })

  // Right: Hard constraint
  addCard(slide, 6.8, 1.9, 5.8, 2.0, { borderColor: 'EF4444', borderWidth: 1 })
  slide.addShape(pptx.ShapeType.rect, {
    x: 6.82, y: 1.92, w: 5.76, h: 0.05,
    fill: { color: 'EF4444' }, line: { width: 0 },
  })
  slide.addText('⚠ 硬性约束', {
    x: 7.1, y: 2.1, w: 3, h: 0.35,
    fontSize: 15, color: 'EF4444', bold: true, fontFace: 'Microsoft YaHei',
  })
  slide.addText('置信度评分 < 阈值 → 人工介入', {
    x: 7.1, y: 2.55, w: 5.3, h: 0.5,
    fontSize: 14, color: LIGHT_GRAY, fontFace: 'Microsoft YaHei',
  })
  slide.addText('低置信度决策必须回退至创始人确认', {
    x: 7.1, y: 3.05, w: 5.3, h: 0.4,
    fontSize: 13, color: GRAY, fontFace: 'Microsoft YaHei',
  })

  // Tech stack section
  slide.addText('技术选型', {
    x: 0.7, y: 4.2, w: 3, h: 0.35,
    fontSize: 15, color: TEAL, bold: true, fontFace: 'Microsoft YaHei',
  })

  const techItems = [
    { label: '向量数据库', value: 'Qdrant / Milvus', progress: 0.85 },
    { label: '模型微调', value: 'Llama-3/Qwen + LoRA', progress: 0.7 },
    { label: '编排框架', value: '魔改 LangGraph', progress: 0.65 },
  ]

  techItems.forEach((tech, i) => {
    const yPos = 4.7 + i * 0.9
    addCard(slide, 0.7, yPos, 11.9, 0.7, { bgColor: CARD_BG2 })
    slide.addText(tech.label, {
      x: 1.0, y: yPos + 0.1, w: 2.0, h: 0.5,
      fontSize: 13, color: WHITE, fontFace: 'Microsoft YaHei', bold: true,
    })
    slide.addText(tech.value, {
      x: 3.2, y: yPos + 0.1, w: 3.5, h: 0.5,
      fontSize: 13, color: TEAL, fontFace: 'Consolas',
    })
    addProgressBar(slide, 7.0, yPos + 0.22, 5.2, tech.progress, `${Math.round(tech.progress * 100)}%`)
  })
}

// ========== SLIDE 5: 可信证据链 ==========
function createSlide5() {
  const slide = addDarkSlide()
  addSectionTitle(slide, '可信证据链', 'Verifiable Evidence Chain', 5)

  // Core function
  addCard(slide, 0.7, 1.9, 7.5, 2.0, { shadow: true })
  slide.addText('核心功能', {
    x: 1.0, y: 2.05, w: 3, h: 0.35,
    fontSize: 15, color: EMERALD, bold: true, fontFace: 'Microsoft YaHei',
  })
  const funcItems = ['用户访谈上链存证', 'A/B测试结果不可篡改', '决策日志全链路追溯']
  addBulletList(slide, 1.0, 2.45, 6.8, 1.3, funcItems, { bulletCode: '2713', fontSize: 13 })

  // Hard constraint
  addCard(slide, 8.5, 1.9, 4.1, 2.0, { borderColor: 'EF4444', borderWidth: 1 })
  slide.addShape(pptx.ShapeType.rect, {
    x: 8.52, y: 1.92, w: 4.06, h: 0.05,
    fill: { color: 'EF4444' }, line: { width: 0 },
  })
  slide.addText('⚠ 硬性约束', {
    x: 8.8, y: 2.1, w: 3, h: 0.35,
    fontSize: 15, color: 'EF4444', bold: true, fontFace: 'Microsoft YaHei',
  })
  slide.addText('MVP阶段证据必须有VC签名', {
    x: 8.8, y: 2.55, w: 3.5, h: 0.6,
    fontSize: 13, color: LIGHT_GRAY, fontFace: 'Microsoft YaHei',
  })

  // Tech stack
  slide.addText('技术选型', {
    x: 0.7, y: 4.2, w: 3, h: 0.35,
    fontSize: 15, color: TEAL, bold: true, fontFace: 'Microsoft YaHei',
  })

  const techItems = [
    { label: '身份认证', value: 'W3C DID + VC', progress: 0.8 },
    { label: '区块链层', value: '以太坊 L2', progress: 0.75 },
    { label: '存储层', value: 'IPFS / Arweave', progress: 0.7 },
    { label: '合约层', value: 'Solidity', progress: 0.65 },
  ]

  techItems.forEach((tech, i) => {
    const yPos = 4.7 + i * 0.65
    addCard(slide, 0.7, yPos, 11.9, 0.55, { bgColor: CARD_BG2 })
    slide.addText(tech.label, {
      x: 1.0, y: yPos + 0.08, w: 2.0, h: 0.4,
      fontSize: 12, color: WHITE, fontFace: 'Microsoft YaHei', bold: true,
    })
    slide.addText(tech.value, {
      x: 3.2, y: yPos + 0.08, w: 3.5, h: 0.4,
      fontSize: 12, color: TEAL, fontFace: 'Consolas',
    })
    addProgressBar(slide, 7.0, yPos + 0.15, 5.2, tech.progress)
  })
}

// ========== SLIDE 6: 流体协作调度器 ==========
function createSlide6() {
  const slide = addDarkSlide()
  addSectionTitle(slide, '流体协作调度器', 'Fluid Collaboration Router', 6)

  // Core function
  addCard(slide, 0.7, 1.9, 7.5, 2.0, { shadow: true })
  slide.addText('核心功能', {
    x: 1.0, y: 2.05, w: 3, h: 0.35,
    fontSize: 15, color: EMERALD, bold: true, fontFace: 'Microsoft YaHei',
  })
  const funcItems = ['流体民主制动态分配任务', '自动确权与结算', '基于复杂度的智能路由']
  addBulletList(slide, 1.0, 2.45, 6.8, 1.3, funcItems, { bulletCode: '2713', fontSize: 13 })

  // Hard constraint
  addCard(slide, 8.5, 1.9, 4.1, 2.0, { borderColor: 'EF4444', borderWidth: 1 })
  slide.addShape(pptx.ShapeType.rect, {
    x: 8.52, y: 1.92, w: 4.06, h: 0.05,
    fill: { color: 'EF4444' }, line: { width: 0 },
  })
  slide.addText('⚠ 硬性约束', {
    x: 8.8, y: 2.1, w: 3, h: 0.35,
    fontSize: 15, color: 'EF4444', bold: true, fontFace: 'Microsoft YaHei',
  })
  slide.addText('外部贡献必须通过CI/CD和安全扫描', {
    x: 8.8, y: 2.55, w: 3.5, h: 0.8,
    fontSize: 13, color: LIGHT_GRAY, fontFace: 'Microsoft YaHei',
  })

  // Tech stack
  slide.addText('技术选型', {
    x: 0.7, y: 4.2, w: 3, h: 0.35,
    fontSize: 15, color: TEAL, bold: true, fontFace: 'Microsoft YaHei',
  })

  const techItems = [
    { label: '协作协议', value: 'DAO2DAO 协议', progress: 0.7 },
    { label: '支付结算', value: 'ERC-20 微支付', progress: 0.75 },
    { label: '路由算法', value: '基于复杂度自动路由', progress: 0.6 },
  ]

  techItems.forEach((tech, i) => {
    const yPos = 4.7 + i * 0.8
    addCard(slide, 0.7, yPos, 11.9, 0.65, { bgColor: CARD_BG2 })
    slide.addText(tech.label, {
      x: 1.0, y: yPos + 0.1, w: 2.0, h: 0.45,
      fontSize: 13, color: WHITE, fontFace: 'Microsoft YaHei', bold: true,
    })
    slide.addText(tech.value, {
      x: 3.2, y: yPos + 0.1, w: 3.5, h: 0.45,
      fontSize: 13, color: TEAL, fontFace: 'Consolas',
    })
    addProgressBar(slide, 7.0, yPos + 0.2, 5.2, tech.progress)
  })
}

// ========== SLIDE 7: 虚实共生沙盒 ==========
function createSlide7() {
  const slide = addDarkSlide()
  addSectionTitle(slide, '虚实共生沙盒', 'XDP Sandbox', 7)

  // Core function
  addCard(slide, 0.7, 1.9, 7.5, 2.0, { shadow: true })
  slide.addText('核心功能', {
    x: 1.0, y: 2.05, w: 3, h: 0.35,
    fontSize: 15, color: EMERALD, bold: true, fontFace: 'Microsoft YaHei',
  })
  const funcItems = ['直接生成可交互3D/空间计算MVP原型', '跨维度社交协议集成', '虚实交互闭环验证']
  addBulletList(slide, 1.0, 2.45, 6.8, 1.3, funcItems, { bulletCode: '2713', fontSize: 13 })

  // Hard constraint
  addCard(slide, 8.5, 1.9, 4.1, 2.0, { borderColor: 'EF4444', borderWidth: 1 })
  slide.addShape(pptx.ShapeType.rect, {
    x: 8.52, y: 1.92, w: 4.06, h: 0.05,
    fill: { color: 'EF4444' }, line: { width: 0 },
  })
  slide.addText('⚠ 硬性约束', {
    x: 8.8, y: 2.1, w: 3, h: 0.35,
    fontSize: 15, color: 'EF4444', bold: true, fontFace: 'Microsoft YaHei',
  })
  slide.addText('原型必须包含核心交互循环', {
    x: 8.8, y: 2.55, w: 3.5, h: 0.6,
    fontSize: 13, color: LIGHT_GRAY, fontFace: 'Microsoft YaHei',
  })

  // Tech stack
  slide.addText('技术选型', {
    x: 0.7, y: 4.2, w: 3, h: 0.35,
    fontSize: 15, color: TEAL, bold: true, fontFace: 'Microsoft YaHei',
  })

  const techItems = [
    { label: '3D引擎', value: 'Three.js / Babylon.js', progress: 0.8 },
    { label: '社交协议', value: 'XDP 跨维度社交协议', progress: 0.55 },
  ]

  techItems.forEach((tech, i) => {
    const yPos = 4.7 + i * 0.85
    addCard(slide, 0.7, yPos, 11.9, 0.7, { bgColor: CARD_BG2 })
    slide.addText(tech.label, {
      x: 1.0, y: yPos + 0.1, w: 2.0, h: 0.5,
      fontSize: 13, color: WHITE, fontFace: 'Microsoft YaHei', bold: true,
    })
    slide.addText(tech.value, {
      x: 3.2, y: yPos + 0.1, w: 3.5, h: 0.5,
      fontSize: 13, color: TEAL, fontFace: 'Consolas',
    })
    addProgressBar(slide, 7.0, yPos + 0.22, 5.2, tech.progress)
  })
}

// ========== SLIDE 8: Phase 1 ==========
function createSlide8() {
  const slide = addDarkSlide()
  addSectionTitle(slide, 'Phase 1: D1-D30 基建与协议验证', 'Infrastructure & Protocol Validation', 8)

  // Phase indicator bar
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.7, y: 1.9, w: 11.9, h: 0.4,
    fill: { color: CARD_BG }, line: { width: 0 },
  })
  // Progress for phase 1
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.7, y: 1.9, w: 3.97, h: 0.4,
    fill: { color: EMERALD }, line: { width: 0 },
  })
  slide.addText('Phase 1', { x: 1.0, y: 1.9, w: 3, h: 0.4, fontSize: 12, color: WHITE, bold: true, fontFace: 'Consolas' })
  slide.addText('Phase 2', { x: 4.67, y: 1.9, w: 3, h: 0.4, fontSize: 12, color: GRAY, fontFace: 'Consolas' })
  slide.addText('Phase 3', { x: 8.6, y: 1.9, w: 3, h: 0.4, fontSize: 12, color: GRAY, fontFace: 'Consolas' })

  // Action card
  addCard(slide, 0.7, 2.55, 5.8, 2.2, { shadow: true })
  slide.addText('🔧 动作', {
    x: 1.0, y: 2.7, w: 3, h: 0.35,
    fontSize: 15, color: EMERALD, bold: true, fontFace: 'Microsoft YaHei',
  })
  const actions = [
    '搭建 Qdrant 向量库',
    '接入 W3C VC 签发模块',
    '部署基础数据管道',
  ]
  addBulletList(slide, 1.0, 3.15, 5.2, 1.4, actions, { fontSize: 13 })

  // Target card
  addCard(slide, 6.8, 2.55, 5.8, 2.2, { shadow: true })
  slide.addText('🎯 目标', {
    x: 7.1, y: 2.7, w: 3, h: 0.35,
    fontSize: 15, color: TEAL, bold: true, fontFace: 'Microsoft YaHei',
  })
  slide.addText('输入访谈记录 → 提取假设 → 生成带哈希VC凭证', {
    x: 7.1, y: 3.15, w: 5.2, h: 1.2,
    fontSize: 14, color: LIGHT_GRAY, fontFace: 'Microsoft YaHei',
    valign: 'top',
  })

  // Acceptance criteria
  addCard(slide, 0.7, 5.0, 11.9, 1.9, { borderColor: EMERALD, borderWidth: 1 })
  slide.addText('✅ 验收标准', {
    x: 1.0, y: 5.15, w: 4, h: 0.35,
    fontSize: 15, color: EMERALD, bold: true, fontFace: 'Microsoft YaHei',
  })

  // Two KPI boxes
  addCard(slide, 1.0, 5.65, 5.5, 1.0, { bgColor: CARD_BG2 })
  slide.addText('凭证生成', {
    x: 1.2, y: 5.75, w: 3, h: 0.3,
    fontSize: 12, color: GRAY, fontFace: 'Microsoft YaHei',
  })
  slide.addText('< 2s', {
    x: 1.2, y: 6.05, w: 3, h: 0.4,
    fontSize: 24, color: EMERALD, bold: true, fontFace: 'Consolas',
  })

  addCard(slide, 6.8, 5.65, 5.5, 1.0, { bgColor: CARD_BG2 })
  slide.addText('链上查询', {
    x: 7.0, y: 5.75, w: 3, h: 0.3,
    fontSize: 12, color: GRAY, fontFace: 'Microsoft YaHei',
  })
  slide.addText('< 500ms', {
    x: 7.0, y: 6.05, w: 3, h: 0.4,
    fontSize: 24, color: EMERALD, bold: true, fontFace: 'Consolas',
  })
}

// ========== SLIDE 9: Phase 2 ==========
function createSlide9() {
  const slide = addDarkSlide()
  addSectionTitle(slide, 'Phase 2: D31-D60 认知分身MVP', 'Cognitive Avatar MVP', 9)

  // Phase indicator bar
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.7, y: 1.9, w: 11.9, h: 0.4,
    fill: { color: CARD_BG }, line: { width: 0 },
  })
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.7, y: 1.9, w: 7.93, h: 0.4,
    fill: { color: TEAL }, line: { width: 0 },
  })
  slide.addText('Phase 1', { x: 1.0, y: 1.9, w: 3, h: 0.4, fontSize: 12, color: WHITE, bold: true, fontFace: 'Consolas' })
  slide.addText('Phase 2', { x: 4.67, y: 1.9, w: 3, h: 0.4, fontSize: 12, color: WHITE, bold: true, fontFace: 'Consolas' })
  slide.addText('Phase 3', { x: 8.6, y: 1.9, w: 3, h: 0.4, fontSize: 12, color: GRAY, fontFace: 'Consolas' })

  // Action card
  addCard(slide, 0.7, 2.55, 5.8, 2.2, { shadow: true })
  slide.addText('🔧 动作', {
    x: 1.0, y: 2.7, w: 3, h: 0.35,
    fontSize: 15, color: EMERALD, bold: true, fontFace: 'Microsoft YaHei',
  })
  const actions = [
    '导入3年决策日志',
    '训练 LoRA 适配器',
    '搭建虚拟红蓝对抗系统',
  ]
  addBulletList(slide, 1.0, 3.15, 5.2, 1.4, actions, { fontSize: 13 })

  // Target card
  addCard(slide, 6.8, 2.55, 5.8, 2.2, { shadow: true })
  slide.addText('🎯 目标', {
    x: 7.1, y: 2.7, w: 3, h: 0.35,
    fontSize: 15, color: TEAL, bold: true, fontFace: 'Microsoft YaHei',
  })
  slide.addText('上线虚拟红蓝对抗，输出3+致命漏洞', {
    x: 7.1, y: 3.15, w: 5.2, h: 1.2,
    fontSize: 14, color: LIGHT_GRAY, fontFace: 'Microsoft YaHei',
    valign: 'top',
  })

  // Acceptance criteria
  addCard(slide, 0.7, 5.0, 11.9, 1.9, { borderColor: TEAL, borderWidth: 1 })
  slide.addText('✅ 验收标准', {
    x: 1.0, y: 5.15, w: 4, h: 0.35,
    fontSize: 15, color: TEAL, bold: true, fontFace: 'Microsoft YaHei',
  })

  addCard(slide, 1.0, 5.65, 5.5, 1.0, { bgColor: CARD_BG2 })
  slide.addText('漏洞准确率', {
    x: 1.2, y: 5.75, w: 3, h: 0.3,
    fontSize: 12, color: GRAY, fontFace: 'Microsoft YaHei',
  })
  slide.addText('> 70%', {
    x: 1.2, y: 6.05, w: 3, h: 0.4,
    fontSize: 24, color: TEAL, bold: true, fontFace: 'Consolas',
  })

  addCard(slide, 6.8, 5.65, 5.5, 1.0, { bgColor: CARD_BG2 })
  slide.addText('致命漏洞数量', {
    x: 7.0, y: 5.75, w: 3, h: 0.3,
    fontSize: 12, color: GRAY, fontFace: 'Microsoft YaHei',
  })
  slide.addText('≥ 3', {
    x: 7.0, y: 6.05, w: 3, h: 0.4,
    fontSize: 24, color: TEAL, bold: true, fontFace: 'Consolas',
  })
}

// ========== SLIDE 10: Phase 3 ==========
function createSlide10() {
  const slide = addDarkSlide()
  addSectionTitle(slide, 'Phase 3: D61-D90 流体协作闭环', 'Fluid Collaboration Loop', 10)

  // Phase indicator bar - full
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.7, y: 1.9, w: 11.9, h: 0.4,
    fill: { color: EMERALD }, line: { width: 0 },
  })
  slide.addText('Phase 1', { x: 1.0, y: 1.9, w: 3, h: 0.4, fontSize: 12, color: WHITE, bold: true, fontFace: 'Consolas' })
  slide.addText('Phase 2', { x: 4.67, y: 1.9, w: 3, h: 0.4, fontSize: 12, color: WHITE, bold: true, fontFace: 'Consolas' })
  slide.addText('Phase 3', { x: 8.6, y: 1.9, w: 3, h: 0.4, fontSize: 12, color: WHITE, bold: true, fontFace: 'Consolas' })

  // Action card
  addCard(slide, 0.7, 2.55, 5.8, 2.2, { shadow: true })
  slide.addText('🔧 动作', {
    x: 1.0, y: 2.7, w: 3, h: 0.35,
    fontSize: 15, color: EMERALD, bold: true, fontFace: 'Microsoft YaHei',
  })
  const actions = [
    '接入外部开发者',
    '发布微支付开源任务',
    '建立审计与结算流程',
  ]
  addBulletList(slide, 1.0, 3.15, 5.2, 1.4, actions, { fontSize: 13 })

  // Target card
  addCard(slide, 6.8, 2.55, 5.8, 2.2, { shadow: true })
  slide.addText('🎯 目标', {
    x: 7.1, y: 2.7, w: 3, h: 0.35,
    fontSize: 15, color: TEAL, bold: true, fontFace: 'Microsoft YaHei',
  })
  slide.addText('验证任务发布→接单→审计→结算全链路', {
    x: 7.1, y: 3.15, w: 5.2, h: 1.2,
    fontSize: 14, color: LIGHT_GRAY, fontFace: 'Microsoft YaHei',
    valign: 'top',
  })

  // Acceptance criteria
  addCard(slide, 0.7, 5.0, 11.9, 1.9, { borderColor: 'F59E0B', borderWidth: 1 })
  slide.addText('✅ 验收标准', {
    x: 1.0, y: 5.15, w: 4, h: 0.35,
    fontSize: 15, color: 'F59E0B', bold: true, fontFace: 'Microsoft YaHei',
  })

  addCard(slide, 1.0, 5.65, 11.3, 1.0, { bgColor: CARD_BG2 })
  slide.addText('无摩擦外部协作', {
    x: 1.2, y: 5.75, w: 4, h: 0.3,
    fontSize: 12, color: GRAY, fontFace: 'Microsoft YaHei',
  })
  slide.addText('10次', {
    x: 1.2, y: 6.05, w: 3, h: 0.4,
    fontSize: 24, color: 'F59E0B', bold: true, fontFace: 'Consolas',
  })

  // Flow visualization
  const steps = ['发布', '接单', '审计', '结算']
  steps.forEach((step, i) => {
    const xPos = 5.5 + i * 2.2
    slide.addShape(pptx.ShapeType.roundRect, {
      x: xPos, y: 5.85, w: 1.8, h: 0.6,
      fill: { color: CARD_BG2 },
      rectRadius: 0.08,
      line: { width: 1, color: 'F59E0B' },
    })
    slide.addText(step, {
      x: xPos, y: 5.85, w: 1.8, h: 0.6,
      fontSize: 13, color: 'F59E0B', fontFace: 'Microsoft YaHei',
      align: 'center', valign: 'middle',
    })
    if (i < steps.length - 1) {
      slide.addText('→', {
        x: xPos + 1.75, y: 5.85, w: 0.5, h: 0.6,
        fontSize: 16, color: GRAY, align: 'center', valign: 'middle',
      })
    }
  })
}

// ========== SLIDE 11: 技术栈与集成 ==========
function createSlide11() {
  const slide = addDarkSlide()
  addSectionTitle(slide, '技术栈与集成', 'Tech Stack & Integration', 11)

  const stackItems = [
    { category: '向量数据库', tech: 'Qdrant / Milvus', icon: '🗄', color: EMERALD },
    { category: '模型微调', tech: 'Llama-3/Qwen + LoRA', icon: '🧠', color: TEAL },
    { category: '区块链', tech: '以太坊L2 / AFCChain', icon: '⛓', color: '0EA5E9' },
    { category: '前端', tech: 'Three.js / Next.js', icon: '🖥', color: 'F59E0B' },
    { category: '协议', tech: 'W3C DID/VC, XDP, ERC-20', icon: '🔗', color: 'A855F7' },
  ]

  stackItems.forEach((item, i) => {
    const yPos = 1.9 + i * 1.05
    addCard(slide, 0.7, yPos, 11.9, 0.9, { shadow: true, borderColor: item.color, borderWidth: 1 })
    
    // Color accent on left
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.72, y: yPos + 0.02, w: 0.08, h: 0.86,
      fill: { color: item.color }, line: { width: 0 },
    })

    slide.addText(item.icon, {
      x: 1.1, y: yPos + 0.1, w: 0.6, h: 0.7,
      fontSize: 22, align: 'center', valign: 'middle',
    })

    slide.addText(item.category, {
      x: 1.8, y: yPos + 0.1, w: 2.5, h: 0.7,
      fontSize: 16, color: WHITE, bold: true, fontFace: 'Microsoft YaHei',
      valign: 'middle',
    })

    slide.addText(item.tech, {
      x: 4.5, y: yPos + 0.1, w: 5, h: 0.7,
      fontSize: 15, color: item.color, fontFace: 'Consolas',
      valign: 'middle',
    })

    // Integration status indicator
    const statusColors = [EMERALD, TEAL, '0EA5E9', 'F59E0B', 'A855F7']
    slide.addShape(pptx.ShapeType.ellipse, {
      x: 11.3, y: yPos + 0.3, w: 0.25, h: 0.25,
      fill: { color: statusColors[i] }, line: { width: 0 },
    })
  })
}

// ========== SLIDE 12: 结语 ==========
function createSlide12() {
  const slide = addDarkSlide()

  // Top and bottom accent bars
  addAccentBar(slide, 0, 0.08, EMERALD)
  addAccentBar(slide, 7.42, 0.08, DARK_EMERALD)
  addSideAccent(slide)

  // Central quote area
  addCard(slide, 2.0, 2.0, 9.3, 3.2, { shadow: true, borderColor: EMERALD, borderWidth: 1.5 })
  
  // Decorative line above quote
  slide.addShape(pptx.ShapeType.rect, {
    x: 4.5, y: 2.3, w: 4.3, h: 0.04,
    fill: { color: EMERALD }, line: { width: 0 },
  })

  slide.addText([
    { text: '架构已定。', options: { color: WHITE, fontSize: 26, bold: true } },
    { text: '\n直接去写代码。', options: { color: EMERALD, fontSize: 26, bold: true } },
    { text: '\n看日志，跑测试。', options: { color: TEAL, fontSize: 22 } },
  ], {
    x: 2.5, y: 2.5, w: 8.3, h: 2.4,
    fontFace: 'Microsoft YaHei',
    align: 'center', valign: 'middle',
    lineSpacingMultiple: 1.5,
  })

  // Decorative line below quote
  slide.addShape(pptx.ShapeType.rect, {
    x: 4.5, y: 5.0, w: 4.3, h: 0.04,
    fill: { color: EMERALD }, line: { width: 0 },
  })

  // Team attribution
  slide.addText('飘数 Piaoshu Team', {
    x: 2.0, y: 5.5, w: 9.3, h: 0.5,
    fontSize: 16, color: GRAY, fontFace: 'Microsoft YaHei',
    align: 'center',
  })

  // Version
  slide.addText('v0.1.0-alpha | 90天硬核序列', {
    x: 2.0, y: 6.1, w: 9.3, h: 0.4,
    fontSize: 12, color: DIM_TEXT, fontFace: 'Consolas',
    align: 'center',
  })

  // Decorative dots
  for (let i = 0; i < 5; i++) {
    slide.addShape(pptx.ShapeType.ellipse, {
      x: 5.67 + i * 0.4, y: 6.7, w: 0.1, h: 0.1,
      fill: { color: i === 2 ? EMERALD : DIM_TEXT }, line: { width: 0 },
    })
  }

  addSlideNumber(slide, 12)
}

// ========== CREATE ALL SLIDES ==========
createSlide1()
createSlide2()
createSlide3()
createSlide4()
createSlide5()
createSlide6()
createSlide7()
createSlide8()
createSlide9()
createSlide10()
createSlide11()
createSlide12()

// ========== WRITE FILE ==========
const outputPath = '/home/z/my-project/upload/创始人行动手册_AI原生创业演示稿.pptx'
const buffer = await pptx.write({ outputType: 'nodebuffer' })
fs.writeFileSync(outputPath, buffer)

const stats = fs.statSync(outputPath)
console.log(`✅ PPTX created successfully!`)
console.log(`📍 Path: ${outputPath}`)
console.log(`📦 Size: ${(stats.size / 1024).toFixed(1)} KB (${stats.size} bytes)`)
