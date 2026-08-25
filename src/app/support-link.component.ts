import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'full-dive-support-link',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      class="support-link"
      [href]="href()"
      target="_blank"
      rel="noopener noreferrer"
      [attr.aria-label]="label() + ' for ' + brandName() + ' (opens in a new tab)'"
    >
      <span class="support-icon" aria-hidden="true">{{ icon() }}</span>
      <span>{{ label() }}</span>
    </a>
  `
})
export class SupportLinkComponent {
  readonly href = input('https://ko-fi.com/5reason');
  readonly label = input('Leave a tip');
  readonly icon = input('☕');
  readonly brandName = input('Full Dive AP');
}
