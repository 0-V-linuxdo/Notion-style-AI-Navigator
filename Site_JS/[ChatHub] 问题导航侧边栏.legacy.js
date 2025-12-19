// ==UserScript==
// @name              [ChatHub] 问题导航侧边栏 20251218 v1.0.1
// @namespace         0_V userscripts/[ChatHub] 问题导航侧边栏
// @description       (悬浮球+右侧滑出面板，Q→A顺序) 为 ChatHub 提供问答导航侧边栏。新增多聊天区域分组支持，并保留单/双击跳转+Toast 提示。
// @version           1.1.0
// @match             https://app.chathub.gg/*
// @grant             none
// @icon              data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8IS0tIOW3puS+p+aooeWdl++8mumXruWPt+WbvuW9ou+8iOayv+eUqOesrOS4gOS4qnN2Z+eahOW3puS+p++8iSAtLT4KICA8cmVjdCB3aWR0aD0iMTQiIGhlaWdodD0iMjAiIHJ4PSI1IiBmaWxsPSIjNjc1NkJEIi8+CiAgPHBhdGggZD0iTTQgOEM0IDYuNSA1IDUuNSA3IDUuNUM5IDUuNSAxMCA2LjUgMTAgOEMxMCA5LjUgNyAxMCA3IDExLjVWMTMiIAogICAgICAgIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMS4yIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KICA8Y2lyY2xlIGN4PSI3IiBjeT0iMTUiIHI9IjAuOCIgZmlsbD0id2hpdGUiLz4KCiAgPCEtLSDlj7PkvqfmqKHlnZfvvJrnp7vmpI3oh6rnrKzkuozkuKpzdmfkuK3lt6bkvqfnmoTigJzkvqfovrnmoI/igJ3nrKblj7fvvIwKICAgICAgIOiwg+aVtOWQjuehruS/neWFtuinhuiniemrmOW6puS4juW3puS+p+mXruWPt+S4gOiHtCAtLT4KICA8cmVjdCB4PSIxNiIgd2lkdGg9IjE0IiBoZWlnaHQ9IjIwIiByeD0iNSIgZmlsbD0iIzQ5ODdGQyIvPgogIDwhLS0g5Y6f5pys56ys5LqM5Liqc3Zn55qE5LiJ5Liq5qiq57q/77yI5Y6f5Z2Q5qCHIHg9MywgeT02LDksMTI7IHdpZHRoPTg7IGhlaWdodD0x77yJCiAgICAgICDov5nph4zmqKrlkJHlop7liqDlgY/np7vph48xNu+8iOWuueWZqOeahHjvvIkrM++8iOWxheS4reeVmeeZve+8iT0xOe+8jAogICAgICAg5bm26LCD5pW057q15Z2Q5qCH5L2/5b6X5pW05L2T5LuONS415YiwMTUuOO+8jOS4jumXruWPt+WbvuW9ouWMuemFjSAtLT4KICA8cmVjdCB4PSIxOSIgeT0iNS41IiB3aWR0aD0iOCIgaGVpZ2h0PSIxIiByeD0iMC41IiBmaWxsPSJ3aGl0ZSIvPgogIDxyZWN0IHg9IjE5IiB5PSIxMC4xNSIgd2lkdGg9IjgiIGhlaWdodD0iMSIgcng9IjAuNSIgZmlsbD0id2hpdGUiLz4KICA8cmVjdCB4PSIxOSIgeT0iMTQuOCIgd2lkdGg9IjgiIGhlaWdodD0iMSIgcng9IjAuNSIgZmlsbD0id2hpdGUiLz4KCiAgPCEtLSDlupXpg6jnirbmgIHmnaEgLS0+CiAgPHJlY3QgeT0iMjIiIHdpZHRoPSIzMCIgaGVpZ2h0PSI4IiByeD0iNCIgZmlsbD0iI0ZBRTM4NyIvPgoKICA8IS0tIOa4kOWPmOijhemlsOWFg+e0oOS/neaMgeS4jeWPmCAtLT4KICA8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTUgMjJDNS41NTIyOCAyMiA2IDIxLjU1MjMgNiAyMUM2IDIwLjQ0NzcgNS41NTIyOCAyMCA1IDIwSDlDOC40NDc3MiAyMCA4IDIwLjQ0NzcgOCAyMUM4IDIxLjU1MjMgOC40NDc3MiAyMiA5IDIySDVaIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXIpIi8+CiAgPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0yMSAyMkMyMS41NTIzIDIyIDIyIDIxLjU1MjMgMjIgMjFDMjIgMjAuNDQ3NyAyMS41NTIzIDIwIDIxIDIwSDI1QzI0LjQ0NzcgMjAgMjQgMjAuNDQ3NyAyNCAyMUMyNCAyMS41NTIzIDI0LjQ0NzcgMjIgMjUgMjJIMjFaIiBmaWxsPSJ1cmwoI3BhaW50MV9saW5lYXIpIi8+CiAgPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xNCA4QzE0IDguNTUyMjggMTQuNDQ3NyA5IDE1IDlDMTUuNTUyMyA5IDE2IDguNTUyMjggMTYgOEwxNiAxMkMxNiAxMS40NDc3IDE1LjU1MjMgMTEgMTUgMTFDMTQuNDQ3NyAxMSAxNCAxMS40NDc3IDE0IDEyTDE0IDhaIiBmaWxsPSJ1cmwoI3BhaW50Ml9saW5lYXIpIi8+CiAgCiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXIiIHgxPSI3IiB5MT0iMjAiIHgyPSI3IiB5Mj0iMjIiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KICAgICAgPHN0b3Agc3RvcC1jb2xvcj0iIzY3NTZCRCIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNGQUUzODciLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MV9saW5lYXIiIHgxPSIyMyIgeTE9IjIwIiB4Mj0iMjMiIHkyPSIyMiIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgogICAgICA8c3RvcCBzdG9wLWNvbG9yPSIjNDk4N0ZDIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI0ZBRTM4NyIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQyX2xpbmVhciIgeDE9IjE2IiB5MT0iMTAiIHgyPSIxNCIgeTI9IjEwIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CiAgICAgIDxzdG9wIHN0b3AtY29sb3I9IiM0OTg3RkMiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjNjc1NkJEIi8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KPC9zdmc+
// ==/UserScript==

