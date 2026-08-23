import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { SupportLinkComponent } from './support-link.component';

describe('SupportLinkComponent', () => {
  it('links safely to the CalcPath Ko-fi page', async () => {
    await TestBed.configureTestingModule({ imports: [SupportLinkComponent] }).compileComponents();
    const anchor = TestBed.createComponent(SupportLinkComponent).nativeElement.querySelector('a') as HTMLAnchorElement;

    expect(anchor.href).toBe('https://ko-fi.com/5reason');
    expect(anchor.target).toBe('_blank');
    expect(anchor.rel).toContain('noopener');
    expect(anchor.textContent).toContain('Leave a tip');
  });
});
