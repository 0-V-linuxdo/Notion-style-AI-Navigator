// ==UserScript==
// @name         [AI Studio] Notion 风格的导航目录 [20251201] v1.0.0
// @namespace    0_V userscripts/Notion 风格的 AI Studio 导航目录
// @description  为 Google AI Studio 添加悬浮导航目录，快速在对话消息间跳转，支持多种定位效果，包括高亮边框、脉冲光晕、淡入淡出等。支持思考过程识别。
//
// @version      [20241222] v1.0.2
// @update-log   v1.0.2: 清理导航显示内容，去除多余的角色标识，思考过程显示为Thoughts
//
// @match        https://aistudio.google.com/*
//
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
//
// @license      MIT
// @forked-from  https://greasyfork.org/scripts/541002
//
// @icon         https://github.com/0-V-linuxdo/Notion-style-AI-Navigator/raw/refs/heads/main/site_icons/AI_studio.svg
//
// @require      https://github.com/0-V-linuxdo/Notion-style-AI-Navigator/raw/refs/heads/0-V-linuxdo-patch-1/notion-style-ai-navigator2.js
// ==/UserScript==

// ================================================
// 基于 Notion 风格的 AI 导航目录核心功能
// 适配 Google AI Studio 对话界面
// ================================================

(function () {
  "use strict";

  // 路径检查：确保在 AI Studio 页面运行
  const { hostname, pathname } = window.location;
  if (hostname !== "aistudio.google.com") {
    return;
  }

  // 等待核心功能脚本加载
  const waitForNavigator = () => {
    if (typeof window.NotionStyleNavigator !== 'undefined') {
      initializeNavigator();
    } else {
      setTimeout(waitForNavigator, 100);
    }
  };

  // 初始化导航器
  const initializeNavigator = () => {
    // AI Studio 平台配置
    const PLATFORMS = [
      {
        name: "Google AI Studio",
        hosts: ["aistudio.google.com"],
        messageSelector: "ms-chat-turn[id^='turn-']",
        // 备用选择器，防止ID模式变化
        fallbackSelectors: [
          "ms-chat-turn",
          "[data-turn-role]",
          ".chat-turn-container"
        ]
      }
    ];

    // 导航器配置
    const navigatorConfig = {
      // 平台配置
      platforms: PLATFORMS,

      // 存储接口
      storage: {
        getValue: (key, defaultValue) => {
          try {
            return GM_getValue(key, defaultValue);
          } catch (e) {
            console.warn('[AI Studio Navigator] GM_getValue 不可用，使用默认值：', e);
            return defaultValue;
          }
        },
        setValue: (key, value) => {
          try {
            GM_setValue(key, value);
          } catch (e) {
            console.warn('[AI Studio Navigator] GM_setValue 不可用：', e);
          }
        }
      },

      // 菜单接口
      menu: {
        registerMenuCommand: (name, callback) => {
          try {
            GM_registerMenuCommand(name, callback);
          } catch (e) {
            console.warn('[AI Studio Navigator] GM_registerMenuCommand 不可用：', e);
          }
        }
      },

      // AI Studio 特定配置
      customConfig: {
        // 消息类型识别函数
        getMessageType: (element) => {
          // 方法1：通过 data-turn-role 属性识别
          const turnRole = element.querySelector('[data-turn-role]')?.getAttribute('data-turn-role');
          if (turnRole) {
            return turnRole.toLowerCase() === 'user' ? 'user' : 'assistant';
          }

          // 方法2：通过作者标签识别
          const authorLabel = element.querySelector('.author-label');
          if (authorLabel) {
            const text = authorLabel.textContent?.trim().toLowerCase();
            if (text === 'user') return 'user';
            if (text === 'model') return 'assistant';
          }

          // 方法3：通过容器类名识别
          const container = element.querySelector('.chat-turn-container');
          if (container) {
            if (container.classList.contains('user')) return 'user';
            if (container.classList.contains('model')) return 'assistant';
          }

          // 默认返回助手（大多数情况下是回答）
          return 'assistant';
        },

        // 检测是否包含思考过程
        hasThoughts: (element) => {
          // 方法1：检查是否存在 ms-thought-chunk 元素
          const thoughtChunk = element.querySelector('ms-thought-chunk');
          if (thoughtChunk) return true;

          // 方法2：检查是否有"Thoughts"文本
          const thoughtsText = element.querySelector('[class*="thought"], [id*="thought"]');
          if (thoughtsText) return true;

          // 方法3：检查扩展面板是否包含思考相关内容
          const expansionPanels = element.querySelectorAll('mat-expansion-panel');
          for (const panel of expansionPanels) {
            const panelText = panel.textContent || '';
            if (panelText.toLowerCase().includes('thought') ||
                panelText.toLowerCase().includes('thinking') ||
                panelText.includes('💭')) {
              return true;
            }
          }

          // 方法4：检查是否有思考相关的class或属性
          const thoughtElements = element.querySelectorAll('[class*="thinking"], [class*="thought"]');
          if (thoughtElements.length > 0) return true;

          return false;
        },

        // 消息内容提取函数
        extractContent: (element) => {
          // 先尝试获取主要文本内容
          const turnContent = element.querySelector('.turn-content');
          if (!turnContent) return '';

          // 克隆元素以避免修改原DOM
          const clone = turnContent.cloneNode(true);

          // 移除作者标签（User/Model）
          const authorLabels = clone.querySelectorAll('.author-label');
          authorLabels.forEach(label => label.remove());

          // 移除思考过程部分（如果存在）
          const thoughtChunks = clone.querySelectorAll('ms-thought-chunk');
          thoughtChunks.forEach(chunk => chunk.remove());

          // 移除引用源部分
          const sources = clone.querySelectorAll('ms-grounding-sources, ms-search-entry-point');
          sources.forEach(source => source.remove());

          // 移除按钮和控制元素
          const controls = clone.querySelectorAll('button, .actions-container, .turn-footer');
          controls.forEach(control => control.remove());

          // 移除其他噪声元素
          const noise = clone.querySelectorAll('svg, .material-symbols-outlined, [jslog]');
          noise.forEach(el => el.remove());

          // 获取纯文本内容
          let content = clone.textContent || '';

          // 清理空白字符
          content = content.replace(/\s+/g, ' ').trim();

          // 清理角色标识（如果还有残留）
          content = content.replace(/^(User|Model|用户|模型)\s*/i, '');

          return content;
        },

        // 代码块检测函数
        detectCodeBlocks: (element) => {
          const codeBlocks = element.querySelectorAll('pre, code, .code-block');
          if (codeBlocks.length > 0) {
            // 尝试提取语言信息
            const firstBlock = codeBlocks[0];
            const lang = firstBlock.className.match(/language-(\w+)/)?.[1] ||
                        firstBlock.getAttribute('data-language') ||
                        'Code';
            return lang.charAt(0).toUpperCase() + lang.slice(1);
          }
          return null;
        }
      }
    };

    // 扩展核心导航器以支持 AI Studio 特定功能
    class AIStudioNavigator extends window.NotionStyleNavigator.PromptNavigator {
      constructor(config) {
        super(config);
        this.customConfig = config.customConfig;
        // 添加思考符号常量
        this.CONSTANTS.THINKING_EMOJI = "💭";
      }

      // 重写消息类型识别
      getMessageTypeEmoji(el) {
        // 首先检查是否包含思考过程
        if (this.customConfig.hasThoughts(el)) {
          return this.CONSTANTS.THINKING_EMOJI;
        }

        // 正常的消息类型识别
        const messageType = this.customConfig.getMessageType(el);
        return messageType === 'user' ? this.CONSTANTS.USER_EMOJI : this.CONSTANTS.ASSISTANT_EMOJI;
      }

      // 重写内容提取
      extractText(rootEl) {
        // 如果是思考消息，返回特殊标识
        if (this.customConfig.hasThoughts(rootEl)) {
          return "Thoughts"; // 改为英文显示
        }

        // 使用自定义内容提取函数
        let content = this.customConfig.extractContent(rootEl);

        // 检测代码块
        const codeType = this.customConfig.detectCodeBlocks(rootEl);
        let prefix = '';

        if (codeType) {
          prefix = `<strong>${this.escapeHtml(codeType)}</strong> `;
        }

        return prefix + content;
      }

      // 重写消息查询以处理 AI Studio 的复杂结构
      queryMessages() {
        const selector = this.platform.messageSelector;
        let nodes = Array.from(document.querySelectorAll(selector));

        // 如果主选择器没有找到消息，尝试备用选择器
        if (nodes.length === 0 && this.platform.fallbackSelectors) {
          for (const fallbackSelector of this.platform.fallbackSelectors) {
            nodes = Array.from(document.querySelectorAll(fallbackSelector));
            if (nodes.length > 0) {
              console.log(`[AI Studio Navigator] 使用备用选择器: ${fallbackSelector}`);
              break;
            }
          }
        }

        return nodes.filter((el) => {
          if (!(el instanceof HTMLElement)) return false;
          if (!document.body.contains(el)) return false;

          // 确保是有效的对话回合
          const turnContent = el.querySelector('.turn-content');
          if (!turnContent) return false;

          // 如果是思考消息，直接包含
          if (this.customConfig.hasThoughts(el)) {
            return true;
          }

          // 排除空消息
          const text = this.customConfig.extractContent(el);
          return text.length > 0;
        });
      }

      // 重写消息摘要生成
      summarizeMessage(el, index) {
        // 如果是思考消息，使用特殊处理
        if (this.customConfig.hasThoughts(el)) {
          return `<span class="nav-emoji">${this.CONSTANTS.THINKING_EMOJI}</span>Thoughts`;
        }

        let text = this.extractText(el).trim();

        if (!text) {
          text = `Message ${index + 1}`;
        }

        // 再次清理可能残留的角色标识
        text = text.replace(/^(User|Model|用户|模型)[\s:：]*/, '');

        // 限制长度
        if (text.length > this.CONSTANTS.SUMMARY_MAX_LEN) {
          text = text.substring(0, this.CONSTANTS.SUMMARY_MAX_LEN) + "...";
        }

        // 添加消息类型表情
        const emoji = this.getMessageTypeEmoji(el);
        return `<span class="nav-emoji">${emoji}</span>${text}`;
      }
    }

    // 创建并初始化导航器
    const navigator = new AIStudioNavigator(navigatorConfig);
    navigator.init();

    console.log('[AI Studio Navigator] Google AI Studio 导航目录已初始化');

    // 添加 AI Studio 特定的样式调整
    addAIStudioStyles();
  };

  // 添加 AI Studio 特定样式
  function addAIStudioStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* AI Studio 特定样式调整 */

      /* 确保导航容器在 AI Studio 的复杂布局中正确显示 */
      #prompt-nav-container {
        z-index: 10000 !important;
      }

      /* 思考符号的特殊样式 */
      #prompt-nav-menu li a .nav-emoji {
        font-size: 1.1rem;
      }

      /* 思考消息的特殊样式 */
      #prompt-nav-menu li a[data-target-id*="turn-"] {
        position: relative;
      }

      /* 针对 AI Studio 的深色主题适配 */
      @media (prefers-color-scheme: dark) {
        #prompt-nav-container[data-theme='dark'] {
          --nav-bg-color: #1f1f1f;
          --nav-border-color: rgba(255, 255, 255, 0.12);
        }
      }

      /* 响应式调整，适配 AI Studio 的侧边栏 */
      @media (max-width: 1200px) {
        #prompt-nav-container {
          right: 0.75rem;
        }
      }

      /* 针对 AI Studio 移动端的调整 */
      @media (max-width: 768px) {
        #prompt-nav-container {
          top: 4rem;
          right: 0.5rem;
        }

        #prompt-nav-menu {
          width: 16rem;
          max-height: calc(100vh - 8rem);
        }
      }

      /* 确保与 AI Studio 的思考展开面板不冲突 */
      .mat-expansion-panel {
        position: relative;
        z-index: 1;
      }

      /* 针对 AI Studio 特有的消息结构优化 */
      ms-chat-turn .prompt-nav-effect-border {
        border-radius: 12px;
      }

      ms-chat-turn .prompt-nav-effect-pulse {
        border-radius: 12px;
      }

      ms-chat-turn .prompt-nav-effect-fade {
        border-radius: 12px;
      }

      /* 思考过程高亮效果的特殊处理 */
      ms-chat-turn:has(ms-thought-chunk) .prompt-nav-effect-border {
        outline-color: #9333ea;
      }

      ms-chat-turn:has(ms-thought-chunk) .prompt-nav-effect-pulse {
        box-shadow: 0 0 0 0 rgba(147, 51, 234, 0.7);
      }

      @keyframes prompt-nav-thinking-pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(147, 51, 234, 0.7);
        }
        50% {
          box-shadow: 0 0 0 15px rgba(147, 51, 234, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(147, 51, 234, 0);
        }
      }

      ms-chat-turn:has(ms-thought-chunk) .prompt-nav-effect-pulse {
        animation: prompt-nav-thinking-pulse 2s ease-in-out forwards;
      }
    `;

    document.head.appendChild(style);
  }

  // 监听 AI Studio 的动态路由变化
  function handleRouteChange() {
    // AI Studio 是 SPA，需要监听路由变化来重新初始化
    if (typeof window.NotionStyleNavigator !== 'undefined') {
      // 延迟初始化，等待新页面内容加载
      setTimeout(() => {
        const existingContainer = document.getElementById('prompt-nav-container');
        if (existingContainer) {
          existingContainer.remove();
        }
        initializeNavigator();
      }, 1000);
    }
  }

  // 监听页面变化（AI Studio SPA 路由）
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      handleRouteChange();
    }
  }).observe(document, { subtree: true, childList: true });

  // 开始等待并初始化
  waitForNavigator();
})();
