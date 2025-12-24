// ==UserScript==
// @name         [Poe] Notion 风格的导航目录 [20251224] v1.0.0
// @namespace    https://github.com/0-V-linuxdo/Notion-style-AI-Navigator
// @description  为 Poe 添加悬浮导航目录，快速在对话消息间跳转，支持多种定位效果，包括高亮边框、脉冲光晕、淡入淡出等。
//
// @version      [20251224] v1.0.0
// @update-log   [20251224] v1.0.0: 适配 Poe 平台，支持动态加载的聊天消息
//
// @match        https://poe.com/*
//
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
//
// @license      MIT
// @forked-from  https://greasyfork.org/scripts/541002
//
// @icon         https://github.com/0-V-linuxdo/Notion-style-AI-Navigator/raw/refs/heads/main/site_icons/Poe_icon.svg
//
// @require      https://github.com/0-V-linuxdo/Notion-style-AI-Navigator/raw/refs/heads/0-V-linuxdo-patch-1/notion-style-ai-navigator2.js
// ==/UserScript==

// ================================================
// 原脚本信息：
// 名称：Notion 风格的 ChatGPT、Gemini 导航目录
// 作者：YuJian
// 链接：https://greasyfork.org/scripts/541002
// 版本：2.3.0
// ================================================

(function () {
  "use strict";

  // 路径检查：仅在 Poe 聊天页面运行
  const { hostname, pathname } = window.location;
  if (hostname !== "poe.com") {
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
    // 平台配置
    const PLATFORMS = [
      {
        name: "Poe",
        hosts: ["poe.com"],
        messageSelector: ".ChatMessage_chatMessage__xkgHx[data-complete='true']",
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
            console.warn('[Prompt Navigator] GM_getValue 不可用，使用默认值：', e);
            return defaultValue;
          }
        },
        setValue: (key, value) => {
          try {
            GM_setValue(key, value);
          } catch (e) {
            console.warn('[Prompt Navigator] GM_setValue 不可用：', e);
          }
        }
      },

      // 菜单接口
      menu: {
        registerMenuCommand: (name, callback) => {
          try {
            GM_registerMenuCommand(name, callback);
          } catch (e) {
            console.warn('[Prompt Navigator] GM_registerMenuCommand 不可用：', e);
          }
        }
      }
    };

    // 扩展导航器类以适配 Poe
    class PoePromptNavigator extends window.NotionStyleNavigator.PromptNavigator {
      constructor(config) {
        super(config);
        // 增加 Poe 特有的初始化延迟，因为页面是动态加载的
        this.CONSTANTS.INIT_DELAY_MS = 3000;
      }

      /**
       * 重写消息查询方法以适配 Poe 的结构
       */
      queryMessages() {
        const selector = this.platform.messageSelector;
        const nodes = Array.from(document.querySelectorAll(selector));

        return nodes.filter((el) => {
          if (!(el instanceof HTMLElement)) return false;
          if (!document.body.contains(el)) return false;

          // 检查消息是否完成
          if (el.getAttribute('data-complete') !== 'true') return false;

          // 确保有消息内容
          const messageContent = el.querySelector('.Message_messageTextContainer__w64Sc, .Attachments_videoAttachment__Oy67V, .Attachments_imageAttachment__2VQPX');
          if (!messageContent) return false;

          // 提取文本内容检查
          const text = this.extractText(el).trim();
          return text.length > 0 || el.querySelector("pre, code, p, blockquote, ul, ol, video, img");
        });
      }

      /**
       * 重写消息类型判断以适配 Poe 的结构
       */
      getMessageTypeEmoji(el) {
        // 检查是否为右侧消息（用户消息）
        if (el.querySelector('.Message_rightSideMessageBubble__ioa_i')) {
          return this.CONSTANTS.USER_EMOJI;
        }

        // 检查是否为左侧消息（AI助手消息）
        if (el.querySelector('.Message_leftSideMessageBubble__VPdk6') ||
            el.querySelector('.LeftSideMessageHeader_leftSideMessageHeader__5CfdD')) {
          return this.CONSTANTS.ASSISTANT_EMOJI;
        }

        // 默认返回助手表情
        return this.CONSTANTS.ASSISTANT_EMOJI;
      }

      /**
       * 重写文本提取方法以适配 Poe 的结构
       */
      extractText(rootEl) {
        const clone = rootEl.cloneNode(true);

        // 移除 Poe 特有的噪声元素
        const noisySelectors = [
          ".MessageOverflowActions_overflowActionsWrapper__uC5oj",
          ".Message_messageMetadataContainer__nBPq7",
          ".LeftSideMessageHeader_leftSideMessageHeader__5CfdD",
          ".BotMessageHeader_wrapper__gvvdw",
          ".VideoPlayer_controlRoot__hJd_Z",
          ".VideoPlayer_buttonOverlay__jvLpQ",
          "button",
          "svg",
          ".vds-controls",
          ".vds-slider"
        ];

        noisySelectors.forEach(sel => {
          clone.querySelectorAll(sel).forEach(el => el.remove());
        });

        // 特殊处理代码块标题
        const codeHeaders = clone.querySelectorAll('pre code');
        let codePrefix = '';
        if (codeHeaders.length > 0) {
          // 尝试从前面的文本中提取语言信息
          const prevText = clone.textContent;
          if (prevText) {
            const codeMatch = prevText.match(/```(\w+)/);
            if (codeMatch) {
              codePrefix = `<strong>${this.escapeHtml(codeMatch[1])}</strong> `;
            }
          }
        }

        // 提取剩余文本内容
        const content = (clone.textContent || "").replace(/\s+/g, " ").trim();

        // 返回拼接结果
        return codePrefix + content;
      }

      /**
       * 重写消息摘要生成方法
       */
      summarizeMessage(el, index) {
        let text = this.extractText(el).trim();
        if (!text) text = el.textContent?.trim() || "";

        // 检查是否有附件（图片、视频等）
        const hasVideo = el.querySelector('.Attachments_videoAttachment__Oy67V');
        const hasImage = el.querySelector('.Attachments_imageAttachment__2VQPX');
        const hasAttachment = hasVideo || hasImage;

        if (!text && hasAttachment) {
          const attachmentType = hasVideo ? '视频' : hasImage ? '图片' : '附件';
          text = `[${attachmentType}]`;
        }

        if (!text) return `<span class="nav-emoji">${this.getMessageTypeEmoji(el)}</span>Item ${index + 1}`;

        if (text.length > this.CONSTANTS.SUMMARY_MAX_LEN) {
          text = text.substring(0, this.CONSTANTS.SUMMARY_MAX_LEN) + "...";
        }

        // 在文本前添加对应的表情
        const emoji = this.getMessageTypeEmoji(el);
        return `<span class="nav-emoji">${emoji}</span>${text}`;
      }
    }

    // 创建并初始化导航器
    const navigator = new PoePromptNavigator(navigatorConfig);
    navigator.init();

    console.log('[Prompt Navigator] Poe 导航目录已初始化');
  };

  // 开始等待并初始化
  waitForNavigator();
})();
