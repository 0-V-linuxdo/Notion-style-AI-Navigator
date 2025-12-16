// ==UserScript==
// @name         [DeepSeek] Notion 风格的导航目录 [20251216] v1.0.0
// @namespace    0_V userscripts/Notion 风格的 deepseek 导航目录
// @description  为 DeepSeek 网页版添加悬浮导航目录，快速在对话消息间跳转，支持多种定位效果，包括高亮边框、脉冲光晕、淡入淡出等。
//
// @version      [20251216] v1.0.0
// @update-log   [20251216] v1.0.0: 调整高亮定位，边框贴合 DeepSeek 气泡
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

    const getHighlightTarget = (messageEl) => {
      if (!messageEl) return null;

      const isUsable = (el) => {
        if (!(el instanceof HTMLElement)) return false;
        const rect = el.getBoundingClientRect();
        const hasSize = rect.width > 0 && rect.height > 0;
        const hasText = (el.textContent || "").trim().length > 0;
        return hasSize && hasText;
      };

      const mainMarkdowns = Array.from(
        messageEl.querySelectorAll(".ds-markdown")
      ).filter((el) => !el.closest(".ds-think-content") && isUsable(el));
      if (mainMarkdowns.length > 0) {
        return mainMarkdowns[mainMarkdowns.length - 1];
      }

      const candidateSelectors = [
        ".fbb737a4",
        ".ds-think-content .ds-markdown",
        ".ds-markdown",
        "._74c0879"
      ];

      for (const selector of candidateSelectors) {
        const candidate = messageEl.querySelector(selector);
        if (isUsable(candidate)) {
          return candidate;
        }
      }

      return messageEl;
    };

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

    const originalSummarize = navigator.summarizeMessage.bind(navigator);
    navigator.summarizeMessage = function(el, index) {
      const pickMainText = () => {
        const mainMarkdowns = Array.from(el.querySelectorAll('.ds-markdown'))
          .filter((md) => !md.closest('.ds-think-content') && (md.textContent || '').trim().length > 0);
        if (mainMarkdowns.length > 0) {
          const last = mainMarkdowns[mainMarkdowns.length - 1];
          return (last.textContent || '').replace(/\s+/g, ' ').trim();
        }

        const userEl = el.querySelector('.fbb737a4');
        if (userEl && (userEl.textContent || '').trim().length > 0) {
          return (userEl.textContent || '').replace(/\s+/g, ' ').trim();
        }

        return '';
      };

      let text = pickMainText();

      if (!text) {
        const clone = el.cloneNode(true);
        const noisySelectors = [
          ".ds-think-content",
          ".ds-icon",
          ".ds-icon-button",
          ".ds-atom-button",
          ".ds-floating-button",
          ".ffdab56b",
          ".c99b79f8",
          ".site_logo_back",
          ".d162f7b9"
        ];
        noisySelectors.forEach(sel => {
          clone.querySelectorAll(sel).forEach(node => node.remove());
        });
        text = (clone.textContent || "").replace(/\s+/g, " ").trim();
      }

      if (!text) {
        return originalSummarize(el, index);
      }

      if (text.length > this.CONSTANTS.SUMMARY_MAX_LEN) {
        text = text.substring(0, this.CONSTANTS.SUMMARY_MAX_LEN) + "...";
      }

      const emoji = this.getMessageTypeEmoji(el);
      return `<span class="nav-emoji">${emoji}</span>${text}`;
    };

    navigator.scrollToMessage = function(messageElement) {
      const targetEl = getHighlightTarget(messageElement) || messageElement;
      const scrollParent = this.scrollParent || this.findScrollableParent(targetEl);
      if (!this.scrollParent) this.scrollParent = scrollParent;

      let scrollTimeout;
      const scrollEndListener = () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          this.effectManager.applyEffect(targetEl);
          scrollParent.removeEventListener("scroll", scrollEndListener);
        }, this.CONSTANTS.SCROLL_END_TIMEOUT);
      };
      scrollParent.addEventListener("scroll", scrollEndListener);

      const parentTop = scrollParent === document.documentElement ? 0 : scrollParent.getBoundingClientRect().top;
      const msgTop = targetEl.getBoundingClientRect().top;
      const scrollTop = (scrollParent.scrollTop || window.scrollY) + msgTop - parentTop - this.CONSTANTS.SCROLL_OFFSET;

      if (typeof scrollParent.scrollTo === "function") {
        scrollParent.scrollTo({ top: scrollTop, behavior: "smooth" });
      } else {
        window.scrollTo({ top: scrollTop, behavior: "smooth" });
      }
    };

    navigator.init();
    console.log('[Prompt Navigator] DeepSeek 导航目录已初始化');
  };

  waitForNavigator();
})();
