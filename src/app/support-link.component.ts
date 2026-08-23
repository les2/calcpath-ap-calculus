import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'calc-support-link',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      class="support-link"
      href="https://ko-fi.com/5reason"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Leave a tip for CalcPath on Ko-fi (opens in a new tab)"
    >
      <span class="support-icon" aria-hidden="true">☕</span>
      <span>Leave a tip</span>
    </a>
  `
})
export class SupportLinkComponent {}
