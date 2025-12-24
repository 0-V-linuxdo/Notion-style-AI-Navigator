// ==UserScript==
// @name         [ChatHub] Notion 风格的导航目录 [20251224] v1.1.0
// @namespace    0_V userscripts/Notion 风格的 ChatHub 导航目录
// @description  为 ChatHub 网页版添加悬浮导航目录，每个对话区域拥有独立的导航目录，支持随区域定位。
//
// @version      [20251224] v1.1.0
// @update-log   v1.1.0: 下调侧边栏组件 z-index（设为 0），避免遮挡网页悬浮弹窗。
//
// @match        https://app.chathub.gg/*
//
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
//
// @license      MIT
// @author       0_V
//
// @icon         https://www.google.com/s2/favicons?sz=64&domain=chathub.gg
//
// @require      https://github.com/0-V-linuxdo/Notion-style-AI-Navigator/raw/main/core/ai-navigator-core.js
// ==/UserScript==

(function () {
  "use strict";

  if (window.location.host !== "app.chathub.gg") {
    return;
  }
  
  const run = () => {
    const waitForNavigator = () => {
      if (typeof window.NotionStyleNavigator !== "undefined") {
        initializeNavigator();
      } else {
        setTimeout(waitForNavigator, 100);
      }
    };

    const initializeNavigator = () => {
      const PLATFORMS = [
        {
          name: "ChatHub",
          hosts: ["app.chathub.gg"],
          messageSelector: 'div.group.flex.w-full.flex-row-reverse, div.group.flex.w-full.flex-row:not(.flex-row-reverse)',
        },
      ];

      const navigatorConfig = {
        platforms: PLATFORMS,
        storage: {
          getValue: (key, defaultValue) => {
            try { return GM_getValue(key, defaultValue); } catch (e) { console.warn("[Prompt Navigator] GM_getValue is not available, using default value:", e); return defaultValue; }
          },
          setValue: (key, value) => {
            try { GM_setValue(key, value); } catch (e) { console.warn("[Prompt Navigator] GM_setValue is not available:", e); }
          },
        },
        menu: {
          registerMenuCommand: (name, callback) => {
            try { GM_registerMenuCommand(name, callback); } catch (e) { console.warn("[Prompt Navigator] GM_registerMenuCommand is not available:", e); }
          },
        },
      };

      /**
       * Area-specific Navigator Class
       * Creates an independent sidebar for a specific chat pane.
       */
      class ChatHubAreaNavigator extends window.NotionStyleNavigator.PromptNavigator {
        constructor(config, areaEl, index) {
          super(config);
          this.areaEl = areaEl;
          this.index = index;
          
          // Generate unique IDs for this instance to allow multiple sidebars
          const suffix = `-${index}`;
          this.CONSTANTS.CONTAINER_ID = `prompt-nav-container${suffix}`;
          this.CONSTANTS.INDICATOR_ID = `prompt-nav-indicator${suffix}`;
          this.CONSTANTS.MENU_ID = `prompt-nav-menu${suffix}`;
          this.CONSTANTS.MESSAGE_ID_PREFIX = `prompt-nav-item${suffix}-`;
          
          // 使用节流替代防抖，确保流式输出时也能定时更新
          this.debouncedBuildNav = this.throttle(this.buildNav.bind(this), 500);
        }

        throttle(func, limit) {
          let inThrottle;
          return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
              func.apply(context, args);
              inThrottle = true;
              setTimeout(() => inThrottle = false, limit);
            }
          }
        }

        init() {
          if (!this.platform) return;
          
          // Inject styles specific to this instance ID (handled by core's addStyles using this.CONSTANTS)
          this.addStyles();
          
          this.setupObservers();
          this.setupEventListeners();
          
          // We don't register the menu command here to avoid duplicate menu items.
          // The manager or a single instance could handle global settings if needed.
          // For ChatHub, we let the manager handle menu registration.
          
          // Initial build
          this.buildNav();
          
          // Update position on window resize
          window.addEventListener('resize', () => this.updatePosition());
        }

        // Override: Only scope messages within this specific area element
        queryMessages() {
          const selector = this.platform.messageSelector;
          // Scope querySelectorAll to this.areaEl
          const nodes = Array.from(this.areaEl.querySelectorAll(selector));
          
          return nodes.map(el => {
            if (!(el instanceof HTMLElement)) return null;

            const isQuestion = el.classList.contains('flex-row-reverse');
            const hasContentBubble = isQuestion
              ? el.querySelector('[class*="bg-primary-blue"], [class*="dark:bg-primary-blue"], [class*="bg-white"]')
              : el.querySelector('[class*="bg-secondary"], [class*="dark:bg-secondary"], [class*="bg-gray"]');

            if (!hasContentBubble) return null;

            // Clone the bubble to avoid modifying the live DOM
            const clone = hasContentBubble.cloneNode(true);
            // Remove the 'details' element before extracting text and checking validity
            clone.querySelectorAll('details').forEach(el => el.remove());

            const text = this.extractText(clone).trim();
            
            // 用户消息：任意长度都有效
            // AI回复：需要至少50字符（约2行）才认为内容完整
            const minLengthForAI = 50;
            const isValid = isQuestion 
              ? text.length > 0 
              : text.length >= minLengthForAI;
            
            return isValid ? hasContentBubble : null;
          }).filter(Boolean);
        }

        // Override: Update position after building
        buildNav() {
            super.buildNav();
            this.updatePosition();
        }

        // Custom: Update the fixed position of the sidebar relative to the chat area
        updatePosition() {
            const container = document.getElementById(this.CONSTANTS.CONTAINER_ID);
            if (!container) return;
            
            // Check if area is still in DOM
            if (!document.body.contains(this.areaEl)) {
                container.remove();
                return;
            }

            const rect = this.areaEl.getBoundingClientRect();
            
            // Calculate position: Top-Right of the area
            // Use fixed positioning relative to viewport
            const top = Math.max(80, rect.top + 20); 
            const right = document.documentElement.clientWidth - rect.right + 20;

            container.style.position = 'fixed';
            container.style.top = `${top}px`;
            container.style.right = `${right}px`;
            
            // Hide if the area is too small or off-screen (e.g. collapsed)
            if (rect.width < 100 || rect.height < 100 || rect.bottom < 100) {
                container.style.display = 'none';
            } else {
                container.style.display = 'block';
            }
        }

        // Override: Observe only this area for changes
        setupObservers() {
          const observer = new MutationObserver(() => {
            this.debouncedBuildNav();
            this.updateTheme();
            this.updatePosition();
          });
          observer.observe(this.areaEl, { childList: true, subtree: true });
        }

        // Standard helpers
        getMessageTypeEmoji(el) {
          // If el is the bubble, try to find the row container to check direction
          const row = el.closest('.group.flex');
          if (row) {
            return row.classList.contains('flex-row-reverse') ? this.CONSTANTS.USER_EMOJI : this.CONSTANTS.ASSISTANT_EMOJI;
          }
          // Fallback if el is the row itself (should not happen with new queryMessages)
          return el.classList.contains('flex-row-reverse') ? this.CONSTANTS.USER_EMOJI : this.CONSTANTS.ASSISTANT_EMOJI;
        }

        extractText(rootEl) {
          const clone = rootEl.cloneNode(true);
          // 移除所有 thought 块、按钮、SVG 等无关元素
          clone.querySelectorAll('details, button, svg, .gap-1').forEach(el => el.remove());
          // 返回清理后的文本
          return (clone.textContent || "").replace(/\s+/g, " ").trim();
        }

        scrollToMessage(messageElement) {
          // Scroll parent is the area element itself
          const scrollParent = this.areaEl;
          this.scrollParent = scrollParent;

          let scrollTimeout;
          const scrollEndListener = () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
              this.effectManager.applyEffect(messageElement);
              scrollParent.removeEventListener("scroll", scrollEndListener);
            }, this.CONSTANTS.SCROLL_END_TIMEOUT);
          };
          scrollParent.addEventListener("scroll", scrollEndListener);

          const parentTop = scrollParent.getBoundingClientRect().top;
          const msgTop = messageElement.getBoundingClientRect().top;
          const scrollTop = scrollParent.scrollTop + msgTop - parentTop - this.CONSTANTS.SCROLL_OFFSET;

          scrollParent.scrollTo({ top: scrollTop, behavior: "smooth" });
        }
        
        // Override addStyles to ensure we don't duplicate global styles if they exist,
        // but still add the instance-specific ID styles.
        addStyles() {
            // Create style element for this instance
            const style = document.createElement("style");
            // We reuse the logic from parent but only for this instance's ID
            // Since we can't easily call part of super.addStyles(), we rely on the fact 
            // that super.addStyles() generates CSS based on this.CONSTANTS.CONTAINER_ID.
            // However, we want to ensure global CSS vars are present.
            
            // Inject a shared global style sheet once if not present
            if (!document.getElementById('prompt-nav-global-styles')) {
                 const globalStyle = document.createElement("style");
                 globalStyle.id = 'prompt-nav-global-styles';
                 // We can't easily extract just the global parts from the core class without instantiation.
                 // So we will let the first instance inject everything.
                 super.addStyles();
            } else {
                 // For subsequent instances, we still need the ID-specific selectors.
                 // The core addStyles() does both. It's safe to call it multiple times 
                 // as long as the CONSTANTS.CONTAINER_ID is different, it will generate 
                 // CSS for that specific ID.
                 super.addStyles();
            }
        }
      }

      /**
       * Manager Class
       * Detects chat areas and manages Navigator instances.
       */
      class ChatHubManager {
        constructor(config) {
            this.config = config;
            this.navigators = new Map(); // Map<Element, ChatHubAreaNavigator>
            this.menuRegistered = false;
            this.init();
        }

        init() {
            // Watch for new chat areas appearing
            const observer = new MutationObserver(() => this.scan());
            observer.observe(document.body, { childList: true, subtree: true });
            
            // Initial scan
            this.scan();
            
            // Periodically update positions (in case of layout changes not triggering resize)
            setInterval(() => this.updateAllPositions(), 1000);
        }

        scan() {
            const areas = this.findChatAreas();
            
            // 1. Cleanup
            for (const [el, nav] of this.navigators) {
                if (!document.body.contains(el)) {
                    const container = document.getElementById(nav.CONSTANTS.CONTAINER_ID);
                    if (container) container.remove();
                    this.navigators.delete(el);
                }
            }

            // 2. Create new
            areas.forEach((el, index) => {
                if (!this.navigators.has(el)) {
                    // Use a timestamp to ensure truly unique IDs if indices are reused
                    const uniqueId = `${index}-${Date.now()}`; 
                    const nav = new ChatHubAreaNavigator(this.config, el, uniqueId);
                    nav.init();
                    this.navigators.set(el, nav);
                    
                    // Register menu command only once
                    if (!this.menuRegistered) {
                        nav.registerMenuCommand();
                        this.menuRegistered = true;
                    }
                } else {
                    this.navigators.get(el).updatePosition();
                }
            });
        }

        findChatAreas() {
            // Find all message groups
            const selector = 'div.group.flex.w-full.flex-row-reverse, div.group.flex.w-full.flex-row:not(.flex-row-reverse)';
            const messages = document.querySelectorAll(selector);
            const areaSet = new Set();

            messages.forEach(msg => {
                let parent = msg.parentElement;
                // Walk up to find the scrollable container
                while (parent && parent !== document.body) {
                    const style = window.getComputedStyle(parent);
                    if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && parent.scrollHeight >= parent.clientHeight) {
                        areaSet.add(parent);
                        break;
                    }
                    parent = parent.parentElement;
                }
            });
            return Array.from(areaSet);
        }
        
        updateAllPositions() {
            this.navigators.forEach(nav => nav.updatePosition());
        }
      }

      // Start the manager
      new ChatHubManager(navigatorConfig);

      addChatHubStyles();
      console.log("[Prompt Navigator] ChatHub Manager initialized.");
    };

    waitForNavigator();
  }
  
  window.addEventListener('load', () => {
    setTimeout(run, 1500);
  });
  
  function addChatHubStyles() {
    const style = document.createElement("style");
    style.textContent = `
      div.group[class*="flex-row"] {
        scroll-margin-top: 80px;
      }
      /* Ensure nav containers transition smoothly when areas move */
      [id^="prompt-nav-container"] {
        /* Use non-positive stacking to avoid covering site modals/popovers that rely on default z-index layering */
        z-index: 0 !important;
        transition: top 0.2s ease, right 0.2s ease, opacity 0.2s ease;
      }
    `;
    document.head.appendChild(style);
  }
})();
