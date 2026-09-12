import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';

@Component({
  selector: 'app-error',
  imports: [RouterLink, HlmButton],
  template: `<main class="error-page">
    <div class="error-illustration">
      <span>{{ info().icon }}</span
      ><i></i><i></i><i></i>
    </div>
    <p class="error-code">{{ info().code }}</p>
    <h1>{{ info().title }}</h1>
    <p>{{ info().message }}</p>
    <div>
      <a hlmBtn routerLink="/dashboard">Back to dashboard</a
      ><button hlmBtn variant="outline" type="button" (click)="reload()">Try again</button>
    </div>
    <small>If you believe this is a mistake, contact your workspace administrator.</small>
  </main>`,
})
export class ErrorPage {
  readonly code = input('404');
  readonly info = computed(
    () =>
      ({
        '401': {
          code: '401',
          icon: '⌾',
          title: 'Authentication required',
          message: 'You need to sign in before you can access this page.',
        },
        '403': {
          code: '403',
          icon: '⊘',
          title: 'Access forbidden',
          message: "You don't have permission to view this resource.",
        },
        '404': {
          code: '404',
          icon: '⌕',
          title: 'Page not found',
          message: 'The page you are looking for may have moved or no longer exists.',
        },
        '500': {
          code: '500',
          icon: '!',
          title: 'Something went wrong',
          message: 'Our server hit an unexpected problem. Please try again in a moment.',
        },
        maintenance: {
          code: '',
          icon: '⚒',
          title: 'Down for maintenance',
          message: "We're making a few improvements. The workspace will be back shortly.",
        },
      })[this.code()] ?? {
        code: '404',
        icon: '⌕',
        title: 'Page not found',
        message: 'The requested page could not be found.',
      },
  );
  reload(): void {
    location.reload();
  }
}