(function () {
    'use strict';

    /********************************************************
     * 0. 创建 Shadow DOM，用于容纳悬浮球和面板
     ********************************************************/
    let shadowRoot = null;
    const areaTitleCache = new WeakMap();
    const areaButtons = new Map();
    const areaPanels = new Map();
    let areaOrderForButtons = [];
    let areaUIRafId = null;
    let latestAreaMap = new Map();
    let uiListenersBound = false;
    const ENABLE_LEGACY_GLOBAL_UI = false; // 已移除全局悬浮球+通用侧栏

    function ensureShadowRoot() {
        if (shadowRoot) return;
        const container = document.createElement('div');
        container.id = 'qaNavShadowContainer';
        shadowRoot = container.attachShadow({ mode: 'open' });
        document.documentElement.appendChild(container);

        // 若容器被外部 DOM 移除，则自动加回
        new MutationObserver(() => {
            if (!document.documentElement.contains(container)) {
                document.documentElement.appendChild(container);
            }
        }).observe(document.documentElement, { childList: true });
    }

    /********************************************************
     * 1. Q/A 收集与列表构建逻辑（确保 Q→A 顺序，支持多聊天区域）
     ********************************************************/
    function _findAllQnASections() {
        const results = [];

        // 识别"问题"
        const questionDivs = document.querySelectorAll('div.group.flex.w-full.flex-row-reverse');
        questionDivs.forEach((qDiv) => {
            const primaryBlueDiv = qDiv.querySelector('[class*="bg-primary-blue"], [class*="dark:bg-primary-blue"], [class*="bg-white"]');
            if (primaryBlueDiv) {
                results.push({ type: 'question', el: qDiv });
            }
        });

        // 识别"回答"
        const answerDivs = document.querySelectorAll('div.group.flex.w-full.flex-row:not(.flex-row-reverse)');
        answerDivs.forEach((aDiv) => {
            const secondaryDiv = aDiv.querySelector('[class*="bg-secondary"], [class*="dark:bg-secondary"], [class*="bg-gray"]');
            if (secondaryDiv) {
                results.push({ type: 'answer', el: aDiv });
            }
        });

        // 按文档出现顺序排序
        results.sort((a, b) => (a.el.compareDocumentPosition(b.el) & 2 ? 1 : -1));
        return results;
    }

    function collectAreaMap() {
        const qnaBlocks = _findAllQnASections();
        const areaMap = new Map();
        qnaBlocks.forEach((block) => {
            const areaEl = findChatAreaRoot(block.el);
            if (!areaMap.has(areaEl)) {
                areaMap.set(areaEl, []);
            }
            areaMap.get(areaEl).push(block);
        });
        latestAreaMap = areaMap;
        return { qnaBlocks, areaMap };
    }

    function _extractSectionContent(sectionEl) {
        const contentEl =
            sectionEl.querySelector(
                '[class*="bg-primary-blue"], [class*="dark:bg-primary-blue"], ' +
                '[class*="bg-secondary"], [class*="dark:bg-secondary"], ' +
                'div.prose, div.relative, div.text-sm, p'
            ) || sectionEl;

        const fullText = contentEl ? contentEl.innerText.trim() : '';
        const lines = fullText.split('\n').slice(0, 10);
        return lines.join('\n');
    }

    function getAreaLabel(areaEl) {
        if (!areaEl) return '聊天区域';
        if (areaTitleCache.has(areaEl)) return areaTitleCache.get(areaEl);

        let label = '';

        const attrLabel =
            areaEl.getAttribute('aria-label') ||
            areaEl.getAttribute('data-title') ||
            areaEl.getAttribute('data-model') ||
            areaEl.getAttribute('data-provider-name') ||
            areaEl.getAttribute('data-model-name');

        if (attrLabel) {
            label = attrLabel.trim();
        }

        if (!label) {
            const heading = areaEl.querySelector(
                'header h1, header h2, header h3, header h4, [data-model-name], [data-provider-name], .text-lg, .text-base.font-semibold'
            );
            if (heading && heading.textContent) {
                label = heading.textContent.trim().replace(/\s+/g, ' ');
            }
        }

        const finalLabel = label || '聊天区域';
        areaTitleCache.set(areaEl, finalLabel);
        return finalLabel;
    }

    function isScrollableContainer(el) {
        if (!(el instanceof HTMLElement)) return false;
        const style = getComputedStyle(el);
        if (!style) return false;

        const overflowY = style.overflowY || style.overflow;
        const overflow = style.overflow;
        const allowScroll =
            ['auto', 'scroll', 'overlay'].includes(overflowY) || ['auto', 'scroll', 'overlay'].includes(overflow);
        const hasRoom = el.scrollHeight - el.clientHeight > 80;
        const enoughHeight = el.clientHeight > 240;
        return allowScroll && hasRoom && enoughHeight;
    }

    function findChatAreaRoot(el) {
        if (!el) return document.scrollingElement || document.documentElement;
        let current = el;
        while (current && current !== document.documentElement) {
            if (isScrollableContainer(current)) {
                return current;
            }
            current = current.parentElement;
        }
        return document.scrollingElement || document.documentElement;
    }

    /**
     * 保证 Q→A 顺序：先问题、若有后续回答则紧跟着，同一 questionCount 编号
     * 并在不同聊天区域间分组显示
     */
    function buildQAPanelList() {
        if (!shadowRoot) return;

        const { qnaBlocks, areaMap } = collectAreaMap();
        areaOrderForButtons = Array.from(areaMap.keys());
        syncAreaButtons(areaOrderForButtons);
        updateAreaPanels(areaMap);

        const navList = shadowRoot.querySelector('#qaNavList');
        if (!navList) return;

        // 记录当前滚动位置，避免重绘后侧边栏滚动条回到顶部
        const oldScrollTop = navList.scrollTop;
        navList.innerHTML = '';

        if (!qnaBlocks.length) {
            const emptyMsg = document.createElement('p');
            emptyMsg.style.textAlign = 'center';
            emptyMsg.style.padding = '12px';
            emptyMsg.textContent = '无问答';
            navList.appendChild(emptyMsg);
            return;
        }

        let areaIndex = 0;
        areaMap.forEach((blocks, areaEl) => {
            areaIndex++;
            const areaLabel = getAreaLabel(areaEl);

            addAreaHeader(navList, areaLabel);

            let i = 0;
            let questionCount = 0;

            while (i < blocks.length) {
                const item = blocks[i];
                if (item.type === 'question') {
                    questionCount++;
                    const qContent = _extractSectionContent(item.el);
                    addNavItem(
                        { index: questionCount, type: '问题', content: qContent, sectionEl: item.el, areaEl, areaLabel },
                        navList
                    );

                    // 如果下一个是回答，则插入回答
                    if (i + 1 < blocks.length && blocks[i + 1].type === 'answer') {
                        const ansItem = blocks[i + 1];
                        const aContent = _extractSectionContent(ansItem.el);
                        addNavItem(
                            { index: questionCount, type: '回答', content: aContent, sectionEl: ansItem.el, areaEl, areaLabel },
                            navList
                        );
                        i += 2;
                    } else {
                        i += 1;
                    }

                    // 若下一个还是问题，则插入分割线
                    if (i < blocks.length && blocks[i].type === 'question') {
                        addDivider(navList);
                    }
                } else {
                    // 如果先出现回答，则单独插入
                    const aContent = _extractSectionContent(item.el);
                    addNavItem(
                        { index: questionCount, type: '回答', content: aContent, sectionEl: item.el, areaEl, areaLabel },
                        navList
                    );
                    i += 1;

                    // 若下一个还是问题，则插入分割线
                    if (i < blocks.length && blocks[i].type === 'question') {
                        addDivider(navList);
                    }
                }
            }

            if (areaIndex < areaMap.size) {
                addAreaDivider(navList);
            }
        });

        // 恢复之前的滚动位置
        navList.scrollTop = oldScrollTop;
    }

    function addAreaHeader(navList, title) {
        const header = document.createElement('div');
        header.className = 'qa-area-header';
        header.dataset.areaLabel = title;

        const dot = document.createElement('span');
        dot.className = 'qa-area-dot';

        const text = document.createElement('span');
        text.className = 'qa-area-title';
        text.textContent = title;

        header.appendChild(dot);
        header.appendChild(text);
        navList.appendChild(header);
    }

    function addAreaDivider(navList) {
        const divider = document.createElement('hr');
        divider.className = 'nav-area-divider';
        navList.appendChild(divider);
    }

    function addNavItem({ index, type, content, sectionEl, areaEl, areaLabel }, navList) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'nav-item';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'qa-title';

        const indexSpan = document.createElement('span');
        indexSpan.className = 'qa-index';
        indexSpan.textContent = `#${index}`;

        const typeSpan = document.createElement('span');
        typeSpan.className = 'qa-type';
        typeSpan.textContent = type;

        titleDiv.appendChild(indexSpan);
        titleDiv.appendChild(typeSpan);
        itemDiv.appendChild(titleDiv);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'qa-content';
        contentDiv.textContent = content;
        itemDiv.appendChild(contentDiv);

        // 展开/收起按钮（保持与原有逻辑一致）
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'toggle-btn';
        toggleBtn.textContent = '展开'; // 默认
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            itemDiv.classList.toggle('expanded');
            toggleBtn.textContent = itemDiv.classList.contains('expanded') ? '收起' : '展开';
        });
        itemDiv.appendChild(toggleBtn);

        // 绑定单/双击跳转 + Toast
        attachNavItemClickEvents(itemDiv, index, type, sectionEl, areaEl, areaLabel);

        navList.appendChild(itemDiv);
    }

    function addDivider(navList) {
        const divider = document.createElement('hr');
        divider.className = 'nav-divider';
        navList.appendChild(divider);
    }

    // 监听 DOM 变化 => 实时更新
    let mo = null;
    function initMutationObserver() {
        if (mo) mo.disconnect();
        mo = new MutationObserver(() => {
            mo.disconnect();
            try {
                buildQAPanelList();
            } finally {
                mo.observe(document.body, { childList: true, subtree: true });
            }
        });
        mo.observe(document.body, { childList: true, subtree: true });
    }

    /********************************************************
     * 2.b 按聊天区域生成快捷按钮 & 独立侧边栏
     ********************************************************/
    function syncAreaButtons(areaEls) {
        const keepSet = new Set(areaEls.filter((el) => el && el !== document.body && el !== document.documentElement));

        // 清理不存在的按钮
        for (const [el, btn] of areaButtons.entries()) {
            if (!keepSet.has(el) || !document.body.contains(el)) {
                btn.remove();
                areaButtons.delete(el);
            }
        }

        // 新增需要的按钮
        keepSet.forEach((areaEl) => {
            if (!areaButtons.has(areaEl)) {
                const btn = createAreaButton(areaEl);
                areaButtons.set(areaEl, btn);
            }
        });

        scheduleUpdateAreaUIPositions();
    }

    function createAreaButton(areaEl) {
        const label = getAreaLabel(areaEl);
        const btn = document.createElement('div');
        btn.className = 'qa-area-fab';
        btn.title = `打开“${label}”导航`;
        btn.textContent = '≡';
        btn.dataset.areaLabel = label;
        btn.style.display = 'none';

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleAreaPanelWithFreshData(areaEl);
        });

        shadowRoot.appendChild(btn);
        return btn;
    }

    function ensureAreaPanel(areaEl) {
        if (areaPanels.has(areaEl)) return areaPanels.get(areaEl);
        const label = getAreaLabel(areaEl);
        const panel = document.createElement('div');
        panel.className = 'qa-area-panel';
        panel.dataset.areaLabel = label;
        panel.innerHTML = `
            <div class="qa-area-panel-header">
                <span class="qa-area-panel-title">${label}</span>
                <button class="qa-area-panel-close" title="关闭">×</button>
            </div>
            <div class="qa-area-panel-list"></div>
        `;
        const closeBtn = panel.querySelector('.qa-area-panel-close');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            panel.classList.remove('show');
        });
        shadowRoot.appendChild(panel);
        areaPanels.set(areaEl, panel);
        return panel;
    }

    function fillAreaPanel(areaEl, blocks) {
        const label = getAreaLabel(areaEl);
        const panel = ensureAreaPanel(areaEl);
        panel.dataset.areaLabel = label;
        const list = panel.querySelector('.qa-area-panel-list');
        if (!list) return;

        const oldScroll = list.scrollTop;
        list.innerHTML = '';

        let i = 0;
        let questionCount = 0;
        while (i < blocks.length) {
            const item = blocks[i];
            if (item.type === 'question') {
                questionCount++;
                const qContent = _extractSectionContent(item.el);
                addNavItem({ index: questionCount, type: '问题', content: qContent, sectionEl: item.el, areaEl, areaLabel: label }, list);
                if (i + 1 < blocks.length && blocks[i + 1].type === 'answer') {
                    const ansItem = blocks[i + 1];
                    const aContent = _extractSectionContent(ansItem.el);
                    addNavItem({ index: questionCount, type: '回答', content: aContent, sectionEl: ansItem.el, areaEl, areaLabel: label }, list);
                    i += 2;
                } else {
                    i += 1;
                }
                if (i < blocks.length && blocks[i].type === 'question') {
                    addDivider(list);
                }
            } else {
                const aContent = _extractSectionContent(item.el);
                addNavItem({ index: questionCount, type: '回答', content: aContent, sectionEl: item.el, areaEl, areaLabel: label }, list);
                i += 1;
                if (i < blocks.length && blocks[i].type === 'question') {
                    addDivider(list);
                }
            }
        }

        if (list.children.length === 0) {
            const emptyMsg = document.createElement('p');
            emptyMsg.style.textAlign = 'center';
            emptyMsg.style.padding = '12px';
            emptyMsg.textContent = '无问答';
            list.appendChild(emptyMsg);
        }

        list.scrollTop = oldScroll;
    }

    function updateAreaPanels(areaMap) {
        syncAreaPanels(Array.from(areaMap.keys()));
        areaMap.forEach((blocks, areaEl) => {
            fillAreaPanel(areaEl, blocks);
        });
        updateAreaPanelPositions();
    }

    function syncAreaPanels(areaEls) {
        const keepSet = new Set(areaEls.filter((el) => el && el !== document.body && el !== document.documentElement));
        for (const [el, panel] of areaPanels.entries()) {
            if (!keepSet.has(el) || !document.body.contains(el)) {
                panel.remove();
                areaPanels.delete(el);
            }
        }
    }

    function toggleAreaPanel(areaEl) {
        const panel = ensureAreaPanel(areaEl);
        if (panel.classList.contains('show')) {
            panel.classList.remove('show');
        } else {
            panel.classList.add('show');
            scheduleUpdateAreaUIPositions();
        }
    }

    function toggleAreaPanelWithFreshData(areaEl) {
        const panel = ensureAreaPanel(areaEl);
        const { areaMap } = collectAreaMap();
        updateAreaPanels(areaMap);
        const blocks = areaMap.get(areaEl) || [];
        fillAreaPanel(areaEl, blocks);
        if (panel.classList.contains('show')) {
            panel.classList.remove('show');
        } else {
            panel.classList.add('show');
            scheduleUpdateAreaUIPositions();
        }
    }

    function scheduleUpdateAreaUIPositions() {
        if (areaUIRafId) cancelAnimationFrame(areaUIRafId);
        areaUIRafId = requestAnimationFrame(() => {
            areaUIRafId = null;
            updateAreaButtonPositions();
            updateAreaPanelPositions();
        });
    }

    function ensureToastContainer() {
        if (!shadowRoot) return;
        if (!shadowRoot.querySelector('#toastContainer')) {
            const toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            shadowRoot.appendChild(toastContainer);
        }
    }

    function cleanupLegacyGlobalUI() {
        const oldBall = shadowRoot?.querySelector?.('#qaNavFloatingBall');
        if (oldBall) oldBall.remove();
        const oldPanel = shadowRoot?.querySelector?.('#qaNavPanel');
        if (oldPanel) oldPanel.remove();
    }

    function bindUIPositionListeners() {
        if (uiListenersBound) return;
        window.addEventListener('scroll', scheduleUpdateAreaUIPositions, { passive: true, capture: true });
        window.addEventListener('resize', scheduleUpdateAreaUIPositions);
        uiListenersBound = true;
    }

    function updateAreaPanelPositions() {
        const viewportW = document.documentElement.clientWidth;
        const viewportH = document.documentElement.clientHeight;
        const panelWidth = 300;

        for (const [areaEl, panel] of areaPanels.entries()) {
            if (!areaEl.isConnected) {
                panel.style.display = 'none';
                continue;
            }
            const rect = areaEl.getBoundingClientRect();
            const visible =
                rect.width > 10 &&
                rect.height > 10 &&
                rect.bottom > 0 &&
                rect.top < viewportH &&
                rect.right > 0 &&
                rect.left < viewportW;

            if (!visible) {
                panel.style.display = 'none';
                continue;
            }

            const left = clamp(rect.right - panelWidth - 12, Math.max(rect.left + 8, 8), viewportW - panelWidth - 8);
            const top = clamp(rect.top + 8, 8, viewportH - 80);
            const maxH = Math.min(rect.height - 16, viewportH - top - 8);

            panel.style.display = panel.classList.contains('show') ? 'flex' : 'none';
            panel.style.width = `${panelWidth}px`;
            panel.style.left = `${left}px`;
            panel.style.top = `${top}px`;
            panel.style.maxHeight = `${Math.max(maxH, 160)}px`;
        }
    }

    function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    function openPanelAndScrollToArea(areaLabel) {
        const panel = shadowRoot.querySelector('#qaNavPanel');
        const list = shadowRoot.querySelector('#qaNavList');
        if (!panel || !list) return;

        panel.classList.add('show');

        const header = Array.from(list.querySelectorAll('.qa-area-header')).find((h) => h.dataset.areaLabel === areaLabel);
        if (header) {
            header.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function updateAreaButtonPositions() {
        const viewportW = document.documentElement.clientWidth;
        const viewportH = document.documentElement.clientHeight;

        for (const [areaEl, btn] of areaButtons.entries()) {
            if (!areaEl.isConnected) {
                btn.style.display = 'none';
                continue;
            }

            const rect = areaEl.getBoundingClientRect();
            const visible =
                rect.width > 10 &&
                rect.height > 10 &&
                rect.bottom > 0 &&
                rect.top < viewportH &&
                rect.right > 0 &&
                rect.left < viewportW;

            if (!visible) {
                btn.style.display = 'none';
                continue;
            }

            const offsetX = 16;
            const offsetY = 0;
            const btnWidth = 32;
            const left = clamp(rect.right - btnWidth - offsetX, rect.left + 8, viewportW - btnWidth - 8);
            const top = clamp(rect.top + offsetY, 8, viewportH - btnWidth - 8);

            btn.style.display = 'flex';
            btn.style.left = `${left}px`;
            btn.style.top = `${top}px`;
        }
    }

    /********************************************************
     * 2. 构建悬浮球 & 右侧滑出面板 (含拖拽 & 记忆) + Toast容器
     ********************************************************/
    function createFloatingBallAndPanel() {
        // 仅负责样式与 Toast 容器，移除全局悬浮球/共用侧栏
        if (shadowRoot.querySelector('#qaNavBaseStyle')) {
            ensureToastContainer();
            cleanupLegacyGlobalUI();
            bindUIPositionListeners();
            return;
        }

        // 注入整体样式 (含 Toast 相关CSS) —— Toast部分已改为与参考脚本一致
        const styleEl = document.createElement('style');
        styleEl.id = 'qaNavBaseStyle';
        styleEl.textContent = `
            :host {
                color-scheme: light dark;
            }

            /* 右侧滑出面板 */
            #qaNavPanel {
                position: fixed;
                top: 60px;
                right: 0;
                width: 320px;
                min-height: 200px;
                max-height: 90vh;
                background: #fff;
                color: #333;
                border: 1px solid #ddd;
                border-right: none;
                border-top-left-radius: 8px;
                border-bottom-left-radius: 8px;
                box-shadow: -2px 0 6px rgba(0,0,0,0.1);
                z-index: 999999;
                display: flex;
                flex-direction: column;
                font-size: 14px;
                transform: translateX(100%);
                transition: transform 0.3s ease-in-out;
                overflow: hidden;
            }
            @media (prefers-color-scheme: dark) {
                #qaNavPanel {
                    background: #2c2c2c;
                    color: #eee;
                    border-color: #555;
                }
            }
            #qaNavPanel.show {
                transform: translateX(0%);
            }

            .panel-header {
                padding: 8px;
                font-weight: bold;
                border-bottom: 1px solid #ddd;
                flex-shrink: 0;
                position: relative;
            }
            @media (prefers-color-scheme: dark) {
                .panel-header {
                    border-color: #555;
                }
            }
            .close-btn {
                position: absolute;
                top: 50%;
                right: 8px;
                transform: translateY(-50%);
                background: transparent;
                border: none;
                font-size: 20px;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: inherit;
                cursor: pointer;
                transition: background-color 0.3s, transform 0.3s, color 0.3s;
            }
            .close-btn:hover {
                background-color: rgba(0, 0, 0, 0.1);
                transform: translateY(-50%) scale(1.1);
                color: red;
            }
            @media (prefers-color-scheme: dark) {
                .close-btn:hover {
                    background-color: rgba(255, 255, 255, 0.1);
                    color: #ff6666;
                }
            }

            #qaNavList {
                flex: 1;
                overflow-y: auto;
                padding: 8px;
            }
            .qa-area-header {
                display: flex;
                align-items: center;
                gap: 6px;
                margin: 6px 0 4px;
                font-size: 13px;
                font-weight: 600;
                color: #666;
                letter-spacing: 0.2px;
            }
            .qa-area-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: linear-gradient(135deg, #ff9f43, #ffc766);
                box-shadow: 0 0 0 2px rgba(255, 159, 67, 0.2);
            }
            .qa-area-title {
                flex: 1;
            }
            @media (prefers-color-scheme: dark) {
                .qa-area-header {
                    color: #ddd;
                }
            }
            .nav-area-divider {
                border: none;
                border-top: 1px dashed #ddd;
                margin: 10px 0 6px;
            }
            @media (prefers-color-scheme: dark) {
                .nav-area-divider {
                    border-top: 1px dashed #555;
                }
            }
            .nav-item {
                margin-bottom: 8px;
                padding: 6px;
                border-left: 2px solid transparent;
                border-radius: 4px;
                cursor: pointer;
            }
            .nav-item:hover {
                background: #f5f5f5;
                border-color: orange;
            }
            @media (prefers-color-scheme: dark) {
                .nav-item:hover {
                    background: rgba(255,255,255,0.1);
                }
            }
            .qa-title {
                font-weight: bold;
                margin-bottom: 4px;
                display: flex;
                align-items: center;
            }
            .qa-index {
                margin-right: 6px;
                color: #ff6600;
            }
            @media (prefers-color-scheme: dark) {
                .qa-index {
                    color: #ffb84d;
                }
            }
            .qa-content {
                font-size: 13px;
                line-height: 1.4;
                white-space: pre-wrap;
                opacity: 0.9;
                max-height: calc(1.4em * 3);
                overflow: hidden;
                transition: max-height 0.3s;
            }
            .nav-item.expanded .qa-content {
                max-height: 1000px;
            }
            .toggle-btn {
                margin-top: 4px;
                padding: 2px 6px;
                border: 1px solid #ccc;
                border-radius: 4px;
                font-size: 12px;
                background: #fafafa;
                cursor: pointer;
                color: #333;
            }
            .toggle-btn:hover {
                background: #eee;
            }
            @media (prefers-color-scheme: dark) {
                .toggle-btn {
                    background: #444;
                    border-color: #666;
                    color: #eee;
                }
                .toggle-btn:hover {
                    background: #555;
                }
            }
            .nav-divider {
                border: none;
                border-top: 1px solid #ddd;
                margin: 8px 0;
            }
            @media (prefers-color-scheme: dark) {
                .nav-divider {
                    border-top: 1px solid #555;
                }
            }

            /* 悬浮球 */
            #qaNavFloatingBall {
                position: fixed;
                width: 48px;
                height: 48px;
                border-radius: 50%;
                background: rgb(255, 150, 0);
                color: #fff;
                box-shadow: 2px 2px 6px rgba(0,0,0,0.3);
                font-size: 24px;
                text-align: center;
                line-height: 48px;
                cursor: pointer;
                z-index: 999999;
                user-select: none;
            }
            #qaNavFloatingBall:hover {
                opacity: 0.9;
            }

            /* 聊天区域快捷按钮 */
            .qa-area-fab {
                position: fixed;
                width: 32px;
                height: 32px;
                border-radius: 16px;
                background: linear-gradient(135deg, #ff9f43, #ffb347);
                color: #fff;
                box-shadow: 0 4px 10px rgba(0,0,0,0.18);
                font-size: 18px;
                text-align: center;
                line-height: 32px;
                cursor: pointer;
                z-index: 999998;
                user-select: none;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.15s ease, box-shadow 0.15s ease;
            }
            .qa-area-fab:hover {
                transform: translateY(-1px);
                box-shadow: 0 6px 12px rgba(0,0,0,0.24);
            }
            @media (prefers-color-scheme: dark) {
                .qa-area-fab {
                    background: linear-gradient(135deg, #ffb347, #ffd27f);
                    color: #222;
                }
            }

            /* 聊天区域独立侧边栏 */
            .qa-area-panel {
                position: fixed;
                right: 0;
                top: 60px;
                width: 300px;
                background: #fff;
                color: #333;
                border: 1px solid #ddd;
                border-radius: 8px;
                box-shadow: -2px 0 8px rgba(0,0,0,0.12);
                z-index: 999997;
                display: none;
                flex-direction: column;
                font-size: 14px;
                overflow: hidden;
            }
            .qa-area-panel.show {
                display: flex;
            }
            .qa-area-panel-header {
                padding: 8px;
                font-weight: 600;
                border-bottom: 1px solid #ddd;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 6px;
                background: linear-gradient(135deg, #fffaf4, #fff);
            }
            .qa-area-panel-title {
                flex: 1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .qa-area-panel-close {
                background: transparent;
                border: none;
                font-size: 18px;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                cursor: pointer;
                color: inherit;
                transition: background-color 0.2s;
            }
            .qa-area-panel-close:hover {
                background: rgba(0,0,0,0.08);
            }
            .qa-area-panel-list {
                flex: 1;
                overflow: auto;
                padding: 8px;
            }
            @media (prefers-color-scheme: dark) {
                .qa-area-panel {
                    background: #2c2c2c;
                    color: #eee;
                    border-color: #555;
                    box-shadow: -2px 0 8px rgba(0,0,0,0.35);
                }
                .qa-area-panel-header {
                    border-color: #555;
                    background: linear-gradient(135deg, #2f2f2f, #2c2c2c);
                }
                .qa-area-panel-close:hover {
                    background: rgba(255,255,255,0.08);
                }
            }

            /* ============== Toast 样式(改为参考脚本方式) ============== */
            #toastContainer {
                position: fixed;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                z-index: 1000000; /* 比面板更高 */
                pointer-events: none; /* 不阻塞点击 */
            }
            /* 外层容器：控制透明度淡入淡出 */
            ._toast {
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
                opacity: 0;
                transition: opacity 0.3s;
            }
            /* 内层气泡面板 */
            ._toast_inner {
                position: relative;
                font-size: 16px;
                padding: 12px 20px;
                border-radius: 6px;
                box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                max-width: 80vw;
                text-align: center;
                background-color: #333;
                color: #fff;
            }
            @media (prefers-color-scheme: dark) {
                ._toast_inner {
                    background-color: #eee;
                    color: #333;
                }
            }
            /* 淡入时 */
            ._toast._fadeIn {
                opacity: 1;
            }
            /* 上箭头(贴底边) / 下箭头(贴顶边) */
            ._toast_upArrow ._toast_inner::after,
            ._toast_downArrow ._toast_inner::after {
                content: "";
                position: absolute;
                left: 50%;
                transform: translateX(-50%);
                border-style: solid;
            }
            /* 当位置是"top" => 箭头朝上(贴底边) */
            ._toast_upArrow ._toast_inner::after {
                bottom: 0;
                transform: translateX(-50%) translateY(100%);
                border-width: 8px 8px 0 8px;
                border-color: #333 transparent transparent transparent;
            }
            @media (prefers-color-scheme: dark) {
                ._toast_upArrow ._toast_inner::after {
                    border-color: #eee transparent transparent transparent;
                }
            }
            /* 当位置是"bottom" => 箭头朝下(贴顶边) */
            ._toast_downArrow ._toast_inner::after {
                top: 0;
                transform: translateX(-50%) translateY(-100%);
                border-width: 0 8px 8px 8px;
                border-color: transparent transparent #333 transparent;
            }
            @media (prefers-color-scheme: dark) {
                ._toast_downArrow ._toast_inner::after {
                    border-color: transparent transparent #eee transparent;
                }
            }
        `;
        shadowRoot.appendChild(styleEl);

        ensureToastContainer();
        cleanupLegacyGlobalUI();
        bindUIPositionListeners();

        if (!ENABLE_LEGACY_GLOBAL_UI) return;

        // 预留：如需恢复全局悬浮球，可开启 ENABLE_LEGACY_GLOBAL_UI
    }

    /**
     * 应用悬浮球位置
     * @param {HTMLElement} ball 悬浮球元素
     */
    function applyBallPosition(ball) {
        // 默认位置（右下角）
        let positionInfo = {
            horizontalEdge: 'right',
            horizontalValue: 20,
            verticalEdge: 'bottom',
            verticalValue: 80,
        };

        // 尝试从 localStorage 读取位置信息
        const savedPosStr = localStorage.getItem('tm_qaNavBallPos');
        if (savedPosStr) {
            try {
                const savedPos = JSON.parse(savedPosStr);

                // 验证保存的位置信息是否有效且完整
                if (
                    savedPos &&
                    (savedPos.horizontalEdge === 'left' || savedPos.horizontalEdge === 'right') &&
                    (savedPos.verticalEdge === 'top' || savedPos.verticalEdge === 'bottom') &&
                    typeof savedPos.horizontalValue === 'number' &&
                    typeof savedPos.verticalValue === 'number'
                ) {
                    positionInfo = savedPos;
                }
            } catch (e) {
                console.error('解析保存的悬浮球位置信息失败:', e);
                // 使用默认位置
            }
        }

        // 重置所有位置属性
        ball.style.left = '';
        ball.style.right = '';
        ball.style.top = '';
        ball.style.bottom = '';

        // 应用水平位置
        ball.style[positionInfo.horizontalEdge] = positionInfo.horizontalValue + 'px';

        // 应用垂直位置
        ball.style[positionInfo.verticalEdge] = positionInfo.verticalValue + 'px';
    }

    /********************************************************
     * 3. 单/双击跳转 + Toast 提示（Toast在 shadowRoot 内，支持多聊天区域）
     ********************************************************/
    const clickDelay = 300; // 双击阈值

    let currentToast = null;
    let toastTimerId = null;

    function attachNavItemClickEvents(itemDiv, index, qaType, sectionEl, areaEl, areaLabel) {
        let clickTimer = null;
        itemDiv.addEventListener('click', (e) => {
            e.stopPropagation();

            // 若已存在一次点击 => 双击
            if (clickTimer) {
                clearTimeout(clickTimer);
                clickTimer = null;
                // 双击：始终滚到底部 + Toast
                scrollToElementBottom(sectionEl, areaEl);
                showToast(index, qaType, 'bottom', areaLabel);
            } else {
                // 第一次点击
                clickTimer = setTimeout(() => {
                    clickTimer = null;
                    // 单击：若已在顶部 => 滚到底部，否则滚到顶部
                    if (isAtSectionTop(sectionEl, areaEl)) {
                        scrollToElementBottom(sectionEl, areaEl);
                        showToast(index, qaType, 'bottom', areaLabel);
                    } else {
                        scrollToElementTop(sectionEl, areaEl);
                        showToast(index, qaType, 'top', areaLabel);
                    }
                }, clickDelay);
            }
        });
    }

    function getScrollContainer(areaEl) {
        if (areaEl && areaEl !== document.body && areaEl !== document.documentElement) {
            return areaEl;
        }
        return document.scrollingElement || document.documentElement;
    }

    // 增大了误差阈值以适配固定头部
    function isAtSectionTop(sectionEl, areaEl) {
        const container = getScrollContainer(areaEl);
        if (!container) return true;

        if (container === document.body || container === document.documentElement || container === document.scrollingElement) {
            const rect = sectionEl.getBoundingClientRect();
            const scrollY = window.scrollY || document.documentElement.scrollTop;
            const elTop = scrollY + rect.top;
            return Math.abs(scrollY - elTop) < 120;
        }

        const rect = sectionEl.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const elTop = rect.top - containerRect.top + container.scrollTop;
        return Math.abs(container.scrollTop - elTop) < 120;
    }

    function scrollToElementTop(el, areaEl) {
        const container = getScrollContainer(areaEl);
        if (!container) return;

        if (container === document.body || container === document.documentElement || container === document.scrollingElement) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }

        container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const rect = el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const targetTop = rect.top - containerRect.top + container.scrollTop - 12;
        container.scrollTo({ top: Math.max(targetTop, 0), behavior: 'smooth' });
    }

    function scrollToElementBottom(el, areaEl) {
        const container = getScrollContainer(areaEl);
        if (!container) return;

        if (container === document.body || container === document.documentElement || container === document.scrollingElement) {
            el.scrollIntoView({ behavior: 'smooth', block: 'end' });
            return;
        }

        container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const rect = el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const elBottom = rect.bottom - containerRect.top + container.scrollTop;
        const targetTop = Math.max(elBottom - container.clientHeight + 12, 0);
        container.scrollTo({ top: targetTop, behavior: 'smooth' });
    }

    /**
     * 显示 Toast
     * @param {number} index  问题/回答编号
     * @param {string} qaType "问题" or "回答"
     * @param {string} position "top" or "bottom"
     * @param {string} areaLabel 聊天区域标签
     */
    function showToast(index, qaType, position, areaLabel) {
        const toastContainer = shadowRoot.querySelector('#toastContainer');
        if (!toastContainer) return;

        // 若已有Toast，先移除
        if (currentToast) {
            removeToast(currentToast);
            currentToast = null;
        }

        // 创建外层容器
        const toast = document.createElement('div');
        toast.classList.add('_toast');

        // 箭头朝向
        if (position === 'top') {
            toast.classList.add('_toast_upArrow');
        } else {
            toast.classList.add('_toast_downArrow');
        }

        // 内部气泡面板
        const toastInner = document.createElement('div');
        toastInner.classList.add('_toast_inner');

        const line1 = `<strong style="color:orange;">#${index}</strong> <strong>${qaType}</strong>`;
        const line2 = `(已滚动到${position === 'top' ? '顶部' : '底部'})`;
        const line3 = areaLabel ? `<div style="margin-top:4px; opacity:0.65;">${areaLabel}</div>` : '';

        toastInner.innerHTML = `
            <div>${line1}</div>
            <div style="margin-top:4px; opacity:0.7;">${line2}</div>
            ${line3}
        `;
        toast.appendChild(toastInner);

        toastContainer.appendChild(toast);

        // 强制重排触发动画
        toast.getBoundingClientRect();
        toast.classList.add('_fadeIn');

        currentToast = toast;

        // 2秒后自动消失
        toastTimerId = setTimeout(() => {
            removeToast(toast);
        }, 2000);
    }

    function removeToast(toastEl) {
        toastEl.classList.remove('_fadeIn');
        setTimeout(() => {
            if (toastEl.parentNode) {
                toastEl.parentNode.removeChild(toastEl);
            }
            if (toastEl === currentToast) {
                currentToast = null;
                toastTimerId = null;
            }
        }, 300);
    }

    /********************************************************
     * 4. 脚本主入口
     ********************************************************/
    function init() {
        ensureShadowRoot();
        createFloatingBallAndPanel(); // 仅用于注入样式 & Toast 容器
        buildQAPanelList();
        initMutationObserver();
        scheduleUpdateAreaUIPositions();
    }

    window.addEventListener('load', () => {
        setTimeout(() => {
            init();
            // 冗余重试
            setTimeout(() => buildQAPanelList(), 1200);
        }, 400);
    });
})();
