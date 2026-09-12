import { CurrencyPipe } from '@angular/common';
import { Component, input, signal } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';

interface Plan {
  name: string;
  description: string;
  monthly: number;
  yearly: number;
  featured?: boolean;
  features: string[];
}

@Component({
  selector: 'app-pricing',
  imports: [CurrencyPipe, HlmButton],
  template: `
    <section class="pricing-page">
      <div class="pricing-heading">
        <span class="eyebrow">Simple pricing</span>
        <h1>Choose the plan that fits your team</h1>
        <p>Start free and scale when your product finds its stride. No hidden fees.</p>
        <div class="billing-toggle">
          <button type="button" [class.active]="!yearly()" (click)="yearly.set(false)">
            Monthly</button
          ><button type="button" [class.active]="yearly()" (click)="yearly.set(true)">
            Yearly <b>Save 20%</b>
          </button>
        </div>
      </div>
      @if (style() === 'table') {
        <div class="pricing-table panel">
          <table>
            <thead>
              <tr>
                <th>Features</th>
                @for (plan of plans; track plan.name) {
                  <th>
                    <h2>{{ plan.name }}</h2>
                    <strong
                      >{{ price(plan) === 0 ? '$0' : '$' + price(plan) }}<small>/mo</small></strong
                    ><button
                      hlmBtn
                      [variant]="plan.featured ? 'default' : 'outline'"
                      type="button"
                      (click)="selectPlan(plan.name)"
                    >
                      {{ selected() === plan.name ? 'Selected' : 'Choose ' + plan.name }}
                    </button>
                  </th>
                }
              </tr>
            </thead>
            <tbody>
              @for (feature of comparison; track feature.name) {
                <tr>
                  <th>{{ feature.name }}</th>
                  @for (value of feature.values; track $index) {
                    <td>{{ value }}</td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else if (style() === 'single') {
        <div class="single-price panel">
          <span class="eyebrow">Best value</span>
          <div>
            <section>
              <h2>Everything your growing team needs</h2>
              <p>
                One straightforward plan with unlimited projects and complete access to every page
                and workflow.
              </p>
              <ul>
                @for (feature of plans[1].features; track feature) {
                  <li>✓ {{ feature }}</li>
                }
              </ul>
            </section>
            <aside>
              <small>Professional plan</small
              ><strong>{{ price(plans[1]) | currency }}<span>/month</span></strong>
              <p>Billed {{ yearly() ? 'yearly' : 'monthly' }}. Cancel at any time.</p>
              <button hlmBtn size="lg" type="button" (click)="selectPlan('Professional')">
                {{
                  selected() === 'Professional' ? 'Plan selected' : 'Start your free trial'
                }}</button
              ><small>No credit card required</small>
            </aside>
          </div>
        </div>
      } @else {
        <div class="pricing-grid">
          @for (plan of plans; track plan.name) {
            <article [class.featured]="plan.featured">
              <div>
                @if (plan.featured) {
                  <span class="popular-badge">Most popular</span>
                }
                <h2>{{ plan.name }}</h2>
                <p>{{ plan.description }}</p>
                <strong
                  >{{ price(plan) === 0 ? '$0' : '$' + price(plan) }}<span>/month</span></strong
                ><button
                  hlmBtn
                  [variant]="plan.featured ? 'default' : 'outline'"
                  type="button"
                  (click)="selectPlan(plan.name)"
                >
                  {{
                    selected() === plan.name
                      ? 'Selected'
                      : plan.monthly === 0
                        ? 'Get started'
                        : 'Start free trial'
                  }}
                </button>
              </div>
              <ul>
                @for (feature of plan.features; track feature) {
                  <li><span>✓</span>{{ feature }}</li>
                }
              </ul>
            </article>
          }
        </div>
      }
      <p class="pricing-footnote">
        All plans include a 14-day trial · Cancel anytime · Prices in USD
      </p>
    </section>
  `,
})
export class PricingPage {
  readonly style = input('column');
  readonly yearly = signal(true);
  readonly selected = signal('');
  readonly plans: Plan[] = [
    {
      name: 'Starter',
      description: 'For individuals and small projects.',
      monthly: 0,
      yearly: 0,
      features: [
        '1 workspace',
        'Up to 3 team members',
        'Core dashboard pages',
        'Community support',
      ],
    },
    {
      name: 'Professional',
      description: 'For teams building serious products.',
      monthly: 29,
      yearly: 23,
      featured: true,
      features: [
        'Unlimited workspaces',
        'Up to 25 team members',
        'Every dashboard feature',
        'Advanced exports',
        'Priority support',
        'Custom themes',
      ],
    },
    {
      name: 'Enterprise',
      description: 'For organizations that need control.',
      monthly: 99,
      yearly: 79,
      features: [
        'Everything in Professional',
        'Unlimited team members',
        'SAML single sign-on',
        'Audit log and retention',
        'Dedicated success manager',
        'Custom integrations',
      ],
    },
  ];
  readonly comparison = [
    { name: 'Team members', values: ['3', '25', 'Unlimited'] },
    { name: 'Workspaces', values: ['1', 'Unlimited', 'Unlimited'] },
    { name: 'Custom themes', values: ['—', '✓', '✓'] },
    { name: 'Single sign-on', values: ['—', '—', '✓'] },
    { name: 'Support', values: ['Community', 'Priority', 'Dedicated'] },
  ];
  price(plan: Plan): number {
    return this.yearly() ? plan.yearly : plan.monthly;
  }
  selectPlan(name: string): void {
    this.selected.set(name);
  }
}
