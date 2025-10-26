// ==UserScript==
// @name         [Kagi] Notion 风格的导航目录2
// @namespace    0_V userscripts/Notion 风格的 kagi assistant 导航目录
// @description  为 Kagi Assistant 添加悬浮导航目录，快速在对话消息间跳转，支持多种定位效果，包括高亮边框、脉冲光晕、淡入淡出等。
//
// @version      [20251022] v1.0.1
// @update-log   v1.0.1: 扩展匹配域并增加路径判定；拆分为核心功能外部脚本和调用脚本
//
// @match        https://kagi.com/*
//
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
//
// @license      MIT
// @forked-from  https://greasyfork.org/scripts/541002
//
// @icon         https://github.com/0-V-linuxdo/Notion-style-AI-Navigator/raw/refs/heads/main/site_icons/kagi%20assistant_icon.svg
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

  // 路径检查：仅在 Kagi Assistant 页面运行
  const { hostname, pathname } = window.location;
  if (
    hostname !== "kagi.com" ||
    (pathname !== "/assistant" && !pathname.startsWith("/assistant/"))
  ) {
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
        name: "Kagi Assistant",
        hosts: ["kagi.com"],
        messageSelector: ".chat_bubble[role='article'], .chat_bubble, main [role='article']",
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

    // 创建并初始化导航器
    const navigator = new window.NotionStyleNavigator.PromptNavigator(navigatorConfig);
    navigator.init();

    console.log('[Prompt Navigator] Kagi Assistant 导航目录已初始化');
  };

  // 开始等待并初始化
  waitForNavigator();
})();
