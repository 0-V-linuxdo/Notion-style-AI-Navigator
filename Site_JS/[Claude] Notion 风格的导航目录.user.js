// ==UserScript==
// @name         [Claude] Notion 风格的导航目录 [20251216] v1.0.0
// @namespace    0_V userscripts/Notion 风格的 claude.ai 导航目录
// @description  为 Claude.ai 添加悬浮导航目录，快速在对话消息间跳转，支持多种定位效果，包括高亮边框、脉冲光晕、淡入淡出等。
// @version      [20251216] v1.0.0
// @update-log   v1.0.0: 新增 claude.ai 适配；修正模型下拉被误标；高亮贴合整块气泡
//
// @match        https://claude.ai/*
// @match        https://www.claude.ai/*
//
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
//
// @license      MIT
// @forked-from  https://greasyfork.org/scripts/541002
//
// @icon         https://claude.ai/favicon.ico
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

  if (!/(^|\.)claude\.ai$/.test(location.hostname)) return;

  // 给用户/助手消息正文打标，供核心脚本识别
  const setupClaudeMessageMarkers = (() => {
    const FLAG = "data-nsan-article";
    const USER_SELECTOR = "div[data-testid='user-message']";
    // Claude 页面对助手正文使用 .font-claude-response-body；我们标记其父级（常带 .font-claude-response），避免误标按钮/下拉
    const ASSISTANT_BODY_SELECTOR = ".font-claude-response-body";
    const IGNORE_CONTAINER_SELECTOR =
      "button, [role='button'], [type='button'], [aria-haspopup], [role='menu'], [role='dialog'], [data-testid='model-selector-dropdown']";

    const getTarget = (el, author) => {
      if (!el) return null;

      // 用户消息：选取带背景/圆角的气泡容器
      if (author === "user") {
        const bubble = el.closest(".bg-bg-300") || el.closest(".group.relative.inline-flex");
        if (bubble && !bubble.closest(IGNORE_CONTAINER_SELECTOR)) return bubble;
      }

      // 助手消息：优先外层 .font-claude-response，否则用正文自身
      if (author === "assistant") {
        const bubble = el.closest(".font-claude-response") || el.closest(".group.relative.pb-3");
        if (bubble && !bubble.closest(IGNORE_CONTAINER_SELECTOR)) return bubble;
      }

      return el;
    };

    const mark = (el, author) => {
      const target = getTarget(el, author);
      if (!target || target.getAttribute(FLAG) === "1") return;
      if (target.closest(IGNORE_CONTAINER_SELECTOR)) return;
      target.setAttribute("role", "article");
      target.setAttribute("data-author", author);
      target.setAttribute(FLAG, "1");
    };

    const runOnce = () => {
      document.querySelectorAll(USER_SELECTOR).forEach((el) => mark(el, "user"));

      document.querySelectorAll(ASSISTANT_BODY_SELECTOR).forEach((body) => {
        // 取带字体样式的上层容器，否则用正文自身
        const container = body.closest(".font-claude-response") || body;
        mark(container, "assistant");
      });
    };

    const observe = () => {
      const mo = new MutationObserver((muts) => {
        for (const m of muts) {
          if (m.type !== "childList") continue;
          m.addedNodes.forEach((node) => {
            if (!(node instanceof HTMLElement)) return;

            if (node.matches?.(USER_SELECTOR)) mark(node, "user");
            node.querySelectorAll?.(USER_SELECTOR).forEach((el) => mark(el, "user"));
            node.querySelectorAll?.(ASSISTANT_BODY_SELECTOR).forEach((body) => {
              const container = body.closest(".font-claude-response") || body;
              mark(container, "assistant");
            });
          });
        }
      });

      mo.observe(document.body, { childList: true, subtree: true });
    };

    return () => {
      runOnce();
      observe();
    };
  })();

  const waitForNavigator = () => {
    if (typeof window.NotionStyleNavigator !== "undefined") {
      initializeNavigator();
    } else {
      setTimeout(waitForNavigator, 100);
    }
  };

  const initializeNavigator = () => {
    setupClaudeMessageMarkers();

    const PLATFORMS = [
      {
        name: "Claude.ai",
        hosts: ["claude.ai", "www.claude.ai"],
        // 仅选取我们打标过的正文节点，避免把工具栏/历史记录面板纳入
        messageSelector: "[data-nsan-article='1']",
      },
    ];

    const navigatorConfig = {
      platforms: PLATFORMS,
      storage: {
        getValue: (key, defaultValue) => {
          try {
            return GM_getValue(key, defaultValue);
          } catch (e) {
            console.warn("[Prompt Navigator] GM_getValue 不可用，使用默认值：", e);
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

    const { PromptNavigator } = window.NotionStyleNavigator;
    const navigator = new PromptNavigator(navigatorConfig);
    navigator.init();

    console.log("[Prompt Navigator] Claude.ai 导航目录已初始化");
  };

  waitForNavigator();
})();
