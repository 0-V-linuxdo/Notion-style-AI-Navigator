// ==UserScript==
// @name         [LeChat] Notion 风格的导航目录 [20251024] v1.0.1
// @namespace    0_V userscripts/Notion 风格的 AI 导航目录
// @description  为 Mistral LeChat（chat.mistral.ai）添加 Notion 风格悬浮导航目录；仅含配置与适配逻辑，核心功能由外部脚本提供。
// @version      [20251024] v1.0.1
// @update-log   v1.0.1: 精准标注“用户输入区域”，缩小高亮范围；仅对真正消息气泡/正文打标
//
// @match        https://chat.mistral.ai/*
//
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
//
// @license      MIT
// @icon         https://chat.mistral.ai/favicon.ico
//
// @require      https://github.com/0-V-linuxdo/Notion-style-AI-Navigator/raw/refs/heads/0-V-linuxdo-patch-1/notion-style-ai-navigator2.js
// ==/UserScript==

(function () {
  "use strict";

  if (!/(^|\.)chat\.mistral\.ai$/.test(location.hostname)) return;

  // 给真正的“消息正文节点”打标：
  // - role="article" 供外部脚本通过过滤
  // - data-nsan-article="1" 仅选取我们标注过的节点，避免范围过大
  // - data-author 标记作者类型（user/assistant）
  const markLeChatMessageBodies = (() => {
    const ROOT_SEL = "div[data-message-author-role]";
    const FLAG = "data-nsan-article";

    function setArticle(el, author) {
      if (!el || el.getAttribute(FLAG) === "1") return;
      el.setAttribute("role", "article");
      el.setAttribute(FLAG, "1");
      if (!el.hasAttribute("data-author") && author) {
        el.setAttribute("data-author", author);
      }
    }

    // 精确定位“用户消息”的灰底圆角气泡（而不是整块外层）
    function findUserBody(root) {
      // 结构一般为：root > .flex.min-w-0.flex-1.flex-col > div.rounded-3xl(气泡)
      const direct = root.querySelector(
        ":scope > .flex.min-w-0.flex-1.flex-col > div.rounded-3xl"
      );
      if (direct) return direct;

      // 兜底：任意后代的圆角大气泡
      const bubble = root.querySelector(".rounded-3xl");
      if (bubble) return bubble;

      // 最后兜底：正文容器（尽量窄）
      return root.querySelector(":scope .flex.w-full.flex-col.gap-2.break-words");
    }

    // 精确定位“助手消息”主体：优先选择最终回答块，其次任一 markdown 正文
    function findAssistantBody(root) {
      const answer = root.querySelector("[data-message-part-type='answer'].markdown-container-style");
      if (answer) return answer;

      const firstMd = root.querySelector(".markdown-container-style");
      if (firstMd) return firstMd;

      // 兜底：第一段正文容器
      return root.querySelector(":scope .flex.w-full.flex-col.gap-2.break-words");
    }

    function adaptOne(root) {
      const role = root.getAttribute("data-message-author-role");
      if (!role) return;

      // 清理历史误标：如果外层被标了我们的 FLAG，则移除，避免整块被识别
      if (root.getAttribute(FLAG) === "1") {
        root.removeAttribute(FLAG);
        if (root.getAttribute("role") === "article") {
          root.removeAttribute("role");
        }
      }

      let body = null;
      if (role === "user") {
        body = findUserBody(root);
        setArticle(body, "user");
      } else {
        body = findAssistantBody(root);
        setArticle(body, "assistant");
      }
    }

    function runOnce() {
      document.querySelectorAll(ROOT_SEL).forEach(adaptOne);
    }

    function observe() {
      const mo = new MutationObserver((muts) => {
        for (const m of muts) {
          if (m.type === "childList") {
            m.addedNodes.forEach((n) => {
              if (!(n instanceof HTMLElement)) return;
              if (n.matches?.(ROOT_SEL)) adaptOne(n);
              n.querySelectorAll?.(ROOT_SEL).forEach(adaptOne);
            });
          } else if (m.type === "attributes") {
            const t = m.target;
            if (t instanceof HTMLElement && t.matches(ROOT_SEL)) {
              adaptOne(t);
            }
          }
        }
      });
      mo.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["data-message-author-role"],
      });
    }

    return () => {
      runOnce();
      observe();
    };
  })();

  function waitForCoreAndInit() {
    if (typeof window.NotionStyleNavigator !== "undefined" &&
        typeof window.NotionStyleNavigator.PromptNavigator === "function") {
      initNavigator();
    } else {
      setTimeout(waitForCoreAndInit, 100);
    }
  }

  function initNavigator() {
    // 先精准标注消息正文，缩小高亮范围
    markLeChatMessageBodies();

    const PLATFORMS = [
      {
        name: "LeChat (Mistral)",
        hosts: ["chat.mistral.ai"],
        // 只选取我们打了 data-nsan-article="1" 的正文节点，避免把整块外层或输入区纳入
        messageSelector: "[data-nsan-article='1']",
      },
    ];

    const navigatorConfig = {
      platforms: PLATFORMS,
      storage: {
        getValue: (key, def) => {
          try { return GM_getValue(key, def); } catch { return def; }
        },
        setValue: (key, val) => {
          try { GM_setValue(key, val); } catch {}
        },
      },
      menu: {
        registerMenuCommand: (name, cb) => {
          try { GM_registerMenuCommand(name, cb); } catch {}
        },
      },
    };

    const { PromptNavigator } = window.NotionStyleNavigator;
    const nav = new PromptNavigator(navigatorConfig);
    nav.init();

    console.log("[Prompt Navigator] LeChat 适配已初始化（优化用户输入区域识别）");
  }

  waitForCoreAndInit();
})();
