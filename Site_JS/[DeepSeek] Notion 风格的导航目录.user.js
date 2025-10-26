// ==UserScript==
// @name         [DeepSeek] Notion 风格的导航目录 [20241220] v1.0.2
// @namespace    0_V userscripts/Notion 风格的 deepseek 导航目录
// @description  为 DeepSeek 网页版添加悬浮导航目录，快速在对话消息间跳转，支持多种定位效果，包括高亮边框、脉冲光晕、淡入淡出等。
//
// @version      [20241220] v1.0.2
// @update-log   v1.0.2: 限定适配域名为 chat.deepseek.com
//
// @match        https://chat.deepseek.com/*
//
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
//
// @license      MIT
// @forked-from  https://greasyfork.org/scripts/541002
//
// @icon         https://github.com/0-V-linuxdo/Notion-style-AI-Navigator/raw/refs/heads/main/site_icons/deepseek_icon.svg
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

  if (window.location.hostname !== "chat.deepseek.com") {
    return;
  }

  const waitForNavigator = () => {
    if (typeof window.NotionStyleNavigator !== 'undefined') {
      initializeNavigator();
    } else {
      setTimeout(waitForNavigator, 100);
    }
  };

  const initializeNavigator = () => {
    const PLATFORMS = [
      {
        name: "DeepSeek Chat",
        hosts: ["chat.deepseek.com"],
        messageSelector: ".ds-message, [role='assistant'], [role='user']",
      }
    ];

    const navigatorConfig = {
      platforms: PLATFORMS,
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

    const navigator = new window.NotionStyleNavigator.PromptNavigator(navigatorConfig);

    const originalQueryMessages = navigator.queryMessages.bind(navigator);
    navigator.queryMessages = function() {
      const selector = this.platform.messageSelector;
      const nodes = Array.from(document.querySelectorAll(selector));

      return nodes.filter((el) => {
        if (!(el instanceof HTMLElement)) return false;
        if (!document.body.contains(el)) return false;

        const isMessage = el.classList.contains("ds-message") ||
                          el.getAttribute("role") === "assistant" ||
                          el.getAttribute("role") === "user";
        if (!isMessage) return false;

        const text = this.extractText(el).trim();
        const hasContent = text.length > 0 ||
                           el.querySelector(".ds-markdown, .fbb737a4, pre, code, p, blockquote, ul, ol");

        return hasContent;
      });
    };

    const originalGetMessageTypeEmoji = navigator.getMessageTypeEmoji.bind(navigator);
    navigator.getMessageTypeEmoji = function(el) {
      const role = el.getAttribute('role');
      if (role === 'user') {
        return this.CONSTANTS.USER_EMOJI;
      } else if (role === 'assistant') {
        return this.CONSTANTS.ASSISTANT_EMOJI;
      }

      const textContainer = el.querySelector('.fbb737a4');
      if (textContainer) {
        return this.CONSTANTS.USER_EMOJI;
      }

      return originalGetMessageTypeEmoji(el);
    };

    const originalExtractText = navigator.extractText.bind(navigator);
    navigator.extractText = function(rootEl) {
      const clone = rootEl.cloneNode(true);

      const userTextEl = clone.querySelector('.fbb737a4');
      if (userTextEl) {
        const userText = userTextEl.textContent?.trim() || '';
        if (userText) {
          return userText;
        }
      }

      const noisySelectors = [
        ".ds-icon",
        "button",
        "svg",
        ".ds-icon-button",
        ".ds-atom-button",
        ".ds-floating-button",
        ".ds-scroll-area__gutters",
        ".ds-scroll-area__vertical-gutter",
        ".ds-scroll-area__horizontal-gutter"
      ];
      noisySelectors.forEach(sel => {
        clone.querySelectorAll(sel).forEach(el => el.remove());
      });

      const content = (clone.textContent || "").replace(/\s+/g, " ").trim();
      if (content) {
        return content;
      }

      return originalExtractText(rootEl);
    };

    navigator.init();
    console.log('[Prompt Navigator] DeepSeek 导航目录已初始化');
  };

  waitForNavigator();
})();
