// ==UserScript==
// @name         [Gemini] Notion 风格的导航目录 [20251224] v1.0.0
// @namespace    https://github.com/0-V-linuxdo/Notion-style-AI-Navigator
// @description  为 Gemini（gemini.google.com/bard.google.com）网页版添加悬浮导航目录，快速在对话消息间跳转，支持多种定位效果，包括高亮边框、脉冲光晕、淡入淡出等。
//
// @version      [20251224] v1.0.0
// @update-log   [20251224] v1.0.0: 新增 Gemini 适配，标注用户与助手消息正文，兼容 gemini.google.com 与 bard.google.com
//
// @match        https://gemini.google.com/*
// @match        https://bard.google.com/*
//
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
//
// @license      MIT
// @forked-from  https://greasyfork.org/scripts/541002
//
// @icon         https://www.google.com/s2/favicons?sz=64&domain=gemini.google.com
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
  const isGeminiHost =
    hostname === "gemini.google.com" || hostname === "bard.google.com";
  if (!isGeminiHost) return;

  const FLAG = "data-nsan-article";

  // 为 Gemini 消息正文打标，缩小高亮范围
  const markGeminiMessages = (() => {
    const USER_ROOT_SEL = "user-query";
    const ASSIST_ROOT_SEL = "model-response";

    const setArticle = (el, author) => {
      if (!el || el.getAttribute(FLAG) === "1") return;
      el.setAttribute("role", "article");
      el.setAttribute(FLAG, "1");
      if (author) el.setAttribute("data-author", author);
    };

    const findUserBody = (root) => {
      if (!root) return null;
      return (
        root.querySelector(".user-query-bubble-with-background") ||
        root.querySelector(".query-text") ||
        root.querySelector(".query-content") ||
        root.querySelector(".user-query-container") ||
        root
      );
    };

    const findAssistantBody = (root) => {
      if (!root) return null;

      const responseText = root.querySelector(".model-response-text");
      if (responseText) {
        const markdown = responseText.querySelector(".markdown");
        return markdown || responseText;
      }

      const messageContent = root.querySelector("message-content");
      if (messageContent) {
        const markdown = messageContent.querySelector(".markdown");
        return markdown || messageContent;
      }

      const responseContainer = root.querySelector(
        ".response-container-content, .response-container, structured-content-container"
      );
      if (responseContainer) return responseContainer;

      return root;
    };

    const adaptUser = (node) => {
      const body = findUserBody(node);
      setArticle(body, "user");
    };

    const adaptAssistant = (node) => {
      const body = findAssistantBody(node);
      setArticle(body, "assistant");
    };

    const runInitial = () => {
      document.querySelectorAll(USER_ROOT_SEL).forEach(adaptUser);
      document.querySelectorAll(ASSIST_ROOT_SEL).forEach(adaptAssistant);
    };

    const observe = () => {
      const mo = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((n) => {
            if (!(n instanceof HTMLElement)) return;

            if (n.matches?.(USER_ROOT_SEL)) adaptUser(n);
            if (n.matches?.(ASSIST_ROOT_SEL)) adaptAssistant(n);

            n.querySelectorAll?.(USER_ROOT_SEL).forEach(adaptUser);
            n.querySelectorAll?.(ASSIST_ROOT_SEL).forEach(adaptAssistant);
          });
        });
      });

      mo.observe(document.body, {
        childList: true,
        subtree: true,
      });
    };

    return () => {
      runInitial();
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
    // 先给消息正文打标，确保导航精准指向气泡本身
    markGeminiMessages();

    const PLATFORMS = [
      {
        name: "Gemini",
        hosts: ["gemini.google.com", "bard.google.com"],
        messageSelector: `[${FLAG}='1']`,
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
            console.warn(
              "[Prompt Navigator] GM_registerMenuCommand 不可用：",
              e
            );
          }
        },
      },
    };

    const navigator = new window.NotionStyleNavigator.PromptNavigator(
      navigatorConfig
    );

    // 定制文本提取，剔除 Gemini 界面的一些动作按钮与图标
    const originalExtractText = navigator.extractText.bind(navigator);
    navigator.extractText = function (rootEl) {
      const clone = rootEl.cloneNode(true);

      const noisySelectors = [
        "button",
        "svg",
        "mat-icon",
        "mat-icon-button",
        "tts-control",
        ".response-container-header",
        ".response-container-footer",
        ".actions-container-v2",
        "message-actions",
        ".thumb-animation",
        ".regenerate-animation",
      ];
      noisySelectors.forEach((sel) => {
        clone.querySelectorAll(sel).forEach((el) => el.remove());
      });

      const content = (clone.textContent || "").replace(/\s+/g, " ").trim();
      if (content) return content;

      return originalExtractText(rootEl);
    };

    navigator.init();
    console.log("[Prompt Navigator] Gemini 导航目录已初始化");
  };

  waitForNavigator();
})();
