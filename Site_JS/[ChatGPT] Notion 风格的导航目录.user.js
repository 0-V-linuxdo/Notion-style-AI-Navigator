// ==UserScript==
// @name         [ChatGPT] Notion 风格的导航目录 [20251224] v1.0.0
// @namespace    https://github.com/0-V-linuxdo/Notion-style-AI-Navigator
// @description  为 ChatGPT 网页版添加悬浮导航目录，快速在对话消息间跳转，支持多种定位效果，包括高亮边框、脉冲光晕、淡入淡出等。
//
// @version      [20251224] v1.0.0
// @update-log   [20251224] v1.0.0: 新增 ChatGPT 适配，支持 chatgpt.com 与 chat.openai.com 新旧域名；修正滚动定位顶栏偏移问题
//
// @match        https://chatgpt.com/*
// @match        https://www.chatgpt.com/*
// @match        https://chat.openai.com/*
//
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
//
// @license      MIT
// @forked-from  https://greasyfork.org/scripts/541002
//
// @icon         https://www.google.com/s2/favicons?sz=64&domain=chatgpt.com
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

  const { hostname } = window.location;
  const isChatGPTHost =
    hostname.endsWith("chatgpt.com") || hostname === "chat.openai.com";
  if (!isChatGPTHost) return;

  // 等待核心功能脚本加载
  const waitForNavigator = () => {
    if (typeof window.NotionStyleNavigator !== "undefined") {
      initializeNavigator();
    } else {
      setTimeout(waitForNavigator, 100);
    }
  };

  // 初始化导航器
  const initializeNavigator = () => {
    const PLATFORMS = [
      {
        name: "ChatGPT",
        hosts: ["chatgpt.com", "chat.openai.com"],
        // 主要针对新版 ChatGPT DOM 结构
        messageSelector:
          "article[data-testid^='conversation-turn-'], article[data-turn-id], article[data-turn]",
      },
    ];

    const navigatorConfig = {
      platforms: PLATFORMS,
      storage: {
        getValue: (key, defaultValue) => {
          try {
            return GM_getValue(key, defaultValue);
          } catch (e) {
            console.warn(
              "[Prompt Navigator] GM_getValue 不可用，使用默认值：",
              e
            );
            return defaultValue;
          }
        },
        setValue: (key, value) => {
          try {
            GM_setValue(key, value);
          } catch (e) {
            console.warn("[Prompt Navigator] GM_setValue 不可用：", e);
          }
        },
      },
      menu: {
        registerMenuCommand: (name, callback) => {
          try {
            GM_registerMenuCommand(name, callback);
          } catch (e) {
            console.warn("[Prompt Navigator] GM_registerMenuCommand 不可用：", e);
          }
        },
      },
    };

    // ChatGPT 专用导航器：适配新版 DOM、角色识别与文本抽取
    class ChatGPTNavigator extends window.NotionStyleNavigator.PromptNavigator {
      constructor(config) {
        super(config);
        this.CONSTANTS.THINKING_EMOJI = "💭";
      }

      queryMessages() {
        const selector = this.platform.messageSelector;
        const nodes = Array.from(document.querySelectorAll(selector));

        return nodes.filter((el) => {
          if (!(el instanceof HTMLElement)) return false;
          if (!document.body.contains(el)) return false;
          if (el.closest("aside")) return false;

          const text = this.extractText(el).trim();
          const hasContent =
            text.length > 0 ||
            el.querySelector("pre, code, p, blockquote, ul, ol");
          return hasContent;
        });
      }

      getMessageTypeEmoji(el) {
        const role = this.getMessageRole(el);
        if (role === "user") return this.CONSTANTS.USER_EMOJI;
        if (role === "assistant") return this.CONSTANTS.ASSISTANT_EMOJI;
        return this.CONSTANTS.THINKING_EMOJI;
      }

      getMessageRole(el) {
        const bubbleRole = el.getAttribute("data-message-author-role");
        if (bubbleRole) return bubbleRole;

        const bubble = this.getMessageBubble(el);
        if (bubble) {
          const role = bubble.getAttribute("data-message-author-role");
          if (role) return role;
        }

        const directRole = el.getAttribute("data-message-author-role");
        if (directRole) return directRole;

        const innerRole = el
          .querySelector("[data-message-author-role]")
          ?.getAttribute("data-message-author-role");
        if (innerRole) return innerRole;

        const turnRole = el.getAttribute("data-turn");
        if (turnRole) return turnRole;

        const ariaLabel = el.getAttribute("aria-label");
        if (ariaLabel) {
          const lower = ariaLabel.toLowerCase();
          if (lower.includes("you said")) return "user";
          if (lower.includes("assistant said")) return "assistant";
        }

        return null;
      }

      getMessageBubble(container) {
        if (!container) return null;
        // 1) 直接是消息气泡
        if (container.getAttribute("data-message-author-role")) return container;

        // 2) 先找到消息块（含 data-message-author-role）
        const messageRoot =
          container.querySelector("[data-message-author-role]") ||
          container.querySelector(".text-message") ||
          container;

        // 3) 再在消息块内寻找实际气泡容器（尽量缩小高亮范围）
        const bubbleSelectors = [
          ".user-message-bubble-color",
          ".assistant-message-bubble-color",
          "[class*='message-bubble']",
          "[class*='bubble-color']",
          ".markdown.prose",
          ".markdown",
          ".conversation-item",
          ".text-message [class*='bubble']",
          ".text-message > div > div[class*='bubble']",
        ];

        for (const sel of bubbleSelectors) {
          const bubble = messageRoot.querySelector(sel);
          if (bubble) return bubble;
        }

        return messageRoot;
      }

      extractText(rootEl) {
        const clone = rootEl.cloneNode(true);

        const noisySelectors = [
          ".sr-only",
          "header",
          "footer",
          "form",
          "input",
          "textarea",
          "button",
          "svg",
          "img",
          "[role='menu']",
          "[role='toolbar']",
          "[data-testid='copy-turn-action-button']",
          "[data-testid='bad-response-turn-action-button']",
          "[data-testid='good-response-turn-action-button']",
          "[data-testid='webpage-citation-pill']",
          "[data-testid='webpage-citation-footnote']",
          "[data-testid='footnote-bar']",
          "[data-testid*='action-button']",
          "[aria-label='Copy']",
          "[aria-label='Edit message']",
          "[aria-label='Share']",
          "[aria-label='Good response']",
          "[aria-label='Bad response']",
          "[aria-label='Copy code']",
          ".group\\/footnote",
          ".gizmo-shared-transition-group",
          "[data-message-author-role='system']",
          "[data-message-author-role='tool']",
        ];

        noisySelectors.forEach((sel) => {
          clone.querySelectorAll(sel).forEach((el) => el.remove());
        });

        const content = (clone.textContent || "").replace(/\s+/g, " ").trim();
        return content;
      }

      summarizeMessage(el, index) {
        let text = this.extractText(el).trim();
        if (!text) {
          text = `Message ${index + 1}`;
        }

        if (text.length > this.CONSTANTS.SUMMARY_MAX_LEN) {
          text = text.substring(0, this.CONSTANTS.SUMMARY_MAX_LEN) + "...";
        }

        const emoji = this.getMessageTypeEmoji(el);
        return `<span class="nav-emoji">${emoji}</span>${text}`;
      }

      getTopBarOffset() {
        // 尝试获取顶部固定/吸顶元素的高度，避免滚动后被挡住
        const selectors = [
          "header",
          "nav[role='banner']",
          "[class*='sticky'][class*='top']",
          "[class*='fixed'][class*='top']",
          "[data-headlessui-state][class*='sticky']"
        ];

        let maxHeight = 0;
        selectors.forEach((sel) => {
          document.querySelectorAll(sel).forEach((el) => {
            const style = window.getComputedStyle(el);
            const pos = style.position;
            if (pos !== "fixed" && pos !== "sticky") return;

            const rect = el.getBoundingClientRect();
            if (rect.bottom <= 0) return; // 不在视口
            if (rect.top > 80) return;    // 明显不是顶部栏

            maxHeight = Math.max(maxHeight, rect.height);
          });
        });

        // 预留一点间距，且限制最大值
        if (maxHeight > 0) {
          return Math.min(maxHeight + 12, 200);
        }
        // 默认顶部栏约 64px，高度不可用时返回 64
        return 64;
      }

      scrollToMessage(messageElement) {
        const targetBubble = this.getMessageBubble(messageElement) || messageElement;
        const scrollParent = this.scrollParent || this.findScrollableParent(targetBubble);
        if (!this.scrollParent) this.scrollParent = scrollParent;

        let scrollTimeout;
        const scrollEndListener = () => {
          clearTimeout(scrollTimeout);
          scrollTimeout = setTimeout(() => {
            this.effectManager.applyEffect(targetBubble);
            scrollParent.removeEventListener("scroll", scrollEndListener);
          }, this.CONSTANTS.SCROLL_END_TIMEOUT);
        };
        scrollParent.addEventListener("scroll", scrollEndListener);

        const parentTop =
          scrollParent === document.documentElement
            ? 0
            : scrollParent.getBoundingClientRect().top;
        const msgTop = targetBubble.getBoundingClientRect().top;
        const offset =
          (this.CONSTANTS && this.CONSTANTS.SCROLL_OFFSET) ||
          this.config?.CONSTANTS?.SCROLL_OFFSET ||
          30;
        const scrollTop =
          (scrollParent.scrollTop || window.scrollY) +
          msgTop -
          parentTop -
          offset -
          this.getTopBarOffset();

        if (typeof scrollParent.scrollTo === "function") {
          scrollParent.scrollTo({ top: scrollTop, behavior: "smooth" });
        } else {
          window.scrollTo({ top: scrollTop, behavior: "smooth" });
        }
      }
    }

    const navigator = new ChatGPTNavigator(navigatorConfig);
    navigator.init();

    addChatGPTStyles();

    console.log("[Prompt Navigator] ChatGPT 导航目录已初始化");
  };

  // ChatGPT 额外样式，确保高亮与悬浮层显示正常
  function addChatGPTStyles() {
    const style = document.createElement("style");
    style.textContent = `
      #prompt-nav-container {
        z-index: 12000 !important;
      }

      article[data-testid^="conversation-turn-"],
      article[data-turn-id],
      article[data-turn] {
        scroll-margin-top: 72px;
      }

      article[data-testid^="conversation-turn-"] .prompt-nav-effect-border,
      article[data-turn-id] .prompt-nav-effect-border,
      article[data-turn] .prompt-nav-effect-border,
      article[data-testid^="conversation-turn-"] .prompt-nav-effect-pulse,
      article[data-turn-id] .prompt-nav-effect-pulse,
      article[data-turn] .prompt-nav-effect-pulse,
      article[data-testid^="conversation-turn-"] .prompt-nav-effect-fade,
      article[data-turn-id] .prompt-nav-effect-fade,
      article[data-turn] .prompt-nav-effect-fade {
        border-radius: 12px;
      }
    `;
    document.head.appendChild(style);
  }

  waitForNavigator();
})();
