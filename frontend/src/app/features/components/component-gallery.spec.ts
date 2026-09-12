import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import axe from 'axe-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentGalleryPage } from './component-gallery';

describe('ComponentGalleryPage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ComponentGalleryPage],
      providers: [provideRouter([])],
    });
  });

  it('renders the Spartan primitive index', () => {
    const fixture = TestBed.createComponent(ComponentGalleryPage);
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('h1')?.textContent).toContain('Spartan component gallery');
    expect(page.querySelectorAll('.gallery-architecture code')).toHaveLength(12);
  });

  it('updates the signal counter through the primary action', () => {
    const fixture = TestBed.createComponent(ComponentGalleryPage);
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;

    page.querySelector<HTMLButtonElement>('#buttons button')?.click();
    fixture.detectChanges();

    expect(page.querySelector('[role="status"]')?.textContent).toContain('1');
  });

  it('has no automatically detectable accessibility violations', async () => {
    const fixture = TestBed.createComponent(ComponentGalleryPage);
    fixture.detectChanges();
    await fixture.whenStable();

    const canvas = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    try {
      const results = await axe.run(fixture.nativeElement as HTMLElement);
      const details = results.violations
        .map((violation) => `${violation.id}: ${violation.help}`)
        .join('\n');
      expect(results.violations, details).toEqual([]);
    } finally {
      canvas.mockRestore();
    }
  });
});
