(function (global) {
  "use strict";

  const DEFAULT_CONSTANTS = {
    CONTAINER_ID: "prompt-nav-container",
    INDICATOR_ID: "prompt-nav-indicator",
    MENU_ID: "prompt-nav-menu",
    INDICATOR_LINE_CLASS: "nav-indicator-line",
    ACTIVE_CLASS: "active",
    MESSAGE_ID_PREFIX: "prompt-nav-item-",
    SCROLL_END_TIMEOUT: 150,
    DEBOUNCE_BUILD_MS: 500,
    THROTTLE_UPDATE_MS: 100,
    INIT_DELAY_MS: 2000,
    CODE_LANG_LABEL_CLASS: "prompt-nav-code-lang-label",
    USER_EMOJI: "❓",
    ASSISTANT_EMOJI: "🤖",
  };

  const DEFAULT_OPTIONS = {
    messageSelector: "",
    isMessageElement: null,
    skipMessage: null,
    extractText: null,
    summarizeMessage: null,
    getMessageEmoji: null,
    shouldInit: null,
    initDelayMs: DEFAULT_CONSTANTS.INIT_DELAY_MS,
    scrollOffset: 30,
    storageKey: "prompt-nav-effect-mode",
    defaultEffect: "border",
    logPrefix: "[Prompt Navigator]",
    enableSettings: true,
    menuCommandLabel: "⚙️ 导航效果设置",
    summaryMaxLen: 60,
    highlightThresholdRatio: 0.4,
    availableEffects: null,
    settingsModalText: {},
    constants: {},
  };

  const DEFAULT_EFFECTS = [
    { id: "none", name: "无效果（纯平滑滚动）", description: "仅滚动，不显示任何动画效果" },
    { id: "border", name: "高亮边框", description: "显示 3px 彩色边框，持续 2 秒" },
    { id: "pulse", name: "脉冲光晕", description: "边框脉冲闪烁，持续 2 秒" },
    { id: "fade", name: "淡入淡出", description: "背景淡入淡出效果，持续 1.5 秒" },
    { id: "jiggle", name: "经典抖动", description: "水平微抖动（原效果）" },
  ];

  function defaultIsMessageElement(el) {
    if (!(el instanceof HTMLElement)) return false;
    if (!document.body.contains(el)) return false;
    const text = (el.textContent || "").trim();
    if (text.length > 0) return true;
    return !!el.querySelector("pre, code, p, blockquote, ul, ol");
  }

  function defaultSkipMessage(el) {
    const selector = el.querySelector(".selector");
    if (!selector) return false;

    const clone = el.cloneNode(true);
    const cloneSelector = clone.querySelector(".selector");
    if (cloneSelector) {
      cloneSelector.remove();
    }

    const noisySelectors = [
      ".model",
      "button",
      "svg",
      "header",
      "footer",
      "[data-files]",
      "[data-edit]",
      ".code-buttons",
    ];
    noisySelectors.forEach((sel) => {
      clone.querySelectorAll(sel).forEach((node) => node.remove());
    });

    const remainingText = (clone.textContent || "").replace(/\s+/g, " ").trim();
    return remainingText.length < 10;
  }

  function defaultGetMessageEmoji(el, constants) {
    const author = el.getAttribute("data-author");
    if (author === "user") {
      return constants.USER_EMOJI;
    }
    if (author === "assistant") {
      return constants.ASSISTANT_EMOJI;
    }

    const ariaLabel = el.getAttribute("aria-label");
    if (ariaLabel) {
      if (ariaLabel.includes("You said:")) {
        return constants.USER_EMOJI;
      }
      if (ariaLabel.includes("Assistant said:")) {
        return constants.ASSISTANT_EMOJI;
      }
    }

    return constants.ASSISTANT_EMOJI;
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function defaultExtractText(el, helpers) {
    const clone = el.cloneNode(true);

    const filenameEl = clone.querySelector(".filename");
    let filenamePrefix = "";
    if (filenameEl) {
      filenamePrefix = `<strong>${helpers.escapeHtml(filenameEl.textContent)}</strong> `;
      filenameEl.remove();
    }

    const noisySelectors = [
      ".model",
      "button",
      "svg",
      "header",
      "footer",
      "[data-files]",
      "[data-edit]",
      ".selector",
      ".code-buttons",
    ];
    noisySelectors.forEach((sel) => {
      clone.querySelectorAll(sel).forEach((node) => node.remove());
    });

    const content = (clone.textContent || "").replace(/\s+/g, " ").trim();
    return filenamePrefix + content;
  }

  function defaultSummarizeMessage(el, index, helpers) {
    let text = helpers.extractText(el).trim();
    if (!text) text = el.textContent?.trim() || "";
    if (!text) {
      const emoji = helpers.getEmoji(el);
      return `<span class="nav-emoji">${emoji}</span>Item ${index + 1}`;
    }

    if (text.length > helpers.summaryMaxLen) {
      text = text.substring(0, helpers.summaryMaxLen) + "...";
    }

    const emoji = helpers.getEmoji(el);
    return `<span class="nav-emoji">${emoji}</span>${text}`;
  }

  class StorageManager {
    constructor(storageKey, defaultEffect = "border") {
      this.storageKey = typeof storageKey === "string" && storageKey.length > 0 ? storageKey : null;
      this.defaultEffect = defaultEffect;
    }

    getEffect() {
      if (!this.storageKey) return this.defaultEffect;
      try {
        if (typeof GM_getValue === "function") {
          return GM_getValue(this.storageKey, this.defaultEffect);
        }
      } catch (err) {
        console.warn("[Prompt Navigator] 读取效果设置失败：", err);
      }

      try {
        const value = window.localStorage?.getItem(this.storageKey);
        return value || this.defaultEffect;
      } catch (err) {
        return this.defaultEffect;
      }
    }

    setEffect(effect) {
      if (!this.storageKey) return;
      try {
        if (typeof GM_setValue === "function") {
          GM_setValue(this.storageKey, effect);
          return;
        }
      } catch (err) {
        console.warn("[Prompt Navigator] 保存效果设置失败：", err);
      }

      try {
        window.localStorage?.setItem(this.storageKey, effect);
      } catch (err) {
        console.warn("[Prompt Navigator] localStorage 不可用：", err);
      }
    }
  }

  class EffectManager {
    constructor(options = {}) {
      this.storageManager = options.storageManager || null;
      this.availableEffects =
        Array.isArray(options.availableEffects) && options.availableEffects.length > 0
          ? options.availableEffects
          : DEFAULT_EFFECTS;
      this.currentElement = null;
      const storedEffect = this.storageManager?.getEffect();
      this.currentEffect = options.initialEffect || storedEffect || "border";
      this.effectTimeout = null;
      this.pulseInterval = null;
    }

    updateEffect(effectType) {
      this.currentEffect = effectType;
      this.storageManager?.setEffect(effectType);
    }

    getAvailableEffects() {
      return this.availableEffects.slice();
    }

    applyEffect(element) {
      if (!element) return;

      this.clearEffect();
      this.currentElement = element;

      switch (this.currentEffect) {
        case "none":
          break;
        case "border":
          this.applyBorderEffect(element);
          break;
        case "pulse":
          this.applyPulseEffect(element);
          break;
        case "fade":
          this.applyFadeEffect(element);
          break;
        case "jiggle":
          this.applyJiggleEffect(element);
          break;
        default:
          this.applyBorderEffect(element);
      }
    }

    applyBorderEffect(element) {
      element.classList.add("prompt-nav-effect-border");
      this.effectTimeout = setTimeout(() => {
        if (element && element.parentNode) {
          element.classList.remove("prompt-nav-effect-border");
        }
      }, 2000);
    }

    applyPulseEffect(element) {
      element.classList.add("prompt-nav-effect-pulse");
      this.effectTimeout = setTimeout(() => {
        if (element && element.parentNode) {
          element.classList.remove("prompt-nav-effect-pulse");
        }
      }, 2000);
    }

    applyFadeEffect(element) {
      element.classList.add("prompt-nav-effect-fade");
      this.effectTimeout = setTimeout(() => {
        if (element && element.parentNode) {
          element.classList.remove("prompt-nav-effect-fade");
        }
      }, 1500);
    }

    applyJiggleEffect(element) {
      element.classList.add("prompt-nav-jiggle-effect");
      this.effectTimeout = setTimeout(() => {
        if (element && element.parentNode) {
          element.classList.remove("prompt-nav-jiggle-effect");
        }
      }, 400);
    }

    clearEffect() {
      if (this.currentElement && this.currentElement.parentNode) {
        this.currentElement.classList.remove(
          "prompt-nav-effect-border",
          "prompt-nav-effect-pulse",
          "prompt-nav-effect-fade",
          "prompt-nav-jiggle-effect",
        );
      }
      if (this.effectTimeout) {
        clearTimeout(this.effectTimeout);
        this.effectTimeout = null;
      }
      if (this.pulseInterval) {
        clearInterval(this.pulseInterval);
        this.pulseInterval = null;
      }
    }
  }

  class SettingsModal {
    constructor(effectManager, textOptions = {}) {
      this.effectManager = effectManager;
      this.modal = null;
      this.isDarkMode = this.detectDarkMode();
      this.previewContext = null;
      this.text = Object.assign(
        {
          title: "🎨 导航定位效果设置",
          closeLabel: "✕",
          previewLabel: "预览",
          tip: "💡 提示：选择后立即保存，预览按钮可查看效果演示",
        },
        textOptions || {},
      );
    }

    detectDarkMode() {
      const root = document.documentElement;
      const hasDarkClass = root.classList.contains("dark") || root.classList.contains("theme-dark");
      const hasDarkData =
        root.getAttribute("data-theme") === "dark" || document.body.getAttribute("data-theme") === "dark";
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      return hasDarkClass || hasDarkData || prefersDark;
    }

    open() {
      if (this.modal && document.body.contains(this.modal)) {
        this.modal.remove();
      }

      this.isDarkMode = this.detectDarkMode();
      this.modal = this.createModal();
      document.body.appendChild(this.modal);
    }

    createModal() {
      const modal = document.createElement("div");
      modal.className = "prompt-nav-settings-modal-overlay";
      modal.setAttribute("data-theme", this.isDarkMode ? "dark" : "light");

      const content = document.createElement("div");
      content.className = "prompt-nav-settings-modal-content";

      const header = document.createElement("div");
      header.className = "prompt-nav-settings-header";
      const title = document.createElement("h2");
      title.textContent = this.text.title;
      const closeBtn = document.createElement("button");
      closeBtn.className = "prompt-nav-settings-close-btn";
      closeBtn.innerHTML = this.text.closeLabel;
      closeBtn.addEventListener("click", () => modal.remove());
      header.appendChild(title);
      header.appendChild(closeBtn);

      const optionsContainer = document.createElement("div");
      optionsContainer.className = "prompt-nav-settings-options";

      const currentEffect = this.effectManager.currentEffect;
      const effects = this.effectManager.getAvailableEffects();

      effects.forEach((effect) => {
        const option = document.createElement("div");
        option.className = "prompt-nav-settings-option";

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "effect";
        radio.value = effect.id;
        radio.id = `prompt-nav-effect-${effect.id}`;
        radio.checked = effect.id === currentEffect;
        radio.addEventListener("change", () => this.selectEffect(effect.id));

        const label = document.createElement("label");
        label.htmlFor = radio.id;

        const labelText = document.createElement("span");
        labelText.className = "prompt-nav-settings-label-text";
        labelText.textContent = effect.name;

        const description = document.createElement("span");
        description.className = "prompt-nav-settings-description";
        description.textContent = effect.description;

        label.appendChild(labelText);
        label.appendChild(description);

        const btn = document.createElement("button");
        btn.className = "prompt-nav-settings-preview-btn";
        btn.textContent = this.text.previewLabel;
        btn.addEventListener("click", () => this.previewEffect(effect.id, effect.name));

        option.appendChild(radio);
        option.appendChild(label);
        option.appendChild(btn);

        option.addEventListener("click", (e) => {
          if (e.target.tagName !== "BUTTON") {
            radio.checked = true;
            this.selectEffect(effect.id);
          }
        });

        optionsContainer.appendChild(option);
      });

      const footer = document.createElement("div");
      footer.className = "prompt-nav-settings-footer";
      const tip = document.createElement("p");
      tip.textContent = this.text.tip;
      footer.appendChild(tip);

      content.appendChild(header);
      content.appendChild(optionsContainer);
      content.appendChild(footer);
      modal.appendChild(content);

      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });

      const escHandler = (e) => {
        if (e.key === "Escape") {
          modal.remove();
          document.removeEventListener("keydown", escHandler);
        }
      };
      document.addEventListener("keydown", escHandler);

      return modal;
    }

    selectEffect(effectId) {
      this.effectManager.updateEffect(effectId);
      console.log(`[Prompt Navigator] 已切换至效果: ${effectId}`);
    }

    previewEffect(effectId, effectName) {
      this.clearPreview();

      const wrapper = document.createElement("div");
      wrapper.className = "prompt-nav-preview-wrapper";

      const demoElement = document.createElement("div");
      demoElement.className = "prompt-nav-preview-element";
      demoElement.textContent = effectName || "预览效果...";
      wrapper.appendChild(demoElement);
      document.body.appendChild(wrapper);

      const tempManager = new EffectManager({
        availableEffects: this.effectManager.getAvailableEffects(),
        initialEffect: effectId,
      });
      tempManager.applyEffect(demoElement);

      const pointerDownHandler = () => {
        this.clearPreview();
      };
      window.addEventListener("pointerdown", pointerDownHandler, true);

      const timeoutId = window.setTimeout(() => {
        this.clearPreview();
      }, 2500);

      this.previewContext = {
        wrapper,
        element: demoElement,
        manager: tempManager,
        timeoutId,
        pointerDownHandler,
      };
    }

    clearPreview() {
      if (!this.previewContext) return;
      const { wrapper, element, manager, timeoutId, pointerDownHandler } = this.previewContext;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (pointerDownHandler) {
        window.removeEventListener("pointerdown", pointerDownHandler, true);
      }
      manager?.clearEffect();
      if (wrapper && wrapper.parentNode) {
        wrapper.remove();
      } else if (element && element.parentNode) {
        element.remove();
      }
      this.previewContext = null;
    }
  }

  class PromptNavigatorCore {
    #scrollParent = null;
    #debouncedBuildNav = null;
    #throttledUpdateActiveLink = null;
    #idToElementMap = new Map();
    #effectManager = null;
    #settingsModal = null;
    #initialized = false;

    constructor(options = {}) {
      this.options = Object.assign({}, DEFAULT_OPTIONS, options || {});
      this.CONSTANTS = Object.assign({}, DEFAULT_CONSTANTS, this.options.constants || {});

      if (typeof this.options.shouldInit === "function" && !this.options.shouldInit()) {
        this.isEnabled = false;
        return;
      }

      if (!this.options.messageSelector || typeof this.options.messageSelector !== "string") {
        console.warn(`${this.options.logPrefix} 未提供有效的 messageSelector，导航未初始化。`);
        this.isEnabled = false;
        return;
      }

      this.isEnabled = true;
      const storageManager = new StorageManager(this.options.storageKey, this.options.defaultEffect);
      this.#effectManager = new EffectManager({
        storageManager,
        availableEffects: this.options.availableEffects,
        initialEffect: this.options.defaultEffect,
      });

      if (this.options.enableSettings) {
        this.#settingsModal = new SettingsModal(this.#effectManager, this.options.settingsModalText);
      }

      this.#debouncedBuildNav = this.#debounce(this.buildNav.bind(this), this.CONSTANTS.DEBOUNCE_BUILD_MS);
      this.#throttledUpdateActiveLink = this.#throttle(
        this.updateActiveLink.bind(this),
        this.CONSTANTS.THROTTLE_UPDATE_MS,
      );
    }

    init() {
      if (!this.isEnabled || this.#initialized) {
        return;
      }
      this.#initialized = true;

      const delay = typeof this.options.initDelayMs === "number" ? this.options.initDelayMs : this.CONSTANTS.INIT_DELAY_MS;

      setTimeout(() => {
        this.#addStyles();
        this.#setupObservers();
        this.#setupEventListeners();
        this.#registerMenuCommand();
        this.buildNav();
      }, delay);
    }

    buildNav() {
      const messages = this.#queryMessages();

      if (messages.length === this.#idToElementMap.size && messages.length > 0) {
        let allMatch = true;
        let i = 0;
        for (const mappedElement of this.#idToElementMap.values()) {
          if (mappedElement !== messages[i]) {
            allMatch = false;
            break;
          }
          i++;
        }
        if (allMatch) {
          this.updateActiveLink();
          return;
        }
      }

      this.#scrollParent = null;
      this.#idToElementMap.clear();

      const navItems = [];
      messages.forEach((msg, index) => {
        const messageId = `${this.CONSTANTS.MESSAGE_ID_PREFIX}${index}`;
        this.#idToElementMap.set(messageId, msg);

        const text = this.#summarizeMessage(msg, index);
        navItems.push({ id: messageId, text });
      });

      const existingContainer = document.getElementById(this.CONSTANTS.CONTAINER_ID);
      if (existingContainer) {
        existingContainer.remove();
      }

      if (navItems.length === 0) return;

      const container = this.#createContainer();
      const indicator = this.#createIndicator(navItems);
      const menu = this.#createMenu(navItems);

      container.append(menu, indicator);
      document.body.appendChild(container);

      this.#updateTheme();
      this.updateActiveLink();
    }

    updateActiveLink() {
      const threshold = Math.max(0.1, Math.min(0.9, this.options.highlightThresholdRatio || 0.4));
      const highlightThreshold = window.innerHeight * threshold;
      let lastVisibleMessageId = null;

      for (const [id, msg] of this.#idToElementMap.entries()) {
        if (!document.body.contains(msg)) {
          continue;
        }
        const rect = msg.getBoundingClientRect();
        if (rect.top < highlightThreshold) {
          lastVisibleMessageId = id;
        } else {
          break;
        }
      }

      const links = document.querySelectorAll(`#${this.CONSTANTS.MENU_ID} li a`);
      const indicatorLines = document.querySelectorAll(`.${this.CONSTANTS.INDICATOR_LINE_CLASS}`);
      let hasActive = false;

      links.forEach((link, index) => {
        const isActive = link.dataset.targetId === lastVisibleMessageId;
        link.classList.toggle(this.CONSTANTS.ACTIVE_CLASS, isActive);
        indicatorLines[index]?.classList.toggle(this.CONSTANTS.ACTIVE_CLASS, isActive);
        if (isActive) hasActive = true;
      });

      if (!hasActive && links.length > 0) {
        links[0].classList.add(this.CONSTANTS.ACTIVE_CLASS);
        indicatorLines[0]?.classList.add(this.CONSTANTS.ACTIVE_CLASS);
      }
      this.#syncIndicatorScroll();
    }

    destroy() {
      const container = document.getElementById(this.CONSTANTS.CONTAINER_ID);
      if (container) container.remove();
      this.#effectManager?.clearEffect();
      this.#idToElementMap.clear();
      this.#scrollParent = null;
      this.#initialized = false;
    }

    #queryMessages() {
      const selector = this.options.messageSelector;
      const nodes = Array.from(document.querySelectorAll(selector));
      const isMessageElement =
        typeof this.options.isMessageElement === "function" ? this.options.isMessageElement : defaultIsMessageElement;
      const skipMessage = typeof this.options.skipMessage === "function" ? this.options.skipMessage : defaultSkipMessage;

      return nodes.filter((el) => {
        if (!(el instanceof HTMLElement)) return false;
        if (!document.body.contains(el)) return false;

        if (skipMessage(el)) return false;

        const result = isMessageElement(el);
        if (!result) return false;

        const text = (el.textContent || "").trim();
        return text.length > 0 || el.querySelector("pre, code, p, blockquote, ul, ol");
      });
    }

    #getMessageTypeEmoji(el) {
      if (typeof this.options.getMessageEmoji === "function") {
        return this.options.getMessageEmoji(el, this.CONSTANTS);
      }
      return defaultGetMessageEmoji(el, this.CONSTANTS);
    }

    #createContainer() {
      const container = document.createElement("div");
      container.id = this.CONSTANTS.CONTAINER_ID;
      return container;
    }

    #createIndicator(navItems) {
      const indicator = document.createElement("div");
      indicator.id = this.CONSTANTS.INDICATOR_ID;
      const lineWrapper = document.createElement("div");
      lineWrapper.id = "prompt-nav-indicator-wrapper";

      navItems.forEach((item) => {
        const line = document.createElement("div");
        line.className = this.CONSTANTS.INDICATOR_LINE_CLASS;
        line.dataset.targetId = item.id;
        lineWrapper.appendChild(line);
      });
      indicator.appendChild(lineWrapper);
      return indicator;
    }

    #createMenu(navItems) {
      const menu = document.createElement("div");
      menu.id = this.CONSTANTS.MENU_ID;
      const list = document.createElement("ul");

      navItems.forEach((item) => {
        const link = document.createElement("a");
        link.href = `#${item.id}`;
        link.innerHTML = item.text;
        link.dataset.targetId = item.id;
        link.onclick = (e) => this.#handleLinkClick(e);

        const listItem = document.createElement("li");
        listItem.appendChild(link);
        list.appendChild(listItem);
      });

      menu.appendChild(list);
      return menu;
    }

    #handleLinkClick(event) {
      event.preventDefault();
      const link = event.currentTarget;
      const targetId = link.dataset.targetId;
      const messageElement = this.#idToElementMap.get(targetId);

      if (!messageElement || !document.body.contains(messageElement)) {
        console.error(`${this.options.logPrefix} 未找到目标消息元素:`, targetId);
        return;
      }

      document
        .querySelectorAll(`#${this.CONSTANTS.MENU_ID} li a, .${this.CONSTANTS.INDICATOR_LINE_CLASS}`)
        .forEach((el) => el.classList.remove(this.CONSTANTS.ACTIVE_CLASS));

      link.classList.add(this.CONSTANTS.ACTIVE_CLASS);
      const indicatorLine = document.querySelector(
        `.${this.CONSTANTS.INDICATOR_LINE_CLASS}[data-target-id="${targetId}"]`,
      );
      indicatorLine?.classList.add(this.CONSTANTS.ACTIVE_CLASS);

      this.#scrollToMessage(messageElement);
      this.#syncIndicatorScroll();
    }

    #scrollToMessage(messageElement) {
      const scrollParent = this.#scrollParent || this.#findScrollableParent(messageElement);
      if (!this.#scrollParent) this.#scrollParent = scrollParent;

      let scrollTimeout;
      const scrollEndListener = () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          this.#effectManager.applyEffect(messageElement);
          scrollParent.removeEventListener("scroll", scrollEndListener);
        }, this.CONSTANTS.SCROLL_END_TIMEOUT);
      };
      scrollParent.addEventListener("scroll", scrollEndListener);

      const parentTop = scrollParent === document.documentElement ? 0 : scrollParent.getBoundingClientRect().top;
      const msgTop = messageElement.getBoundingClientRect().top;
      const currentScroll = scrollParent.scrollTop ?? window.scrollY;
      const offset = typeof this.options.scrollOffset === "number" ? this.options.scrollOffset : 0;
      const scrollTop = currentScroll + msgTop - parentTop - offset;

      if (typeof scrollParent.scrollTo === "function") {
        scrollParent.scrollTo({ top: scrollTop, behavior: "smooth" });
      } else {
        window.scrollTo({ top: scrollTop, behavior: "smooth" });
      }
    }

    #updateTheme() {
      const root = document.documentElement;
      const container = document.getElementById(this.CONSTANTS.CONTAINER_ID);
      if (!container) return;

      const hasDarkClass = root.classList.contains("dark") || root.classList.contains("theme-dark");
      const hasDarkData =
        root.getAttribute("data-theme") === "dark" || document.body.getAttribute("data-theme") === "dark";
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

      const isDarkMode = hasDarkClass || hasDarkData || prefersDark;
      container.dataset.theme = isDarkMode ? "dark" : "light";
    }

    #syncIndicatorScroll() {
      const indicator = document.getElementById(this.CONSTANTS.INDICATOR_ID);
      const lineWrapper = document.getElementById("prompt-nav-indicator-wrapper");
      const activeLine = indicator?.querySelector(
        `.${this.CONSTANTS.INDICATOR_LINE_CLASS}.${this.CONSTANTS.ACTIVE_CLASS}`,
      );

      if (!indicator || !lineWrapper || !activeLine) {
        return;
      }

      const indicatorHeight = indicator.clientHeight;
      const wrapperHeight = lineWrapper.scrollHeight;

      if (wrapperHeight <= indicatorHeight) {
        lineWrapper.style.transform = `translateY(0px)`;
        return;
      }

      const activeLineTop = activeLine.offsetTop;
      const activeLineHeight = activeLine.offsetHeight;

      let desiredTranslateY = -(activeLineTop - indicatorHeight / 2 + activeLineHeight / 2);

      desiredTranslateY = Math.min(0, desiredTranslateY);

      const maxScroll = wrapperHeight - indicatorHeight;
      desiredTranslateY = Math.max(-maxScroll, desiredTranslateY);

      lineWrapper.style.transform = `translateY(${desiredTranslateY}px)`;
    }

    #setupObservers() {
      const observer = new MutationObserver(() => {
        this.#debouncedBuildNav();
        this.#updateTheme();
      });
      observer.observe(document.body, { childList: true, subtree: true });

      const themeObserver = new MutationObserver(() => this.#updateTheme());
      themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
      themeObserver.observe(document.body, { attributes: true, attributeFilter: ["class", "data-theme"] });

      if (window.matchMedia) {
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        mq.addEventListener?.("change", () => this.#updateTheme());
      }
    }

    #setupEventListeners() {
      window.addEventListener("scroll", this.#throttledUpdateActiveLink, {
        capture: true,
      });
    }

    #addStyles() {
      if (document.getElementById("prompt-nav-style")) return;
      const style = document.createElement("style");
      style.id = "prompt-nav-style";
      style.textContent = `
        :root {
          --nav-bg-color-light: #F7F7F7;
          --nav-text-color-light: #333333;
          --nav-text-subtle-light: #555555;
          --nav-border-color-light: #E0E0E0;
          --nav-hover-bg-color-light: #E9E9E9;
          --nav-active-bg-color-light: #DCDCDC;
          --nav-scrollbar-thumb-light: #CCCCCC;
          --nav-scrollbar-thumb-hover-light: #BBBBBB;
          --nav-indicator-line-light: rgba(0, 0, 0, 0.3);
          --nav-indicator-active-color-light: #000000;
          --nav-code-label-color-light: #2563EB;
          --nav-emoji-color-light: #333333;

          --nav-bg-color-dark: #2A2A2A;
          --nav-text-color-dark: #EAEAEA;
          --nav-text-subtle-dark: #C0C0C0;
          --nav-border-color-dark: rgba(255, 255, 255, 0.1);
          --nav-hover-bg-color-dark: rgba(255, 255, 255, 0.1);
          --nav-active-bg-color-dark: rgba(255, 255, 255, 0.15);
          --nav-scrollbar-thumb-dark: rgba(255, 255, 255, 0.2);
          --nav-scrollbar-thumb-hover-dark: rgba(255, 255, 255, 0.3);
          --nav-indicator-line-dark: rgba(255, 255, 255, 0.4);
          --nav-indicator-active-color-dark: #D3D3D3;
          --nav-code-label-color-dark: #60A5FA;
          --nav-emoji-color-dark: #EAEAEA;
        }

        #${this.CONSTANTS.CONTAINER_ID}[data-theme='light'] {
          --nav-bg-color: var(--nav-bg-color-light);
          --nav-text-color: var(--nav-text-color-light);
          --nav-text-subtle: var(--nav-text-subtle-light);
          --nav-border-color: var(--nav-border-color-light);
          --nav-hover-bg-color: var(--nav-hover-bg-color-light);
          --nav-active-bg-color: var(--nav-active-bg-color-light);
          --nav-scrollbar-thumb: var(--nav-scrollbar-thumb-light);
          --nav-scrollbar-thumb-hover: var(--nav-scrollbar-thumb-hover-light);
          --nav-indicator-line: var(--nav-indicator-line-light);
          --nav-indicator-active-color: var(--nav-indicator-active-color-light);
          --nav-indicator-active-shadow: var(--nav-indicator-active-color-light);
          --nav-code-label-color: var(--nav-code-label-color-light);
          --nav-emoji-color: var(--nav-emoji-color-light);
        }

        #${this.CONSTANTS.CONTAINER_ID}[data-theme='dark'] {
          --nav-bg-color: var(--nav-bg-color-dark);
          --nav-text-color: var(--nav-text-color-dark);
          --nav-text-subtle: var(--nav-text-subtle-dark);
          --nav-border-color: var(--nav-border-color-dark);
          --nav-hover-bg-color: var(--nav-hover-bg-color-dark);
          --nav-active-bg-color: var(--nav-active-bg-color-dark);
          --nav-scrollbar-thumb: var(--nav-scrollbar-thumb-dark);
          --nav-scrollbar-thumb-hover: var(--nav-scrollbar-thumb-hover-dark);
          --nav-indicator-line: var(--nav-indicator-line-dark);
          --nav-indicator-active-color: var(--nav-indicator-active-color-dark);
          --nav-indicator-active-shadow: var(--nav-indicator-active-color-dark);
          --nav-code-label-color: var(--nav-code-label-color-dark);
          --nav-emoji-color: var(--nav-emoji-color-dark);
        }

        @keyframes prompt-nav-jiggle {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
          20%, 40%, 60%, 80% { transform: translateX(3px); }
        }

        #${this.CONSTANTS.CONTAINER_ID} {
          position: fixed;
          top: 10rem;
          right: 1.25rem;
          z-index: 9999;
        }

        #${this.CONSTANTS.INDICATOR_ID} {
          position: absolute;
          top: 0;
          right: 0;
          cursor: pointer;
          transition: opacity 0.25s ease-in-out;
          max-height: calc(100vh - 12rem);
          overflow: hidden;
        }
        #prompt-nav-indicator-wrapper {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 1rem;
          transition: transform 0.2s ease-in-out;
        }
        .${this.CONSTANTS.INDICATOR_LINE_CLASS} {
          width: 1.25rem;
          height: 2px;
          background-color: var(--nav-indicator-line);
          border-radius: 0.125rem;
          transition: all 0.25s ease-in-out;
        }
        .${this.CONSTANTS.INDICATOR_LINE_CLASS}.${this.CONSTANTS.ACTIVE_CLASS} {
          width: 1.75rem;
          background-color: var(--nav-indicator-active-color);
          height: 2px;
          transition: background 0.2s, box-shadow 0.2s, width 0.2s;
          box-shadow: var(--nav-indicator-active-shadow) 0px 0px 3px;
          border-radius: 0.125rem;
          margin-left: 0px;
        }
        #${this.CONSTANTS.MENU_ID} {
          position: absolute;
          top: 0;
          right: 0;
          transform: translateX(1rem);
          width: 18rem;
          max-height: calc(100vh - 12rem);
          overflow-y: auto;
          background-color: var(--nav-bg-color);
          border: 1px solid var(--nav-border-color);
          color: var(--nav-text-color);
          border-radius: 0.75rem;
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
          padding: 0.75rem;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.25s ease, visibility 0.25s ease, transform 0.25s ease;
        }
        #${this.CONSTANTS.CONTAINER_ID}:hover #${this.CONSTANTS.INDICATOR_ID} {
          opacity: 0;
        }
        #${this.CONSTANTS.CONTAINER_ID}:hover #${this.CONSTANTS.MENU_ID} {
          opacity: 1;
          visibility: visible;
          transform: translateX(0);
        }
        #${this.CONSTANTS.MENU_ID} ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        #${this.CONSTANTS.MENU_ID} li a {
          display: block;
          padding: 0.5rem;
          text-decoration: none;
          color: var(--nav-text-subtle);
          border-radius: 0.375rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 0.875rem;
          transition: background-color 0.2s ease, color 0.2s ease;
        }
        #${this.CONSTANTS.MENU_ID} li a:hover {
          background-color: var(--nav-hover-bg-color);
          color: var(--nav-text-color);
        }
        #${this.CONSTANTS.MENU_ID} li a.${this.CONSTANTS.ACTIVE_CLASS} {
          background-color: var(--nav-active-bg-color);
          color: var(--nav-text-color);
          font-weight: 500;
        }

        #${this.CONSTANTS.MENU_ID} li a .nav-emoji {
          color: var(--nav-emoji-color);
          font-style: normal;
          margin-right: 0.375rem;
          font-size: 1rem;
          display: inline-block;
          vertical-align: middle;
        }

        #${this.CONSTANTS.MENU_ID} li a strong {
          color: var(--nav-code-label-color);
          font-weight: 600;
          margin-right: 0.25rem;
        }
        #${this.CONSTANTS.MENU_ID} li a.${this.CONSTANTS.ACTIVE_CLASS} strong {
          color: var(--nav-code-label-color);
        }

        #${this.CONSTANTS.MENU_ID}::-webkit-scrollbar { width: 0.5rem; }
        #${this.CONSTANTS.MENU_ID}::-webkit-scrollbar-track { background: transparent; }
        #${this.CONSTANTS.MENU_ID}::-webkit-scrollbar-thumb { background-color: var(--nav-scrollbar-thumb); border-radius: 0.25rem; }
        #${this.CONSTANTS.MENU_ID}::-webkit-scrollbar-thumb:hover { background-color: var(--nav-scrollbar-thumb-hover); }

        .prompt-nav-effect-border {
          position: relative;
          border-radius: 8px;
          outline: 2px solid var(--prompt-nav-highlight-color, #FFD700);
          outline-offset: 4px;
        }
        .prompt-nav-effect-border::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          box-shadow: 0 0 0 0 var(--prompt-nav-highlight-ring, rgba(255, 215, 0, 0.45));
          animation: prompt-nav-border-highlight 2s ease-in-out forwards;
        }

        @keyframes prompt-nav-border-highlight {
          0% {
            box-shadow: 0 0 0 0 var(--prompt-nav-highlight-ring, rgba(255, 215, 0, 0.45));
            opacity: 1;
          }
          60% {
            box-shadow: 0 0 0 12px rgba(255, 215, 0, 0);
            opacity: 0;
          }
          100% {
            box-shadow: 0 0 0 12px rgba(255, 215, 0, 0);
            opacity: 0;
          }
        }

        .prompt-nav-effect-pulse {
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
          animation: prompt-nav-pulse 2s ease-in-out forwards;
        }

        @keyframes prompt-nav-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
          }
          50% {
            box-shadow: 0 0 0 15px rgba(59, 130, 246, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
        }

        .prompt-nav-effect-fade {
          animation: prompt-nav-fade 1.5s ease-in-out forwards;
        }

        @keyframes prompt-nav-fade {
          0% {
            background-color: rgba(59, 130, 246, 0);
          }
          50% {
            background-color: rgba(59, 130, 246, 0.3);
          }
          100% {
            background-color: rgba(59, 130, 246, 0);
          }
        }

        .prompt-nav-jiggle-effect {
          animation: prompt-nav-jiggle 400ms ease-in-out;
        }

        .prompt-nav-settings-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
          animation: prompt-nav-overlay-fade-in 0.2s ease-in-out;
        }

        @keyframes prompt-nav-overlay-fade-in {
          from {
            background-color: rgba(0, 0, 0, 0);
          }
          to {
            background-color: rgba(0, 0, 0, 0.5);
          }
        }

        .prompt-nav-settings-modal-overlay[data-theme='light'] {
          --settings-bg: #FFFFFF;
          --settings-text: #1F2937;
          --settings-border: #E5E7EB;
          --settings-hover-bg: #F3F4F6;
          --settings-active-bg: #DBEAFE;
          --settings-secondary-text: #6B7280;
        }

        .prompt-nav-settings-modal-overlay[data-theme='dark'] {
          --settings-bg: #1F2937;
          --settings-text: #F3F4F6;
          --settings-border: #374151;
          --settings-hover-bg: #374151;
          --settings-active-bg: #1E40AF;
          --settings-secondary-text: #9CA3AF;
        }

        .prompt-nav-settings-modal-content {
          background-color: var(--settings-bg);
          color: var(--settings-text);
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          animation: prompt-nav-modal-slide-up 0.3s ease-out;
        }

        @keyframes prompt-nav-modal-slide-up {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .prompt-nav-settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid var(--settings-border);
          position: sticky;
          top: 0;
          background-color: var(--settings-bg);
        }

        .prompt-nav-settings-header h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .prompt-nav-settings-close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--settings-secondary-text);
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .prompt-nav-settings-close-btn:hover {
          background-color: var(--settings-hover-bg);
          color: var(--settings-text);
        }

        .prompt-nav-settings-options {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .prompt-nav-settings-option {
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
          padding: 1rem;
          border: 1px solid var(--settings-border);
          border-radius: 8px;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .prompt-nav-settings-option:hover {
          background-color: var(--settings-hover-bg);
          border-color: #3B82F6;
        }

        .prompt-nav-settings-option input[type='radio'] {
          margin-top: 0.125rem;
          cursor: pointer;
          width: 18px;
          height: 18px;
          accent-color: #3B82F6;
        }

        .prompt-nav-settings-option input[type='radio']:checked + label {
          font-weight: 600;
        }

        .prompt-nav-settings-option label {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          cursor: pointer;
        }

        .prompt-nav-settings-label-text {
          font-weight: 500;
          color: var(--settings-text);
        }

        .prompt-nav-settings-description {
          font-size: 0.875rem;
          color: var(--settings-secondary-text);
        }

        .prompt-nav-settings-preview-btn {
          padding: 0.5rem 1rem;
          background-color: #3B82F6;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .prompt-nav-settings-preview-btn:focus,
        .prompt-nav-settings-preview-btn:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.4);
        }

        .prompt-nav-settings-preview-btn:hover {
          background-color: #2563EB;
          transform: translateY(-2px);
        }

        .prompt-nav-settings-preview-btn:active {
          transform: translateY(0);
        }

        .prompt-nav-settings-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--settings-border);
          background-color: var(--settings-hover-bg);
        }

        .prompt-nav-settings-footer p {
          margin: 0;
          font-size: 0.875rem;
          color: var(--settings-secondary-text);
        }

        .prompt-nav-preview-wrapper {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 10001;
          pointer-events: none;
        }
        .prompt-nav-preview-element {
          padding: 2rem;
          background-color: rgba(59, 130, 246, 0.1);
          border-radius: 8px;
          font-weight: 600;
          color: #3B82F6;
        }

        @media (max-width: 640px) {
          .prompt-nav-settings-modal-content {
            width: 95%;
            max-height: 90vh;
          }

          .prompt-nav-settings-option {
            flex-direction: column;
          }

          .prompt-nav-settings-preview-btn {
            width: 100%;
          }

          #${this.CONSTANTS.CONTAINER_ID} {
            top: 5rem;
            right: 0.5rem;
          }
        }
      `;
      document.head.appendChild(style);
    }

    #findScrollableParent(element) {
      if (typeof this.options.getScrollContainer === "function") {
        const custom = this.options.getScrollContainer(element);
        if (custom instanceof HTMLElement) {
          return custom;
        }
      }

      let el = element.parentElement;
      while (el && el !== document.body) {
        const style = window.getComputedStyle(el);
        const overflowY = style.overflowY;
        if (overflowY === "auto" || overflowY === "scroll") {
          return el;
        }
        el = el.parentElement;
      }
      return document.documentElement;
    }

    #extractText(rootEl) {
      if (typeof this.options.extractText === "function") {
        return this.options.extractText(rootEl, {
          escapeHtml,
          defaultExtractText: (node) => defaultExtractText(node, { escapeHtml }),
        });
      }
      return defaultExtractText(rootEl, { escapeHtml });
    }

    #summarizeMessage(el, index) {
      if (typeof this.options.summarizeMessage === "function") {
        return this.options.summarizeMessage(el, index, {
          extractText: (node) => this.#extractText(node),
          getEmoji: (node) => this.#getMessageTypeEmoji(node),
          summaryMaxLen: this.options.summaryMaxLen,
        });
      }
      return defaultSummarizeMessage(el, index, {
        extractText: (node) => this.#extractText(node),
        getEmoji: (node) => this.#getMessageTypeEmoji(node),
        summaryMaxLen: this.options.summaryMaxLen,
      });
    }

    #registerMenuCommand() {
      if (!this.options.enableSettings) return;
      try {
        if (typeof GM_registerMenuCommand === "function") {
          GM_registerMenuCommand(this.options.menuCommandLabel, () => {
            this.#settingsModal.open();
          });
        }
      } catch (e) {
        console.warn(`${this.options.logPrefix} GM_registerMenuCommand 不可用：`, e);
      }
    }

    #debounce(func, wait) {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
      };
    }

    #throttle(func, limit) {
      let inThrottle;
      return (...args) => {
        if (!inThrottle) {
          func(...args);
          inThrottle = true;
          setTimeout(() => (inThrottle = false), limit);
        }
      };
    }
  }

  global.NotionStyleNavigator = Object.assign(global.NotionStyleNavigator || {}, {
    version: "1.0.0",
    createNavigator(options) {
      const navigator = new PromptNavigatorCore(options);
      navigator.init();
      return navigator;
    },
    PromptNavigatorCore,
  });
})(typeof window !== "undefined" ? window : globalThis);
