import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/dom';
import * as tabsModule from './tabs';

function renderTabsFixture(activation?: 'manual'): {
  tablist: HTMLElement;
  tabProfile: HTMLElement;
  tabBilling: HTMLElement;
  tabArchived: HTMLElement;
  panelProfile: HTMLElement;
  panelBilling: HTMLElement;
  panelArchived: HTMLElement;
} {
  document.body.innerHTML = `
    <div>
      <div class="fw-tablist" role="tablist" aria-label="Account settings" data-fw-tabs${
        activation ? ` data-fw-tabs-activation="${activation}"` : ''
      }>
        <button type="button" class="fw-tab" role="tab" id="tab-profile" aria-selected="true" aria-controls="panel-profile">Profile</button>
        <button type="button" class="fw-tab" role="tab" id="tab-billing" aria-selected="false" aria-controls="panel-billing" aria-disabled="true">Billing</button>
        <button type="button" class="fw-tab" role="tab" id="tab-archived" aria-selected="false" aria-controls="panel-archived">Archived</button>
      </div>
      <div class="fw-tabpanel" role="tabpanel" id="panel-profile" aria-labelledby="tab-profile" tabindex="0">Profile content</div>
      <div class="fw-tabpanel" role="tabpanel" id="panel-billing" aria-labelledby="tab-billing" tabindex="0">Billing content</div>
      <div class="fw-tabpanel" role="tabpanel" id="panel-archived" aria-labelledby="tab-archived" tabindex="0">Archived content</div>
    </div>
  `;
  return {
    tablist: document.querySelector('[role="tablist"]') as HTMLElement,
    tabProfile: document.getElementById('tab-profile') as HTMLElement,
    tabBilling: document.getElementById('tab-billing') as HTMLElement,
    tabArchived: document.getElementById('tab-archived') as HTMLElement,
    panelProfile: document.getElementById('panel-profile') as HTMLElement,
    panelBilling: document.getElementById('panel-billing') as HTMLElement,
    panelArchived: document.getElementById('panel-archived') as HTMLElement,
  };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('tabs', () => {
  it('init() derives roving tabindex and hidden panels from the authored aria-selected tab', () => {
    const { tabProfile, tabBilling, tabArchived, panelProfile, panelBilling, panelArchived } = renderTabsFixture();
    tabsModule.init();

    expect(tabProfile.tabIndex).toBe(0);
    expect(tabBilling.tabIndex).toBe(-1);
    expect(tabArchived.tabIndex).toBe(-1);
    expect(panelProfile.hidden).toBe(false);
    expect(panelBilling.hidden).toBe(true);
    expect(panelArchived.hidden).toBe(true);
  });

  it('click activates a tab: updates aria-selected, tabindex, and unhides its panel', () => {
    const { tabArchived, tabProfile, panelArchived, panelProfile } = renderTabsFixture();
    tabsModule.init();

    fireEvent.click(tabArchived);

    expect(tabArchived.getAttribute('aria-selected')).toBe('true');
    expect(tabArchived.tabIndex).toBe(0);
    expect(panelArchived.hidden).toBe(false);
    expect(tabProfile.getAttribute('aria-selected')).toBe('false');
    expect(tabProfile.tabIndex).toBe(-1);
    expect(panelProfile.hidden).toBe(true);
  });

  it('dispatches fw:tabs-change with the tab and panel on activation', () => {
    const { tablist, tabArchived, panelArchived } = renderTabsFixture();
    tabsModule.init();

    const onChange = vi.fn();
    tablist.addEventListener('fw:tabs-change', onChange);

    fireEvent.click(tabArchived);

    expect(onChange).toHaveBeenCalledTimes(1);
    const detail = onChange.mock.calls[0][0].detail;
    expect(detail.tab).toBe(tabArchived);
    expect(detail.panel).toBe(panelArchived);
  });

  it('clicking a disabled tab does nothing', () => {
    const { tabBilling, tabProfile } = renderTabsFixture();
    tabsModule.init();

    fireEvent.click(tabBilling);

    expect(tabBilling.getAttribute('aria-selected')).toBe('false');
    expect(tabProfile.getAttribute('aria-selected')).toBe('true');
  });

  it('ArrowRight moves focus and activates the next non-disabled tab (skipping disabled), with wraparound', () => {
    const { tabProfile, tabArchived, panelArchived } = renderTabsFixture();
    tabsModule.init();
    tabProfile.focus();

    fireEvent.keyDown(tabProfile, { key: 'ArrowRight' });

    expect(document.activeElement).toBe(tabArchived);
    expect(tabArchived.getAttribute('aria-selected')).toBe('true');
    expect(panelArchived.hidden).toBe(false);

    fireEvent.keyDown(tabArchived, { key: 'ArrowRight' });

    expect(document.activeElement).toBe(tabProfile);
    expect(tabProfile.getAttribute('aria-selected')).toBe('true');
  });

  it('ArrowLeft wraps to the last non-disabled tab', () => {
    const { tabProfile, tabArchived } = renderTabsFixture();
    tabsModule.init();
    tabProfile.focus();

    fireEvent.keyDown(tabProfile, { key: 'ArrowLeft' });

    expect(document.activeElement).toBe(tabArchived);
    expect(tabArchived.getAttribute('aria-selected')).toBe('true');
  });

  it('Home and End jump to the first and last non-disabled tab', () => {
    const { tabProfile, tabArchived } = renderTabsFixture();
    tabsModule.init();
    tabProfile.focus();

    fireEvent.keyDown(tabProfile, { key: 'End' });
    expect(document.activeElement).toBe(tabArchived);

    fireEvent.keyDown(tabArchived, { key: 'Home' });
    expect(document.activeElement).toBe(tabProfile);
  });

  it('manual activation: arrow keys move focus without selecting; Space/Enter selects the focused tab', () => {
    const { tabProfile, tabArchived, panelArchived } = renderTabsFixture('manual');
    tabsModule.init();
    tabProfile.focus();

    fireEvent.keyDown(tabProfile, { key: 'ArrowRight' });

    expect(document.activeElement).toBe(tabArchived);
    expect(tabArchived.getAttribute('aria-selected')).toBe('false');
    expect(panelArchived.hidden).toBe(true);

    fireEvent.keyDown(tabArchived, { key: 'Enter' });

    expect(tabArchived.getAttribute('aria-selected')).toBe('true');
    expect(panelArchived.hidden).toBe(false);
  });

  it('init() is idempotent: calling it twice does not double-bind the tablist', () => {
    const { tablist, tabArchived } = renderTabsFixture();
    tabsModule.init();
    tabsModule.init();

    const onChange = vi.fn();
    tablist.addEventListener('fw:tabs-change', onChange);

    fireEvent.click(tabArchived);

    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
